import React from "react";
import { useNavigate } from "react-router-dom";
import { C } from "../../shared/constants/colors.js";
import { StarRating } from "../../shared/components/common/Badges.jsx";

const IX = {
  wrap: {
    padding: "12px 14px"
  },
  table: DC => ({
    background: DC.white,
    borderRadius: 12,
    overflow: "hidden",
    border: "1px solid " + DC.border
  }),
  row: (i, rows, DC) => ({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "11px 14px",
    borderBottom: i < rows.length - 1 ? "1px solid " + DC.border : "none",
    background: i % 2 === 0 ? DC.white : DC.bg,
    gap: 12
  }),
  label: DC => ({
    fontSize: 13,
    color: DC.text3,
    flexShrink: 0
  }),
  value: (label, DC) => ({
    fontSize: 13,
    fontWeight: 700,
    color: label === "السعر" ? C.primary : label === "رقم الإعلان" ? "#C8952A" : DC.text,
    textAlign: "left",
    wordBreak: "break-word"
  }),
  copyWrap: {
    display: "flex",
    alignItems: "center",
    gap: 6
  },
  copyButton: {
    background: "none",
    border: "none",
    fontSize: 14,
    cursor: "pointer",
    padding: 0
  },
  compassWrap: {
    display: "inline-block"
  },
  compassTable: {
    borderCollapse: "separate",
    borderSpacing: 3,
    direction: "ltr",
    margin: "0 auto"
  },
  compassLabel: {
    display: "block",
    textAlign: "center",
    fontSize: 12,
    fontWeight: 700,
    color: C.primary,
    marginTop: 6
  },
  compassCell: (isCenter, isActive) => ({
    width: 52,
    height: 36,
    textAlign: "center",
    verticalAlign: "middle",
    borderRadius: 8,
    fontSize: 11,
    fontWeight: 900,
    background: isCenter ? "transparent" : isActive ? "#E8F4F0" : "#F9FAFB",
    color: isCenter ? "#D1D5DB" : isActive ? C.primary : "#D1D5DB",
    border: isCenter ? "none" : `1.5px solid ${isActive ? C.primary : "#E5E7EB"}`,
    boxShadow: isActive ? "0 2px 6px rgba(26,74,46,0.18)" : "none"
  }),
  extraCard: DC => ({
    marginTop: 10,
    background: DC.white,
    borderRadius: 12,
    border: "1px solid " + DC.border,
    overflow: "hidden"
  }),
  extraHeader: DC => ({
    padding: "8px 14px",
    borderBottom: "1px solid " + DC.border
  }),
  extraTitle: DC => ({
    fontSize: 10,
    fontWeight: 800,
    color: DC.text3
  }),
  extraRow: (i, values, DC) => ({
    display: "flex",
    alignItems: "flex-start",
    padding: "10px 14px",
    borderBottom: i < values.length - 1 ? "1px solid " + DC.border : "none",
    background: i % 2 === 0 ? DC.white : DC.bg,
    gap: 8
  }),
  extraBullet: DC => ({
    fontSize: 10,
    color: DC.text3,
    flexShrink: 0,
    marginTop: 3
  }),
  extraValue: DC => ({
    fontSize: 12,
    fontWeight: 700,
    color: DC.text
  }),
  chipRow: {
    display: "flex",
    gap: 8,
    marginTop: 10,
    flexWrap: "wrap"
  },
  softChip: (color, bg) => ({
    fontSize: 11,
    fontWeight: 700,
    color,
    background: bg,
    borderRadius: 20,
    padding: "4px 10px"
  }),
  ratingCard: DC => ({
    background: DC.white,
    borderRadius: 12,
    padding: "12px 14px",
    marginTop: 10,
    border: "1px solid " + DC.border
  }),
  sellerRatingButton: {
    marginTop: 10,
    width: "100%",
    padding: "9px",
    borderRadius: 10,
    border: "1px solid #FCD34D",
    background: "#FFFBEB",
    fontSize: 12,
    color: "#92400E",
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit"
  },
  reportButton: hasReported => ({
    marginTop: 8,
    width: "100%",
    padding: "9px",
    borderRadius: 10,
    border: `1px solid ${hasReported ? "#D1D5DB" : "#FCA5A5"}`,
    background: hasReported ? "#F8FAFC" : "#FEF2F2",
    fontSize: 12,
    color: hasReported ? "#64748B" : "#EF4444",
    fontWeight: 700,
    cursor: hasReported ? "default" : "pointer",
    fontFamily: "inherit"
  })
};

const GRID = [
  { k: "شمال غربي", ar: "↖" },
  { k: "شمالي", ar: "↑ شمالي" },
  { k: "شمال شرقي", ar: "↗" },
  { k: "غربي", ar: "← غربي" },
  { k: "_center", ar: "●" },
  { k: "شرقي", ar: "شرقي →" },
  { k: "جنوب غربي", ar: "↙" },
  { k: "جنوبي", ar: "↓ جنوبي" },
  { k: "جنوب شرقي", ar: "↘" }
];

function hasValue(value) {
  return (
    value !== null &&
    value !== undefined &&
    String(value).trim() !== "" &&
    String(value).trim().toLowerCase() !== "null" &&
    String(value).trim().toLowerCase() !== "undefined"
  );
}

function normalizeDirection(value) {
  return String(value || "")
    .replace("قبلي", "جنوبي")
    .replace("شمال شرق", "شمال شرقي")
    .replace("جنوب شرق", "جنوب شرقي")
    .replace("شمال غرب", "شمال غربي")
    .replace("جنوب غرب", "جنوب غربي")
    .replace(/\bشمال\b/g, "شمالي")
    .replace(/\bجنوب\b/g, "جنوبي")
    .replace(/\bشرق\b/g, "شرقي")
    .replace(/\bغرب\b/g, "غربي");
}

function DirectionCompass({ value }) {
  const normalized = normalizeDirection(value);

  return (
    <span style={IX.compassWrap}>
      <table style={IX.compassTable}>
        <tbody>
          {[[0, 1, 2], [3, 4, 5], [6, 7, 8]].map((row, ri) => (
            <tr key={ri}>
              {row.map(idx => {
                const d = GRID[idx];
                const isCenter = d.k === "_center";
                const isActive = !isCenter && normalized.includes(d.k);

                return (
                  <td key={idx} style={IX.compassCell(isCenter, isActive)}>
                    {d.ar}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <span style={IX.compassLabel}>{value}</span>
    </span>
  );
}

function getRawListingId(value) {
  const digits = String(value || "").replace(/\D/g, "");
  const normalized = digits.replace(/^0+/, "");
  return normalized || digits;
}

async function copyText(value) {
  const text = String(value || "");

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {}

  try {
    const input = document.createElement("textarea");
    input.value = text;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.opacity = "0";
    document.body.appendChild(input);
    input.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(input);
    return ok;
  } catch {
    return false;
  }
}

function renderValue(label, value, ctx = {}) {
  if (label === "رقم الإعلان") {
    return (
      <span style={IX.copyWrap}>
        {value}
        <button
          type="button"
          onClick={async e => {
            e.preventDefault();
            e.stopPropagation();

            await copyText(value);

            if (ctx.isAdmin) {
              const id = getRawListingId(value);
              if (id) ctx.navigate?.(`/admin/listings?q=${encodeURIComponent(id)}`);
            }
          }}
          style={IX.copyButton}
          aria-label={ctx.isAdmin ? "نسخ رقم الإعلان وفتحه في لوحة الإدارة" : "نسخ رقم الإعلان"}
          title={ctx.isAdmin ? "نسخ وفتح الإعلان في لوحة الإدارة" : "نسخ رقم الإعلان"}
        >
          📋
        </button>
      </span>
    );
  }

  if (label === "الجهة") {
    return <DirectionCompass value={value} />;
  }

  return value;
}

function buildDetailRows(item) {
  const rows = [
    ["السعر", Number(item?.price || 0).toLocaleString("en") + " " + (item?.currency === "USD" ? "USD" : "ل.س")],
    ["رقم الإعلان", "#" + String(item?.id).padStart(10, "0")],
    ["تاريخ الإعلان", item?.time || null],
    ["المدينة", item?.city || null],
    ["الحي", item?.district || null],
    ["القرية", item?.village || null],
    ["نوع الملكية / الطابو", item?.ownership || null],
    ["المعلن", item?.accountType === "office" ? "وسيط" : "مالك"],
    ["المساحة الصافية", item?.net_area ? item?.net_area + " م²" : item?.total_area ? item?.total_area + " م²" : null],
    ["المساحة الكلية", item?.total_area ? item?.total_area + " م²" : null],
    ["مساحة الأرض", item?.land_area ? item?.land_area + " م²" : null],
    ["مساحة البناء", item?.build_area ? item?.build_area + " م²" : null],
    ["الواجهة", item?.facade ? item?.facade + " م" : null],
    ["عدد الغرف", (() => {
      const r = item?.rooms;
      const s = item?.salle ?? null;

      if (!r) return null;

      const roomsTxt = r === 1 ? "غرفة" : r === 2 ? "غرفتان" : r + " غرف";
      const salonsTxt = s === 1 ? "صالون" : s === 2 ? "صالونان" : s > 2 ? s + " صالونات" : null;

      return salonsTxt ? roomsTxt + " و" + salonsTxt : roomsTxt;
    })()],
    ["الحمامات", item?.baths > 0 ? String(item?.baths) : null],
    ["الموقع التفصيلي", item?.location_detail || null],
    ["الشرفات", item?.balconies > 0 ? item?.balconies + " شرفة" : null],
    ["حالة السكن", item?.occupancy || null],
    ["الطابق", item?.floor || null],
    ["عدد الطوابق", item?.total_floors ? item?.total_floors + " طوابق" : null],
    ["عدد الوحدات", item?.total_units ? item?.total_units + " وحدة" : null],
    ["ارتفاع السقف", item?.ceil_height ? item?.ceil_height + " م" : null],
    ["عمر البناء", item?.building_age || null],
    ["التدفئة", item?.heating === true ? "✓ نعم" : null],
    ["المطبخ", item?.kitchen === true ? "✓ نعم" : null],
    ["مجمع سكني", item?.compound ? "✓ نعم" : null],
    ["طاقة شمسية", item?.solar ? "✓ نعم" : null],
    ["مسبح", item?.pool ? "✓ نعم" : null],
    ["حالة العقار", item?.condition || null],
    ["الإكساء", item?.finishing || null],
    ["الجهة", item?.facing_dir || item?.facing || null],
    ["مستوى الإضاءة", item?.light_score > 0 ? "☀️".repeat(item.light_score) + "  " + ["", "ضعيفة", "مقبولة", "جيدة", "ممتازة", "استثنائية"][item?.light_score] : null],
    ["تصنيف السكن", item?.zone_class || null],
    ["نوع التربة", item?.soil_type || null],
    ["مصدر المياه", item?.water_source || null],
    ["موقع المحل", item?.shop_location || null],
    ["وصول شاحنات", item?.truck_access ? "✓ نعم" : null]
  ];

  return rows.filter(row => hasValue(row[1]));
}

function parseExtraFields(extraFields) {
  if (!extraFields) return [];

  let data = extraFields;

  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      return [];
    }
  }

  if (typeof data !== "object" || Array.isArray(data)) return [];

  const values = [];

  const flatten = obj => {
    for (const [, value] of Object.entries(obj)) {
      if (!hasValue(value)) continue;

      if (typeof value === "object" && !Array.isArray(value)) {
        flatten(value);
      } else {
        values.push(String(value).trim());
      }
    }
  };

  flatten(data);
  return values;
}

function DetailTable({ rows, DC, user, navigate }) {
  if (!rows.length) return null;

  const isAdmin = user?.role === "admin" || (user?.allowedPages || []).includes("adminListings");

  return (
    <div style={IX.table(DC)}>
      {rows.map(([label, value], i) => (
        <div key={label + "-" + i} style={IX.row(i, rows, DC)}>
          <span style={IX.label(DC)}>{label}</span>
          <span style={IX.value(label, DC)}>{renderValue(label, value, { isAdmin, navigate })}</span>
        </div>
      ))}
    </div>
  );
}

function ExtraFieldsCard({ item, DC }) {
  const values = parseExtraFields(item?.extra_fields);

  if (!values.length) return null;

  return (
    <div style={IX.extraCard(DC)}>
      <div style={IX.extraHeader(DC)}>
        <span style={IX.extraTitle(DC)}>⊕ معلومات إضافية</span>
      </div>

      {values.map((value, i) => (
        <div key={i} style={IX.extraRow(i, values, DC)}>
          <span style={IX.extraBullet(DC)}>▪︎</span>
          <span style={IX.extraValue(DC)}>{value}</span>
        </div>
      ))}
    </div>
  );
}

function DetailBadges({ item }) {
  return (
    <div style={IX.chipRow}>
      {item?.verified && (
        <span style={IX.softChip(C.primary, "#E8F4F0")}>
          ✓ موثّق
        </span>
      )}

      {item?.whatsapp && (
        <span style={IX.softChip("#25D366", "#F0FDF4")}>
          💬 واتساب
        </span>
      )}

      {item?.messenger_id && item.messenger_id.trim() !== "" && (
        <span style={IX.softChip("#1877F2", "#EFF6FF")}>
          📘 فيسبوك
        </span>
      )}
    </div>
  );
}

function SellerRatingCard({ item, DC }) {
  if (!(item?.ratingCount > 0)) return null;

  return (
    <div style={IX.ratingCard(DC)}>
      <StarRating rating={item?.rating} count={item?.ratingCount} size={14} />
    </div>
  );
}

export default function DetailInfoTab({
  item,
  user,
  DC = C,
  hasReported = false,
  onReport,
  onRateSeller
}) {
  const rows = buildDetailRows(item);
  const navigate = useNavigate();

  return (
    <div style={IX.wrap}>
      <DetailTable rows={rows} DC={DC} user={user} navigate={navigate} />
      <ExtraFieldsCard item={item} DC={DC} />
      <DetailBadges item={item} />
      <SellerRatingCard item={item} DC={DC} />

      {user && item?.sellerId && user.id !== item.sellerId && (
        <button type="button" onClick={onRateSeller} style={IX.sellerRatingButton}>
          ⭐ تقييم البائع
        </button>
      )}

      <button
        type="button"
        onClick={onReport}
        disabled={hasReported}
        style={IX.reportButton(hasReported)}
      >
        {hasReported ? "🛡️ تم الإبلاغ مسبقًا" : "🚩 الإبلاغ عن هذا الإعلان"}
      </button>
    </div>
  );
}
