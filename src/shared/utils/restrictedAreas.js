const LOCATION_FIELDS = ["city", "district", "village", "location_detail"];

export const RESTRICTED_AREA_MESSAGE =
  "لا يمكن نشر إعلان عقاري في هذه المنطقة مباشرةً بسبب وجود نزاع جماعي في أصل ملكية بعض الأراضي. يرجى إرسال وثيقة إثبات الملكية عبر واتساب، وبعد التحقق ستضيف الإدارة الإعلان نيابةً عنك.";

// لا تضع أسماء مدن كاملة مثل القامشلي أو المالكية أو رأس العين هنا.
// تُضاف فقط أسماء المناطق المحددة المتفق عليها داخل تلك المدن عند توفرها.
export const RESTRICTED_AREAS = [
  {
    name: "السومرية",
    aliases: ["السومرية", "السومريه"],
  },
  {
    name: "البلان",
    aliases: ["البلان", "منطقة البلان"],
  },
  {
    name: "حارة المحطة",
    aliases: ["حارة المحطة"],
  },
  {
    name: "محطة القدم",
    aliases: ["محطة القدم"],
  },
  {
    name: "الشراشير",
    aliases: ["الشراشير", "قرية الشراشير"],
  },
  {
    name: "الحزام العربي",
    aliases: ["الحزام العربي"],
  },
  {
    name: "القرى النموذجية",
    aliases: ["القرى النموذجية"],
  },
  {
    name: "أراضي المغمورين",
    aliases: ["أراضي المغمورين", "اراضي المغمورين"],
  },
];

export function normalizeArabicText(value) {
  return String(value ?? "")
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

function containsNormalizedPhrase(value, phrase) {
  if (!value || !phrase) return false;
  return ` ${value} `.includes(` ${phrase} `);
}

const NORMALIZED_RESTRICTED_AREAS = RESTRICTED_AREAS.map((area) => ({
  ...area,
  normalizedAliases: area.aliases
    .map(normalizeArabicText)
    .filter(Boolean),
}));

export function findRestrictedArea(listing = {}) {
  const locationValues = LOCATION_FIELDS
    .map((field) => normalizeArabicText(listing?.[field]))
    .filter(Boolean);

  for (const area of NORMALIZED_RESTRICTED_AREAS) {
    const matched = area.normalizedAliases.some((alias) =>
      locationValues.some((value) => containsNormalizedPhrase(value, alias))
    );

    if (matched) return area.name;
  }

  return null;
}

export function isRestrictedArea(listing = {}) {
  return Boolean(findRestrictedArea(listing));
}

export function partitionRestrictedListings(listings = []) {
  const allowedListings = [];
  const restrictedListings = [];

  (Array.isArray(listings) ? listings : []).forEach((listing, index) => {
    const area = findRestrictedArea(listing);

    if (area) {
      restrictedListings.push({ listing, index, area });
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
  const area = findRestrictedArea(listing);
  if (!area) return null;

  dispatchRestrictedAreaEvent({
    kind: "restricted",
    source,
    listing,
    area,
  });

  throw new RestrictedAreaError(listing, area, source);
}

export function reportImportedListingSuccess(listing) {
  dispatchRestrictedAreaEvent({
    kind: "import-success",
    source: "import",
    listing,
  });
}
