import { getSupabase } from "./supabaseClient.js";
import {
  buildRestrictedAreaIndex,
  dispatchRestrictedAreaEvent,
  findRestrictedAreaDetail,
  RESTRICTED_AREA_MESSAGE,
  RestrictedAreaError,
  setRestrictedAreaIndex,
} from "../utils/restrictedAreas.js";

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
      .select("id,name,city_id,is_restricted,restriction_reason"),
    supabase
      .from("villages")
      .select("id,name,district_id,is_restricted,restriction_reason")
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
      cachedIndex = buildRestrictedAreaIndex(rows);
      cachedAt = Date.now();
      setRestrictedAreaIndex(cachedIndex);
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
  setRestrictedAreaIndex({});
}

export async function findRestrictedAreaResolved(listing = {}) {
  let databaseIndex;

  try {
    databaseIndex = await loadRestrictedAreaIndex();
  } catch (error) {
    console.error("[restrictedAreaRulesService] failed to load database rules", error);
    throw new Error(
      "تعذر التحقق من المناطق المحظورة حاليًا. يرجى المحاولة مرة أخرى بعد قليل."
    );
  }

  return findRestrictedAreaDetail(listing, databaseIndex);
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
