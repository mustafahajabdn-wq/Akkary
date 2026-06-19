import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { C } from "../../shared/constants/colors.js";
import {
  getAdminEngagementFilterOptions,
  getAdminEngagementStats,
} from "../services/engagementStatsService.js";

const UI_VERSION = "2";

const METRICS = [
  { key: "views", icon: "👁", label: "المشاهدات", color: "#0F766E", bg: "#ECFDF5" },
  { key: "phoneClicks", icon: "📞", label: "فتح الهاتف", color: "#1D4ED8", bg: "#EFF6FF" },
  { key: "whatsappClicks", icon: "💬", label: "فتح واتساب", color: "#15803D", bg: "#F0FDF4" },
  { key: "favorites", icon: "❤️", label: "إضافة للمفضلة", color: "#BE123C", bg: "#FFF1F2" },
  { key: "conversations", icon: "✉️", label: "بدء محادثة", color: "#7C3AED", bg: "#F5F3FF" },
];

const PERIODS = [
  ["all", "كل الإعلانات"],
  ["today", "منشورة اليوم"],
  ["week", "آخر 7 أيام"],
  ["month", "آخر 30 يومًا"],
];

const TYPE_LABELS = {
  sell: "للبيع",
  rent: "للإيجار",
  want_buy: "مطلوب شراء",
  want_rent: "مطلوب إيجار",
};

const EMPTY_FILTERS = {
  period: "all",
  city: "",
  type: "",
  category: "",
};

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-US");
}

function FilterSelect({ value, onChange, label, options, formatOption }) {
  return (
    <label style={{ display: "grid", gap: 4, minWidth: 0 }}>
      <span style={{ fontSize: 9, fontWeight: 800, color: "#64748B" }}>{label}</span>
      <select
        value={value}
        onChange={event => onChange(event.target.value)}
        style={{
          width: "100%",
          minWidth: 0,
          border: "1px solid #DDE8E1",
          borderRadius: 10,
          padding: "8px 9px",
          background: "#fff",
          color: "#1A2E20",
          fontFamily: "inherit",
          fontSize: 11,
          fontWeight: 700,
          outline: "none",
        }}
      >
        <option value="">الكل</option>
        {options.map(option => (
          <option key={option} value={option}>
            {formatOption ? formatOption(option) : option}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function AdminEngagementOverview({ DC }) {
  const anchorRef = useRef(null);
  const [target, setTarget] = useState(null);
  const [stats, setStats] = useState(null);
  const [options, setOptions] = useState({ cities: [], types: [], categories: [] });
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const anchor = anchorRef.current;
    const dashboardRoot = anchor?.previousElementSibling;
    const dashboardBody = dashboardRoot?.children?.[1];

    if (!dashboardBody) return undefined;

    const mount = document.createElement("div");
    mount.dataset.adminEngagementOverview = "true";
    dashboardBody.prepend(mount);
    setTarget(mount);

    const observer = new MutationObserver(() => {
      if (!dashboardBody.contains(mount)) dashboardBody.prepend(mount);
    });

    observer.observe(dashboardBody, { childList: true });

    return () => {
      observer.disconnect();
      mount.remove();
    };
  }, []);

  useEffect(() => {
    getAdminEngagementFilterOptions()
      .then(setOptions)
      .catch(loadError => {
        console.warn("Failed to load engagement filter options", loadError);
      });
  }, []);

  async function load(nextFilters = filters) {
    setLoading(true);
    setError("");

    try {
      setStats(await getAdminEngagementStats(nextFilters));
    } catch (loadError) {
      console.error("Failed to load engagement stats", loadError);
      setError("تعذر تحميل إحصائيات التفاعل");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(filters);
  }, [filters.period, filters.city, filters.type, filters.category]);

  function updateFilter(key, value) {
    setFilters(current => ({ ...current, [key]: value }));
  }

  const hasFilters =
    filters.period !== "all" ||
    !!filters.city ||
    !!filters.type ||
    !!filters.category;

  const content = (
    <section
      data-engagement-ui-version={UI_VERSION}
      style={{
        background: DC?.white || "#fff",
        border: `1px solid ${DC?.border || "#DDE8E1"}`,
        borderRadius: 16,
        padding: 14,
        marginBottom: 14,
        boxShadow: "0 5px 16px rgba(15, 23, 42, 0.05)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10,
          marginBottom: 12,
        }}
      >
        <div>
          <div style={{ fontSize: 13, fontWeight: 900, color: DC?.text || "#1A2E20" }}>
            📊 تفاعل الإعلانات
            <span
              style={{
                marginRight: 6,
                fontSize: 8,
                color: "#94A3B8",
                fontWeight: 700,
              }}
            >
              v{UI_VERSION}
            </span>
          </div>
          <div style={{ fontSize: 10, color: DC?.text3 || "#64748B", marginTop: 3 }}>
            أرقام تراكمية ضمن {formatNumber(stats?.listings)} إعلان مطابق للفلتر
          </div>
        </div>

        <button
          type="button"
          onClick={() => load(filters)}
          disabled={loading}
          style={{
            border: `1px solid ${C.primary}`,
            background: "#fff",
            color: C.primary,
            borderRadius: 10,
            padding: "7px 10px",
            fontFamily: "inherit",
            fontSize: 10,
            fontWeight: 800,
            cursor: loading ? "wait" : "pointer",
            opacity: loading ? 0.65 : 1,
          }}
        >
          {loading ? "جارٍ التحديث..." : "تحديث"}
        </button>
      </div>

      <div
        style={{
          display: "flex",
          gap: 6,
          overflowX: "auto",
          paddingBottom: 4,
          marginBottom: 9,
        }}
      >
        {PERIODS.map(([value, label]) => {
          const active = filters.period === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => updateFilter("period", value)}
              style={{
                flexShrink: 0,
                border: active ? `1px solid ${C.primary}` : "1px solid #DDE8E1",
                background: active ? C.primary : "#fff",
                color: active ? "#fff" : "#64748B",
                borderRadius: 999,
                padding: "7px 10px",
                fontFamily: "inherit",
                fontSize: 10,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 7,
          marginBottom: 10,
        }}
      >
        <FilterSelect
          label="المدينة"
          value={filters.city}
          options={options.cities}
          onChange={value => updateFilter("city", value)}
        />
        <FilterSelect
          label="نوع الإعلان"
          value={filters.type}
          options={options.types}
          formatOption={value => TYPE_LABELS[value] || value}
          onChange={value => updateFilter("type", value)}
        />
        <FilterSelect
          label="الفئة"
          value={filters.category}
          options={options.categories}
          onChange={value => updateFilter("category", value)}
        />
      </div>

      {hasFilters ? (
        <button
          type="button"
          onClick={() => setFilters(EMPTY_FILTERS)}
          style={{
            width: "100%",
            border: "1px dashed #CBD5E1",
            background: "#F8FAFC",
            color: "#475569",
            borderRadius: 10,
            padding: "7px 10px",
            fontFamily: "inherit",
            fontSize: 10,
            fontWeight: 800,
            cursor: "pointer",
            marginBottom: 10,
          }}
        >
          مسح الفلاتر
        </button>
      ) : null}

      <div
        style={{
          padding: "8px 10px",
          borderRadius: 10,
          background: "#FFFBEB",
          border: "1px solid #FDE68A",
          color: "#92400E",
          fontSize: 9.5,
          fontWeight: 700,
          lineHeight: 1.7,
          marginBottom: 10,
        }}
      >
        فلتر المدة يعتمد تاريخ نشر الإعلان؛ أمّا أرقام التفاعل نفسها فهي عدادات تراكمية.
      </div>

      {error ? (
        <div
          style={{
            padding: 12,
            borderRadius: 12,
            background: "#FEF2F2",
            color: "#B91C1C",
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {error}
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(105px, 1fr))",
            gap: 8,
          }}
        >
          {METRICS.map(metric => (
            <div
              key={metric.key}
              style={{
                background: metric.bg,
                border: `1px solid ${metric.color}22`,
                borderRadius: 13,
                padding: "11px 9px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 18, marginBottom: 4 }}>{metric.icon}</div>
              <div
                dir="ltr"
                style={{
                  fontSize: 20,
                  lineHeight: 1,
                  fontWeight: 950,
                  color: metric.color,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {loading && !stats ? "—" : formatNumber(stats?.[metric.key])}
              </div>
              <div style={{ fontSize: 9.5, fontWeight: 800, color: metric.color, marginTop: 5 }}>
                {metric.label}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );

  return (
    <>
      <span ref={anchorRef} style={{ display: "none" }} />
      {target ? createPortal(content, target) : null}
    </>
  );
}
