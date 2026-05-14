import React from "react";
import { C, LISTING_TYPE_COLORS as TYPE_COLORS } from "../../../shared/constants/colors.js";
import { S, mergeStyles } from "../../../shared/styles/primitives.js";
import { updateSavedSearchNotif, deleteSavedSearch } from "../../services/savedSearchService.js";
import { CC } from "../../../shared/styles/componentStyles.js";

// =====================================================================
//  ثوابت تحويل النوع — مرجع واحد بدل ~4 مواضع متكررة
// =====================================================================
// يقبل المفاتيح الإنكليزية والقيم العربية (passthrough) ويُرجع اسماً عربياً للعرض
const TYPE_AR = {
  sell: "للبيع",
  rent: "للإيجار",
  lease: "للإيجار",
  "تأجير": "للإيجار",
  want_buy: "مطلوب شراء",
  want_rent: "مطلوب للإيجار",
  "مطلوب إيجار": "مطلوب للإيجار",
  "للبيع": "للبيع",
  "للإيجار": "للإيجار",
  "مطلوب شراء": "مطلوب شراء",
  "مطلوب للإيجار": "مطلوب للإيجار"
};

const typeArabicOrNull = t => TYPE_AR[t] || null;

// قيمة مخزّنة في activeType:
//   sell/rent/lease → عربي ("للبيع"/"للإيجار")
//   want_buy/want_rent → مفتاح إنكليزي (للحفاظ على المنطق القائم)
const ACTIVE_TYPE_NORMALIZE = {
  sell: "للبيع",
  rent: "للإيجار",
  lease: "للإيجار",
  "تأجير": "للإيجار",
  want_buy: "want_buy",
  want_rent: "want_rent",
  "للبيع": "للبيع",
  "للإيجار": "للإيجار",
  "مطلوب شراء": "want_buy",
  "مطلوب للإيجار": "want_rent",
  "مطلوب إيجار": "want_rent",
  "الكل": "الكل"
};

const normalizeStoredActiveType = v => ACTIVE_TYPE_NORMALIZE[v] || "الكل";

function getActiveTypeKey(value) {
  if (value === "للبيع" || value === "sell") return "sell";
  if (value === "للإيجار" || value === "rent" || value === "lease" || value === "تأجير") return "rent";
  if (value === "want_buy" || value === "مطلوب شراء") return "want_buy";
  if (value === "want_rent" || value === "مطلوب للإيجار" || value === "مطلوب إيجار") return "want_rent";
  return "all";
}

function normalizeCategoryKey(value) {
  const v = String(value || "").trim();
  if (!v || v === "الكل") return "";
  if (v === "محل") return "محل تجاري";
  return v;
}

const ACTIVE_TYPE_STORAGE_KEY = "aqari_active_type";

// =====================================================================
//  بيانات ثابتة للقوائم — استُخرجت من الـ JSX
// =====================================================================
const FLOOR_OPTIONS = [
  ["الكل", "الكل"], ["0", "أرضي"],
  ["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"],
  ["6", "6"], ["7", "7"], ["8", "8"], ["9", "9"], ["10", "10"]
];

const FACING_OPTIONS = ["الكل", "شمالي", "جنوبي", "قبلي", "شرقي", "غربي"];

const BEDS_OPTIONS = [
  ["الكل", "الكل"], ["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"], ["5+", "5+"]
];

const SORT_OPTIONS = [
  ["newest", "🕐 الأحدث أولاً"],
  ["price_asc", "💰 السعر: من الأقل"],
  ["price_desc", "💰 السعر: من الأعلى"],
  ["area_desc", "📐 مساحة: الأكبر"],
  ["area_asc", "📐 مساحة: الأصغر"]
];

const SORT_LABELS_SHORT = {
  price_asc: "سعر↑",
  price_desc: "سعر↓",
  area_desc: "مساحة↓",
  area_asc: "مساحة↑"
};

const OWNERSHIP_OPTIONS = [
  ["الكل", "🏠 الكل"],
  ["طابو نظامي (أخضر)", "✅ طابو نظامي"],
  ["طابو زراعي", "🌱 طابو زراعي"],
  ["حكم محكمة", "⚖️ حكم محكمة"],
  ["كاتب عدل (وكالة غير قابلة للعزل)", "📝 كاتب عدل"]
];

const DEFAULT_HOME_TYPES = [
  ["شقة", "🏢 شقة"],
  ["بيت عربي", "🏠 بيت عربي"],
  ["فيلا-مزرعة", "🏡 فيلا"],
  ["شاليه", "🏖️ شاليه"],
  ["سكن طلاب", "🎓 سكن طلاب"],
  ["محل تجاري", "🏪 محل"],
  ["مستودع", "📦 مستودع"],
  ["مكتب", "🖥️ مكتب"],
  ["أرض سكنية", "🏗️ أرض سكنية"],
  ["أرض زراعية", "🌾 أرض زراعية"]
];

const PRICE_RANGES_USD = [
  ["", "50000", "< 50k"],
  ["50000", "100000", "50k - 100k"],
  ["100000", "200000", "100k - 200k"],
  ["200000", "", "+200k"]
];

const PRICE_RANGES_SYP = [
  ["", "5000000", "< 5م"],
  ["5000000", "20000000", "5 - 20م"],
  ["20000000", "50000000", "20 - 50م"],
  ["50000000", "", "+50م"]
];

const AREA_RANGES = [
  ["", "50", "< 50"],
  ["50", "100", "50 - 100"],
  ["100", "200", "100 - 200"],
  ["200", "", "+200"]
];

const MORE_BOOLEAN_FIELDS = [
  ["elevator", "مصعد"],
  ["parking", "موقف سيارة"],
  ["furnished", "مفروش/غير"],
  ["heating", "تدفئة"]
];

// مفاتيح الفلاتر التي تجعل بطاقة "مزيد" تظهر مفعّلة
// (أُضيف parking و heating لأنها كانت ناقصة)
const MORE_ACTIVE_KEYS = ["condition", "finishing", "elevator", "parking", "furnished", "heating"];

// =====================================================================
//  أنماط مشتركة (دُمجت s2 و s4 في errorText)
// =====================================================================
export const filterBarStyles = {
  s1: DC => ({ borderTop: "1px solid " + DC.border, paddingTop: 10 }),
  s3: DC => ({ borderTop: "1px solid " + DC.border, paddingTop: 10, marginTop: 8 }),
  s5: C => ({
    fontSize: 11,
    color: C.primary,
    fontWeight: 700,
    background: "none",
    border: "none",
    cursor: "pointer",
    fontFamily: "inherit"
  }),
  s9: DC => ({ textAlign: "center", padding: "20px 0", color: DC.text3, fontSize: 13 }),
  s10: { display: "flex", flexDirection: "column", gap: 8 },
  s11: { maxHeight: 420, overflowY: "auto" },
  s15: DC => ({ fontSize: 11, fontWeight: 800, color: DC.text3, marginBottom: 5 }),
  s16: { display: "flex", flexWrap: "wrap", gap: 5 },
  errorText: { fontSize: 11, color: "#EF4444" }
};

// =====================================================================
//  Helpers عامة (firstSet مرفوعة لمستوى الملف)
// =====================================================================
function toArray(val) {
  if (Array.isArray(val)) return val.map(String);
  if (val === 0) return ["0"];
  if (val === "" || val === null || val === undefined || val === "الكل") return [];
  return [String(val)];
}

function toggleInArray(arr, v) {
  return arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v];
}

function readActiveTypeLocal() {
  try {
    return normalizeStoredActiveType(localStorage.getItem(ACTIVE_TYPE_STORAGE_KEY));
  } catch {
    return "الكل";
  }
}

function saveActiveTypeLocal(value) {
  try {
    localStorage.setItem(ACTIVE_TYPE_STORAGE_KEY, normalizeStoredActiveType(value));
  } catch {}
}

// =====================================================================
//  PILL_SIZES + FilterPill
// =====================================================================
const PILL_SIZES = {
  xs: { padding: "5px 10px", borderRadius: 16, fontSize: 11, borderWidth: 1.5 },
  sm: { padding: "6px 12px", borderRadius: 16, fontSize: 12, borderWidth: 1.5 },
  md: { padding: "8px 14px", borderRadius: 20, fontSize: 13, borderWidth: 1.5 },
  lg: { padding: "10px 14px", borderRadius: 10, fontSize: 13, borderWidth: 1.5 },
  block: { padding: "10px 6px", borderRadius: 12, fontSize: 14, borderWidth: 2 },
  range: { padding: "8px 6px", borderRadius: 16, fontSize: 12, borderWidth: 1.5 }
};

function FilterPill({
  DC, size = "sm", active = false,
  color = C.primary, bg = "#E8F4F0",
  idleColor, idleBorder, idleBg = "transparent",
  showCheck = false, flex = false, fullWidth = false, wrap = false,
  minHeight, dir, rightSlot, style: extraStyle,
  onClick, title, ariaLabel, children
}) {
  const t = PILL_SIZES[size] || PILL_SIZES.sm;
  const _idleBorder = idleBorder || (DC && DC.border) || "#E5E7EB";
  const _idleColor = idleColor || (DC && DC.text2) || "#445";
  const useRow = !!rightSlot || fullWidth;

  const baseStyle = {
    padding: t.padding,
    borderRadius: t.borderRadius,
    fontSize: t.fontSize,
    border: t.borderWidth + "px solid " + (active ? color : _idleBorder),
    background: active ? bg : idleBg,
    color: active ? color : _idleColor,
    fontWeight: active ? 800 : 600,
    cursor: "pointer",
    fontFamily: "inherit",
    whiteSpace: wrap ? "normal" : "nowrap",
    flex: flex ? 1 : undefined,
    width: fullWidth ? "100%" : undefined,
    minHeight,
    direction: dir,
    ...(wrap && !useRow
      ? {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          lineHeight: 1.15,
          wordBreak: "normal"
        }
      : null),
    ...(useRow
      ? { display: "flex", alignItems: "center", gap: 8, textAlign: "right" }
      : null),
    ...extraStyle
  };

  return (
    <button type="button" onClick={onClick} title={title} aria-label={ariaLabel} style={baseStyle}>
      {showCheck && active ? "✓ " : null}
      {useRow ? <span style={{ flex: 1 }}>{children}</span> : children}
      {rightSlot}
    </button>
  );
}

function ApplyButton({ count, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        marginTop: 10,
        width: "100%",
        minHeight: 42,
        borderRadius: 12,
        border: "none",
        background: C.primary,
        color: "#fff",
        fontSize: 14,
        fontWeight: 800,
        cursor: "pointer",
        fontFamily: "inherit"
      }}
    >
      تطبيق ({count}) ✓
    </button>
  );
}

function TypeOptionLabel({ icon, text }) {
  return (
    <span
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 1,
        lineHeight: 1.05
      }}
    >
      <span style={{ display: "block", fontSize: 16, lineHeight: 1, margin: 0, padding: 0 }}>
        {icon}
      </span>
      <span style={{ display: "block", fontSize: 13, lineHeight: 1.12, margin: 0, padding: 0 }}>
        {text}
      </span>
    </span>
  );
}

// =====================================================================
//  TypeDots
// =====================================================================
function TypeDots({ activeType, setActiveType }) {
  const activeKey = getActiveTypeKey(activeType);

  const dots = [
    { key: "sell", value: "للبيع", color: TYPE_COLORS.sell.color, title: "للبيع" },
    { key: "rent", value: "للإيجار", color: TYPE_COLORS.rent.color, title: "للإيجار" },
    { key: "want_buy", value: "want_buy", color: TYPE_COLORS.want_buy.color, title: "مطلوب شراء" },
    { key: "want_rent", value: "want_rent", color: TYPE_COLORS.want_rent.color, title: "مطلوب للإيجار" }
  ];

  return (
    <div style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      marginInlineStart: 8,
      marginInlineEnd: 8,
      flexShrink: 0
    }}>
      {dots.map(dot => {
        const active = activeKey === dot.key;
        return (
          <button
            key={dot.key}
            type="button"
            title={dot.title}
            aria-label={dot.title}
            onClick={() => setActiveType(active ? "الكل" : dot.value)}
            style={{
              width: 28,
              height: 28,
              borderRadius: 9,
              border: active ? "2px solid " + dot.color : "1px solid #DADDD6",
              background: active ? dot.color + "12" : "#FFFFFF",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
              cursor: "pointer",
              flexShrink: 0,
              boxShadow: active ? "0 2px 6px rgba(0,0,0,.08)" : "none"
            }}
          >
            <span style={{
              width: active ? 13 : 14,
              height: active ? 13 : 14,
              borderRadius: 5,
              background: dot.color,
              display: "block"
            }} />
          </button>
        );
      })}
    </div>
  );
}

// =====================================================================
//  QuickFilters
// =====================================================================
function QuickFilters({ activeType, setActiveType, filters = {}, setFilters }) {
  const quickItems = [
    {
      key: "new",
      label: "✨ جديد",
      active: !!filters._newOnly,
      onClick: () => setFilters(f => ({ ...f, _newOnly: !f._newOnly }))
    },
    { key: "apartment", label: " شقة", type: "للبيع", category: "شقة" },
    { key: "shop", label: " محل", type: "للبيع", category: "محل تجاري" }
  ];

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 6,
      flexWrap: "nowrap",
      overflowX: "auto",
      scrollbarWidth: "none"
    }}>
      {quickItems.map(item => {
        const isActive = item.key === "new"
          ? item.active
          : getActiveTypeKey(activeType) === getActiveTypeKey(item.type) && normalizeCategoryKey(filters.category) === normalizeCategoryKey(item.category);

        return (
          <button
            key={item.key}
            type="button"
            onClick={() => {
              if (item.key === "new") { item.onClick(); return; }
              if (isActive) {
                setActiveType("الكل");
                setFilters(p => ({ ...p, category: undefined }));
              } else {
                setActiveType(item.type);
                setFilters(p => ({ ...p, category: item.category }));
              }
            }}
            style={{
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
              padding: "4px 10px",
              borderRadius: 20,
              border: "none",
              background: isActive ? C.primary : "none",
              color: isActive ? "#fff" : C.primary,
              transition: "all 0.2s",
              whiteSpace: "nowrap"
            }}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

// =====================================================================
//  FilterBar
// =====================================================================
function FilterBar({
  DC, user,
  activeType, setActiveType,
  activeCity, setActiveCity,
  activeDistrict, setActiveDistrict,
  activeVillage, setActiveVillage,
  filters, setFilters,
  activeSheet, setActiveSheet,
  savedSearches = [], setSavedSearches = () => {},
  filterOpts = { condition: [], finishing: [], heating: [], furnished: [] },
  homeTypes = [],
  filterDistricts = [], filterVillages = [],
  loadingDistricts = false, loadingVillages = false,
  districtsError = "", villagesError = "",
  cityOptions = [], hasFilters = false,
  saveSearch = null, clearFilters = () => {},
  activeSearchId = null, setActiveSearchId = () => {},
  extraRight = null, showQuickFilters = false
}) {
  const sx = filterBarStyles;
  if (!DC) DC = C;
  filters = filters || {};

  const openSheet = name => setActiveSheet(s => s === name ? null : name);
  const closeSheet = () => setActiveSheet(null);

  // المحفوظة: مصدر الفتح يحدد الواجهة (top/mini)
  const [savedOpenSource, setSavedOpenSource] = React.useState("top");

  const openSavedSheet = source => {
    const previousSource = savedOpenSource;
    setSavedOpenSource(source);
    setActiveSheet(s => (s === "saved" && previousSource === source) ? null : "saved");
  };

  // إعادة ضبط سلسلة الموقع — استُخرجت لتجنب تكرار 6 مواضع
  const resetCityChain = () => {
    setActiveCity("الكل");
    setActiveDistrict("الكل");
    setActiveVillage("الكل");
  };
  const resetDistrictChain = () => {
    setActiveDistrict("الكل");
    setActiveVillage("الكل");
  };

  // قيم متعددة الاختيار (تدعم البيانات القديمة كنص)
  const floorList = toArray(filters.floor);
  const facingList = toArray(filters.facing);

  const activeTypeKey = getActiveTypeKey(activeType);

  // السعر
  const priceCurrency = filters.currency || "الكل";
  const priceCurrencyLabel = priceCurrency === "USD" ? "دولار" : priceCurrency === "SYP" ? "ليرة" : "";
  const hasPriceFilter = !!(filters.minPrice || filters.maxPrice || priceCurrencyLabel);
  const pricePillLabel = hasPriceFilter
    ? [
        filters.minPrice || filters.maxPrice
          ? (filters.minPrice || "0") + "—" + (filters.maxPrice || "∞")
          : "السعر",
        priceCurrencyLabel
      ].filter(Boolean).join(" · ")
    : "السعر";

  const togglePriceCurrency = value => setFilters(f => ({
    ...f,
    currency: (f.currency || "الكل") === value ? "الكل" : value
  }));

  // المساحة
  const hasAreaFilter = !!(filters.minArea || filters.maxArea);
  const areaPillLabel = hasAreaFilter
    ? "مساحة " + (filters.minArea || "0") + "—" + (filters.maxArea || "∞")
    : "المساحة";

  // الطابق
  const hasFloorFilter = floorList.length > 0;
  const floorPillLabel = !hasFloorFilter
    ? "الطابق"
    : floorList.length === 1
      ? (floorList[0] === "0" ? "أرضي" : "طابق " + floorList[0])
      : "الطوابق (" + floorList.length + ")";

  // الجهة
  const hasFacingFilter = facingList.length > 0;
  const facingPillLabel = !hasFacingFilter
    ? "الجهة"
    : facingList.length === 1
      ? facingList[0]
      : "الجهة (" + facingList.length + ")";

  // مزيد — فحص دفاعي يستبعد "" و "الكل"
  const hasMoreFilter = MORE_ACTIVE_KEYS.some(k => filters[k] && filters[k] !== "الكل");

  React.useEffect(() => {
    const saved = readActiveTypeLocal();
    if (saved && saved !== activeType) setActiveType(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    saveActiveTypeLocal(activeType);
  }, [activeType]);

  // -----------------------------------------------------------------
  //  بناء قائمة الـ pills العلوية
  // -----------------------------------------------------------------
  const topPills = [
    [
      "type",
      activeType !== "الكل" ? (typeArabicOrNull(activeType) || activeType) : "النوع",
      activeType !== "الكل",
      () => setActiveType("الكل")
    ],
    [
      "category",
      filters.category && filters.category !== "الكل" ? filters.category : "الفئة",
      !!(filters.category && filters.category !== "الكل"),
      () => setFilters(f => ({ ...f, category: "الكل" }))
    ],
    [
      "city",
      activeCity !== "الكل"
        ? activeDistrict !== "الكل"
          ? activeVillage !== "الكل"
            ? activeCity + " · " + activeDistrict + " · " + activeVillage
            : activeCity + " · " + activeDistrict
          : activeCity
        : "المدينة",
      activeCity !== "الكل",
      resetCityChain
    ],
    [
      "price", pricePillLabel, hasPriceFilter,
      () => setFilters(f => ({ ...f, minPrice: "", maxPrice: "", currency: "الكل" }))
    ],
    [
      "area", areaPillLabel, hasAreaFilter,
      () => setFilters(f => ({ ...f, minArea: "", maxArea: "" }))
    ],
    [
      "floor", floorPillLabel, hasFloorFilter,
      () => setFilters(f => ({ ...f, floor: [] }))
    ],
    [
      "beds",
      filters.beds && filters.beds !== "الكل" ? filters.beds + " غرف" : "الغرف",
      !!(filters.beds && filters.beds !== "الكل"),
      () => setFilters(f => ({ ...f, beds: "الكل" }))
    ],
    [
      "facing", facingPillLabel, hasFacingFilter,
      () => setFilters(f => ({ ...f, facing: [] }))
    ],
    [
      "ownership",
      filters.ownership && filters.ownership !== "الكل"
        ? "📄 " + filters.ownership.split("(")[0].trim() + " ✓"
        : "📄 الطابو",
      !!(filters.ownership && filters.ownership !== "الكل"),
      () => setFilters(f => ({ ...f, ownership: "" }))
    ],
    [
      "sort",
      filters.sortBy && filters.sortBy !== "newest" ? SORT_LABELS_SHORT[filters.sortBy] : "فرز",
      !!(filters.sortBy && filters.sortBy !== "newest"),
      () => setFilters(f => ({ ...f, sortBy: "newest" }))
    ],
    [
      "more",
      hasMoreFilter ? "⚙️ مزيد ✓" : "⚙️ مزيد",
      hasMoreFilter,
      null
    ]
  ];

  return <div style={CC.filterRoot(DC)}>
    <div style={CC.filterScroll}>
      {topPills.map(([key, label, active, clearFn]) => {
        const typeStyle = key === "type" && active && TYPE_COLORS[activeTypeKey]
          ? TYPE_COLORS[activeTypeKey] : null;
        const pillColor = typeStyle ? typeStyle.color : C.primary;
        const pillBg = typeStyle ? typeStyle.bg : "#E8F4F0";

        return (
          <button
            key={key}
            onClick={() => openSheet(key)}
            style={CC.filterPill(DC, active, activeSheet === key, pillColor, pillBg)}
          >
            {label}
            {active && clearFn && (
              <span
                onClick={e => { e.stopPropagation(); clearFn(); }}
                style={CC.filterClear(pillColor)}
              >✕</span>
            )}
            {!active && (
              <span style={CC.filterChevron(DC)}>{activeSheet === key ? "▲" : "▼"}</span>
            )}
          </button>
        );
      })}

      {user && (
        <button onClick={() => openSavedSheet("top")} style={CC.savedButton(activeSheet === "saved")}>
          ⭐ محفوظة
          {savedSearches.length > 0 && (
            <span style={CC.savedCount(activeSheet === "saved")}>{savedSearches.length}</span>
          )}
          <span style={CC.savedChevron(activeSheet === "saved")}>
            {activeSheet === "saved" ? "▲" : "▼"}
          </span>
        </button>
      )}

      {hasFilters && saveSearch && user && (
        <button onClick={saveSearch} style={CC.saveButton}>🔔 حفظ</button>
      )}
      {hasFilters && (
        <button onClick={clearFilters} style={CC.clearButton}>مسح ✕</button>
      )}
    </div>

    {activeSheet && <div style={CC.filterSheet(DC)}>

      {/* النوع */}
      {activeSheet === "type" && <div style={S.gap8}>
        {[
          ["للبيع", TYPE_COLORS.sell],
          ["للإيجار", TYPE_COLORS.rent],
          ["want_buy", TYPE_COLORS.want_buy],
          ["want_rent", TYPE_COLORS.want_rent]
        ].map(([v, tc]) => {
          const active = getActiveTypeKey(activeType) === getActiveTypeKey(v);
          return (
            <FilterPill
              key={v}
              DC={DC}
              size="block"
              flex
              wrap
              active={active}
              color={tc.color}
              bg={tc.bg}
              onClick={() => {
                setActiveType(active ? "الكل" : v);
                closeSheet();
              }}
              style={{ minHeight: 54, paddingTop: 7, paddingBottom: 7 }}
            >
              <TypeOptionLabel icon={tc.icon} text={tc.label} />
            </FilterPill>
          );
        })}
      </div>}

      {/* الفئة */}
      {activeSheet === "category" && <div style={CC.filterWrap7}>
        {[
          ["الكل", "🏠 الكل"],
          ...(homeTypes.length
            ? homeTypes.map(t => [t.name, (t.icon || "") + t.name])
            : DEFAULT_HOME_TYPES)
        ].map(([v, l]) => (
          <FilterPill
            key={v}
            DC={DC}
            size="md"
            active={normalizeCategoryKey(filters.category || "الكل") === normalizeCategoryKey(v)}
            onClick={() => {
              setFilters(f => ({ ...f, category: v }));
              closeSheet();
            }}
          >
            {l}
          </FilterPill>
        ))}
      </div>}

      {/* المدينة / الحي / القرية */}
      {activeSheet === "city" && <div>
        <div style={mergeStyles(CC.filterWrap6, {
          marginBottom: activeCity !== "الكل" ? 10 : 0
        })}>
          {cityOptions.map(c => (
            <FilterPill
              key={c}
              DC={DC}
              size="md"
              color={C.gold}
              bg="#FEF3C7"
              active={activeCity === c}
              onClick={() => {
                if (c === "الكل") { resetCityChain(); closeSheet(); return; }
                if (activeCity === c) { resetDistrictChain(); closeSheet(); return; }
                setActiveCity(c);
                resetDistrictChain();
              }}
            >
              {c === "الكل" ? "كل المدن" : c}
            </FilterPill>
          ))}
        </div>

        {activeCity !== "الكل" && <div style={sx.s1(DC)}>
          <div style={S.textMuted11Strong(DC)}>الأحياء في {activeCity}</div>

          {loadingDistricts && <div style={S.textMuted11(DC)}>⏳ جارٍ التحميل...</div>}
          {!loadingDistricts && districtsError && <div style={sx.errorText}>⚠️ {districtsError}</div>}
          {!loadingDistricts && !districtsError && filterDistricts.length === 0 && (
            <div style={S.textMuted11(DC)}>لا توجد أحياء</div>
          )}

          {!loadingDistricts && filterDistricts.length > 0 && (
            <div style={mergeStyles(CC.filterWrap6, { maxHeight: 130, overflowY: "auto" })}>
              {["الكل", ...filterDistricts.map(d => d.name)].map(d => (
                <FilterPill
                  key={d}
                  DC={DC}
                  size="sm"
                  active={activeDistrict === d}
                  onClick={() => {
                    if (d === "الكل") { resetDistrictChain(); closeSheet(); return; }
                    if (activeDistrict === d) { setActiveVillage("الكل"); closeSheet(); return; }
                    setActiveDistrict(d);
                    setActiveVillage("الكل");
                  }}
                >
                  {d === "الكل" ? "كل الأحياء" : d}
                </FilterPill>
              ))}
            </div>
          )}
        </div>}

        {activeDistrict !== "الكل" && <div style={sx.s3(DC)}>
          <div style={S.textMuted11Strong(DC)}>القرى في {activeDistrict}</div>

          {loadingVillages && <div style={S.textMuted11(DC)}>⏳ جارٍ التحميل...</div>}
          {!loadingVillages && villagesError && <div style={sx.errorText}>⚠️ {villagesError}</div>}

          {!loadingVillages && !villagesError && filterVillages.length === 0 && (
            <div style={S.rowCenterGap8}>
              <span style={S.textMuted11(DC)}>لا توجد قرى</span>
              <button onClick={closeSheet} style={sx.s5(C)}>تطبيق ✓</button>
            </div>
          )}

          {!loadingVillages && filterVillages.length > 0 && (
            <div style={mergeStyles(CC.filterWrap6, { maxHeight: 110, overflowY: "auto" })}>
              {["الكل", ...filterVillages.map(v => v.name)].map(v => (
                <FilterPill
                  key={v}
                  DC={DC}
                  size="sm"
                  active={activeVillage === v}
                  onClick={() => {
                    if (v === "الكل" || activeVillage === v) {
                      setActiveVillage("الكل"); closeSheet(); return;
                    }
                    setActiveVillage(v);
                    closeSheet();
                  }}
                >
                  {v === "الكل" ? "كل القرى" : v}
                </FilterPill>
              ))}
            </div>
          )}
        </div>}
      </div>}

      {/* السعر */}
      {activeSheet === "price" && <div style={{ direction: "rtl" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr",
          gap: 8, alignItems: "stretch", marginBottom: 12
        }}>
          {[["minPrice", "من"], ["maxPrice", "إلى"]].map(([key, label]) => (
            <input
              key={key}
              value={filters[key] || ""}
              onChange={e => setFilters(f => ({ ...f, [key]: e.target.value }))}
              placeholder={label}
              type="number"
              inputMode="numeric"
              style={{
                width: "100%", boxSizing: "border-box", minWidth: 0, minHeight: 48,
                padding: "9px 10px",
                border: "1.7px solid " + DC.border,
                borderRadius: 16,
                fontSize: 15, fontWeight: 800, fontFamily: "inherit",
                outline: "none", background: DC.bg, color: DC.text,
                direction: "ltr", textAlign: "center"
              }}
            />
          ))}

          {[["USD", "دولار"], ["SYP", "ليرة"]].map(([v, l]) => {
            const a = priceCurrency === v;
            return (
              <FilterPill
                key={v}
                DC={DC}
                size="block"
                minHeight={48}
                active={a}
                idleBorder="#E4EBF2"
                idleColor="#8EA0B5"
                idleBg={DC.bg}
                onClick={() => togglePriceCurrency(v)}
                style={{
                  borderRadius: 16,
                  fontSize: 14,
                  fontWeight: 900,
                  boxShadow: a ? "0 2px 8px rgba(26,74,46,0.10)" : "none"
                }}
              >
                {a ? "✓ " : ""}{l}
              </FilterPill>
            );
          })}
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 7
        }}>
          {(priceCurrency === "SYP" ? PRICE_RANGES_SYP : PRICE_RANGES_USD).map(([mn, mx, l]) => {
            const activeRange = (filters.minPrice || "") === mn && (filters.maxPrice || "") === mx;
            return (
              <FilterPill
                key={l}
                DC={DC}
                size="range"
                dir="ltr"
                minHeight={38}
                idleBg={DC.bg}
                active={activeRange}
                onClick={() => {
                  setFilters(f => ({ ...f, minPrice: mn, maxPrice: mx }));
                  closeSheet();
                }}
              >
                {l}
              </FilterPill>
            );
          })}
        </div>
      </div>}

      {/* المساحة */}
      {activeSheet === "area" && <div style={{ direction: "rtl" }}>
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12
        }}>
          {[["minArea", "من"], ["maxArea", "إلى"]].map(([key, label]) => (
            <input
              key={key}
              value={filters[key] || ""}
              onChange={e => setFilters(f => ({ ...f, [key]: e.target.value }))}
              placeholder={label + " م²"}
              type="number"
              inputMode="numeric"
              style={{
                width: "100%", boxSizing: "border-box", minWidth: 0, minHeight: 48,
                padding: "9px 12px",
                border: "1.7px solid " + DC.border,
                borderRadius: 16,
                fontSize: 15, fontWeight: 800, fontFamily: "inherit",
                outline: "none", background: DC.bg, color: DC.text,
                direction: "ltr", textAlign: "center"
              }}
            />
          ))}
        </div>

        <div style={{
          display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 7
        }}>
          {AREA_RANGES.map(([mn, mx, l]) => {
            const activeRange = (filters.minArea || "") === mn && (filters.maxArea || "") === mx;
            return (
              <FilterPill
                key={l}
                DC={DC}
                size="range"
                dir="ltr"
                minHeight={38}
                idleBg={DC.bg}
                active={activeRange}
                onClick={() => {
                  setFilters(f => ({ ...f, minArea: mn, maxArea: mx }));
                  closeSheet();
                }}
              >
                {l}
              </FilterPill>
            );
          })}
        </div>
      </div>}

      {/* الغرف */}
      {activeSheet === "beds" && <div style={S.gap8}>
        {BEDS_OPTIONS.map(([v, l]) => {
          const a = (filters.beds || "الكل") === v;
          return (
            <FilterPill
              key={v}
              DC={DC}
              size="block"
              flex
              active={a}
              showCheck
              idleBg={DC.bg}
              onClick={() => { setFilters(f => ({ ...f, beds: v })); closeSheet(); }}
              style={{ textAlign: "center" }}
            >
              {l}
            </FilterPill>
          );
        })}
      </div>}

      {/* الطابق (متعدد) */}
      {activeSheet === "floor" && <div style={{ direction: "rtl" }}>
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 7
        }}>
          {FLOOR_OPTIONS.map(([v, l]) => {
            const a = v === "الكل" ? floorList.length === 0 : floorList.includes(v);
            return (
              <FilterPill
                key={v}
                DC={DC}
                size="range"
                minHeight={42}
                idleBg={DC.bg}
                active={a}
                showCheck
                onClick={() => {
                  if (v === "الكل") { setFilters(f => ({ ...f, floor: [] })); return; }
                  setFilters(f => ({ ...f, floor: toggleInArray(toArray(f.floor), v) }));
                }}
                style={{ fontSize: 13 }}
              >
                {l}
              </FilterPill>
            );
          })}
        </div>
        {hasFloorFilter && <ApplyButton count={floorList.length} onClick={closeSheet} />}
      </div>}

      {/* الجهة (متعدد) */}
      {activeSheet === "facing" && <div>
        <div style={CC.filterWrap6}>
          {FACING_OPTIONS.map(v => {
            const a = v === "الكل" ? facingList.length === 0 : facingList.includes(v);
            return (
              <FilterPill
                key={v}
                DC={DC}
                size="md"
                active={a}
                showCheck
                onClick={() => {
                  if (v === "الكل") { setFilters(f => ({ ...f, facing: [] })); return; }
                  setFilters(f => ({ ...f, facing: toggleInArray(toArray(f.facing), v) }));
                }}
              >
                {v}
              </FilterPill>
            );
          })}
        </div>
        {hasFacingFilter && <ApplyButton count={facingList.length} onClick={closeSheet} />}
      </div>}

      {/* الطابو */}
      {activeSheet === "ownership" && <div style={CC.filterWrap7}>
        {OWNERSHIP_OPTIONS.map(([v, l]) => {
          const a = (filters.ownership || "الكل") === v;
          return (
            <FilterPill
              key={v}
              DC={DC}
              size="md"
              active={a}
              showCheck
              bg={C.primary + "15"}
              idleColor={DC.text}
              onClick={() => {
                setFilters(f => ({ ...f, ownership: v === "الكل" ? "" : v }));
                closeSheet();
              }}
            >
              {l}
            </FilterPill>
          );
        })}
      </div>}

      {/* الفرز */}
      {activeSheet === "sort" && <div style={CC.filterColumn6}>
        {SORT_OPTIONS.map(([v, l]) => {
          const a = (filters.sortBy || "newest") === v;
          return (
            <FilterPill
              key={v}
              DC={DC}
              size="lg"
              fullWidth
              idleBg={DC.bg}
              active={a}
              rightSlot={a ? <span>✓</span> : null}
              onClick={() => { setFilters(f => ({ ...f, sortBy: v })); closeSheet(); }}
            >
              {l}
            </FilterPill>
          );
        })}
      </div>}

      {/* الأبحاث المحفوظة */}
      {activeSheet === "saved" && <div>
        {savedSearches.length === 0
          ? <div style={sx.s9(DC)}>لا توجد أبحاث محفوظة</div>
          : <div style={sx.s10}>
              {savedSearches.map(s => {
                const slabel = [
                  typeArabicOrNull(s.type),
                  s.category && s.category !== "الكل" ? s.category : null,
                  s.city && s.city !== "الكل" ? s.city : null,
                  s.district ? s.district : null
                ].filter(Boolean).join(" · ");

                const isActive = activeSearchId === s.id;

                return (
                  <div key={s.id} style={CC.savedSearchRow(DC, isActive)}>
                    <div
                      style={CC.savedSearchText}
                      onClick={() => {
                        setActiveSearchId(s.id);
                        setTimeout(() => setActiveSearchId(null), 1200);

                        if (s.city && s.city !== "الكل") setActiveCity(s.city);
                        else setActiveCity("الكل");

                        if (s.district) setActiveDistrict(s.district);
                        else setActiveDistrict("الكل");

                        setActiveVillage("الكل");

                        // يتعامل مع sell/rent/lease/want_* بشكل موحد
                        setActiveType(s.type ? normalizeStoredActiveType(s.type) : "الكل");

                        // البحث المحفوظ: استبدال كامل للحالة (لا يرث القيم الحالية)
                        setFilters(f => ({
                          ...f,
                          category: s.category || "الكل",
                          minPrice: s.min_price || "",
                          maxPrice: s.max_price || "",
                          currency: s.currency || "الكل",
                          minArea: s.min_area || "",
                          maxArea: s.max_area || "",
                          floor: toArray(s.floor),
                          facing: toArray(s.facing),
                          beds: s.beds || "الكل",
                          ownership: s.ownership_type || "الكل"
                        }));

                        closeSheet();
                      }}
                    >
                      <div style={CC.savedSearchTitle(DC)}>
                        {isActive ? "✓ " : "⭐ "}{s.query || slabel || "بحث محفوظ"}
                      </div>
                      {slabel && <div style={S.textMuted11(DC)}>{slabel}</div>}
                    </div>

                    <div
                      onClick={async () => {
                        const newNotif = !s.notif;
                        setSavedSearches(p => p.map(x => x.id === s.id ? { ...x, notif: newNotif } : x));
                        await updateSavedSearchNotif(s.id, newNotif);
                      }}
                      style={CC.toggleSwitch(DC, s.notif)}
                    >
                      <div style={CC.toggleKnob(s.notif)} />
                    </div>

                    {savedOpenSource !== "mini" && (
                      <button
                        onClick={async e => {
                          e.stopPropagation();
                          setSavedSearches(p => p.filter(x => x.id !== s.id));
                          await deleteSavedSearch(s.id);
                        }}
                        style={CC.deleteSavedSearch}
                      >✕</button>
                    )}
                  </div>
                );
              })}
            </div>}
      </div>}

      {/* المزيد */}
      {activeSheet === "more" && <div style={sx.s11}>
        {[
          ["condition", "حالة العقار", ["الكل", ...filterOpts.condition]],
          ["finishing", "الإكساء", ["الكل", ...filterOpts.finishing]]
        ].map(([key, title, opts]) => (
          <div key={key} style={{ marginBottom: 12 }}>
            <div style={mergeStyles(S.textMuted11(DC), { fontWeight: 800, marginBottom: 6 })}>
              {title}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {opts.map(v => {
                const a = (filters[key] || "الكل") === v;
                return (
                  <FilterPill
                    key={v}
                    DC={DC}
                    size="sm"
                    active={a}
                    showCheck
                    bg={C.primary + "15"}
                    idleColor={DC.text}
                    onClick={() => setFilters(f => ({ ...f, [key]: v === "الكل" ? "" : v }))}
                  >
                    {v}
                  </FilterPill>
                );
              })}
            </div>
          </div>
        ))}

        {MORE_BOOLEAN_FIELDS.map(([key, title]) => {
          const opts = key === "heating" ? ["الكل", ...filterOpts.heating]
            : key === "furnished" ? ["الكل", ...filterOpts.furnished]
            : ["الكل", "يوجد", "لا يوجد"];

          return (
            <div key={key} style={S.mb10}>
              <div style={sx.s15(DC)}>{title}</div>
              <div style={{ display: "flex", gap: 5 }}>
                {opts.map(v => {
                  const a = (filters[key] || "الكل") === v;
                  return (
                    <FilterPill
                      key={v}
                      DC={DC}
                      size="xs"
                      flex
                      active={a}
                      showCheck
                      bg={C.primary + "15"}
                      idleColor={DC.text}
                      onClick={() => setFilters(f => ({ ...f, [key]: v === "الكل" ? "" : v }))}
                      style={{ borderRadius: 10, textAlign: "center", padding: "7px 4px" }}
                    >
                      {v}
                    </FilterPill>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>}
    </div>}

    <div style={CC.filterFooter(DC)}>
      {showQuickFilters && (
        <QuickFilters
          activeType={activeType}
          setActiveType={setActiveType}
          filters={filters}
          setFilters={setFilters}
        />
      )}

      {extraRight}

      <TypeDots activeType={activeType} setActiveType={setActiveType} />

      {user && (
        <button
          type="button"
          title="المحفوظة"
          aria-label="المحفوظة"
          onClick={() => openSavedSheet("mini")}
          style={{
            width: 28,
            height: 28,
            borderRadius: 9,
            border: activeSheet === "saved" ? "2px solid " + C.gold : "1px solid #DADDD6",
            background: activeSheet === "saved" ? "#FEF3C7" : "#FFFFFF",
            color: C.gold,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            cursor: "pointer",
            fontSize: 15,
            flexShrink: 0,
            boxShadow: activeSheet === "saved" ? "0 2px 6px rgba(0,0,0,.08)" : "none"
          }}
        >
          ⭐
        </button>
      )}
    </div>
  </div>;
}

export { FilterBar };
