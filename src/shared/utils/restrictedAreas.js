const LOCATION_FIELDS = ["city", "district", "village", "location_detail"];
const HASAKAH_CONTEXT_FIELDS = ["city", "district"];
const HASAKAH_CONTEXT_NAMES = [
  "الحسكة",
  "محافظة الحسكة",
  "القامشلي",
  "المالكية",
  "رأس العين",
  "راس العين",
  "القحطانية",
  "الجوادية",
];

export const RESTRICTED_AREA_MESSAGE =
  "لا يمكن نشر إعلان عقاري في هذه المنطقة مباشرةً بسبب وجود نزاع أو حاجة إلى التحقق من أصل الملكية. يرجى إرسال وثيقة الملكية عبر واتساب، وبعد التحقق ستضيف الإدارة الإعلان نيابةً عنك.";

const HASAKAH_RESTRICTED_VILLAGES = [
  { name: "المناذرة", aliases: ["المناذرة"] },
  { name: "الحرمون", aliases: ["الحرمون"] },
  { name: "القحطانية", aliases: ["القحطانية"] },
  { name: "حلوة", aliases: ["حلوة"] },
  { name: "التنورية", aliases: ["التنورية"] },
  { name: "أم الفرسان", aliases: ["أم الفرسان"] },
  { name: "هيمو", aliases: ["هيمو"] },
  { name: "الثورة", aliases: ["الثورة"] },
  { name: "الحاتمية", aliases: ["الحاتمية"] },
  { name: "أم الربيع", aliases: ["أم الربيع"] },
  { name: "البهيرة", aliases: ["البهيرة"] },
  { name: "الجابرية", aliases: ["الجابرية"] },
  { name: "عين الخضراء", aliases: ["عين الخضراء"] },
  { name: "تل الصدق", aliases: ["تل الصدق"] },
  { name: "الصحية", aliases: ["الصحية"] },
  { name: "المصطفاوية", aliases: ["المصطفاوية"] },
  { name: "تل آعور", aliases: ["تل آعور", "تل اعور"] },
  { name: "الحمراء", aliases: ["الحمراء"] },
  { name: "الجوادية", aliases: ["الجوادية"] },
  { name: "شبك", aliases: ["شبك"] },
  { name: "تل علو 1", aliases: ["تل علو 1", "تل علو الأول"] },
  { name: "تل علو 2", aliases: ["تل علو 2", "تل علو الثاني"] },
  { name: "توكل", aliases: ["توكل"] },
  { name: "معشوق", aliases: ["معشوق"] },
  { name: "تل تشرين", aliases: ["تل تشرين"] },
  { name: "القنيطرة", aliases: ["القنيطرة"] },
  { name: "القيروان", aliases: ["القيروان"] },
  { name: "ظهر العرب", aliases: ["ظهر العرب"] },
  { name: "الأسدية", aliases: ["الأسدية"] },
  { name: "برقة", aliases: ["برقة"] },
  { name: "تل الحضارة 1", aliases: ["تل الحضارة 1", "تل الحضارة الأول"] },
  { name: "تل الحضارة 2", aliases: ["تل الحضارة 2", "تل الحضارة الثاني"] },
  { name: "تل الأرقم", aliases: ["تل الأرقم"] },
  { name: "المتنبي", aliases: ["المتنبي"] },
  { name: "أم عظام", aliases: ["أم عظام"] },
  { name: "العنادية", aliases: ["العنادية"] },
  { name: "الزاوية", aliases: ["الزاوية"] },
  { name: "الدهماء", aliases: ["الدهماء"] },
  { name: "هنادي", aliases: ["هنادي"] },
];

const HASAKAH_VILLAGE_RULES = HASAKAH_RESTRICTED_VILLAGES.flatMap((village) => [
  {
    name: village.name,
    aliases: village.aliases,
    fields: ["village"],
    context: {
      fields: HASAKAH_CONTEXT_FIELDS,
      aliases: HASAKAH_CONTEXT_NAMES,
      mode: "exact",
    },
  },
  {
    name: village.name,
    aliases: village.aliases.map((alias) => `قرية ${alias}`),
    fields: ["location_detail"],
  },
]);

export const RESTRICTED_AREA_RULES = [
  // مواقع محددة ضمن أراضي معضمية الشام، من دون حظر معضمية الشام كاملة.
  { name: "السومرية", aliases: ["السومرية", "مساكن السومرية"] },
  { name: "البلان", aliases: ["البلان", "منطقة البلان", "أراضي البلان"] },
  { name: "ضاحية يوسف العظمة", aliases: ["ضاحية يوسف العظمة", "مساكن يوسف العظمة"] },
  { name: "مساكن الزهرية", aliases: ["مساكن الزهرية"] },
  { name: "مساكن الرابعة", aliases: ["مساكن الرابعة", "مساكن الفرقة الرابعة"] },
  { name: "مساكن الشرطة في معضمية الشام", aliases: ["مساكن الشرطة في معضمية الشام"] },
  { name: "مساكن الأمن الجنائي في معضمية الشام", aliases: ["مساكن الأمن الجنائي في معضمية الشام"] },
  { name: "مساكن سرايا الدفاع", aliases: ["مساكن سرايا الدفاع"] },
  { name: "الفوج 555", aliases: ["الفوج 555", "مساكن الفوج 555"] },
  {
    name: "مطار المزة العسكري",
    aliases: ["مطار المزة العسكري", "محيط مطار المزة العسكري", "توسعة مطار المزة"],
  },

  // دمشق.
  {
    name: "المزة 86",
    aliases: [
      "المزة 86",
      "مزة 86",
      "حي المزة 86",
      "المزة ستة وثمانين",
    ],
  },
  { name: "عش الورور", aliases: ["عش الورور", "حي عش الورور", "مساكن عش الورور"] },
  { name: "حي الورود بدمشق", aliases: ["حي الورود دمشق", "الورود دمشق"] },
  {
    name: "حي الورود بدمشق",
    aliases: ["حي الورود"],
    fields: ["district", "village", "location_detail"],
    context: {
      fields: ["city"],
      aliases: ["دمشق", "محافظة دمشق"],
      mode: "exact",
    },
  },

  // حي القدم: لا يُحظر الحي كاملًا.
  {
    name: "حارة المحطة في القدم",
    aliases: [
      "حارة المحطة",
      "حارة المحطة في القدم",
      "القدم حارة المحطة",
      "أراضي حارة المحطة",
      "محاضر حارة المحطة",
    ],
  },

  // مشاريع المرسوم 66، من دون حظر المزة أو كفرسوسة كاملتين.
  {
    name: "ماروتا سيتي",
    aliases: ["ماروتا سيتي", "ماروتا", "ماريتا سيتي", "مشروع ماروتا سيتي", "مدينة ماروتا"],
  },
  {
    name: "باسيليا سيتي",
    aliases: ["باسيليا سيتي", "باسيليا", "مشروع باسيليا سيتي"],
  },
  { name: "خلف الرازي", aliases: ["خلف الرازي", "منطقة خلف الرازي"] },
  { name: "بساتين المزة", aliases: ["بساتين المزة"] },
  {
    name: "مشروع المرسوم 66",
    aliases: [
      "المنطقة التنظيمية الأولى بالمرسوم 66",
      "المنطقة التنظيمية الثانية بالمرسوم 66",
      "تنظيم المرسوم 66",
      "مشروع المرسوم 66",
    ],
  },

  // اللاذقية وريف جبلة.
  {
    name: "الشراشير",
    aliases: [
      "الشراشير",
      "قرية الشراشير",
      "الشراشير العلوية",
      "الشراشير جبلة",
      "الشراشير حميميم",
      "الشراشير قرب مطار حميميم",
    ],
  },

  // محافظة الحسكة: عبارات عامة للحزام العربي وقرى الغمر.
  {
    name: "الحزام العربي وقرى الغمر",
    aliases: [
      "الحزام العربي",
      "مشروع الحزام العربي",
      "أراضي الحزام العربي",
      "قرى الغمر",
      "قرى المغمورين",
      "قرى عرب الغمر",
      "عرب الغمر",
      "القرى النموذجية",
      "المزارع النموذجية",
      "مزارع الدولة النموذجية",
      "أراضي المغمورين",
    ],
  },

  ...HASAKAH_VILLAGE_RULES,
];

// اسم قديم للتوافق مع أي استيراد سابق.
export const RESTRICTED_AREAS = RESTRICTED_AREA_RULES;

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

function containsNormalizedPhrase(value, phrase) {
  if (!value || !phrase) return false;
  return ` ${value} `.includes(` ${phrase} `);
}

function matchesContext(context, normalizedListing) {
  if (!context) return true;

  const aliases = context.aliases.map(normalizeArabicText).filter(Boolean);
  const values = context.fields
    .map((field) => normalizedListing[field])
    .filter(Boolean);

  if (context.mode === "exact") {
    return values.some((value) => aliases.includes(value));
  }

  return aliases.some((alias) =>
    values.some((value) => containsNormalizedPhrase(value, alias))
  );
}

const NORMALIZED_RESTRICTED_AREA_RULES = RESTRICTED_AREA_RULES.map((rule) => ({
  ...rule,
  normalizedAliases: rule.aliases.map(normalizeArabicText).filter(Boolean),
}));

export function findRestrictedArea(listing = {}) {
  const normalizedListing = Object.fromEntries(
    LOCATION_FIELDS.map((field) => [field, normalizeArabicText(listing?.[field])])
  );

  for (const rule of NORMALIZED_RESTRICTED_AREA_RULES) {
    const fields = rule.fields || LOCATION_FIELDS;
    const matched = rule.normalizedAliases.some((alias) =>
      fields.some((field) =>
        containsNormalizedPhrase(normalizedListing[field], alias)
      )
    );

    if (matched && matchesContext(rule.context, normalizedListing)) {
      return rule.name;
    }
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
