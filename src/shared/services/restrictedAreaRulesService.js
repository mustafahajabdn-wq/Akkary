import { getSupabase } from "./supabaseClient.js";
import {
  dispatchRestrictedAreaEvent,
  findRestrictedArea,
  RESTRICTED_AREA_MESSAGE,
  RestrictedAreaError,
} from "../utils/restrictedAreas.js";
import {
  buildDatabaseRestrictionIndex,
  findRestrictedAreaInDatabaseIndex,
} from "../utils/restrictedAreaDatabaseMatcher.js";

const CACHE_TTL_MS = 5 * 60 * 1000;

let cachedIndex = null;
let cachedAt = 0;
let loadingPromise = null;

async function fetchRestrictionRows() {
  const supabase = getSupabase();

  const [citiesResult, districtsResult, villagesResult] = await Promise.all([
    supabase.from("cities").select("id,name"),
    supabase
      .from("districts")
      .select(
        "id,name,city_id,is_restricted,restriction_reason,restricted_aliases"
      ),
    supabase
      .from("villages")
      .select(
        "id,name,district_id,is_restricted,restriction_reason,restricted_aliases"
      )
      .eq("is_restricted", true),
  ]);

  if (citiesResult.error) throw citiesResult.error;
  if (districtsResult.error) throw districtsResult.error;
  if (villagesResult.error) throw villagesResult.error;

  return {
    cities: citiesResult.data || [],
    districts: districtsResult.data || [],
    villages: villagesResult.data || [],
  };
}

export async function loadRestrictedAreaIndex({ force = false } = {}) {
  const fresh = cachedIndex && Date.now() - cachedAt < CACHE_TTL_MS;
  if (!force && fresh) return cachedIndex;
  if (!force && loadingPromise) return loadingPromise;

  loadingPromise = fetchRestrictionRows()
    .then((rows) => {
      cachedIndex = buildDatabaseRestrictionIndex(rows);
      cachedAt = Date.now();
      return cachedIndex;
    })
    .finally(() => {
      loadingPromise = null;
    });

  return loadingPromise;
}

export function clearRestrictedAreaRulesCache() {
  cachedIndex = null;
  cachedAt = 0;
  loadingPromise = null;
}

export async function findRestrictedAreaResolved(listing = {}) {
  try {
    const databaseIndex = await loadRestrictedAreaIndex();
    const databaseRestriction = findRestrictedAreaInDatabaseIndex(
      listing,
      databaseIndex
    );

    if (databaseRestriction) return databaseRestriction;
  } catch (error) {
    console.warn(
      "[restrictedAreaRulesService] database rules unavailable; using fallback rules",
      error
    );
  }

  const fallbackArea = findRestrictedArea(listing);
  if (!fallbackArea) return null;

  return {
    area: fallbackArea,
    reason: RESTRICTED_AREA_MESSAGE,
    level: "fallback",
    source: "fallback",
  };
}

export async function assertListingAreaAllowedAsync(
  listing,
  source = "add"
) {
  const restriction = await findRestrictedAreaResolved(listing);
  if (!restriction) return null;

  dispatchRestrictedAreaEvent({
    kind: "restricted",
    source,
    listing,
    area: restriction.area,
    reason: restriction.reason || RESTRICTED_AREA_MESSAGE,
    restrictionLevel: restriction.level,
    restrictionSource: restriction.source,
  });

  const error = new RestrictedAreaError(listing, restriction.area, source);
  error.reason = restriction.reason || RESTRICTED_AREA_MESSAGE;
  error.restrictionLevel = restriction.level;
  error.restrictionSource = restriction.source;
  throw error;
}

export function primeRestrictedAreaRules() {
  return loadRestrictedAreaIndex().catch(() => null);
}
