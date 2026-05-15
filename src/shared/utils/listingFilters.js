// ════════════════════════════════════════════════════════════════
//  utils/listingFilters.js — منطق فلترة موحّد لكل الصفحات
//  يستخدمها HomePage و MapViewPage لضمان نفس السلوك
// ════════════════════════════════════════════════════════════════

function toArray(value) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (value === 0) return ["0"];
  if (value === "" || value === null || value === undefined || value === "الكل") return [];
  return String(value).split(/[،,]/).map(x => x.trim()).filter(Boolean);
}

function toNumber(value, fallback = 0) {
  const n = Number(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : fallback;
}


function normalizeTypeForFilter(value) {
  const v = String(value || "").trim();
  if (v === "sell" || v === "بيع" || v === "للبيع") return "sell";
  if (v === "rent" || v === "lease" || v === "إيجار" || v === "ايجار" || v === "للإيجار" || v === "للايجار") return "rent";
  if (v === "want_buy" || v === "مطلوب شراء") return "want_buy";
  if (v === "want_rent" || v === "مطلوب إيجار" || v === "مطلوب ايجار" || v === "مطلوب للإيجار") return "want_rent";
  return "all";
}

function normalizeCategoryForFilter(value) {
  const v = String(value || "").trim();
  if (!v || v === "الكل") return "";
  if (v === "محل") return "محل تجاري";
  return v;
}

function sameCategoryForFilter(listingCategory, filterCategory) {
  const a = normalizeCategoryForFilter(listingCategory);
  const b = normalizeCategoryForFilter(filterCategory);
  if (!b) return true;
  return a === b;
}

function getListingArea(listing) {
  return toNumber(
    listing?.net_area ??
    listing?.total_area ??
    listing?.land_area ??
    listing?.build_area ??
    listing?.extra_fields?.net_area ??
    listing?.extra_fields?.total_area ??
    listing?.extra_fields?.land_area ??
    listing?.extra_fields?.build_area,
    0
  );
}

function getListingFacing(listing) {
  return String(
    listing?.facing_dir ??
    listing?.facing ??
    listing?.extra_fields?.facing_dir ??
    listing?.extra_fields?.facing ??
    ""
  ).trim();
}


function expandFacingSearchValues(value) {
  const raw = String(value || "").trim();
  const variants = {
    "شمالي": ["شمال", "شمالي"],
    "شمال": ["شمال", "شمالي"],
    "جنوبي": ["جنوب", "جنوبي", "قبلي"],
    "جنوب": ["جنوب", "جنوبي", "قبلي"],
    "قبلي": ["جنوب", "جنوبي", "قبلي"],
    "شرقي": ["شرق", "شرقي"],
    "شرق": ["شرق", "شرقي"],
    "غربي": ["غرب", "غربي"],
    "غرب": ["غرب", "غربي"],
    "شمال شرقي": ["شمال شرق", "شمال شرقي"],
    "شمال شرق": ["شمال شرق", "شمال شرقي"],
    "شمال غربي": ["شمال غرب", "شمال غربي"],
    "شمال غرب": ["شمال غرب", "شمال غربي"],
    "جنوب شرقي": ["جنوب شرق", "جنوب شرقي"],
    "جنوب شرق": ["جنوب شرق", "جنوب شرقي"],
    "جنوب غربي": ["جنوب غرب", "جنوب غربي"],
    "جنوب غرب": ["جنوب غرب", "جنوب غربي"]
  };

  return variants[raw] || [raw];
}

function facingMatches(listingFacing, selectedFacingList) {
  const text = String(listingFacing || "").trim();
  if (!text || selectedFacingList.length === 0) return false;

  const searchValues = selectedFacingList.flatMap(expandFacingSearchValues);
  return searchValues.some(v => v && text.includes(v));
}

function getListingFloor(listing) {
  const value = listing?.floor ?? listing?.extra_fields?.floor;
  if (value === 0 || value === "0") return "0";
  if (value === "" || value === null || value === undefined) return "";
  return String(value).trim();
}

/**
 * تطبيق فلاتر على قائمة إعلانات.
 *
 * @param {Array} listings — قائمة الإعلانات الأصلية
 * @param {Object} opts — خيارات الفلترة
 *   - activeType:     "الكل" | "للبيع" | "للإيجار" | "want_buy" | "want_rent"
 *   - activeCity:     "الكل" | اسم مدينة
 *   - activeDistrict: "الكل" | اسم حي
 *   - activeVillage:  "الكل" | اسم قرية
 *   - filters:        كائن فلاتر متقدمة
 * @returns {Array} قائمة مُفلترة ومُرتّبة
 */
export function applyListingFilters(listings, {
  activeType     = "الكل",
  activeCity     = "الكل",
  activeDistrict = "الكل",
  activeVillage  = "الكل",
  filters        = {},
} = {}) {
  if (!Array.isArray(listings)) return [];

  const floorList = toArray(filters.floor);
  const facingList = toArray(filters.facing);

  let list = listings.filter(l => {
    // ── نوع الإعلان ──
    const wantedType = normalizeTypeForFilter(activeType);
    if (wantedType !== "all" && l.type !== wantedType) return false;

    // ── الموقع ──
    if (activeCity     !== "الكل" && l.city     !== activeCity)     return false;
    if (activeDistrict !== "الكل" && l.district !== activeDistrict) return false;
    if (activeVillage  !== "الكل" && l.village  !== activeVillage)  return false;

    // ── العملة والسعر ──
    const priceNum = toNumber(l.priceNum ?? l.price, 0);
    const pricedOnly = filters.pricedOnly === true || filters.pricedOnly === "true" || filters.priceMode === "priced";
    const hasPriceRange = !!(filters.minPrice || filters.maxPrice);
    const hasCurrencyFilter = !!(filters.currency && filters.currency !== "الكل");

    // عند تفعيل خيار "إظهار فقط الإعلانات المذكور سعرها" أو استعمال أي فلتر سعر،
    // لا تُعرض إعلانات السعر عند التواصل لأنها مخزنة بسعر 0.
    if ((pricedOnly || hasPriceRange || hasCurrencyFilter) && priceNum <= 0) return false;
    if (hasCurrencyFilter && l.currency !== filters.currency) return false;
    if (filters.minPrice && priceNum < Number(filters.minPrice)) return false;
    if (filters.maxPrice && priceNum > Number(filters.maxPrice)) return false;

    // ── المساحة ──
    const totalArea = getListingArea(l);
    if (filters.minArea && totalArea < Number(filters.minArea)) return false;
    if (filters.maxArea && totalArea > Number(filters.maxArea)) return false;

    // ── الفئة ──
    if (filters.category && filters.category !== "الكل" && !sameCategoryForFilter(l.category, filters.category)) return false;

    // ── الغرف ──
    if (filters.beds && filters.beds !== "الكل") {
      const rc = Number(l.rooms ?? l.beds ?? 0);
      if (filters.beds === "5+") { if (rc < 5) return false; }
      else if (rc !== Number(filters.beds)) return false;
    }

    // ── الطابق ──
    if (floorList.length > 0) {
      const floor = getListingFloor(l);
      if (!floor || !floorList.includes(floor)) return false;
    }

    // ── الملكية ──
    if (filters.ownership && filters.ownership !== "الكل" &&
        !(l.ownership || "").includes(filters.ownership.split("(")[0].trim())) return false;

    // ── الجهة ──
    // ملاحظة: الإضافة تحفظ القيم مثل: "شمال"، بينما الفلتر يعرض "شمالي".
    // لذلك نطابق بالمرادفات حتى يعمل الفلتر مع البيانات القديمة والجديدة.
    if (facingList.length > 0) {
      const fdir = getListingFacing(l);
      if (!facingMatches(fdir, facingList)) return false;
    }

    // ── الحالة والإكساء ──
    if (filters.condition && l.condition !== filters.condition) return false;
    if (filters.finishing && l.finishing !== filters.finishing) return false;

    // ── المصعد ──
    if (filters.elevator === "يوجد"    && !l.elevator) return false;
    if (filters.elevator === "لا يوجد" &&  l.elevator) return false;

    // ── الموقف ──
    if (filters.parking === "يوجد"    && !l.parking) return false;
    if (filters.parking === "لا يوجد" &&  l.parking) return false;

    // ── الفرش ──
    if (filters.furnished === "مفروش"     && l.furnished !== "مفروش") return false;
    if (filters.furnished === "غير مفروش" && l.furnished === "مفروش") return false;

    // ── التدفئة ──
    if (filters.heating && l.heating !== filters.heating) return false;

    // ── الإعلانات الجديدة فقط ──
    if (filters._newOnly) {
      const oneMonthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      if (!l.created_at || new Date(l.created_at).getTime() < oneMonthAgo) return false;
    }

    return true;
  });

  // ── الترتيب ──
  if (filters.sortBy === "price_asc")  list = [...list].sort((a,b) => toNumber(a.priceNum ?? a.price) - toNumber(b.priceNum ?? b.price));
  if (filters.sortBy === "price_desc") list = [...list].sort((a,b) => toNumber(b.priceNum ?? b.price) - toNumber(a.priceNum ?? a.price));
  if (filters.sortBy === "area_desc")  list = [...list].sort((a,b) => getListingArea(b) - getListingArea(a));
  if (filters.sortBy === "area_asc")   list = [...list].sort((a,b) => getListingArea(a) - getListingArea(b));

  return list;
}
