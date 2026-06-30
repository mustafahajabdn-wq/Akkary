export const CATEGORY_TYPE_DEFINITIONS = [
  { slug: "apartments-sale", category: "شقة", type: "sell", titleSingular: "شقة", titlePlural: "شقق", action: "للبيع", queryText: "شقة للبيع" },
  { slug: "apartments-rent", category: "شقة", type: "rent", titleSingular: "شقة", titlePlural: "شقق", action: "للإيجار", queryText: "شقة للإيجار" },
  { slug: "houses-sale", category: "بيت عربي", type: "sell", titleSingular: "بيت", titlePlural: "بيوت", action: "للبيع", queryText: "بيت للبيع" },
  { slug: "houses-rent", category: "بيت عربي", type: "rent", titleSingular: "بيت", titlePlural: "بيوت", action: "للإيجار", queryText: "بيت للإيجار" },
  { slug: "villas-sale", category: "فيلا", type: "sell", titleSingular: "فيلا", titlePlural: "فلل", action: "للبيع", queryText: "فيلا للبيع" },
  { slug: "villas-rent", category: "فيلا", type: "rent", titleSingular: "فيلا", titlePlural: "فلل", action: "للإيجار", queryText: "فيلا للإيجار" },
  { slug: "farms-sale", category: "مزرعة", type: "sell", titleSingular: "مزرعة", titlePlural: "مزارع", action: "للبيع", queryText: "مزرعة للبيع" },
  { slug: "farms-rent", category: "مزرعة", type: "rent", titleSingular: "مزرعة", titlePlural: "مزارع", action: "للإيجار", queryText: "مزرعة للإيجار" },
  { slug: "lands-sale", category: "أرض سكنية", type: "sell", titleSingular: "أرض", titlePlural: "أراضي", action: "للبيع", queryText: "أرض للبيع" },
  { slug: "agricultural-lands-sale", category: "أرض زراعية", type: "sell", titleSingular: "أرض زراعية", titlePlural: "أراضي زراعية", action: "للبيع", queryText: "أرض زراعية للبيع" },
  { slug: "shops-sale", category: "محل تجاري", type: "sell", titleSingular: "محل", titlePlural: "محلات", action: "للبيع", queryText: "محل للبيع" },
  { slug: "shops-rent", category: "محل تجاري", type: "rent", titleSingular: "محل", titlePlural: "محلات", action: "للإيجار", queryText: "محل للإيجار" },
  { slug: "offices-sale", category: "مكتب", type: "sell", titleSingular: "مكتب", titlePlural: "مكاتب", action: "للبيع", queryText: "مكتب للبيع" },
  { slug: "offices-rent", category: "مكتب", type: "rent", titleSingular: "مكتب", titlePlural: "مكاتب", action: "للإيجار", queryText: "مكتب للإيجار" },
  { slug: "warehouses-sale", category: "مستودع", type: "sell", titleSingular: "مستودع", titlePlural: "مستودعات", action: "للبيع", queryText: "مستودع للبيع" },
  { slug: "warehouses-rent", category: "مستودع", type: "rent", titleSingular: "مستودع", titlePlural: "مستودعات", action: "للإيجار", queryText: "مستودع للإيجار" },
  { slug: "chalets-sale", category: "شاليه", type: "sell", titleSingular: "شاليه", titlePlural: "شاليهات", action: "للبيع", queryText: "شاليه للبيع" },
  { slug: "chalets-rent", category: "شاليه", type: "rent", titleSingular: "شاليه", titlePlural: "شاليهات", action: "للإيجار", queryText: "شاليه للإيجار" },
];

const BY_SLUG = Object.fromEntries(CATEGORY_TYPE_DEFINITIONS.map((item) => [item.slug, item]));
const BY_KEY = Object.fromEntries(CATEGORY_TYPE_DEFINITIONS.map((item) => [`${item.category}:${item.type}`, item]));

export function getCategoryTypeDefinition(slug = "") {
  return BY_SLUG[String(slug || "").trim().toLowerCase()] || null;
}

export function getCategoryTypeSlug(category = "", type = "") {
  return BY_KEY[`${String(category || "").trim()}:${String(type || "").trim()}`]?.slug || "";
}
