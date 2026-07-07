export const CATEGORY_TYPE_DEFINITIONS = [
  {
    slug: "apartments-sale",
    category: "شقة",
    dbCategories: ["شقة"],
    aliases: ["شقة", "شقه", "شقق", "شقق سكنية", "شقة سكنية", "ستوديو", "استوديو", "منزل"],
    type: "sell",
    titleSingular: "شقة",
    titlePlural: "شقق سكنية",
    action: "للبيع",
    queryText: "شقة شقق سكنية للبيع",
    seoTerms: [
      "شقق للبيع",
      "شقق سكنية للبيع",
      "شقة تمليك",
      "شقة طابو أخضر",
      "شقة جاهزة للسكن",
      "شقة مفروشة للبيع",
      "شقة غرف وصالة",
      "شقة 3 غرف",
      "شقة بإطلالة",
      "شقة مع مصعد",
      "شقة بواجهة شرقية",
      "أسعار الشقق",
      "مواصفات الشقق"
    ],
    specTerms: ["المساحة", "السعر", "عدد الغرف", "الطابق", "الإكساء", "الملكية", "الواجهة", "المصعد", "البلكون", "الإطلالة"]
  },
  {
    slug: "apartments-rent",
    category: "شقة",
    dbCategories: ["شقة"],
    aliases: ["شقة", "شقه", "شقق", "شقق سكنية", "شقة سكنية", "ستوديو", "استوديو", "منزل"],
    type: "rent",
    titleSingular: "شقة",
    titlePlural: "شقق سكنية",
    action: "للإيجار",
    queryText: "شقة شقق سكنية للإيجار",
    seoTerms: [
      "شقق للإيجار",
      "شقق سكنية للإيجار",
      "شقة مفروشة للإيجار",
      "شقة غير مفروشة",
      "شقة عائلية للإيجار",
      "شقة غرف وصالة",
      "شقة جاهزة للسكن",
      "إيجار شهري",
      "أسعار إيجار الشقق",
      "مواصفات الشقق"
    ],
    specTerms: ["المساحة", "الإيجار", "عدد الغرف", "الطابق", "الفرش", "الإكساء", "المصعد", "البلكون", "الإطلالة"]
  },
  { slug: "houses-sale", category: "بيت عربي", dbCategories: ["بيت عربي", "بيت", "منزل"], aliases: ["بيت عربي", "بيت", "منزل", "دار"], type: "sell", titleSingular: "بيت", titlePlural: "بيوت", action: "للبيع", queryText: "بيت منزل للبيع", seoTerms: ["بيوت للبيع", "منزل للبيع", "بيت عربي للبيع", "دار للبيع"], specTerms: ["المساحة", "السعر", "عدد الغرف", "الملكية"] },
  { slug: "houses-rent", category: "بيت عربي", dbCategories: ["بيت عربي", "بيت", "منزل"], aliases: ["بيت عربي", "بيت", "منزل", "دار"], type: "rent", titleSingular: "بيت", titlePlural: "بيوت", action: "للإيجار", queryText: "بيت منزل للإيجار", seoTerms: ["بيوت للإيجار", "منزل للإيجار", "بيت عربي للإيجار", "دار للإيجار"], specTerms: ["المساحة", "الإيجار", "عدد الغرف", "الفرش"] },
  { slug: "villas-sale", category: "فيلا", dbCategories: ["فيلا", "فيلا-مزرعة"], aliases: ["فيلا", "فلل", "قصر", "فيلا-مزرعة"], type: "sell", titleSingular: "فيلا", titlePlural: "فلل", action: "للبيع", queryText: "فيلا للبيع", seoTerms: ["فلل للبيع", "فيلا للبيع", "قصر للبيع", "فيلا مع مسبح"], specTerms: ["المساحة", "السعر", "الحديقة", "المسبح", "الملكية"] },
  { slug: "villas-rent", category: "فيلا", dbCategories: ["فيلا", "فيلا-مزرعة"], aliases: ["فيلا", "فلل", "قصر", "فيلا-مزرعة"], type: "rent", titleSingular: "فيلا", titlePlural: "فلل", action: "للإيجار", queryText: "فيلا للإيجار", seoTerms: ["فلل للإيجار", "فيلا للإيجار", "قصر للإيجار", "فيلا مفروشة"], specTerms: ["المساحة", "الإيجار", "الحديقة", "المسبح", "الفرش"] },
  { slug: "farms-sale", category: "مزرعة", dbCategories: ["مزرعة", "فيلا-مزرعة"], aliases: ["مزرعة", "مزرعه", "أرض زراعية", "فيلا-مزرعة"], type: "sell", titleSingular: "مزرعة", titlePlural: "مزارع", action: "للبيع", queryText: "مزرعة للبيع", seoTerms: ["مزارع للبيع", "مزرعة للبيع", "أرض زراعية للبيع", "مزرعة مع بئر"], specTerms: ["المساحة", "السعر", "البئر", "الكهرباء", "الطريق"] },
  { slug: "farms-rent", category: "مزرعة", dbCategories: ["مزرعة", "فيلا-مزرعة"], aliases: ["مزرعة", "مزرعه", "استراحة"], type: "rent", titleSingular: "مزرعة", titlePlural: "مزارع", action: "للإيجار", queryText: "مزرعة للإيجار", seoTerms: ["مزارع للإيجار", "مزرعة للإيجار", "استراحة للإيجار"], specTerms: ["المساحة", "الإيجار", "الخدمات", "الطريق"] },
  { slug: "lands-sale", category: "أرض سكنية", dbCategories: ["أرض سكنية", "أرض"], aliases: ["أرض سكنية", "ارض سكنيه", "أرض", "ارض", "قطعة أرض", "قطعه"], type: "sell", titleSingular: "أرض", titlePlural: "أراضي", action: "للبيع", queryText: "أرض للبيع", seoTerms: ["أراضي للبيع", "أرض سكنية للبيع", "قطعة أرض للبيع", "أرض تنظيم"], specTerms: ["المساحة", "السعر", "التنظيم", "الواجهة", "الملكية"] },
  { slug: "agricultural-lands-sale", category: "أرض زراعية", dbCategories: ["أرض زراعية"], aliases: ["أرض زراعية", "ارض زراعيه", "أرض", "ارض", "بستان"], type: "sell", titleSingular: "أرض زراعية", titlePlural: "أراضي زراعية", action: "للبيع", queryText: "أرض زراعية للبيع", seoTerms: ["أراضي زراعية للبيع", "أرض زراعية للبيع", "بستان للبيع"], specTerms: ["المساحة", "السعر", "البئر", "الطريق", "الملكية"] },
  { slug: "shops-sale", category: "محل تجاري", dbCategories: ["محل تجاري", "محل"], aliases: ["محل تجاري", "محل", "دكان", "متجر"], type: "sell", titleSingular: "محل", titlePlural: "محلات", action: "للبيع", queryText: "محل للبيع", seoTerms: ["محلات للبيع", "محل تجاري للبيع", "دكان للبيع", "متجر للبيع"], specTerms: ["المساحة", "السعر", "الواجهة", "الموقع", "الملكية"] },
  { slug: "shops-rent", category: "محل تجاري", dbCategories: ["محل تجاري", "محل"], aliases: ["محل تجاري", "محل", "دكان", "متجر"], type: "rent", titleSingular: "محل", titlePlural: "محلات", action: "للإيجار", queryText: "محل للإيجار", seoTerms: ["محلات للإيجار", "محل تجاري للإيجار", "دكان للإيجار", "متجر للإيجار"], specTerms: ["المساحة", "الإيجار", "الواجهة", "الموقع"] },
  { slug: "offices-sale", category: "مكتب", dbCategories: ["مكتب", "عيادة"], aliases: ["مكتب", "مكاتب", "عيادة", "مكتب تجاري"], type: "sell", titleSingular: "مكتب", titlePlural: "مكاتب", action: "للبيع", queryText: "مكتب للبيع", seoTerms: ["مكاتب للبيع", "مكتب تجاري للبيع", "عيادة للبيع"], specTerms: ["المساحة", "السعر", "الطابق", "المصعد", "الملكية"] },
  { slug: "offices-rent", category: "مكتب", dbCategories: ["مكتب", "عيادة"], aliases: ["مكتب", "مكاتب", "عيادة", "مكتب تجاري"], type: "rent", titleSingular: "مكتب", titlePlural: "مكاتب", action: "للإيجار", queryText: "مكتب للإيجار", seoTerms: ["مكاتب للإيجار", "مكتب تجاري للإيجار", "عيادة للإيجار"], specTerms: ["المساحة", "الإيجار", "الطابق", "المصعد"] },
  { slug: "warehouses-sale", category: "مستودع", dbCategories: ["مستودع"], aliases: ["مستودع", "مستودعات", "مخزن", "هنغار"], type: "sell", titleSingular: "مستودع", titlePlural: "مستودعات", action: "للبيع", queryText: "مستودع للبيع", seoTerms: ["مستودعات للبيع", "مستودع للبيع", "مخزن للبيع", "هنغار للبيع"], specTerms: ["المساحة", "السعر", "ارتفاع السقف", "دخول الشاحنات", "الملكية"] },
  { slug: "warehouses-rent", category: "مستودع", dbCategories: ["مستودع"], aliases: ["مستودع", "مستودعات", "مخزن", "هنغار"], type: "rent", titleSingular: "مستودع", titlePlural: "مستودعات", action: "للإيجار", queryText: "مستودع للإيجار", seoTerms: ["مستودعات للإيجار", "مستودع للإيجار", "مخزن للإيجار", "هنغار للإيجار"], specTerms: ["المساحة", "الإيجار", "ارتفاع السقف", "دخول الشاحنات"] },
  { slug: "chalets-sale", category: "شاليه", dbCategories: ["شاليه"], aliases: ["شاليه", "شاليهات", "استراحة", "استراحه"], type: "sell", titleSingular: "شاليه", titlePlural: "شاليهات", action: "للبيع", queryText: "شاليه للبيع", seoTerms: ["شاليهات للبيع", "شاليه للبيع", "استراحة للبيع"], specTerms: ["المساحة", "السعر", "المسبح", "الإطلالة", "الملكية"] },
  { slug: "chalets-rent", category: "شاليه", dbCategories: ["شاليه"], aliases: ["شاليه", "شاليهات", "استراحة", "استراحه"], type: "rent", titleSingular: "شاليه", titlePlural: "شاليهات", action: "للإيجار", queryText: "شاليه للإيجار", seoTerms: ["شاليهات للإيجار", "شاليه للإيجار", "استراحة للإيجار"], specTerms: ["المساحة", "الإيجار", "المسبح", "الإطلالة"] },
];

export const CATEGORY_TYPE_DEFINITIONS_BY_SLUG = Object.fromEntries(
  CATEGORY_TYPE_DEFINITIONS.map((item) => [item.slug, item])
);

export const CATEGORY_TYPE_DEFINITIONS_BY_KEY = Object.fromEntries(
  CATEGORY_TYPE_DEFINITIONS.map((item) => [`${item.category}:${item.type}`, item])
);

export function getCategoryTypeDefinition(slug = "") {
  const key = String(slug || "").trim().toLowerCase();
  return CATEGORY_TYPE_DEFINITIONS_BY_SLUG[key] || null;
}

export function getCategoryTypeSlug(category = "", type = "") {
  const key = `${String(category || "").trim()}:${String(type || "").trim()}`;
  return CATEGORY_TYPE_DEFINITIONS_BY_KEY[key]?.slug || "";
}

export function getCategoryTypeQueryText(slug = "") {
  return getCategoryTypeDefinition(slug)?.queryText || "";
}

export function getCategoryTypeSeoLabel(slug = "") {
  const def = getCategoryTypeDefinition(slug);
  if (!def) return "";
  return `${def.titlePlural} ${def.action}`;
}

export function getAllCategoryTypeDefinitions() {
  return CATEGORY_TYPE_DEFINITIONS.slice();
}

export function getCategoryTypeSearchTerms(slug = "") {
  return getCategoryTypeDefinition(slug)?.seoTerms?.slice() || [];
}
