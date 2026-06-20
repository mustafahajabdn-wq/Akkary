import { normalizeArabicText } from "./restrictedAreas.js";

function parseAliases(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item ?? "").trim())
      .filter(Boolean);
  }

  if (value && typeof value === "object") {
    return Object.values(value)
      .flatMap((item) => parseAliases(item))
      .filter(Boolean);
  }

  const text = String(value ?? "").trim();
  if (!text) return [];

  try {
    const parsed = JSON.parse(text);
    if (parsed !== text) return parseAliases(parsed);
  } catch {}

  return text
    .split(/[\n,|]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeAliases(name, aliases) {
  return [...new Set([name, ...parseAliases(aliases)])]
    .map(normalizeArabicText)
    .filter(Boolean);
}

function exactMatch(value, aliases) {
  const normalized = normalizeArabicText(value);
  return Boolean(normalized) && aliases.includes(normalized);
}

function phraseMatch(value, aliases) {
  const normalized = normalizeArabicText(value);
  if (!normalized) return false;
  const wrapped = ` ${normalized} `;
  return aliases.some((alias) => wrapped.includes(` ${alias} `));
}

function matchesContext(listing, cityName, districtName = "") {
  if (cityName && !exactMatch(listing?.city, [normalizeArabicText(cityName)])) {
    return false;
  }

  if (
    districtName &&
    listing?.district &&
    !exactMatch(listing.district, [normalizeArabicText(districtName)])
  ) {
    return false;
  }

  return true;
}

export function buildDatabaseRestrictionIndex({
  cities = [],
  districts = [],
  villages = [],
} = {}) {
  const cityById = new Map(
    cities.map((city) => [String(city?.id), String(city?.name || "").trim()])
  );

  const districtById = new Map();
  for (const district of districts) {
    districtById.set(String(district?.id), {
      name: String(district?.name || "").trim(),
      cityName: cityById.get(String(district?.city_id)) || "",
    });
  }

  const restrictedDistricts = districts
    .filter((district) => district?.is_restricted === true)
    .map((district) => ({
      id: district?.id,
      name: String(district?.name || "").trim(),
      cityName: cityById.get(String(district?.city_id)) || "",
      aliases: normalizeAliases(district?.name, district?.restricted_aliases),
      reason: String(district?.restriction_reason || "").trim(),
      level: "district",
    }))
    .filter((district) => district.name && district.aliases.length);

  const restrictedVillages = villages
    .filter((village) => village?.is_restricted === true)
    .map((village) => {
      const parent = districtById.get(String(village?.district_id)) || {};
      return {
        id: village?.id,
        name: String(village?.name || "").trim(),
        cityName: parent.cityName || "",
        districtName: parent.name || "",
        aliases: normalizeAliases(village?.name, village?.restricted_aliases),
        reason: String(village?.restriction_reason || "").trim(),
        level: "village",
      };
    })
    .filter((village) => village.name && village.aliases.length);

  return { restrictedDistricts, restrictedVillages };
}

export function findRestrictedAreaInDatabaseIndex(listing = {}, index = {}) {
  const restrictedDistricts = index?.restrictedDistricts || [];
  const restrictedVillages = index?.restrictedVillages || [];

  for (const district of restrictedDistricts) {
    if (!matchesContext(listing, district.cityName)) continue;

    const matched =
      exactMatch(listing?.district, district.aliases) ||
      phraseMatch(listing?.location_detail, district.aliases);

    if (matched) {
      return {
        area: district.name,
        reason: district.reason,
        level: district.level,
        source: "database",
      };
    }
  }

  for (const village of restrictedVillages) {
    if (!matchesContext(listing, village.cityName, village.districtName)) continue;

    const directVillageMatch = exactMatch(listing?.village, village.aliases);
    const explicitLocationAliases = village.aliases.map((alias) => `قريه ${alias}`);
    const explicitLocationMatch = phraseMatch(
      listing?.location_detail,
      explicitLocationAliases
    );

    if (directVillageMatch || explicitLocationMatch) {
      return {
        area: village.name,
        reason: village.reason,
        level: village.level,
        source: "database",
      };
    }
  }

  return null;
}
