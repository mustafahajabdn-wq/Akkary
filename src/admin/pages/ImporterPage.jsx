import { BackButton } from "../../shared/components/common/BackButton.jsx";
import React, { useState, useRef } from "react";
import JSZip from "jszip";
import { C } from "../../shared/constants/colors.js";
import { IslamicPattern, Wave } from "../../shared/components/icons.jsx";
import { fetchPropertyTypes, fetchListingsSampleColumns, fetchPropertyFieldsForTypeName, fetchAppSettings } from "../../shared/services/propertyMetadataService.js";
import { fetchAdminUsers } from "../services/adminService.js";
import { uploadImportedImage, importListingRow, attachImportedImages } from "../services/importerService.js";
import { deleteStoragePathsAdmin } from "../services/adminApi.js";
import { S } from "../../shared/styles/primitives.js";

// ── حقول كل فئة ──────────────────────────────────────────────
const CATEGORY_FIELDS = {
  "شقة": {
    icon: "🏢",
    fields: {
      total_area: null,
      floor: null,
      total_floors: null,
      rooms: null,
      salle: null,
      baths: null,
      heating: null,
      kitchen: null,
      elevator: null,
      parking: null,
      compound: null,
      furnished: null,
      finishing: null,
      condition: null,
      occupancy: null
    }
  },
  "فيلا-مزرعة": {
    icon: "🏡",
    fields: {
      total_area: null,
      land_area: null,
      build_area: null,
      total_floors: null,
      rooms: null,
      salle: null,
      heating: null,
      kitchen: null,
      parking: null,
      compound: null,
      solar: null,
      furnished: null,
      finishing: null,
      condition: null,
      occupancy: null
    }
  },
  "بيت عربي": {
    icon: "🏠",
    fields: {
      total_area: null,
      land_area: null,
      build_area: null,
      total_floors: null,
      rooms: null,
      salle: null,
      heating: null,
      kitchen: null,
      elevator: null,
      parking: null,
      compound: null,
      furnished: null,
      finishing: null,
      condition: null
    }
  },
  "شاليه": {
    icon: "🏖️",
    fields: {
      total_area: null,
      rooms: null,
      salle: null,
      baths: null,
      balconies: null,
      heating: null,
      kitchen: null,
      parking: null,
      pool: null,
      compound: null,
      furnished: null,
      finishing: null,
      condition: null
    }
  },
  "بناء كامل": {
    icon: "🏗️",
    fields: {
      total_area: null,
      land_area: null,
      build_area: null,
      total_floors: null,
      total_units: null,
      elevator: null,
      parking: null,
      solar: null,
      condition: null
    }
  },
  "محل تجاري": {
    icon: "🏪",
    fields: {
      total_area: null,
      facade: null,
      floor: null,
      parking: null,
      finishing: null,
      condition: null,
      shop_location: null
    }
  },
  "مستودع": {
    icon: "📦",
    fields: {
      total_area: null,
      ceil_height: null,
      truck_access: null,
      parking: null,
      condition: null
    }
  },
  "مكتب": {
    icon: "🖥️",
    fields: {
      total_area: null,
      floor: null,
      rooms: null,
      elevator: null,
      parking: null,
      condition: null,
      finishing: null
    }
  },
  "أرض سكنية": {
    icon: "🏗️",
    fields: {
      total_area: null,
      facade: null,
      zone_class: null,
      soil_type: null
    }
  },
  "أرض زراعية": {
    icon: "🌾",
    fields: {
      total_area: null,
      facade: null,
      water_source: null,
      soil_type: null
    }
  },
  "سكن طلاب": {
    icon: "🎓",
    fields: {
      total_area: null,
      rooms: null,
      baths: null,
      furnished: null,
      water_source: null
    }
  }
};
const REQUIRED = ["title", "category", "city", "type", "phone"];
const IMPORT_META_FIELDS = new Set(["import_key", "image_files"]);
const LISTING_IMAGES_BUCKET = "listing-images";
const SAFE_STORAGE_PATH = /^[\w./-]+$/;
const SCHEDULE_OPTIONS = [
  ["0", "نشر فوري"],
  ["5", "بعد 5 دقائق"],
  ["10", "بعد 10 دقائق"],
  ["15", "بعد 15 دقيقة"],
  ["30", "بعد 30 دقيقة"],
  ["60", "بعد ساعة"],
  ["120", "بعد ساعتين"],
  ["180", "بعد 3 ساعات"],
  ["360", "بعد 6 ساعات"],
  ["720", "بعد 12 ساعة"],
  ["1440", "بعد يوم"],
  ["custom", "إدخال دقائق مخصص"]
];

function scheduleDelayLabel(minutesValue) {
  const minutes = Number(minutesValue);

  if (!Number.isFinite(minutes) || minutes <= 0) return "نشر فوري";
  if (minutes === 60) return "بعد ساعة";
  if (minutes === 120) return "بعد ساعتين";
  if (minutes % 60 === 0) return `بعد ${minutes / 60} ساعات`;
  return `بعد ${minutes} دقيقة`;
}

function extractImportedStoragePath(value) {
  if (!value) return null;

  const raw = String(value).trim();
  if (!raw) return null;

  try {
    const parsed = new URL(raw);
    const pathname = parsed.pathname;
    const publicMarker = `/storage/v1/object/public/${LISTING_IMAGES_BUCKET}/`;
    const signedMarker = `/storage/v1/object/sign/${LISTING_IMAGES_BUCKET}/`;
    let bucketPath = null;

    if (pathname.includes(publicMarker)) {
      bucketPath = pathname.slice(pathname.indexOf(publicMarker) + publicMarker.length);
    } else if (pathname.includes(signedMarker)) {
      bucketPath = pathname.slice(pathname.indexOf(signedMarker) + signedMarker.length);
    }

    if (!bucketPath) return null;

    const clean = decodeURIComponent(bucketPath)
      .split("?")[0]
      .split("#")[0]
      .replace(/^\/+/, "");

    if (!clean || clean.includes("..") || clean.includes("\\") || !SAFE_STORAGE_PATH.test(clean)) {
      return null;
    }

    return clean;
  } catch {
    const clean = raw
      .split("?")[0]
      .split("#")[0]
      .replace(/^\/+/, "");

    if (!clean || clean.includes("..") || clean.includes("\\") || !SAFE_STORAGE_PATH.test(clean)) {
      return null;
    }

    return clean;
  }
}

const JSON_TEMPLATE = JSON.stringify({
  title: "عنوان الإعلان",
  type: "sell",
  category: "شقة",
  city: "دمشق",
  phone: "09XXXXXXXX",
  description: null,
  price: 0,
  currency: "USD",
  district: null,
  village: null,
  phone2: null,
  whatsapp: false,
  created_at: null,
  status: "active",
  admin_status: "approved",
  total_area: null,
  net_area: null,
  land_area: null,
  build_area: null,
  rooms: 0,
  baths: null,
  floor: null,
  total_floors: null,
  ownership: null,
  furnished: null,
  finishing: null,
  condition: null,
  heating: null,
  kitchen: null,
  elevator: null,
  parking: null,
  compound: null,
  balconies: null,
  pool: null,
  solar: null,
  facing_dir: null,
  lat: null,
  lng: null,
  map_lat: null,
  map_lng: null,
  location_accuracy: "approx",
  geo_source: "district",
  location_detail: null,
  video_url: null,
  external_url: null,
  expires_at: null
}, null, 2);
function validateListing(l, index) {
  const errors = [];
  const label = index !== undefined ? `صف ${index + 1}` : "الإعلان";
  for (const f of REQUIRED) {
    if (!l[f] || String(l[f]).trim() === "") errors.push(`${label}: الحقل "${f}" مطلوب`);
  }
  return errors;
}
function parseExtraFieldsValue(value) {
  if (!value) return {};

  if (typeof value === "object" && !Array.isArray(value)) return value;

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }

  return {};
}

function buildInsert(l, dbCols = new Set()) {
  const n = v => v !== undefined && v !== null && v !== "" ? Number(v) : null;
  const s = v => v !== undefined && v !== null && v !== "" ? String(v).trim() : null;
  const b = v => {
    if (v === undefined || v === null || v === "") return null;
    if (typeof v === "boolean") return v;
    if (typeof v === "number") {
      if (v === 1) return true;
      if (v === 0) return false;
    }
    const normalized = String(v).trim().toLowerCase();
    if (!normalized) return null;
    if (["true", "1", "yes", "y", "on", "نعم", "اي", "أجل", "صح", "مفعل"].includes(normalized)) return true;
    if (["false", "0", "no", "n", "off", "لا", "كلا", "خطأ", "غير مفعل"].includes(normalized)) return false;
    return null;
  };

  // ما ليس له عمود في DB → extra_fields، مع استثناء حقول الربط الخاصة بالاستيراد.
  const explicitExtraFields = parseExtraFieldsValue(l.extra_fields);
  const unknownExtraFields = Object.fromEntries(
    Object.entries(l).filter(([k, v]) =>
      k !== "extra_fields" &&
      !IMPORT_META_FIELDS.has(k) &&
      !dbCols.has(k) &&
      v !== null &&
      v !== undefined &&
      v !== ""
    )
  );
  const extraFields = { ...explicitExtraFields, ...unknownExtraFields };

  // بناء الـ insert ديناميكياً من أعمدة DB
  const BOOL_FIELDS = new Set(["heating", "kitchen", "elevator", "parking", "compound", "pool", "solar", "truck_access", "whatsapp"]);
  const INT_FIELDS = new Set(["rooms", "baths", "floor", "total_floors", "total_units", "balconies", "light_score", "salle", "beds"]);
  const FLOAT_FIELDS = new Set(["price", "total_area", "net_area", "land_area", "build_area", "facade", "ceil_height", "lat", "lng", "map_lat", "map_lng"]);
  const SKIP_INSERT = new Set(["id", "user_id", "views", "whatsapp_clicks", "phone_clicks", "content_hash", "content_flag", "content_score", "sort_order", "qa_enabled", "area"]);
  const row = {};
  for (const col of dbCols) {
    if (SKIP_INSERT.has(col)) continue;
    const v = l[col];

    // لا ترسل created_at فارغًا؛ اترك Supabase يضع الوقت الحالي تلقائيًا.
    // أما إذا أُرسل created_at من JSON/CSV أو من حقل الجدولة، فسيُحفظ كما هو.
    if (col === "created_at" && (v === undefined || v === null || v === "")) {
      continue;
    }

    if (v === undefined || v === null || v === "") {
      // قيم افتراضية للحقول الإلزامية
      if (col === "status") {
        row[col] = "active";
        continue;
      }
      if (col === "admin_status") {
        row[col] = "approved";
        continue;
      }
      if (col === "currency") {
        row[col] = l.currency || "USD";
        continue;
      }
      if (col === "price" || col === "rooms") {
        row[col] = 0;
        continue;
      }
      row[col] = null;
      continue;
    }
    if (BOOL_FIELDS.has(col)) {
      row[col] = b(v);
      continue;
    }
    if (INT_FIELDS.has(col)) {
      row[col] = n(v);
      continue;
    }
    if (FLOAT_FIELDS.has(col)) {
      row[col] = n(v);
      continue;
    }
    row[col] = s(v);
  }
  row.extra_fields = Object.keys(extraFields).length > 0 ? extraFields : null;
  row.expires_at = row.expires_at || l.expires_at || (() => {
    const days = (window.__importDurations || {
      sell: 90,
      rent: 60,
      want_buy: 30,
      want_rent: 30
    })[l.type] || 60;
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split("T")[0];
  })();
  return row;
}

function applyImportSchedule(listing, scheduleAfterMinutes, index = 0) {
  const minutes = Number(scheduleAfterMinutes);

  if (!Number.isFinite(minutes) || minutes <= 0) {
    return listing;
  }

  const multiplier = Math.max(1, index + 1);
  const createdAt = new Date(Date.now() + minutes * multiplier * 60 * 1000).toISOString();

  return {
    ...listing,
    created_at: createdAt
  };
}

export default function ImporterPage({
  setPage,
  DC,
  user,
  reloadListings
}) {
  const sx = {
    s1: DC => ({
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      background: DC.bg,
      fontFamily: "Tajawal,sans-serif",
      direction: "rtl"
    }),
    s2: {
      textAlign: "center",
      padding: "0 24px"
    },
    s3: DC => ({
      fontSize: 16,
      fontWeight: 800,
      color: DC.text
    }),
    s4: C => ({
      marginTop: 16,
      padding: "10px 24px",
      background: C.primary,
      color: "white",
      border: "none",
      borderRadius: 12,
      fontSize: 13,
      fontWeight: 700,
      cursor: "pointer",
      fontFamily: "inherit"
    }),
    s5: DC => ({
      display: "flex",
      background: DC.white,
      borderBottom: `1px solid ${DC.border}`
    }),
    s6: {
      padding: "14px",
      paddingBottom: 100
    },
    s7: DC => ({
      fontSize: 11,
      fontWeight: 800,
      color: DC.text3,
      marginBottom: 6
    }),
    s8: inp => ({
      ...inp,
      direction: "rtl",
      cursor: "pointer",
      marginBottom: 0
    }),
    s9: C => ({
      marginTop: 4,
      fontSize: 11,
      color: C.primary,
      fontWeight: 700
    }),
    s10: DC => ({
      fontSize: 11,
      fontWeight: 800,
      color: DC.text3,
      marginBottom: 8
    }),
    s11: {
      display: "flex",
      flexWrap: "wrap",
      gap: 6
    },
    s12: DC => ({
      fontSize: 11,
      fontWeight: 800,
      color: DC.text3,
      marginBottom: 8
    }),
    s13: DC => ({
      background: DC.white,
      borderRadius: 12,
      border: `1px solid ${DC.border}`,
      overflow: "hidden",
      marginBottom: 10
    }),
    s14: DC => ({
      padding: "10px 14px",
      borderBottom: `1px solid ${DC.border}`,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }),
    s15: DC => ({
      fontSize: 12,
      fontWeight: 800,
      color: DC.text2
    }),
    s16: {
      background: "none",
      border: `1px solid #DDD6FE`,
      borderRadius: 6,
      padding: "3px 8px",
      fontSize: 11,
      fontWeight: 700,
      color: "#7C3AED",
      cursor: "pointer",
      fontFamily: "inherit"
    },
    s17: DC => ({
      background: "none",
      border: `1px solid ${DC.border}`,
      borderRadius: 6,
      padding: "3px 8px",
      fontSize: 11,
      fontWeight: 700,
      color: DC.text3,
      cursor: "pointer",
      fontFamily: "inherit"
    }),
    s18: {
      background: "none",
      border: "1px solid #FECACA",
      borderRadius: 6,
      padding: "3px 8px",
      fontSize: 11,
      fontWeight: 700,
      color: "#EF4444",
      cursor: "pointer",
      fontFamily: "inherit"
    },
    s19: DC => ({
      width: "100%",
      height: 200,
      resize: "vertical",
      fontFamily: "monospace",
      fontSize: 11,
      padding: "12px 14px",
      border: "none",
      outline: "none",
      background: "#FAFAFA",
      direction: "ltr",
      textAlign: "left",
      boxSizing: "border-box",
      lineHeight: 1.6,
      color: DC.text
    }),
    s20: DC => ({
      background: DC.white,
      borderRadius: 12,
      padding: "12px 14px",
      marginBottom: 10,
      border: `1px solid ${DC.border}`
    }),
    s21: pastedImages => ({
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: pastedImages.length > 0 ? 10 : 0
    }),
    s22: DC => ({
      fontSize: 12,
      fontWeight: 800,
      color: DC.text2
    }),
    s23: DC => ({
      padding: "5px 10px",
      borderRadius: 7,
      border: `1px solid ${DC.border}`,
      background: "transparent",
      fontSize: 11,
      fontWeight: 700,
      color: DC.text3,
      cursor: "pointer",
      fontFamily: "inherit"
    }),
    s24: {
      padding: "5px 10px",
      borderRadius: 7,
      border: "1px solid #DDD6FE",
      background: "#EDE9FE",
      fontSize: 11,
      fontWeight: 700,
      color: "#7C3AED",
      cursor: "pointer",
      fontFamily: "inherit"
    },
    s25: {
      display: "flex",
      flexWrap: "wrap",
      gap: 8
    },
    s26: DC => ({
      fontSize: 11,
      color: DC.text3,
      textAlign: "center",
      padding: "8px 0"
    }),
    s27: (loading, jsonText, C) => ({
      width: "100%",
      padding: "13px",
      borderRadius: 12,
      border: "none",
      background: loading || !jsonText.trim() ? "#9CA3AF" : C.primary,
      color: "white",
      fontSize: 14,
      fontWeight: 800,
      cursor: loading ? "not-allowed" : "pointer",
      fontFamily: "inherit",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8
    }),
    s28: {
      width: 16,
      height: 16,
      borderRadius: "50%",
      border: "2px solid rgba(255,255,255,0.3)",
      borderTopColor: "white",
      display: "inline-block",
      animation: "spin 0.7s linear infinite"
    },
    s29: jsonResult => ({
      marginTop: 10,
      padding: "12px 14px",
      borderRadius: 10,
      background: jsonResult.ok ? "#F0FDF4" : "#FEF2F2",
      border: `1px solid ${jsonResult.ok ? "#BBF7D0" : "#FECACA"}`,
      fontSize: 12,
      color: jsonResult.ok ? "#14532D" : "#991B1B",
      whiteSpace: "pre-line",
      lineHeight: 1.8
    }),
    s30: DC => ({
      fontSize: 11,
      fontWeight: 800,
      color: DC.text3,
      marginBottom: 6
    }),
    s31: inp => ({
      ...inp,
      direction: "rtl",
      cursor: "pointer",
      marginBottom: 0
    }),
    s32: DC => ({
      fontSize: 12,
      fontWeight: 800,
      color: DC.text2,
      marginBottom: 8
    }),
    s33: {
      display: "flex",
      flexWrap: "wrap",
      gap: 5,
      marginBottom: 8
    },
    s34: DC => ({
      fontSize: 11,
      color: DC.text3,
      lineHeight: 1.7
    }),
    s35: (csvFilename, C, DC) => ({
      width: "100%",
      padding: "14px",
      borderRadius: 12,
      border: `2px dashed ${csvFilename ? C.primary : DC.border}`,
      background: csvFilename ? "#E8F4F0" : DC.white,
      color: csvFilename ? C.primary : DC.text3,
      fontSize: 13,
      fontWeight: 700,
      cursor: "pointer",
      fontFamily: "inherit",
      marginBottom: 12
    }),
    s36: (DC, csvErrors) => ({
      background: DC.white,
      borderRadius: 12,
      padding: "12px 14px",
      marginBottom: 12,
      border: `1px solid ${csvErrors.length ? "#FECACA" : "#BBF7D0"}`
    }),
    s37: csvErrors => ({
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: csvErrors.length ? 8 : 0
    }),
    s38: csvErrors => ({
      fontSize: 13,
      fontWeight: 800,
      color: csvErrors.length ? "#991B1B" : "#14532D"
    }),
    s39: csvErrors => ({
      fontSize: 12,
      fontWeight: 700,
      padding: "3px 10px",
      borderRadius: 20,
      background: csvErrors.length ? "#FEF2F2" : "#F0FDF4",
      color: csvErrors.length ? "#DC2626" : "#16A34A"
    }),
    s40: {
      fontSize: 11,
      color: "#991B1B",
      lineHeight: 1.8,
      whiteSpace: "pre-line",
      maxHeight: 120,
      overflowY: "auto"
    },
    s41: (loading, C) => ({
      width: "100%",
      padding: "13px",
      borderRadius: 12,
      border: "none",
      background: loading ? "#9CA3AF" : C.primary,
      color: "white",
      fontSize: 14,
      fontWeight: 800,
      cursor: loading ? "not-allowed" : "pointer",
      fontFamily: "inherit",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8
    }),
    s42: {
      width: 16,
      height: 16,
      borderRadius: "50%",
      border: "2px solid rgba(255,255,255,0.3)",
      borderTopColor: "white",
      display: "inline-block",
      animation: "spin 0.7s linear infinite"
    },
    s43: csvResult => ({
      marginTop: 10,
      padding: "12px 14px",
      borderRadius: 10,
      background: csvResult.ok ? "#F0FDF4" : "#FEF2F2",
      border: `1px solid ${csvResult.ok ? "#BBF7D0" : "#FECACA"}`,
      fontSize: 12,
      color: csvResult.ok ? "#14532D" : "#991B1B",
      whiteSpace: "pre-line",
      lineHeight: 1.8
    })
  };
  if (!DC) DC = C;
  const [tab, setTab] = useState("json");
  const [jsonText, setJsonText] = useState("");
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [dynFields, setDynFields] = useState([]); // حقول ديناميكية من DB
  const [propTypes, setPropTypes] = useState([]); // أنواع العقارات من DB
  const [allColumns, setAllColumns] = useState([]); // كل أعمدة listings من DB
  const [dbColumns, setDbColumns] = useState([]); // أعمدة listings من information_schema
  const [selectedCat, setSelectedCat] = useState(""); // الفئة المختارة مستقلة عن JSON
  const [jsonResult, setJsonResult] = useState(null);
  const [csvRows, setCsvRows] = useState([]);
  const [csvFilename, setCsvFilename] = useState("");
  const [csvErrors, setCsvErrors] = useState([]);
  const [csvResult, setCsvResult] = useState(null);
  const [zipRows, setZipRows] = useState([]);
  const [zipFilename, setZipFilename] = useState("");
  const [zipErrors, setZipErrors] = useState([]);
  const [zipResult, setZipResult] = useState(null);
  const [zipImageFiles, setZipImageFiles] = useState({});
  const [loading, setLoading] = useState(false);
  const [scheduleMode, setScheduleMode] = useState("0");
  const [scheduleAfterMinutes, setScheduleAfterMinutes] = useState("");
  const [pastedImages, setPastedImages] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [durations, setDurations] = useState({
    sell: 90,
    rent: 60,
    want_buy: 30,
    want_rent: 30
  });
  const [targetUser, setTargetUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("importer_target_user")) || null;
    } catch {
      return null;
    }
  });
  const fileRef = useRef();
  const zipFileRef = useRef();
  const currentCat = selectedCat;
  const canUseImporter = user?.role === "admin" || (user?.allowedPages || []).includes("importer");
  const selectedScheduleMinutes = scheduleMode === "custom" ? scheduleAfterMinutes : scheduleMode;
  const selectedScheduleLabel = scheduleDelayLabel(selectedScheduleMinutes);
  React.useEffect(() => {
    window.__importDurations = durations;
  }, [durations]);

  // جلب البيانات الثابتة من services
  React.useEffect(() => {
    if (!canUseImporter) return;
    fetchPropertyTypes("id,name,icon").then(data => {
      if (data?.length) setPropTypes(data);
    });
    fetchListingsSampleColumns().then(cols => {
      if (cols?.length) setDbColumns(cols);
    });
    fetchAppSettings(["listing_duration_sell", "listing_duration_rent", "listing_duration_want_buy", "listing_duration_want_rent"]).then(map => {
      const dm = {};
      if (map.listing_duration_sell != null) dm.sell = parseInt(map.listing_duration_sell, 10) || 90;
      if (map.listing_duration_rent != null) dm.rent = parseInt(map.listing_duration_rent, 10) || 60;
      if (map.listing_duration_want_buy != null) dm.want_buy = parseInt(map.listing_duration_want_buy, 10) || 30;
      if (map.listing_duration_want_rent != null) dm.want_rent = parseInt(map.listing_duration_want_rent, 10) || 30;
      if (Object.keys(dm).length) setDurations(prev => ({
        ...prev,
        ...dm
      }));
    });
    fetchAdminUsers().then(data => {
      if (data?.length) setAdminUsers(data);
    });
  }, [user?.role]);

  // جلب الحقول الديناميكية عند تغيير الفئة
  React.useEffect(() => {
    if (!canUseImporter) return;
    if (!currentCat || !CATEGORY_FIELDS[currentCat]) return;
    fetchPropertyFieldsForTypeName(currentCat, "field_key,label,field_type,section").then(data => {
      setDynFields(data || []);
    });
  }, [currentCat, user?.role]);
  if (!canUseImporter) return <div style={sx.s1(DC)}>
      <div style={sx.s2}>
        <div style={S.font48Mb12}>🔒</div>
        <div style={sx.s3(DC)}>غير مصرّح</div>
        <button onClick={() => setPage("home")} style={sx.s4(C)}>العودة</button>
      </div>
    </div>;
  async function uploadImg(file) {
    return uploadImportedImage(file);
  }

  function revokeImagePreview(preview) {
    if (!preview) return;

    try {
      URL.revokeObjectURL(preview);
    } catch {}
  }

  function uploadedImageUrls(images = pastedImages) {
    return images.map(i => i?.url).filter(Boolean);
  }

  async function cleanupImportedImages(urls = []) {
    const paths = [...new Set((urls || []).map(extractImportedStoragePath).filter(Boolean))];

    if (!paths.length) return;

    try {
      await deleteStoragePathsAdmin(paths);
    } catch (err) {
      console.warn("importer image cleanup failed", err);
    }
  }

  function clearImagePreviews(images = pastedImages) {
    images.forEach(img => revokeImagePreview(img?.preview));
  }

  async function clearImportedImages({ removeFromStorage = true } = {}) {
    const images = pastedImages;
    const urls = uploadedImageUrls(images);

    setPastedImages([]);
    clearImagePreviews(images);

    if (removeFromStorage) {
      await cleanupImportedImages(urls);
    }
  }

  async function removeImportedImage(index) {
    const img = pastedImages[index];

    setPastedImages(p => p.filter((_, j) => j !== index));
    revokeImagePreview(img?.preview);

    if (img?.url) {
      await cleanupImportedImages([img.url]);
    }
  }

  async function handleImageFile(file) {
    if (!file?.type?.startsWith("image/")) return;

    const preview = URL.createObjectURL(file);

    setPastedImages(p => [...p, {
      file,
      preview,
      url: null,
      uploading: true,
      error: null
    }]);

    try {
      const url = await uploadImg(file);

      setPastedImages(p => p.map(i => i.preview === preview ? {
        ...i,
        url,
        uploading: false,
        error: null
      } : i));
    } catch (err) {
      revokeImagePreview(preview);
      setPastedImages(p => p.filter(i => i.preview !== preview));
      alert("تعذّر قراءة أو رفع الصورة. جرّب اختيارها مرة أخرى من مجلد التنزيلات.");
      console.warn("import image upload failed", err);
    }
  }
  async function handlePaste(e) {
    for (const item of e.clipboardData?.items || []) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const blob = item.getAsFile();
        if (blob) await handleImageFile(blob);
        return;
      }
    }
  }
  async function importJson() {
    setLoading(true);
    setJsonResult(null);

    let obj;

    try {
      obj = JSON.parse(jsonText);
    } catch (e) {
      setJsonResult({
        ok: false,
        msg: "JSON غير صحيح: " + e.message
      });
      setLoading(false);
      return;
    }

    const errors = validateListing(obj);

    if (errors.length) {
      setJsonResult({
        ok: false,
        msg: errors.join("\n")
      });
      setLoading(false);
      return;
    }

    const imagesSnapshot = pastedImages;
    const readyImages = imagesSnapshot.filter(i => i.url);
    const uploadedUrls = uploadedImageUrls(imagesSnapshot);

    try {
      const scheduledObj = applyImportSchedule(obj, selectedScheduleMinutes, 0);

      const newListing = await importListingRow({
        ...buildInsert(scheduledObj, new Set(dbColumns)),
        user_id: targetUser?.id || user?.id || undefined
      });

      if (newListing?.id && readyImages.length > 0) {
        const imgRows = readyImages.map((i, idx) => ({
          listing_id: newListing.id,
          url: i.url,
          is_main: idx === 0
        }));

        await attachImportedImages(newListing.id, imgRows);
      }

      setJsonResult({
        ok: true,
        msg: `✅ تم الاستيراد!${Number(selectedScheduleMinutes) > 0 ? " · مجدول " + selectedScheduleLabel : ""}${readyImages.length > 0 ? " · " + readyImages.length + " صورة" : ""}`
      });

      if (reloadListings) reloadListings();

      setJsonText("");
      setPastedImages([]);
      clearImagePreviews(imagesSnapshot);
    } catch (err) {
      await cleanupImportedImages(uploadedUrls);
      setPastedImages([]);
      clearImagePreviews(imagesSnapshot);

      setJsonResult({
        ok: false,
        msg: "❌ " + (err?.message || "فشل الاستيراد") + (uploadedUrls.length ? "\nتم تنظيف الصور المرفوعة حتى لا تبقى صور يتيمة." : "")
      });
    } finally {
      setLoading(false);
    }
  }
  function parseCsvText(text) {
    const rows = [];
    let row = [];
    let cell = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      const next = text[i + 1];

      if (ch === '"') {
        if (inQuotes && next === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }

      if (ch === "," && !inQuotes) {
        row.push(cell);
        cell = "";
        continue;
      }

      if ((ch === "\n" || ch === "\r") && !inQuotes) {
        if (ch === "\r" && next === "\n") i++;
        row.push(cell);
        if (row.some((v) => String(v).trim() !== "")) rows.push(row);
        row = [];
        cell = "";
        continue;
      }

      cell += ch;
    }

    row.push(cell);
    if (row.some((v) => String(v).trim() !== "")) rows.push(row);

    return rows;
  }

  function normalizeCsvValue(value) {
    const v = String(value ?? "").trim();
    if (v === "" || v.toLowerCase() === "null") return null;
    return v;
  }

  function getBaseFileName(path) {
    return String(path || "").split(/[\\/]/).pop()?.trim() || "";
  }

  function getImageMimeType(name, fallback = "image/jpeg") {
    const ext = getBaseFileName(name).split(".").pop()?.toLowerCase();
    if (ext === "png") return "image/png";
    if (ext === "webp") return "image/webp";
    if (ext === "gif") return "image/gif";
    if (ext === "jpeg" || ext === "jpg") return "image/jpeg";
    return fallback;
  }

  function splitImageFiles(value) {
    return String(value || "")
      .split(/[|؛;،\n]+/)
      .map(v => v.trim())
      .filter(Boolean);
  }

  function mapZipImages(zip) {
    const images = {};
    Object.entries(zip.files || {}).forEach(([path, entry]) => {
      if (entry.dir) return;
      if (!/\.(jpe?g|png|webp|gif)$/i.test(path)) return;
      const cleanPath = path.replace(/^\/+/, "");
      const base = getBaseFileName(cleanPath);
      images[cleanPath.toLowerCase()] = entry;
      images[base.toLowerCase()] = entry;
    });
    return images;
  }

  function getZipImageEntry(imageMap, imageName) {
    const clean = String(imageName || "").replace(/^\/+/, "").trim().toLowerCase();
    if (!clean) return null;
    return imageMap[clean] || imageMap[getBaseFileName(clean).toLowerCase()] || null;
  }

  async function zipEntryToFile(entry, imageName) {
    const blob = await entry.async("blob");
    const name = getBaseFileName(imageName) || "image.jpg";
    const type = getImageMimeType(name, blob.type || "image/jpeg");
    return new File([blob], name, { type });
  }

  function loadCsv(file) {
    if (!file) return;

    setCsvFilename(file.name);
    setCsvRows([]);
    setCsvErrors([]);
    setCsvResult(null);

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = String(e.target.result || "").replace(/^\uFEFF/, "");
        const parsed = parseCsvText(text);

        if (!parsed.length) {
          setCsvErrors(["الملف فارغ أو غير قابل للقراءة"]);
          return;
        }

        const headers = parsed[0].map((h) => String(h || "").trim().replace(/^"|"$/g, ""));

        const rows = parsed
          .slice(1)
          .map((vals) => {
            const obj = {};
            headers.forEach((h, i) => {
              if (!h) return;
              obj[h] = normalizeCsvValue(vals[i]);
            });
            return obj;
          })
          .filter((r) => Object.values(r).some((v) => v !== null && v !== undefined && v !== ""));

        setCsvRows(rows);
        setCsvErrors(rows.flatMap((r, i) => validateListing(r, i)));
      } catch (err) {
        setCsvRows([]);
        setCsvErrors(["تعذّرت قراءة ملف CSV: " + (err?.message || "خطأ غير معروف")]);
      }
    };

    reader.onerror = () => {
      setCsvErrors(["تعذّرت قراءة الملف. جرّب ملفًا آخر بصيغة CSV."]);
    };

    reader.readAsText(file, "UTF-8");
  }

  async function loadZip(file) {
    if (!file) return;

    setZipFilename(file.name);
    setZipRows([]);
    setZipErrors([]);
    setZipResult(null);
    setZipImageFiles({});

    try {
      const zip = await JSZip.loadAsync(file);
      const csvPath = Object.keys(zip.files || {}).find(path => /(^|\/)ads\.csv$/i.test(path) && !zip.files[path].dir);

      if (!csvPath) {
        setZipErrors(["يجب أن يحتوي ملف ZIP على ads.csv"]);
        return;
      }

      const text = String(await zip.files[csvPath].async("string") || "").replace(/^\uFEFF/, "");
      const parsed = parseCsvText(text);

      if (!parsed.length) {
        setZipErrors(["ملف ads.csv فارغ أو غير قابل للقراءة"]);
        return;
      }

      const headers = parsed[0].map((h) => String(h || "").trim().replace(/^"|"$/g, ""));
      const rows = parsed
        .slice(1)
        .map((vals) => {
          const obj = {};
          headers.forEach((h, i) => {
            if (!h) return;
            obj[h] = normalizeCsvValue(vals[i]);
          });
          return obj;
        })
        .filter((r) => Object.values(r).some((v) => v !== null && v !== undefined && v !== ""));

      const imageMap = mapZipImages(zip);
      const errors = rows.flatMap((r, i) => {
        const rowErrors = validateListing(r, i);
        const missingImages = splitImageFiles(r.image_files).filter(name => !getZipImageEntry(imageMap, name));

        if (missingImages.length) {
          rowErrors.push(`صف ${i + 1}: الصور غير موجودة داخل ZIP: ${missingImages.join(", ")}`);
        }

        return rowErrors;
      });

      setZipRows(rows);
      setZipImageFiles(imageMap);
      setZipErrors(errors);
    } catch (err) {
      setZipRows([]);
      setZipErrors(["تعذّرت قراءة ملف ZIP: " + (err?.message || "خطأ غير معروف")]);
      setZipImageFiles({});
    }
  }

  async function importZip() {
    setLoading(true);
    setZipResult(null);

    let ok = 0;
    let fail = 0;
    const failMsgs = [];
    let imageCount = 0;

    for (let i = 0; i < zipRows.length; i++) {
      const rowUploadedUrls = [];

      try {
        const scheduledRow = applyImportSchedule(zipRows[i], selectedScheduleMinutes, i);
        const newListing = await importListingRow({
          ...buildInsert(scheduledRow, new Set(dbColumns)),
          user_id: targetUser?.id || user?.id || undefined
        });

        const imageNames = splitImageFiles(zipRows[i].image_files);

        if (newListing?.id && imageNames.length > 0) {
          const imgRows = [];

          for (let imgIndex = 0; imgIndex < imageNames.length; imgIndex++) {
            const imageName = imageNames[imgIndex];
            const entry = getZipImageEntry(zipImageFiles, imageName);

            if (!entry) {
              throw new Error(`الصورة غير موجودة داخل ZIP: ${imageName}`);
            }

            const imageFile = await zipEntryToFile(entry, imageName);
            const url = await uploadImg(imageFile);

            if (url) {
              rowUploadedUrls.push(url);
              imgRows.push({
                listing_id: newListing.id,
                url,
                is_main: imgIndex === 0
              });
            }
          }

          if (imgRows.length) {
            await attachImportedImages(newListing.id, imgRows);
            imageCount += imgRows.length;
          }
        }

        ok++;
      } catch (err) {
        fail++;
        await cleanupImportedImages(rowUploadedUrls);
        failMsgs.push(`صف ${i + 1}: ${err?.message || "فشل الإدخال"}`);
      }
    }

    setZipResult({
      ok: fail === 0,
      msg: `✅ نجح: ${ok}${imageCount ? `\n🖼 تم رفع وربط ${imageCount} صورة في جدول listing_images` : ""}${Number(selectedScheduleMinutes) > 0 ? `\n⏱ تمت الجدولة: ${selectedScheduleLabel} بين كل إعلان` : ""}${fail ? `\n❌ فشل: ${fail}\n${failMsgs.join("\n")}` : ""}`
    });

    if (ok && reloadListings) reloadListings();
    setLoading(false);
  }

  async function importCsv() {
    setLoading(true);
    setCsvResult(null);
    let ok = 0,
      fail = 0,
      failMsgs = [];
    for (let i = 0; i < csvRows.length; i++) {
      try {
        const scheduledRow = applyImportSchedule(csvRows[i], selectedScheduleMinutes, i);

        await importListingRow({
          ...buildInsert(scheduledRow, new Set(dbColumns)),
          user_id: targetUser?.id || user?.id || undefined
        });
        ok++;
      } catch (err) {
        fail++;
        failMsgs.push(`صف ${i + 1}: ${err?.message || "فشل الإدخال"}`);
      }
    }
    setCsvResult({
      ok: fail === 0,
      msg: `✅ نجح: ${ok}${Number(selectedScheduleMinutes) > 0 ? `\n⏱ تمت الجدولة: ${selectedScheduleLabel} بين كل إعلان` : ""}${fail ? `\n❌ فشل: ${fail}\n${failMsgs.join("\n")}` : ""}`
    });
    setLoading(false);
  }
  const inp = {
    width: "100%",
    padding: "11px 13px",
    borderRadius: 10,
    border: `1.5px solid ${DC.border}`,
    fontSize: 13,
    fontFamily: "Tajawal,sans-serif",
    background: DC.white,
    color: DC.text,
    boxSizing: "border-box",
    outline: "none"
  };
  return <div style={S.pageShell(DC)}>

      {/* Header */}
      <div style={S.primaryHero(C.primary)}>
        <IslamicPattern opacity={0.1} color="#FFFFFF" width={430} height={200} />
        <div style={S.absTopRight14}>
          <BackButton onPress={() => setPage("addChoice")} />
        </div>
        <div style={S.relZ1}>
          <div style={S.title20White}>📥 استيراد إعلانات</div>
          <div style={S.whiteMeta12}>نشر إعلانات دفعةً واحدة</div>
        </div>
        <Wave />
      </div>

      {/* Tabs */}
      <div style={sx.s5(DC)}>
        {[["json", "📋 إعلان مفرد"], ["csv", "📊 استيراد جماعي"], ["zip", "📦 ZIP مع صور"]].map(([t, l]) => {
        const sx = {
          s1: (tab, t, C, DC) => ({
            flex: 1,
            padding: "12px",
            border: "none",
            fontFamily: "inherit",
            borderBottom: tab === t ? `3px solid ${C.primary}` : "3px solid transparent",
            background: "transparent",
            fontSize: 13,
            fontWeight: 800,
            color: tab === t ? C.primary : DC.text3,
            cursor: "pointer"
          })
        };
        return <button key={t} onClick={() => setTab(t)} style={sx.s1(tab, t, C, DC)}>{l}</button>;
      })}
      </div>

      <div style={sx.s6}>
        {/* جدولة النشر */}
        <div style={S.card(DC)}>
          <div style={sx.s7(DC)}>⏱ جدولة النشر بعد</div>
          <select
            value={scheduleMode}
            onChange={e => {
              const value = e.target.value;
              setScheduleMode(value);
              if (value !== "custom") setScheduleAfterMinutes("");
            }}
            style={sx.s8(inp)}
          >
            {SCHEDULE_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          {scheduleMode === "custom" && (
            <input
              type="number"
              min="0"
              inputMode="numeric"
              value={scheduleAfterMinutes}
              onChange={e => {
                const value = e.target.value;
                setScheduleAfterMinutes(value === "" ? "" : String(Math.max(0, Number(value) || 0)));
              }}
              placeholder="أدخل عدد الدقائق، مثال: 45"
              style={{ ...inp, marginTop: 8 }}
            />
          )}

          <div style={sx.s34(DC)}>
            الاختيار الحالي: <strong>{selectedScheduleLabel}</strong>. في الاستيراد الجماعي سيُضاف نفس الفاصل بين كل إعلان والذي يليه.
          </div>
        </div>

        {/* ── JSON Tab ── */}
        {tab === "json" && <>
            {/* المستخدم المستهدف */}
            <div style={S.card(DC)}>
              <div style={sx.s7(DC)}>👤 نشر باسم</div>
              <select value={targetUser?.id || ""} onChange={e => {
            const u = adminUsers.find(u => u.id === e.target.value);
            setTargetUser(u || null);
            try {
              localStorage.setItem("importer_target_user", JSON.stringify(u || null));
            } catch {}
          }} style={sx.s8(inp)}>
                <option value="">— حسابي الحالي —</option>
                {adminUsers.map(u => <option key={u.id} value={u.id}>
                    {u.role === "admin" ? "🔴" : u.role === "moderator" ? "🟡" : "🟢"} {u.name}
                  </option>)}
              </select>
              {targetUser && <div style={sx.s9(C)}>✓ الإعلان سيُنشر باسم {targetUser.name}</div>}
            </div>

            {/* أنواع العقارات */}
            <div style={S.card(DC)}>
              <div style={sx.s10(DC)}>أنواع العقارات</div>
              <div style={sx.s11}>
                {(propTypes.length ? propTypes : Object.entries(CATEGORY_FIELDS).map(([name, info]) => ({
              name,
              icon: info.icon
            }))).map(t => {
              const cat = t.name;
              const icon = t.icon || CATEGORY_FIELDS[cat]?.icon || "🏠";
              const active = currentCat === cat;
              const sx = {
                s1: (active, C, DC) => ({
                  padding: "6px 10px",
                  borderRadius: 20,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  border: `1.5px solid ${active ? C.primary : DC.border}`,
                  background: active ? "#E8F4F0" : "transparent",
                  fontSize: 12,
                  fontWeight: active ? 800 : 600,
                  color: active ? C.primary : DC.text2
                })
              };
              return <button key={cat} onClick={() => setSelectedCat(cat)} style={sx.s1(active, C, DC)}>
                      {icon} {cat}
                    </button>;
            })}
              </div>
            </div>

            {/* حقول الإعلان — كل الحقول */}
            {currentCat && <div style={S.card(DC)}>
                <div style={sx.s12(DC)}>حقول {currentCat}</div>
                {(() => {
            let parsedObj = null;
            const sx = {
              s1: DC => ({
                minHeight: 40,
                marginBottom: 10,
                borderRadius: 10,
                background: DC.bg,
                border: `1px solid ${DC.border}`,
                padding: "8px 14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s"
              }),
              s2: DC => ({
                fontSize: 13,
                color: DC.text,
                fontWeight: 900,
                fontFamily: "monospace",
                direction: "ltr"
              }),
              s3: DC => ({
                fontSize: 11,
                color: DC.text3,
                fontWeight: 600
              }),
              s4: {
                display: "flex",
                flexWrap: "wrap",
                gap: 5
              }
            };
            try {
              parsedObj = JSON.parse(jsonText);
            } catch {}
            const BASIC = new Set(["title", "type", "category", "city", "district", "village", "phone", "phone2", "whatsapp", "price", "currency", "description", "ownership", "lat", "lng", "map_lat", "map_lng", "location_accuracy", "geo_source", "created_at", "video_url", "external_url", "messenger_id", "location_detail"]);
            const dynKeys = new Set(dynFields.map(f => f.field_key));
            const allKeys = dbColumns.length ? dbColumns : [...dynKeys];
            return <>
                      {/* منطقة العرض الثابتة */}
                      <div style={sx.s1(DC)}>
                        {activeTooltip ? <span style={sx.s2(DC)}>{String(activeTooltip.value)}</span> : <span style={sx.s3(DC)}>اضغط على أي حقل لعرض قيمته</span>}
                      </div>

                      {/* الوسوم */}
                      <div style={sx.s4}>
                        {allKeys.map(key => {
                  const hasVal = parsedObj?.[key] !== null && parsedObj?.[key] !== undefined && parsedObj?.[key] !== "";
                  const isDyn = dynKeys.has(key);
                  const isBasic = BASIC.has(key);
                  const isActive = activeTooltip?.label === key;
                  const sx = {
                    s1: (isActive, hasVal, isDyn, isBasic, C, DC) => ({
                      padding: "3px 9px",
                      borderRadius: 20,
                      fontSize: 10,
                      fontWeight: 700,
                      cursor: "pointer",
                      background: isActive ? "#1A2E20" : hasVal ? "#E8F4F0" : isDyn ? "#EDE9FE" : isBasic ? "#FFF7ED" : "#F3F4F6",
                      color: isActive ? "white" : hasVal ? C.primary : isDyn ? "#7C3AED" : isBasic ? "#C2410C" : DC.text3,
                      border: `1px solid ${isActive ? "#1A2E20" : hasVal ? C.primary : isDyn ? "#DDD6FE" : isBasic ? "#FED7AA" : DC.border}`,
                      transition: "all 0.15s"
                    })
                  };
                  return <span key={key} onClick={() => {
                    if (isActive) {
                      setActiveTooltip(null);
                      return;
                    }
                    setActiveTooltip({
                      label: key,
                      value: hasVal ? parsedObj[key] : "—"
                    });
                  }} style={sx.s1(isActive, hasVal, isDyn, isBasic, C, DC)}>
                              {hasVal ? "✓ " : ""}{key}
                            </span>;
                })}
                      </div>
                    </>;
          })()}
              </div>}

            {/* محرر JSON */}
            <div style={sx.s13(DC)}>
              <div style={sx.s14(DC)}>
                <div style={S.rowCenterGap8}>
                  <span style={sx.s15(DC)}>📄 بيانات الإعلان (JSON)</span>
                  {(() => {
                const sx = {
                  s1: C => ({
                    fontSize: 10,
                    fontWeight: 800,
                    padding: "2px 8px",
                    borderRadius: 20,
                    background: "#E8F4F0",
                    color: C.primary
                  })
                };
                try {
                  const obj = JSON.parse(jsonText);
                  const count = Object.values(obj).filter(v => v !== null && v !== undefined && v !== "").length;
                  return <span style={sx.s1(C)}>{count} حقل</span>;
                } catch {
                  return null;
                }
              })()}
                </div>
                <div style={S.gap6}>
                  <button onClick={async () => {
                try {
                  const text = await navigator.clipboard.readText();
                  if (text) setJsonText(text);
                } catch {
                  alert("تعذّر اللصق — تأكد من صلاحية الوصول للحافظة");
                }
              }} style={sx.s16}>📋 لصق</button>
                  <button onClick={async () => {
                setJsonText("");
                setJsonResult(null);
                await clearImportedImages({ removeFromStorage: true });
              }} style={sx.s18}>مسح</button>
                </div>
              </div>
              <textarea value={jsonText} onChange={e => {
            setJsonText(e.target.value);
            try {
              const cat = JSON.parse(e.target.value)?.category;
              if (cat) setSelectedCat(cat);
            } catch {}
          }} onPaste={async e => {
            // صورة → ارفعها
            for (const item of e.clipboardData?.items || []) {
              if (item.type.startsWith("image/")) {
                e.preventDefault();
                const blob = item.getAsFile();
                if (blob) await handleImageFile(blob);
                return;
              }
            }
            // نص → حدّث selectedCat
            const text = e.clipboardData?.getData("text") || "";
            setTimeout(() => {
              try {
                const cat = JSON.parse(text)?.category;
                if (cat) setSelectedCat(cat);
              } catch {}
            }, 50);
          }} placeholder='' style={sx.s19(DC)} />
            </div>

            {/* الصور */}
            <div style={sx.s20(DC)}>
              <div style={sx.s21(pastedImages)}>
                <span style={sx.s22(DC)}>📸 الصور ({pastedImages.length})</span>
                <div style={S.gap6}>
                  <label htmlFor="img-file" style={sx.s23(DC)}>
                    رفع صورة
                  </label>
                  <button onClick={async () => {
                try {
                  const items = await navigator.clipboard.read();
                  for (const item of items) {
                    const imgType = item.types.find(t => t.startsWith("image/"));
                    if (imgType) {
                      const blob = await item.getType(imgType);
                      await handleImageFile(new File([blob], `clip.${imgType.split("/")[1]}`, {
                        type: imgType
                      }));
                    }
                  }
                } catch {
                  alert("لا توجد صورة في الحافظة");
                }
              }} style={sx.s24}>
                    لصق
                  </button>
                </div>
                <input type="file" accept="image/*" multiple id="img-file" style={S.hidden} onChange={e => Array.from(e.target.files || []).forEach(file => { handleImageFile(file); })} />
              </div>

              {pastedImages.length > 0 ? <div style={sx.s25}>
                  {pastedImages.map((img, i) => {
              const sx = {
                s1: {
                  position: "relative",
                  width: 72,
                  height: 72
                },
                s2: (img, DC) => ({
                  width: 72,
                  height: 72,
                  borderRadius: 8,
                  objectFit: "cover",
                  border: `2px solid ${img.url ? "#BBF7D0" : DC.border}`,
                  opacity: img.uploading ? 0.5 : 1
                }),
                s3: {
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14
                },
                s4: {
                  position: "absolute",
                  top: 2,
                  right: 2,
                  background: "#16A34A",
                  borderRadius: "50%",
                  width: 16,
                  height: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  color: "white"
                },
                s5: C => ({
                  position: "absolute",
                  bottom: 2,
                  left: 2,
                  background: C.primary,
                  borderRadius: 4,
                  fontSize: 8,
                  color: "white",
                  padding: "1px 4px",
                  fontWeight: 800
                }),
                s6: i => ({
                  position: "absolute",
                  top: 2,
                  left: i === 0 ? 32 : 2,
                  background: "rgba(0,0,0,0.5)",
                  border: "none",
                  borderRadius: "50%",
                  width: 16,
                  height: 16,
                  color: "white",
                  fontSize: 10,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                })
              };
              return <div key={i} style={sx.s1}>
                      <img src={img.preview} alt="" style={sx.s2(img, DC)} />
                      {img.uploading && <div style={sx.s3}>⏳</div>}
                      {img.url && <div style={sx.s4}>✓</div>}
                      {i === 0 && <div style={sx.s5(C)}>رئيسية</div>}
                      <button onClick={() => { removeImportedImage(i); }} style={sx.s6(i)}>✕</button>
                    </div>;
            })}
                </div> : <div style={sx.s26(DC)}>الصق صورة مباشرة في حقل JSON أو اضغط "رفع صورة"</div>}
            </div>

            {/* زر الاستيراد */}
            <button onClick={importJson} disabled={loading || !jsonText.trim()} style={sx.s27(loading, jsonText, C)}>
              {loading ? <><span style={sx.s28} /> جارٍ الاستيراد...</> : "📥 استيراد الإعلان"}
            </button>

            {jsonResult && <div style={sx.s29(jsonResult)}>
                {jsonResult.msg}
              </div>}
          </>}

        {/* ── CSV Tab ── */}
        {tab === "csv" && <>
            {/* المستخدم المستهدف */}
            <div style={S.card(DC)}>
              <div style={sx.s30(DC)}>👤 نشر باسم</div>
              <select value={targetUser?.id || ""} onChange={e => {
            const u = adminUsers.find(u => u.id === e.target.value);
            setTargetUser(u || null);
            try {
              localStorage.setItem("importer_target_user", JSON.stringify(u || null));
            } catch {}
          }} style={sx.s31(inp)}>
                <option value="">— حسابي الحالي —</option>
                {adminUsers.map(u => <option key={u.id} value={u.id}>{u.role === "admin" ? "🔴" : u.role === "moderator" ? "🟡" : "🟢"} {u.name}</option>)}
              </select>
            </div>

            {/* تعليمات CSV */}
            <div style={S.card(DC)}>
              <div style={sx.s32(DC)}>📋 الحقول المطلوبة</div>
              <div style={sx.s33}>
                {["title", "category", "city", "type", "phone"].map(f => {
              const sx = {
                s1: {
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "3px 8px",
                  borderRadius: 20,
                  background: "#FEF2F2",
                  color: "#DC2626",
                  border: "1px solid #FECACA"
                }
              };
              return <span key={f} style={sx.s1}>✕ {f}</span>;
            })}
              </div>
              <div style={sx.s34(DC)}>
                <strong>اختياري:</strong> description, price, currency, district, village, total_area, rooms, baths, floor, total_floors, ownership, furnished, finishing, condition, heating, elevator, parking, compound, pool, solar, facing_dir, lat, lng, map_lat, map_lng, location_accuracy, geo_source, created_at, video_url, external_url, expires_at
              </div>
            </div>

            {/* رفع CSV */}
            <input
              type="file"
              accept=".csv,text/csv"
              ref={fileRef}
              style={S.hidden}
              onClick={(e) => {
                e.target.value = "";
              }}
              onChange={(e) => {
                e.preventDefault();
                e.stopPropagation();

                const file = e.target.files?.[0];
                if (!file) return;

                loadCsv(file);
              }}
            />
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                fileRef.current?.click();
              }}
              style={sx.s35(csvFilename, C, DC)}
            >
              {csvFilename ? `📄 ${csvFilename}` : "📁 اختر ملف CSV"}
            </button>

            {/* نتيجة التحقق */}
            {csvRows.length > 0 && <div style={sx.s36(DC, csvErrors)}>
                <div style={sx.s37(csvErrors)}>
                  <span style={sx.s38(csvErrors)}>
                    {csvRows.length} إعلان
                  </span>
                  <span style={sx.s39(csvErrors)}>
                    {csvErrors.length ? `${csvErrors.length} خطأ` : "✅ جاهز"}
                  </span>
                </div>
                {csvErrors.length > 0 && <div style={sx.s40}>
                    {csvErrors.join("\n")}
                  </div>}
              </div>}

            {csvRows.length > 0 && csvErrors.length === 0 && <button type="button" onClick={importCsv} disabled={loading} style={sx.s41(loading, C)}>
                {loading ? <><span style={sx.s42} />جارٍ الاستيراد...</> : `📥 استيراد ${csvRows.length} إعلان`}
              </button>}

            {csvResult && <div style={sx.s43(csvResult)}>
                {csvResult.msg}
              </div>}
          </>}

        {/* ── ZIP Tab ── */}
        {tab === "zip" && <>
            <div style={S.card(DC)}>
              <div style={sx.s30(DC)}>👤 نشر باسم</div>
              <select value={targetUser?.id || ""} onChange={e => {
            const u = adminUsers.find(u => u.id === e.target.value);
            setTargetUser(u || null);
            try {
              localStorage.setItem("importer_target_user", JSON.stringify(u || null));
            } catch {}
          }} style={sx.s31(inp)}>
                <option value="">— حسابي الحالي —</option>
                {adminUsers.map(u => <option key={u.id} value={u.id}>{u.role === "admin" ? "🔴" : u.role === "moderator" ? "🟡" : "🟢"} {u.name}</option>)}
              </select>
            </div>

            <div style={S.card(DC)}>
              <div style={sx.s32(DC)}>📦 بنية ملف ZIP المطلوبة</div>
              <div style={sx.s34(DC)}>
                يجب أن يحتوي الملف على <strong>ads.csv</strong> ومجلد <strong>images</strong>. اربط الصور بعمود <strong>image_files</strong> مثل: <strong>ad-002-01.jpg|ad-002-02.jpg</strong>. الإعلانات بلا صور اترك حقل الصور فيها فارغًا.
              </div>
              <div style={sx.s34(DC)}>
                حقلا <strong>import_key</strong> و <strong>image_files</strong> لن يُحفَظا داخل معلومات إضافية؛ يستخدمان فقط للربط أثناء الاستيراد.
              </div>
            </div>

            <input
              type="file"
              accept=".zip,application/zip,application/x-zip-compressed"
              ref={zipFileRef}
              style={S.hidden}
              onClick={(e) => {
                e.target.value = "";
              }}
              onChange={(e) => {
                e.preventDefault();
                e.stopPropagation();

                const file = e.target.files?.[0];
                if (!file) return;

                loadZip(file);
              }}
            />
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                zipFileRef.current?.click();
              }}
              style={sx.s35(zipFilename, C, DC)}
            >
              {zipFilename ? `📦 ${zipFilename}` : "📦 اختر ملف ZIP"}
            </button>

            {zipRows.length > 0 && <div style={sx.s36(DC, zipErrors)}>
                <div style={sx.s37(zipErrors)}>
                  <span style={sx.s38(zipErrors)}>
                    {zipRows.length} إعلان
                  </span>
                  <span style={sx.s39(zipErrors)}>
                    {zipErrors.length ? `${zipErrors.length} خطأ` : "✅ جاهز"}
                  </span>
                </div>
                <div style={sx.s34(DC)}>
                  الصور المطلوبة: {zipRows.reduce((sum, row) => sum + splitImageFiles(row.image_files).length, 0)} · الصور الموجودة في الملف: {Object.keys(zipImageFiles).filter(k => !k.includes("/")).length}
                </div>
                {zipErrors.length > 0 && <div style={sx.s40}>
                    {zipErrors.join("\n")}
                  </div>}
              </div>}

            {zipRows.length > 0 && zipErrors.length === 0 && <button type="button" onClick={importZip} disabled={loading} style={sx.s41(loading, C)}>
                {loading ? <><span style={sx.s42} />جارٍ الاستيراد والرفع...</> : `📥 استيراد ${zipRows.length} إعلان مع الصور`}
              </button>}

            {zipResult && <div style={sx.s43(zipResult)}>
                {zipResult.msg}
              </div>}
          </>}
      </div>
    </div>;
    }
