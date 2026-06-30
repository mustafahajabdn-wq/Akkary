import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { C } from "../../shared/constants/colors.js";
import { cities } from "../../shared/utils/geo.js";
import { IslamicPattern, Wave } from "../../shared/components/icons.jsx";
import { ListingCard } from "../../shared/components/common/ListingCard.jsx";
import { BackButton } from "../../shared/components/common/BackButton.jsx";
import { LoadMoreButton } from "../../shared/components/common/LoadMoreButton.jsx";
import { searchListings, getAllDistrictNames } from "../services/searchService.js";
import { getCurrentUserId } from "../services/authService.js";
import { findSavedSearchByQuery, insertSavedSearch } from "../services/savedSearchService.js";
import { S, mergeStyles } from "../../shared/styles/primitives.js";
import { trackSearch } from "../../shared/services/metaPixel.js";
import { getCategoryTypeQueryText } from "../../shared/seo/categoryTypeSlugs.js";

// ══════════════════════════════════════════════════════════════
//  ثوابت وخرائط
// ══════════════════════════════════════════════════════════════

const AR = "٠١٢٣٤٥٦٧٨٩";
const WE = "0123456789";

// تصحيح أخطاء شائعة في المدن
const CITY_CORRECTIONS = {
  "دمشك": "دمشق",
  "الشام": "دمشق",
  "شام": "دمشق",
  "لاذقيه": "اللاذقية",
  "لاذقية": "اللاذقية",
  "اللاذقيه": "اللاذقية",
  "حماه": "حماة",
  "ديرالزور": "دير الزور",
  "سويداء": "السويداء",
  "ادلب": "إدلب",
  "إدلب": "إدلب",
  "قنيطره": "القنيطرة",
  "حسكه": "الحسكة",
  "رقه": "الرقة"
};
const CATEGORIES = {
  "شقة": ["شقه", "شقة", "شقق", "ستوديو", "استوديو"],
  "بيت عربي": ["بيت", "منزل", "دار", "بيت عربي"],
  "فيلا": ["فيلا", "فلل", "قصر"],
  "فيلا-مزرعة": ["فيلا مزرعه", "فيلا مزرعة"],
  "أرض سكنية": ["ارض سكنيه", "أرض سكنية", "قطعه سكنيه", "ارض سكني"],
  "أرض زراعية": ["ارض زراعيه", "أرض زراعية", "ارض زراعي"],
  "محل تجاري": ["محل", "دكان", "محل تجاري"],
  "مكتب": ["مكتب", "مكاتب"],
  "مستودع": ["مستودع", "مخزن"],
  "شاليه": ["شاليه", "استراحه", "استراحة"],
  "مزرعة": ["مزرعه", "مزرعة"]
};
const LISTING_TYPES = {
  sell: ["للبيع", "بيع", "اشتري", "يبيع", "شراء"],
  rent: ["للايجار", "للإيجار", "ايجار", "إيجار", "للاستئجار", "يؤجر", "استئجار"]
};
const FEATURES = {
  elevator: ["مصعد", "اصنصير", "اسانصير", "أصنصير"],
  parking: ["كراج", "موقف", "موقف سيارات", "مراب", "مرآب", "باركينج"],
  pool: ["مسبح", "سباحه", "حوض سباحه"],
  solar: ["طاقه شمسيه", "طاقة شمسية", "الواح شمسيه", "ألواح شمسية"],
  compound: ["كمباوند", "مجمع سكني", "مجمع"],
  intercom: ["انترفون", "انتركم", "جرس", "إنتركم"],
  security: ["حراسه", "حراسة", "امن", "أمن", "كاميرات"],
  balcony: ["بلكون", "بلكونه", "بلكونة", "شرفه", "شرفة", "شرفات", "برندا", "برنده"],
  terrace: ["تراس", "سطح خاص", "روف", "سطح"],
  furnished_yes: ["مفروش", "مفروشه", "مع العفش", "مع فرش", "مع الاثاث", "مع الأثاث", "نصف مفروش"],
  furnished_no: ["غير مفروش", "غير مفروشه", "بدون فرش", "فارغ", "بدون اثاث"],
  heating_central: ["تدفئه مركزيه", "تدفئة مركزية", "مركزيه", "مركزية"],
  heating_diesel: ["مدفاه ديزل", "مدفأة ديزل", "ديزل"],
  heating_gas: ["مدفاه غاز", "مدفأة غاز", "غاز"],
  heating_electric: ["تدفئه كهرباء", "تدفئة كهربائية", "كهرباء"],
  cond_ready: ["جاهز", "جاهز للسكن", "جاهزه للسكن", "خالي", "تسليم فوري"],
  cond_shell: ["على العضم", "عالعضم", "بدون اكساء", "بدون إكساء", "هيكل"],
  cond_construction: ["قيد الانشاء", "قيد الإنشاء", "تحت الإنشاء", "قيد الإكساء"],
  cond_rented: ["مؤجر", "مأجور", "مستأجر"],
  cond_occupied: ["مسكون", "مسكونه"],
  finish_super: ["سوبر ديلوكس", "سوبر", "ديلوكس deluxe"],
  finish_deluxe: ["ديلوكس", "deluxe"],
  finish_luxury: ["فاخر", "فاخره", "راقي"],
  finish_first: ["نخب اول", "درجة أولى", "ممتاز"],
  finish_modern: ["حديث", "عصري", "مودرن"],
  finish_normal: ["عادي", "متوسط"],
  kitchen_closed: ["مطبخ مغلق", "مطبخ منفصل"],
  kitchen_open: ["مطبخ امريكي", "مطبخ أمريكي", "مطبخ مفتوح", "اوبن سبيس"],
  kitchen_any: ["مطبخ"],
  dir_east: ["شرقي", "شرقيه", "جهة الشرق"],
  dir_west: ["غربي", "غربيه", "جهة الغرب"],
  dir_north: ["شمالي", "شماليه", "جهة الشمال"],
  dir_south: ["جنوبي", "جنوبيه", "قبلي", "جهة الجنوب"],
  multi_facade: ["ثلاث واجهات", "اربع واجهات", "3 واجهات", "4 واجهات"],
  view_open: ["اطلاله مفتوحه", "اطلالة مفتوحة", "اطلاله", "اطلالة", "منظر جميل"],
  own_green: ["طابو اخضر", "طابو أخضر", "طابو نظامي اخضر"],
  own_legal: ["طابو نظامي", "نظامي", "مرخص", "رخصة"],
  own_notary: ["كاتب عدل", "وكاله غير قابله للعزل", "وكالة غير قابلة للعزل"],
  own_court: ["حكم محكمه", "حكم محكمة"],
  own_share: ["سهم", "اسهم", "أسهم", "اكتتاب"],
  price_negotiable: ["قابل للتفاوض", "قابل", "نقاش", "بزار", "تفاوض"]
};

// نوادي النفي
const NEG_PREFIXES = ["بدون", "بلا", "غير", "ليس", "مافي", "ما في", "ما فيه", "بدون ما", "لا يوجد", "لا"];

// مؤشرات النية
const INTENT_MARKERS = ["ابحث عن", "اريد", "أريد", "دور على", "فتش على", "بدي", "محتاج", "عندي استفسار عن"];

function decodeAreaSlug(value = "") {
  try {
    return decodeURIComponent(String(value || ""))
      .replace(/-/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  } catch {
    return String(value || "")
      .replace(/-/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
}

function buildAreaQueryFromPath(pathname = "") {
  const parts = String(pathname || "").split("/").filter(Boolean);
  if (parts[0] !== "real-estate") return "";

  const city = decodeAreaSlug(parts[1]);
  const district = decodeAreaSlug(parts[2]);
  const categoryQuery = getCategoryTypeQueryText(parts[3]);

  if (!city) return "";
  const locationText = district ? `${district} ${city}` : city;
  return categoryQuery ? `${categoryQuery} في ${locationText}` : district ? `عقارات في ${locationText}` : `عقارات في ${city}`;
}

// ══════════════════════════════════════════════════════════════
//  دوال التطبيع
// ══════════════════════════════════════════════════════════════

function nd(s = "") {
  return s.replace(/[٠-٩]/g, d => WE[AR.indexOf(d)] || d);
}
function norm(s = "") {
  return nd(String(s)).toLowerCase().replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/ؤ/g, "و").replace(/ئ/g, "ي").replace(/[^\w\s\u0600-\u06FF]/g, " ").replace(/\s+/g, " ").trim();
}
function has(text, phrases) {
  return phrases.some(p => text.includes(norm(p)));
}
function tokenize(text = "") {
  return norm(text).split(" ").filter(t => t.length > 1);
}
function stringifyExtra(extra) {
  if (!extra) return "";
  if (typeof extra === "string") return extra;
  if (Array.isArray(extra)) return extra.map(stringifyExtra).join(" ");
  if (typeof extra === "object") return Object.values(extra).map(stringifyExtra).join(" ");
  return "";
}
function buildBlob(l) {
  return norm([l.title, l.description, l.category, l.type, l.city, l.district, l.village, l.ownership, l.furnished, l.heating, l.condition, l.finishing, l.kitchen, l.facing_dir, l.zone_class, l.water_source, l.location_detail, l.messenger_id, l.external_url, l.video_url, l.warehouse_type, l.shop_location, stringifyExtra(l.extra_fields)].filter(Boolean).join(" "));
}

// ══════════════════════════════════════════════════════════════
//  دوال الاستخراج مع دعم المجالات والنفي
// ══════════════════════════════════════════════════════════════

// يعيد { min, max, exact } — null يعني غير محدد
function extractArea(text) {
  const n = norm(text);
  const unit = "(?:متر مربع|متر مربع|م2|م\\b|متر\\b)";
  let m = n.match(new RegExp(`بين\\s*(\\d+)\\s*(?:و|الى|إلى|حتى)\\s*(\\d+)\\s*${unit}`));
  if (m) return {
    min: +m[1],
    max: +m[2],
    exact: null
  };
  m = n.match(new RegExp(`(?:اكثر من|أكثر من|فوق|على الاقل|على الأقل)\\s*(\\d+)\\s*${unit}`));
  if (m) return {
    min: +m[1],
    max: null,
    exact: null
  };
  m = n.match(new RegExp(`(?:اقل من|أقل من|تحت|حتى)\\s*(\\d+)\\s*${unit}`));
  if (m) return {
    min: null,
    max: +m[1],
    exact: null
  };
  m = n.match(new RegExp(`(\\d+)\\s*${unit}`));
  if (m) return {
    min: null,
    max: null,
    exact: +m[1]
  };
  return { min: null, max: null, exact: null };
}
function extractRooms(text) {
  const n = norm(text);
  let m = n.match(/(?:بين\s*)?(\d+)\s*(?:و|الى|إلى|حتى)\s*(\d+)\s*(?:غرف|غرفة|اوض|اوضه|اوضة)/);
  if (m) return { min: +m[1], max: +m[2], exact: null };
  m = n.match(/(?:اكثر من|أكثر من|فوق|على الاقل|على الأقل)\s*(\d+)\s*(?:غرف|غرفة|اوض|اوضه|اوضة)/);
  if (m) return { min: +m[1], max: null, exact: null };
  m = n.match(/(?:اقل من|أقل من|تحت|حتى)\s*(\d+)\s*(?:غرف|غرفة|اوض|اوضه|اوضة)/);
  if (m) return { min: null, max: +m[1], exact: null };
  m = n.match(/(\d+)\s*(?:غرف|غرفة|اوض|اوضه|اوضة)/);
  if (m) return { min: null, max: null, exact: +m[1] };
  return { min: null, max: null, exact: null };
}
function extractBaths(text) {
  const m = norm(text).match(/(\d+)\s*(?:حمام|حمامات|دورات مياه)/);
  return m ? +m[1] : null;
}
function extractFloor(text) {
  const n = norm(text);
  if (/(?:طابق|الدور)\s*(?:ارضي|الأرضي)/.test(n)) return 0;
  const words = { اول: 1, الاول: 1, تاني: 2, ثاني: 2, الثاني: 2, تالت: 3, ثالث: 3, الثالث: 3, رابع: 4, الخامس: 5, خامس: 5, سادس: 6, سابع: 7, ثامن: 8, تاسع: 9, عاشر: 10 };
  for (const [w, v] of Object.entries(words)) if (n.includes(`طابق ${w}`) || n.includes(`الدور ${w}`)) return v;
  const m = n.match(/(?:طابق|الدور)\s*(\d+)/);
  if (m) return +m[1];
  if (/(?:اخر طابق|آخر طابق|الاخير|الأخير)/.test(n)) return 99; // رمز الطابق الأخير
  return null;
}
function parseNumberWithUnit(s) {
  const n = norm(s);
  let m = n.match(/(\d+(?:\.\d+)?)\s*(?:مليار|مليارات)/);
  if (m) return +m[1] * 1_000_000_000;
  m = n.match(/(\d+(?:\.\d+)?)\s*(?:مليون|ملايين|م)/);
  if (m) return +m[1] * 1_000_000;
  m = n.match(/(\d+(?:\.\d+)?)\s*(?:الف|ألف|k|ك)/);
  if (m) return +m[1] * 1000;
  m = n.match(/\d{4,}/);
  return m ? +m[0] : null;
}
function extractPrice(text) {
  const n = norm(text);
  let m = n.match(/بين\s*([^\s]+(?:\s*(?:مليون|مليار|الف|ألف|k|ك|م))?)\s*(?:و|الى|إلى|حتى)\s*([^\s]+(?:\s*(?:مليون|مليار|الف|ألف|k|ك|م))?)/);
  if (m) return { min: parseNumberWithUnit(m[1]), max: parseNumberWithUnit(m[2]), exact: null };
  m = n.match(/(?:اقل من|أقل من|تحت|حتى)\s*([^\s]+(?:\s*(?:مليون|مليار|الف|ألف|k|ك|م))?)/);
  if (m) return { min: null, max: parseNumberWithUnit(m[1]), exact: null };
  m = n.match(/(?:اكثر من|أكثر من|فوق|على الاقل|على الأقل)\s*([^\s]+(?:\s*(?:مليون|مليار|الف|ألف|k|ك|م))?)/);
  if (m) return { min: parseNumberWithUnit(m[1]), max: null, exact: null };
  const val = parseNumberWithUnit(text);
  return { min: null, max: null, exact: val };
}
function stripIntent(text) {
  let x = text;
  INTENT_MARKERS.forEach(p => { x = x.replace(new RegExp(p, "gi"), " "); });
  return x.trim();
}
function extractCategories(text) {
  const n = norm(text);
  return Object.entries(CATEGORIES).filter(([, syns]) => has(n, syns)).map(([cat]) => cat);
}
function extractFeatures(text) {
  const n = norm(text);
  const inc = {}, exc = {};
  for (const [key, syns] of Object.entries(FEATURES)) {
    syns.forEach(s => {
      const sn = norm(s);
      if (!sn || !n.includes(sn)) return;
      const idx = n.indexOf(sn);
      const before = n.slice(Math.max(0, idx - 18), idx).trim();
      const neg = NEG_PREFIXES.some(p => before.endsWith(norm(p)) || before.includes(norm(p) + " "));
      if (neg) exc[key] = true; else inc[key] = true;
    });
  }
  return { included: inc, excluded: exc };
}

// تصحيح المدينة
function correctCity(text) {
  const n = norm(text);
  for (const [wrong, correct] of Object.entries(CITY_CORRECTIONS)) {
    if (n.includes(norm(wrong))) return correct;
  }
  return null;
}

// ══════════════════════════════════════════════════════════════
//  parse الاستعلام الكامل
// ══════════════════════════════════════════════════════════════

function parseQuery(query, allDistrictNames = []) {
  const clean = stripIntent(query);
  const n = norm(clean);
  const feats = extractFeatures(clean);

  // OR للفئات
  const categories = extractCategories(clean);

  // كشف المدينة مع التصحيح
  let city = correctCity(clean);
  if (!city) {
    city = (cities || []).find(c => n.includes(norm(c))) || null;
  }

  // كشف الحي من الكاش
  const district = allDistrictNames.find(d => d && n.includes(norm(d))) || null;

  // بحث رقم هاتف جزئي
  const phoneMatch = clean.match(/0\d{3,}/);
  const phoneQuery = phoneMatch ? phoneMatch[0] : null;
  return {
    raw: query,
    categories,
    // مصفوفة (OR)
    listingType: Object.entries(LISTING_TYPES).find(([, syns]) => has(n, syns))?.[0] || null,
    city,
    district,
    area: extractArea(clean),
    rooms: extractRooms(clean),
    baths: extractBaths(clean),
    floor: extractFloor(clean),
    price: extractPrice(clean),
    features: feats.included,
    excludedFeatures: feats.excluded,
    phoneQuery,
    tokens: tokenize(clean)
  };
}

// ══════════════════════════════════════════════════════════════
//  الفلترة الصارمة
// ══════════════════════════════════════════════════════════════

function inRange(value, range) {
  const n = Number(value);
  if (!Number.isFinite(n)) return false;
  if (range.min != null && n < range.min) return false;
  if (range.max != null && n > range.max) return false;
  return true;
}
function featureMatches(item, feat) {
  const blob = buildBlob(item);
  const ownN = norm(item.ownership || "");
  const furN = norm(item.furnished || "");
  const heatN = norm(item.heating || "");
  const condN = norm(item.condition || "");
  const finN = norm(item.finishing || "");
  switch (feat) {
    case "elevator":
    case "parking":
    case "pool":
    case "solar":
    case "compound":
      return !!item[feat];
    case "balcony":
      return has(blob, FEATURES.balcony);
    case "terrace":
      return has(blob, FEATURES.terrace);
    case "intercom":
      return has(blob, FEATURES.intercom);
    case "security":
      return has(blob, FEATURES.security);
    case "furnished_yes":
      return furN.includes("مفروش") && !furN.includes("غير");
    case "furnished_no":
      return furN.includes("غير");
    case "heating_central":
      return heatN.includes("مركزي");
    case "heating_diesel":
      return heatN.includes("ديزل");
    case "heating_gas":
      return heatN.includes("غاز");
    case "heating_electric":
      return heatN.includes("كهرب");
    case "cond_ready":
      return has(condN, FEATURES.cond_ready);
    case "cond_shell":
      return has(condN, FEATURES.cond_shell);
    case "cond_construction":
      return has(condN, FEATURES.cond_construction);
    case "cond_rented":
      return has(condN, FEATURES.cond_rented);
    case "cond_occupied":
      return has(condN, FEATURES.cond_occupied);
    case "finish_super":
      return has(finN, FEATURES.finish_super);
    case "finish_deluxe":
      return has(finN, FEATURES.finish_deluxe);
    case "finish_luxury":
      return has(finN, FEATURES.finish_luxury);
    case "finish_first":
      return has(finN, FEATURES.finish_first);
    case "finish_modern":
      return has(finN, FEATURES.finish_modern);
    case "finish_normal":
      return has(finN, FEATURES.finish_normal);
    case "kitchen_closed":
      return has(blob, FEATURES.kitchen_closed);
    case "kitchen_open":
      return has(blob, FEATURES.kitchen_open);
    case "kitchen_any":
      return has(blob, FEATURES.kitchen_any);
    case "dir_east":
      return has(blob, FEATURES.dir_east);
    case "dir_west":
      return has(blob, FEATURES.dir_west);
    case "dir_north":
      return has(blob, FEATURES.dir_north);
    case "dir_south":
      return has(blob, FEATURES.dir_south);
    case "multi_facade":
      return has(blob, FEATURES.multi_facade);
    case "view_open":
      return has(blob, FEATURES.view_open);
    case "own_green":
      return ownN.includes("اخضر");
    case "own_legal":
      return has(ownN, FEATURES.own_legal);
    case "own_notary":
      return has(ownN, FEATURES.own_notary);
    case "own_court":
      return has(ownN, FEATURES.own_court);
    case "own_share":
      return has(ownN, FEATURES.own_share);
    case "price_negotiable":
      return has(blob, FEATURES.price_negotiable);
    default:
      return has(blob, FEATURES[feat] || [feat]);
  }
}
function hardPass(item, pq) {
  // OR للفئات — مطابقة صارمة
  if (pq.categories?.length) {
    const lc = norm(item.category || "");
    if (!pq.categories.some(cat => lc === norm(cat))) return false;
  }
  if (pq.listingType && item.type !== pq.listingType) return false;
  if (pq.city && !norm(item.city || "").includes(norm(pq.city))) return false;
  if (pq.district && !norm(item.district || "").includes(norm(pq.district))) return false;
  const {
    area,
    rooms,
    price
  } = pq;
  if ((area.min != null || area.max != null) && !inRange(item.total_area, area)) return false;
  if ((rooms.min != null || rooms.max != null) && !inRange(item.rooms, rooms)) return false;
  if (pq.baths != null && Number(item.baths) !== pq.baths) return false;

  // طابق — صارم، إعلان بدون طابق يُرفض
  if (pq.floor != null) {
    if (item.floor == null) return false;
    if (pq.floor === 99) {
      if (!item.total_floors) return false;
      if (Number(item.floor) !== Number(item.total_floors)) return false;
    } else {
      if (Math.abs(Number(item.floor) - pq.floor) > 1) return false;
    }
  }
  const priceVal = Number(item.priceNum ?? item.price ?? 0);
  if ((price.min != null || price.max != null) && !inRange(priceVal, price)) return false;

  // ميزات مطلوبة
  for (const f of Object.keys(pq.features || {})) {
    if (!featureMatches(item, f)) return false;
  }
  // ميزات مستبعدة
  for (const f of Object.keys(pq.excludedFeatures || {})) {
    if (featureMatches(item, f)) return false;
  }
  return true;
}

// ══════════════════════════════════════════════════════════════
//  حساب النقاط
// ══════════════════════════════════════════════════════════════

function score(listing, pq) {
  let s = 0;
  const blob = buildBlob(listing);
  const descT = norm((listing.title || "") + " " + (listing.description || ""));

  // فئة (OR)
  if (pq.categories?.length) {
    const lc = norm(listing.category || "");
    if (pq.categories.some(cat => lc === norm(cat))) s += 20;else if (pq.categories.some(cat => lc.includes(norm(cat.split(" ")[0])))) s += 8;
  }

  // نوع العملية
  if (pq.listingType && listing.type === pq.listingType) s += 15;

  // مدينة وحي
  if (pq.city && norm(listing.city || "").includes(norm(pq.city))) s += 15;
  if (pq.district && norm(listing.district || "").includes(norm(pq.district))) s += 20;

  // مساحة
  const {
    area
  } = pq;
  if (area.exact != null && listing.total_area != null) {
    const d = Math.abs(Number(listing.total_area) - area.exact);
    if (d === 0) s += 20;else if (d <= 10) s += 14;else if (d <= 30) s += 8;else if (d <= 60) s += 3;
  } else if ((area.min != null || area.max != null) && inRange(listing.total_area, area)) s += 12;

  // غرف
  const {
    rooms
  } = pq;
  if (rooms.exact != null && listing.rooms != null) {
    const d = Math.abs(Number(listing.rooms) - rooms.exact);
    if (d === 0) s += 15;else if (d === 1) s += 7;
  } else if ((rooms.min != null || rooms.max != null) && inRange(listing.rooms, rooms)) s += 10;

  // حمامات
  if (pq.baths != null && Number(listing.baths) === pq.baths) s += 10;

  // طابق
  if (pq.floor != null && listing.floor != null) {
    if (pq.floor === 99) {
      if (listing.total_floors && Number(listing.floor) === Number(listing.total_floors)) s += 10;
    } else {
      const d = Math.abs(Number(listing.floor) - pq.floor);
      if (d === 0) s += 10;else if (d === 1) s += 5;
    }
  }

  // سعر
  const priceVal = Number(listing.priceNum ?? listing.price ?? 0);
  const {
    price
  } = pq;
  if (price.exact != null && priceVal) {
    const d = Math.abs(priceVal - price.exact);
    if (d === 0) s += 20;else if (d <= price.exact * 0.1) s += 12;else if (d <= price.exact * 0.2) s += 7;
  } else if ((price.min != null || price.max != null) && inRange(priceVal, price)) s += 12;

  // ميزات بوليانية
  for (const f of ["elevator", "parking", "pool", "solar", "compound"]) {
    if (pq.features?.[f] && listing[f]) s += 12;
  }
  if (pq.features?.balcony && has(descT, FEATURES.balcony)) s += 12;
  if (pq.features?.terrace && has(descT, FEATURES.terrace)) s += 10;
  if (pq.features?.intercom && has(blob, FEATURES.intercom)) s += 6;
  if (pq.features?.security && has(blob, FEATURES.security)) s += 6;
  const furN = norm(listing.furnished || "");
  const heatN = norm(listing.heating || "");
  const condN = norm(listing.condition || "");
  const finN = norm(listing.finishing || "");
  const ownN = norm(listing.ownership || "");
  if (pq.features?.furnished_yes && furN && !furN.includes("غير")) s += 12;
  if (pq.features?.furnished_no && furN && furN.includes("غير")) s += 12;
  if (pq.features?.heating_central && heatN.includes("مركزي")) s += 10;
  if (pq.features?.heating_diesel && heatN.includes("ديزل")) s += 10;
  if (pq.features?.heating_gas && heatN.includes("غاز")) s += 10;
  if (pq.features?.heating_electric && heatN.includes("كهرب")) s += 10;
  if (pq.features?.cond_ready && has(condN, FEATURES.cond_ready)) s += 10;
  if (pq.features?.cond_shell && has(condN, FEATURES.cond_shell)) s += 10;
  if (pq.features?.cond_construction && has(condN, FEATURES.cond_construction)) s += 10;
  if (pq.features?.cond_rented && has(condN, FEATURES.cond_rented)) s += 10;
  if (pq.features?.finish_super && has(finN, FEATURES.finish_super)) s += 10;
  if (pq.features?.finish_deluxe && has(finN, FEATURES.finish_deluxe)) s += 10;
  if (pq.features?.finish_luxury && has(finN, FEATURES.finish_luxury)) s += 10;
  if (pq.features?.finish_first && has(finN, FEATURES.finish_first)) s += 10;
  if (pq.features?.finish_modern && has(finN, FEATURES.finish_modern)) s += 10;
  if (pq.features?.finish_normal && has(finN, FEATURES.finish_normal)) s += 10;
  if (pq.features?.kitchen_closed && has(blob, FEATURES.kitchen_closed)) s += 6;
  if (pq.features?.kitchen_open && has(blob, FEATURES.kitchen_open)) s += 6;
  if (pq.features?.kitchen_any && has(blob, FEATURES.kitchen_any)) s += 4;
  if (pq.features?.dir_east && has(blob, FEATURES.dir_east)) s += 6;
  if (pq.features?.dir_west && has(blob, FEATURES.dir_west)) s += 6;
  if (pq.features?.dir_north && has(blob, FEATURES.dir_north)) s += 6;
  if (pq.features?.dir_south && has(blob, FEATURES.dir_south)) s += 6;
  if (pq.features?.multi_facade && has(blob, FEATURES.multi_facade)) s += 6;
  if (pq.features?.view_open && has(blob, FEATURES.view_open)) s += 5;
  if (pq.features?.own_green && ownN.includes("اخضر")) s += 12;
  if (pq.features?.own_legal && has(ownN, FEATURES.own_legal)) s += 8;
  if (pq.features?.own_notary && has(ownN, FEATURES.own_notary)) s += 8;
  if (pq.features?.own_court && has(ownN, FEATURES.own_court)) s += 8;
  if (pq.features?.own_share && has(ownN, FEATURES.own_share)) s += 5;
  if (pq.features?.price_negotiable && has(blob, FEATURES.price_negotiable)) s += 4;

  // كلمات حرة في العنوان/الوصف
  const tokens = pq.tokens.filter(t => t.length > 2);
  tokens.forEach(t => {
    if (descT.includes(t)) s += 2;
    else if (blob.includes(t)) s += 1;
  });
  return s;
}
function rankSearchRows(rows, pq) {
  return (rows || []).filter(l => hardPass(l, pq)).map(l => ({ ...l, priceNum: Number(l.price || 0), _score: score(l, pq) })).sort((a, b) => b._score - a._score || new Date(b.created_at) - new Date(a.created_at));
}
function mergeUniqueResults(current = [], next = []) {
  const seen = new Set(current.map(item => item?.id).filter(Boolean));
  const merged = [...current];
  next.forEach(item => {
    if (!item?.id || seen.has(item.id)) return;
    seen.add(item.id);
    merged.push(item);
  });
  return merged;
}
function buildTags(pq) {
  const arr = [];
  pq.categories?.forEach(cat => arr.push(cat));
  if (pq.listingType) arr.push(pq.listingType === "sell" ? "للبيع" : "للإيجار");
  if (pq.city) arr.push(pq.city);
  if (pq.district) arr.push(pq.district);
  if (pq.area.exact) arr.push(pq.area.exact + " م²");
  else if (pq.area.min || pq.area.max) arr.push("مساحة " + (pq.area.min || "0") + "—" + (pq.area.max || "∞"));
  if (pq.rooms.exact) arr.push(pq.rooms.exact + " غرف");
  if (pq.floor != null) arr.push(pq.floor === 0 ? "أرضي" : pq.floor === 99 ? "آخر طابق" : "طابق " + pq.floor);
  Object.keys(pq.features || {}).forEach(k => arr.push(k));
  Object.keys(pq.excludedFeatures || {}).forEach(k => arr.push("بدون " + k));
  return arr;
}

// تخزين آخر بحث
const LS_KEY = "aqari_last_search";
function saveLastSearch(q) {
  try { localStorage.setItem(LS_KEY, q); } catch {}
}
function loadLastSearch() {
  try { return localStorage.getItem(LS_KEY) || ""; } catch { return ""; }
}
let searchNoticeTimer = null;

export default function SearchPage({
  setPage,
  setDetail,
  setDetailPrevPage,
  openDetail,
  favs,
  toggleFav,
  DC
}) {
  const sx = {
    s1: DC => ({
      background: DC.bg,
      minHeight: "100vh",
      paddingBottom: 80
    }),
    s2: {
      position: "absolute",
      top: 16,
      right: 16,
      zIndex: 2
    },
    s3: {
      fontSize: 11,
      color: "rgba(255,255,255,0.5)",
      marginBottom: 4,
      letterSpacing: 1
    },
    s4: C => ({
      fontSize: 20,
      fontWeight: 900,
      color: C.white,
      marginBottom: 14
    }),
    s5: C => ({
      background: C.white,
      borderRadius: 12,
      overflow: "hidden"
    }),
    s6: C => ({
      width: "100%",
      padding: "13px 14px",
      border: "none",
      outline: "none",
      fontSize: 14,
      fontFamily: "Tajawal, sans-serif",
      direction: "rtl",
      resize: "none",
      color: C.text,
      boxSizing: "border-box"
    }),
    s7: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "6px 12px 10px"
    },
    s8: C => ({
      fontSize: 11,
      color: C.text3
    }),
    s9: C => ({
      background: C.primary,
      color: "white",
      border: "none",
      borderRadius: 8,
      padding: "7px 16px",
      fontSize: 13,
      fontWeight: 700,
      fontFamily: "Tajawal, sans-serif",
      cursor: "pointer"
    }),
    s10: C => ({
      width: "100%",
      background: "#E8F4F0",
      border: "1px solid " + C.primary2,
      borderRadius: 10,
      padding: "11px 14px",
      fontSize: 13,
      color: C.primary,
      fontFamily: "Tajawal, sans-serif",
      cursor: "pointer",
      textAlign: "right",
      display: "flex",
      alignItems: "center",
      gap: 10,
      marginBottom: 12,
      fontWeight: 700
    }),
    s11: {
      flex: 1,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    },
    s12: C => ({
      fontSize: 11,
      color: C.text3,
      fontWeight: 400,
      flexShrink: 0
    }),
    s13: C => ({
      textAlign: "center",
      padding: "40px 0",
      color: C.text3,
      fontSize: 15
    }),
    s14: DC => ({
      background: DC.white,
      borderRadius: 10,
      padding: "10px 12px",
      marginBottom: 12,
      border: "1px solid " + DC.border
    }),
    s15: C => ({
      fontSize: 11,
      color: C.text3,
      marginBottom: 6
    }),
    s16: {
      display: "flex",
      flexWrap: "wrap",
      gap: 5
    },
    s17: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12
    },
    s18: DC => ({
      fontSize: 14,
      fontWeight: 800,
      color: DC.text
    }),
    s19: C => ({
      fontSize: 11,
      color: C.primary,
      background: "#E8F4F0",
      border: "1px solid " + C.primary2,
      borderRadius: 8,
      padding: "5px 10px",
      cursor: "pointer",
      fontFamily: "inherit",
      fontWeight: 700
    }),
    s20: DC => ({
      fontSize: 12,
      color: DC.text3,
      background: "none",
      border: "none",
      cursor: "pointer",
      fontFamily: "inherit",
      textDecoration: "underline"
    }),
    s21: C => ({
      textAlign: "center",
      padding: "30px 0",
      color: C.text3
    }),
    s22: {
      marginTop: 10,
      fontSize: 14
    }
  };
  if (!DC) DC = C;
  const location = useLocation();
  const autoSearchPathRef = React.useRef("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(20);
  const [allDistricts, setAllDistricts] = useState([]);
  const [lastSearch, setLastSearch] = useState(loadLastSearch);
  const [parsedQuery, setParsedQuery] = useState(null);
  const [serverOffset, setServerOffset] = useState(0);
  const [serverHasMore, setServerHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [notice, setNotice] = useState(null);
  const [savingSearch, setSavingSearch] = useState(false);
  const PAGE_SIZE = 20;
  const SERVER_PAGE_SIZE = 60;
  const AUTO_FETCH_LIMIT = 180;

  // جلب كل الأحياء من الكاش عند التحميل
  useEffect(() => {
    getAllDistrictNames().then(setAllDistricts);
  }, []);

  // عند فتح صفحة منطقة من روابط SEO مثل /real-estate/ريف-دمشق/يلدا/apartments-sale
  // نحول الرابط إلى بحث جاهز داخل نفس صفحة البحث دون إنشاء صفحات React كثيرة.
  useEffect(() => {
    const autoQuery = buildAreaQueryFromPath(location.pathname);
    if (!autoQuery) return;
    if (!allDistricts.length) return;
    if (autoSearchPathRef.current === location.pathname) return;

    autoSearchPathRef.current = location.pathname;
    setQuery(autoQuery);
    doSearch(autoQuery);
  }, [location.pathname, allDistricts.length]);

  const suggestions = ["شقة للبيع في دمشق بلكون مصعد", "بيت عربي في حلب 3 غرف", "أرض سكنية 500 م في ريف دمشق", "شقة للإيجار في اللاذقية مفروش", "فيلا في ريف دمشق مع مسبح طابو أخضر", "شقة أو فيلا سوبر ديلوكس دمشق بين 150 و 250 متر", "شقة 3 غرف بدون مصعد للإيجار"];
  function showNotice(text, type = "ok") {
    setNotice({ text, type });
    window.clearTimeout(searchNoticeTimer);
    searchNoticeTimer = window.setTimeout(() => setNotice(null), 2500);
  }

  async function doSearch(rawQuery) {
    const q = String(rawQuery || "").trim();
    if (!q) return;

    saveLastSearch(q);
    setLastSearch(q);
    setLoading(true);
    setResults(null);
    setVisibleCount(PAGE_SIZE);
    setServerOffset(0);
    setServerHasMore(false);
    setNotice(null);

    try {
      const pq = parseQuery(q, allDistricts);
      setParsedQuery(pq);

      let offset = 0;
      let final = [];
      let hasMore = true;

      while (final.length < PAGE_SIZE && offset < AUTO_FETCH_LIMIT && hasMore) {
        const data = await searchListings(pq, {
          limit: SERVER_PAGE_SIZE,
          offset
        });

        const ranked = rankSearchRows(data, pq);
        final = mergeUniqueResults(final, ranked);
        hasMore = data.length === SERVER_PAGE_SIZE;
        offset += SERVER_PAGE_SIZE;
      }

      setTags(buildTags(pq));
      setResults(final);
      setServerOffset(offset);
      setServerHasMore(hasMore);
      trackSearch(q, {
        results_count: final.length,
        city: pq.city || "",
        district: pq.district || "",
        content_category: pq.category || "",
        property_type: pq.type || ""
      });
    } catch (err) {
      console.error("Search error:", err);
      setResults([]);
      setTags([]);
      setServerHasMore(false);
      showNotice("حدث خطأ أثناء البحث", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleLoadMore() {
    if (results && results.length > visibleCount) {
      setVisibleCount(p => p + PAGE_SIZE);
      return;
    }

    if (!parsedQuery || !serverHasMore || loadingMore) return;

    setLoadingMore(true);

    try {
      const data = await searchListings(parsedQuery, {
        limit: SERVER_PAGE_SIZE,
        offset: serverOffset
      });

      const ranked = rankSearchRows(data, parsedQuery);

      setResults(prev => mergeUniqueResults(prev || [], ranked));
      setVisibleCount(p => p + PAGE_SIZE);
      setServerOffset(p => p + SERVER_PAGE_SIZE);
      setServerHasMore(data.length === SERVER_PAGE_SIZE);
    } catch (err) {
      console.error("Load more search error:", err);
      showNotice("تعذر تحميل المزيد من النتائج", "error");
    } finally {
      setLoadingMore(false);
    }
  }

  async function handleSaveSearch() {
    const text = query.trim();
    if (!text || savingSearch) return;

    setSavingSearch(true);

    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        showNotice("سجّل الدخول أولاً لحفظ البحث", "error");
        return;
      }

      const existing = await findSavedSearchByQuery(userId, text);
      if (existing) {
        showNotice("هذا البحث محفوظ مسبقاً", "ok");
        return;
      }

      await insertSavedSearch({
        user_id: userId,
        query: text,
        notif: true
      });

      showNotice("تم حفظ البحث والتنبيه", "ok");
    } catch (err) {
      console.error("save search error", err);
      showNotice("تعذر حفظ البحث", "error");
    } finally {
      setSavingSearch(false);
    }
  }

  const visibleResults = (results || []).slice(0, visibleCount);
  const canLoadMore = Boolean(
    results &&
      (results.length > visibleCount || serverHasMore)
  );

  return (
    <div style={sx.s1(DC)} dir="rtl">
      <div style={{ background: C.primary, padding: "48px 16px 34px", position: "relative", overflow: "hidden" }}>
        <IslamicPattern opacity={0.1} color="#FFFFFF" />
        <div style={sx.s2}><BackButton onClick={() => setPage ? setPage("home") : window.history.back()} /></div>
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={sx.s3}>البحث الذكي</div>
          <div style={sx.s4(C)}>ابحث بطريقتك</div>
          <div style={sx.s5(C)}>
            <textarea
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="مثال: شقة للبيع في ركن الدين 3 غرف طابو أخضر"
              rows={2}
              style={sx.s6(C)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); doSearch(query); } }}
            />
            <div style={sx.s7}>
              <span style={sx.s8(C)}>{lastSearch ? "آخر بحث: " + lastSearch : "اكتب وصف العقار المطلوب"}</span>
              <button onClick={() => doSearch(query)} style={sx.s9(C)} disabled={loading}>{loading ? "..." : "بحث"}</button>
            </div>
          </div>
        </div>
        <Wave fill={DC.bg} />
      </div>

      <div style={{ padding: 16 }}>
        {lastSearch && !query && <button onClick={() => { setQuery(lastSearch); doSearch(lastSearch); }} style={sx.s10(C)}><span>🔁</span><span style={sx.s11}>إعادة آخر بحث</span><span style={sx.s12(C)}>{lastSearch}</span></button>}

        {notice && <div style={{ ...sx.s14(DC), color: notice.type === "error" ? "#B91C1C" : C.primary }}>{notice.text}</div>}

        {!results && <div style={sx.s14(DC)}>
          <div style={sx.s15(C)}>اقتراحات</div>
          <div style={sx.s16}>{suggestions.map(s => <button key={s} onClick={() => { setQuery(s); doSearch(s); }} style={{ border: "1px solid " + DC.border, background: DC.white, color: DC.text2, borderRadius: 20, padding: "7px 10px", fontSize: 12, fontFamily: "inherit" }}>{s}</button>)}</div>
        </div>}

        {results && <>
          <div style={sx.s17}>
            <div>
              <div style={sx.s18(DC)}>{results.length ? `${results.length} نتيجة` : "لا توجد نتائج"}</div>
              {tags.length > 0 && <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 6 }}>{tags.slice(0, 8).map(t => <span key={t} style={{ background: "#E8F4F0", color: C.primary, borderRadius: 12, padding: "3px 8px", fontSize: 10, fontWeight: 700 }}>{t}</span>)}</div>}
            </div>
            {query && <button onClick={handleSaveSearch} disabled={savingSearch} style={sx.s19(C)}>{savingSearch ? "..." : "🔔 حفظ"}</button>}
          </div>

          {visibleResults.length > 0 ? visibleResults.map(item => <ListingCard key={item.id} item={item} favs={favs} toggleFav={toggleFav} onClick={() => { if (openDetail) openDetail(item, "search"); else { setDetail(item); setDetailPrevPage("search"); setPage("detail"); } }} />) : <div style={sx.s13(C)}>لم نجد إعلاناً مطابقاً. جرّب توسيع البحث أو حذف بعض الشروط.<div style={sx.s22}><button onClick={() => { setQuery(""); setResults(null); setTags([]); }} style={sx.s20(DC)}>بحث جديد</button></div></div>}

          {canLoadMore && <LoadMoreButton loading={loadingMore} onClick={handleLoadMore} label="تحميل المزيد" />}
        </>}

        {loading && <div style={sx.s21(C)}>⏳ جارٍ البحث...</div>}
      </div>
    </div>
  );
}
