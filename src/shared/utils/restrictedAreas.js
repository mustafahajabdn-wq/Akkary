export const RESTRICTED_AREA_MESSAGE =
  "لا يمكن نشر إعلان عقاري في هذه المنطقة.";

let activeRestrictionIndex = {
  restrictedDistricts: [],
  restrictedVillages: [],
};

export function normalizeArabicText(value) {
  const arabicDigits = "٠١٢٣٤٥٦٧٨٩";
  const persianDigits = "۰۱۲۳۴۵۶۷۸۹";

  return String(value ?? "")
    .replace(/[٠-٩]/g, (digit) => String(arabicDigits.indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String(persianDigits.indexOf(digit)))
    .normalize("NFKD")
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
    .replace(/ـ/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ؤ/g, "و")
    .replace(/[ئىي]/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function exactMatch(value, expected) {
  const normalizedValue = normalizeArabicText(value);
  const normalizedExpected = normalizeArabicText(expected);
  return Boolean(normalizedValue && normalizedExpected) && normalizedValue === normalizedExpected;
}

function phraseMatch(value, expected) {
  const normalizedValue = normalizeArabicText(value);
  const normalizedExpected = normalizeArabicText(expected);
  if (!normalizedValue || !normalizedExpected) return false;
  return ` ${normalizedValue} `.includes(` ${normalizedExpected} `);
}

function matchesLocationContext(listing, cityName, districtName = "") {
  if (cityName && !exactMatch(listing?.city, cityName)) return false;

  if (districtName && listing?.district && !exactMatch(listing.district, districtName)) {
    return false;
  }

  return true;
}

export function buildRestrictedAreaIndex({
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
      reason: String(district?.restriction_reason || "").trim(),
      level: "district",
    }))
    .filter((district) => district.name);

  const restrictedVillages = villages
    .filter((village) => village?.is_restricted === true)
    .map((village) => {
      const parent = districtById.get(String(village?.district_id)) || {};

      return {
        id: village?.id,
        name: String(village?.name || "").trim(),
        cityName: parent.cityName || "",
        districtName: parent.name || "",
        reason: String(village?.restriction_reason || "").trim(),
        level: "village",
      };
    })
    .filter((village) => village.name);

  return { restrictedDistricts, restrictedVillages };
}

export function setRestrictedAreaIndex(index = {}) {
  activeRestrictionIndex = {
    restrictedDistricts: Array.isArray(index?.restrictedDistricts)
      ? index.restrictedDistricts
      : [],
    restrictedVillages: Array.isArray(index?.restrictedVillages)
      ? index.restrictedVillages
      : [],
  };
}

export function getRestrictedAreaIndex() {
  return activeRestrictionIndex;
}

export function findRestrictedAreaDetail(
  listing = {},
  index = activeRestrictionIndex
) {
  for (const district of index?.restrictedDistricts || []) {
    if (!matchesLocationContext(listing, district.cityName)) continue;

    const matched =
      exactMatch(listing?.district, district.name) ||
      phraseMatch(listing?.location_detail, district.name);

    if (matched) {
      return {
        area: district.name,
        reason: district.reason,
        level: district.level,
        source: "database",
      };
    }
  }

  for (const village of index?.restrictedVillages || []) {
    if (!matchesLocationContext(listing, village.cityName, village.districtName)) {
      continue;
    }

    const directVillageMatch = exactMatch(listing?.village, village.name);
    const explicitLocationMatch = phraseMatch(
      listing?.location_detail,
      `قرية ${village.name}`
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

export function findRestrictedArea(listing = {}) {
  return findRestrictedAreaDetail(listing)?.area || null;
}

export function isRestrictedArea(listing = {}) {
  return Boolean(findRestrictedArea(listing));
}

export function partitionRestrictedListings(listings = []) {
  const allowedListings = [];
  const restrictedListings = [];

  (Array.isArray(listings) ? listings : []).forEach((listing, index) => {
    const restriction = findRestrictedAreaDetail(listing);

    if (restriction) {
      restrictedListings.push({
        listing,
        index,
        area: restriction.area,
        reason: restriction.reason,
      });
    } else {
      allowedListings.push({ listing, index });
    }
  });

  return { allowedListings, restrictedListings };
}

export class RestrictedAreaError extends Error {
  constructor(listing, area, source = "add") {
    const title = String(listing?.title || "إعلان بلا عنوان").trim();
    super(`تم تجاوز الإعلان «${title}» لوجوده ضمن منطقة محظورة: ${area}`);
    this.name = "RestrictedAreaError";
    this.code = "RESTRICTED_AREA";
    this.area = area;
    this.listing = listing;
    this.source = source;
  }
}

export function dispatchRestrictedAreaEvent(detail) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent("restricted-area-event", {
      detail,
    })
  );
}

export function assertListingAreaAllowed(listing, source = "add") {
  const restriction = findRestrictedAreaDetail(listing);
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
  throw error;
}

export function reportImportedListingSuccess(listing) {
  dispatchRestrictedAreaEvent({
    kind: "import-success",
    source: "import",
    listing,
  });
}
