import React, { useState, useEffect } from "react";
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
  m = n.match(new RegExp(`(?:اقل من|أقل من|حتى)\\s*(\\d+)\\s*${unit}`));
  if (m) return {
    min: null,
    max: +m[1],
    exact: null
  };
  for (const p of [/(\d+)\s*متر مربع/, /(\d+)\s*م2/, /مساح[ه\s]+(\d+)/, /(\d+)\s*متر/, /(\d+)\s*م(?=\s|$)/, /(?:صافي|اجمالي|إجمالي)\s*(\d+)/, /(\d+)\s*(?:صافي|اجمالي|إجمالي)/]) {
    const r = n.match(p);
    if (r) {
      const v = +(r[1] || r[2]);
      return {
        min: v,
        max: v,
        exact: v
      };
    }
  }
  return {
    min: null,
    max: null,
    exact: null
  };
}
function extractRooms(text) {
  const n = norm(text);
  let m = n.match(/بين\s*(\d+)\s*(?:و|الى|إلى|حتى)\s*(\d+)\s*(?:غرف|غرفه|غرفة)\b/);
  if (m) return {
    min: +m[1],
    max: +m[2],
    exact: null
  };
  m = n.match(/(?:اكثر من|أكثر من|على الاقل|على الأقل|فوق)\s*(\d+)\s*(?:غرف|غرفه|غرفة)\b/);
  if (m) return {
    min: +m[1],
    max: null,
    exact: null
  };
  m = n.match(/(?:اقل من|أقل من|حتى)\s*(\d+)\s*(?:غرف|غرفه|غرفة)\b/);
  if (m) return {
    min: null,
    max: +m[1],
    exact: null
  };
  for (const p of [/(\d+)\s*غرف نوم/, /(\d+)\s*غرف/, /(\d+)\s*اوض/, /(\d+)\s*غرفه/, /(\d+)\s*غرفة/]) {
    const r = n.match(p);
    if (r) {
      const v = +r[1];
      return {
        min: v,
        max: v,
        exact: v
      };
    }
  }
  const words = {
    "خمس": 5,
    "5": 5,
    "اربع": 4,
    "أربع": 4,
    "4": 4,
    "ثلاث": 3,
    "3": 3,
    "غرفتين": 2,
    "غرفتان": 2,
    "2": 2,
    "واحده": 1,
    "واحدة": 1,
    "1": 1
  };
  for (const [w, v] of Object.entries(words)) {
    if (n.includes(w + " غرف") || n.includes(w + " غرفه")) return {
      min: v,
      max: v,
      exact: v
    };
  }
  return {
    min: null,
    max: null,
    exact: null
  };
}
function extractBaths(text) {
  const n = norm(text);
  for (const p of [/(\d+)\s*حمامات/, /(\d+)\s*حمام/]) {
    const m = n.match(p);
    if (m) return +m[1];
  }
  if (n.includes("حمامين")) return 2;
  return null;
}
function extractFloor(text) {
  const n = norm(text);
  for (const p of [/الطابق\s*(\d+)/, /طابق\s*(\d+)/]) {
    const m = n.match(p);
    if (m) return +m[1];
  }
  if (n.includes("ارضي") || n.includes("الارضي")) return 0;
  const fw = {
    1: "اول",
    2: "ثاني",
    3: "ثالث",
    4: "رابع",
    5: "خامس",
    6: "سادس",
    7: "سابع",
    8: "ثامن",
    9: "تاسع",
    10: "عاشر"
  };
  for (const [num, word] of Object.entries(fw)) {
    if (n.includes("طابق ال" + word) || n.includes("الطابق ال" + word) || n.includes("طابق " + word)) return +num;
  }
  if (n.includes("اخير") || n.includes("الاخير")) return 99;
  return null;
}
function extractPrice(text) {
  const n = norm(text);
  const amount = (v, suf = "") => {
    const x = +v;
    if (!x) return null;
    if (suf.includes("مليون")) return x * 1_000_000;
    if (suf.includes("الف") || suf.includes("ألف") || suf === "k") return x * 1_000;
    return x;
  };
  let m = n.match(/بين\s*(\d+)\s*(مليون|الف|ألف|k)?\s*(?:و|الى|إلى|حتى)\s*(\d+)\s*(مليون|الف|ألف|k)?/);
  if (m) return {
    min: amount(m[1], m[2] || ""),
    max: amount(m[3], m[4] || ""),
    exact: null
  };
  m = n.match(/(?:اكثر من|أكثر من|فوق|ابتداء من|من)\s*(\d+)\s*(مليون|الف|ألف|k)?/);
  if (m) return {
    min: amount(m[1], m[2] || ""),
    max: null,
    exact: null
  };
  m = n.match(/(?:اقل من|أقل من|حتى)\s*(\d+)\s*(مليون|الف|ألف|k)?/);
  if (m) return {
    min: null,
    max: amount(m[1], m[2] || ""),
    exact: null
  };
  const patterns = [{
    re: /(\d[\d,]*)\s*مليون دولار/,
    mul: 1_000_000
  }, {
    re: /(\d[\d,]*)\s*مليون/,
    mul: 1_000_000
  }, {
    re: /(?:^|\s)(مليون)\s*(?:دولار)?/,
    mul: 1_000_000,
    noNum: true
  }, {
    re: /(\d[\d,]*)\s*الف دولار/,
    mul: 1_000
  }, {
    re: /(\d[\d,]*)\s*الف/,
    mul: 1_000
  }, {
    re: /(\d[\d,]*)\s*k\b/,
    mul: 1_000
  }, {
    re: /\$\s*(\d[\d,]*)/,
    mul: 1
  }, {
    re: /(\d[\d,]*)\s*دولار/,
    mul: 1
  }, {
    re: /السعر\s*(\d[\d,]*)/,
    mul: 1
  }, {
    re: /مطلوب\s*(\d[\d,]*)/,
    mul: 1
  }];
  for (const {
    re,
    mul,
    noNum
  } of patterns) {
    const r = n.match(re);
    if (r) {
      const v = noNum ? mul : +r[1].replace(/,/g, "") * mul;
      return {
        min: v,
        max: v,
        exact: v
      };
    }
  }
  return {
    min: null,
    max: null,
    exact: null
  };
}

// استخراج الميزات مع دعم النفي
function extractFeatures(text) {
  const n = norm(text);
  const included = {};
  const excluded = {};
  for (const [key, phrases] of Object.entries(FEATURES)) {
    let inc = false,
      exc = false;
    for (const phrase of phrases) {
      const p = norm(phrase);
      if (!n.includes(p)) continue;
      // تحقق من النفي
      const isNeg = NEG_PREFIXES.some(neg => {
        const nn = norm(neg);
        const idx = n.indexOf(p);
        const before = n.slice(Math.max(0, idx - nn.length - 2), idx);
        return before.includes(nn);
      });
      if (isNeg) exc = true;else inc = true;
    }
    if (exc) excluded[key] = true;else if (inc) included[key] = true;
  }
  return {
    included,
    excluded
  };
}

// استخراج OR للفئات ("شقة أو فيلا")
function extractCategories(text) {
  const n = norm(text);
  const found = [];
  for (const [cat, synonyms] of Object.entries(CATEGORIES)) {
    if (synonyms.some(s => n.includes(norm(s)))) found.push(cat);
  }
  return found.length > 0 ? found : null;
}

// كشف نية البحث — يزيل عبارات النية قبل التحليل
function stripIntent(text) {
  let t = text;
  for (const marker of INTENT_MARKERS) {
    t = t.replace(new RegExp(marker, "g"), "");
  }
  return t.trim();
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
  if (pq.features?.finish_luxury && has(finN, FEATURES.finish_luxury)) s += 8;
  if (pq.features?.finish_first && has(finN, FEATURES.finish_first)) s += 8;
  if (pq.features?.finish_modern && has(finN, FEATURES.finish_modern)) s += 6;
  if (pq.features?.finish_normal && has(finN, FEATURES.finish_normal)) s += 4;
  if (pq.features?.kitchen_closed && has(blob, FEATURES.kitchen_closed)) s += 8;
  if (pq.features?.kitchen_open && has(blob, FEATURES.kitchen_open)) s += 8;
  if (pq.features?.kitchen_any && has(blob, FEATURES.kitchen_any)) s += 4;
  if (pq.features?.dir_east && has(blob, FEATURES.dir_east)) s += 8;
  if (pq.features?.dir_west && has(blob, FEATURES.dir_west)) s += 8;
  if (pq.features?.dir_north && has(blob, FEATURES.dir_north)) s += 8;
  if (pq.features?.dir_south && has(blob, FEATURES.dir_south)) s += 8;
  if (pq.features?.multi_facade && has(blob, FEATURES.multi_facade)) s += 8;
  if (pq.features?.view_open && has(blob, FEATURES.view_open)) s += 8;
  if (pq.features?.own_green && ownN.includes("اخضر")) s += 12;
  if (pq.features?.own_legal && ownN.includes("نظامي")) s += 12;
  if (pq.features?.own_notary && ownN.includes("كاتب")) s += 12;
  if (pq.features?.own_court && ownN.includes("محكم")) s += 12;
  if (pq.features?.own_share && has(ownN, FEATURES.own_share)) s += 10;

  // رقم هاتف جزئي
  if (pq.phoneQuery) {
    const ph = String(listing.phone || "");
    if (ph.includes(pq.phoneQuery)) s += 50;
  }

  // كلمات حرة
  for (const t of pq.tokens || []) {
    if (t.length < 2) continue;
    if (blob.includes(t)) s += 4;
  }
  return s;
}

// ══════════════════════════════════════════════════════════════
//  بناء الـ tags للعرض
// ══════════════════════════════════════════════════════════════

const FEATURE_LABELS = {
  elevator: "مصعد",
  parking: "كراج",
  pool: "مسبح",
  solar: "طاقة شمسية",
  compound: "مجمع سكني",
  intercom: "انترفون",
  security: "حراسة",
  balcony: "بلكون",
  terrace: "تراس",
  furnished_yes: "مفروش",
  furnished_no: "غير مفروش",
  heating_central: "تدفئة مركزية",
  heating_diesel: "ديزل",
  heating_gas: "غاز",
  heating_electric: "تدفئة كهربائية",
  cond_ready: "جاهز للسكن",
  cond_shell: "على العضم",
  cond_construction: "قيد الإنشاء",
  cond_rented: "مؤجر",
  finish_super: "سوبر ديلوكس",
  finish_deluxe: "ديلوكس",
  finish_luxury: "فاخر",
  finish_first: "نخب أول",
  finish_modern: "حديث",
  finish_normal: "عادي",
  kitchen_closed: "مطبخ مغلق",
  kitchen_open: "مطبخ أمريكي",
  kitchen_any: "مطبخ",
  dir_east: "شرقي",
  dir_west: "غربي",
  dir_north: "شمالي",
  dir_south: "جنوبي",
  multi_facade: "واجهات متعددة",
  view_open: "إطلالة مفتوحة",
  own_green: "طابو أخضر",
  own_legal: "طابو نظامي",
  own_notary: "كاتب عدل",
  own_court: "حكم محكمة",
  own_share: "أسهم",
  price_negotiable: "قابل للتفاوض"
};
function buildTags(pq) {
  const tags = [];
  if (pq.categories?.length > 1) tags.push("🏠 " + pq.categories.join(" أو "));else if (pq.categories?.length === 1) tags.push("🏠 " + pq.categories[0]);
  if (pq.listingType) tags.push("🏷️ " + (pq.listingType === "sell" ? "للبيع" : "للإيجار"));
  if (pq.city) tags.push("📍 " + pq.city);
  if (pq.district) tags.push("📌 " + pq.district);
  const {
    area,
    rooms,
    price
  } = pq;
  if (area.exact != null) tags.push(`📐 ${area.exact} م²`);else if (area.min != null && area.max != null) tags.push(`📐 ${area.min}–${area.max} م²`);else if (area.min != null) tags.push(`📐 > ${area.min} م²`);else if (area.max != null) tags.push(`📐 < ${area.max} م²`);
  if (rooms.exact != null) tags.push(`🛏️ ${rooms.exact} غرف`);else if (rooms.min != null && rooms.max != null) tags.push(`🛏️ ${rooms.min}–${rooms.max} غرف`);
  if (pq.baths) tags.push(`🚿 ${pq.baths} حمامات`);
  if (pq.floor != null) tags.push(`🏢 ${pq.floor === 0 ? "أرضي" : pq.floor === 99 ? "أخير" : "طابق " + pq.floor}`);
  if (price.exact != null) tags.push(`💰 ~${price.exact.toLocaleString()} $`);else if (price.min != null && price.max != null) tags.push(`💰 ${price.min.toLocaleString()}–${price.max.toLocaleString()} $`);else if (price.min != null) tags.push(`💰 > ${price.min.toLocaleString()} $`);else if (price.max != null) tags.push(`💰 < ${price.max.toLocaleString()} $`);
  if (pq.phoneQuery) tags.push(`📞 ${pq.phoneQuery}`);
  for (const [k, label] of Object.entries(FEATURE_LABELS)) {
    if (pq.features?.[k]) tags.push("✅ " + label);
    if (pq.excludedFeatures?.[k]) tags.push("🚫 " + label);
  }
  return tags;
}

// ══════════════════════════════════════════════════════════════
//  تحويل نتيجة Supabase
// ══════════════════════════════════════════════════════════════

function mapListing(row) {
  return {
    ...row,
    seller: row.profiles?.name || "مستخدم",
    verified: row.profiles?.verified || false,
    sellerId: row.user_id,
    sellerName: row.profiles?.name || "",
    sellerAccountType: row.profiles?.account_type || "individual",
    sellerPhone: row.profiles?.phone || "",
    sellerInit: (row.profiles?.name || "م")[0],
    accountType: row.profiles?.account_type || "individual",
    photo: row.listing_images?.find(i => i.is_main)?.url || row.listing_images?.[0]?.url || null,
    images: (row.listing_images || []).map(i => i.url),
    desc: row.description || "",
    priceNum: parseFloat(String(row.price || "0").replace(/,/g, "")) || 0
  };
}

// ══════════════════════════════════════════════════════════════
//  threshold ذكي
// ══════════════════════════════════════════════════════════════

function minScore(pq) {
  // كلما كانت الاستعلام أكثر تحديداً، نرفع العتبة
  let specificity = 0;
  if (pq.categories?.length) specificity++;
  if (pq.listingType) specificity++;
  if (pq.city) specificity++;
  if (pq.district) specificity++;
  if (pq.area.min != null || pq.area.max != null) specificity++;
  if (pq.rooms.min != null || pq.rooms.max != null) specificity++;
  if (Object.keys(pq.features || {}).length) specificity++;
  // استعلام عام جداً → عتبة صفر (نعرض كل ما مر hardPass)
  if (specificity <= 1) return 0;
  // استعلام متوسط → عتبة 4
  if (specificity <= 3) return 4;
  // استعلام محدد → عتبة 8
  return 8;
}

// localStorage لآخر بحث
const LAST_SEARCH_KEY = "tabou_last_search";
let searchNoticeTimer = null;
function saveLastSearch(q) {
  try {
    localStorage.setItem(LAST_SEARCH_KEY, q);
  } catch {}
}
function loadLastSearch() {
  try {
    return localStorage.getItem(LAST_SEARCH_KEY) || "";
  } catch {
    return "";
  }
}

// ترتيب ودمج النتائج محلياً بعد تطبيق فلاتر الخادم
function rankSearchRows(data, pq) {
  const rows = data.map(mapListing);
  const threshold = minScore(pq);

  return rows
    .filter(item => hardPass(item, pq))
    .map(item => ({
      ...item,
      _score: score(item, pq)
    }))
    .filter(item => item._score >= threshold)
    .sort((a, b) => b._score - a._score);
}

function mergeUniqueResults(oldRows, newRows) {
  const seen = new Set(oldRows.map(item => item.id));

  return [...oldRows, ...newRows.filter(item => !seen.has(item.id))]
    .sort((a, b) => b._score - a._score);
}

// ══════════════════════════════════════════════════════════════
//  المكوّن
// ══════════════════════════════════════════════════════════════

function SearchPage({
  openDetail,
  setPage,
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
  return <div style={sx.s1(DC)}>

      <div style={S.primaryHero(C.primary)}>
        <IslamicPattern opacity={0.1} color="#FFFFFF" />
        <div style={sx.s2}>
          <BackButton onPress={() => setPage("home")} />
        </div>
        <div style={S.relZ1}>
          <div style={sx.s3}>بحث ذكي مجاني</div>
          <div style={sx.s4(C)}>ابحث كما تتكلّم</div>
          <div style={sx.s5(C)}>
            <textarea value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), doSearch(query))} placeholder="مثال: شقة أو فيلا بين 150 و 250 متر بدون مصعد للبيع دمشق..." rows={2} style={sx.s6(C)} />
            <div style={sx.s7}>
              <span style={sx.s8(C)}>اضغط Enter أو الزر</span>
              <button onClick={() => doSearch(query)} style={sx.s9(C)}>
                بحث ←
              </button>
            </div>
          </div>
        </div>
        <Wave />
      </div>

      <div style={S.pad14}>

        {!results && !loading && lastSearch && <button onClick={() => {
        setQuery(lastSearch);
        doSearch(lastSearch);
      }} style={sx.s10(C)}>
            <span>🔍</span>
            <span style={sx.s11}>
              آخر بحث: {lastSearch}
            </span>
            <span style={sx.s12(C)}>إعادة</span>
          </button>}

        {!results && !loading && suggestions.map((s, i) => {
        const sx = {
          s1: DC => ({
            width: "100%",
            background: DC.white,
            border: "1px solid " + DC.border,
            borderRadius: 10,
            padding: "11px 14px",
            fontSize: 13,
            color: DC.text,
            fontFamily: "Tajawal, sans-serif",
            cursor: "pointer",
            textAlign: "right",
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 8
          }),
          s2: C => ({
            color: C.text3
          })
        };
        return <button key={i} onClick={() => {
          setQuery(s);
          doSearch(s);
        }} style={sx.s1(DC)}>
            <span style={sx.s2(C)}>🔍</span>{s}
          </button>;
      })}

        {loading && <div style={sx.s13(C)}>
            🔍 جارٍ التحليل...
          </div>}

        {notice && <div style={{
        marginBottom: 10,
        padding: "10px 12px",
        borderRadius: 10,
        fontSize: 13,
        fontWeight: 700,
        color: notice.type === "error" ? "#991B1B" : "#166534",
        background: notice.type === "error" ? "#FEE2E2" : "#DCFCE7",
        border: notice.type === "error" ? "1px solid #FCA5A5" : "1px solid #86EFAC"
      }}>
            {notice.text}
          </div>}

        {results && !loading && <>
          {tags.length > 0 && <div style={sx.s14(DC)}>
              <div style={sx.s15(C)}>فهمت من طلبك</div>
              <div style={sx.s16}>
                {tags.map((tag, i) => {
              const sx = {
                s1: (tag, C) => ({
                  background: tag.startsWith("🚫") ? "#FEF2F2" : C.primary,
                  color: tag.startsWith("🚫") ? "#B91C1C" : "white",
                  border: tag.startsWith("🚫") ? "1px solid #FECACA" : "none",
                  borderRadius: 20,
                  padding: "3px 10px",
                  fontSize: 11,
                  fontWeight: 600
                })
              };
              return <span key={i} style={sx.s1(tag, C)}>
                    {tag}
                  </span>;
            })}
              </div>
            </div>}

          <div style={sx.s17}>
            <span style={sx.s18(DC)}>{results.length} نتيجة</span>
            <div style={S.gap8}>
              <button style={sx.s19(C)} disabled={savingSearch} onClick={async () => {
              if (savingSearch) return;

              setSavingSearch(true);

              try {
                const myId = await getCurrentUserId();

                if (!myId) {
                  showNotice("يجب تسجيل الدخول أولاً", "error");
                  return;
                }

                const existing = await findSavedSearchByQuery(myId, query);

                if (existing) {
                  showNotice("البحث محفوظ مسبقاً");
                  return;
                }

                const {
                  error: insertError
                } = await insertSavedSearch(myId, query, true);

                if (insertError) {
                  showNotice("حدث خطأ أثناء حفظ البحث", "error");
                  return;
                }

                showNotice("تم حفظ البحث بنجاح");
              } finally {
                setSavingSearch(false);
              }
            }}>
                {savingSearch ? "جارٍ الحفظ..." : "🔔 حفظ البحث"}
              </button>
              <button onClick={() => {
              setResults(null);
              setQuery("");
              setTags([]);
              setParsedQuery(null);
              setServerOffset(0);
              setServerHasMore(false);
              setNotice(null);
              saveLastSearch("");
            }} style={sx.s20(DC)}>
                جديد
              </button>
            </div>
          </div>

          {results.slice(0, visibleCount).map(item => <ListingCard key={item.id} item={item} onPress={i => {
          openDetail(i, "search");
        }} favs={favs} toggleFav={toggleFav} DC={DC} />)}

          <LoadMoreButton hasMore={results.length > visibleCount || serverHasMore} loading={loadingMore} onPress={handleLoadMore} />

          {results.length === 0 && <div style={sx.s21(C)}>
              <div style={S.font40}>🔍</div>
              <div style={sx.s22}>لا توجد نتائج — جرب تغيير البحث</div>
            </div>}
        </>}
      </div>
    </div>;
}
export default SearchPage;
