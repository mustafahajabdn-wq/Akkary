import React from "react";
import { CG } from "../../styles/componentStyles.js";

export function CurrencyTag({ currency }) {
  const isUSD = currency === "USD";

  return <span style={CG.currencyTag(isUSD)}>{isUSD ? "💰" : "ل.س"}</span>;
}

export function OwnershipTag({ type }) {
  if (!type) return null;

  const s =
    {
      "طابو نظامي (أخضر)": {
        bg: "#FFF7E6",
        color: "#9A6B12",
        border: "#E8B84B",
      },
      "طابو زراعي": {
        bg: "#FFFBEA",
        color: "#A16207",
        border: "#FCD34D",
      },
      "حكم محكمة": {
        bg: "#FEF3C7",
        color: "#78350F",
        border: "#FCD34D",
      },
      "كاتب عدل (وكالة غير قابلة للعزل)": {
        bg: "#FFF7ED",
        color: "#92400E",
        border: "#FDBA74",
      },
    }[type] || {
      bg: "#F8F6F1",
      color: "#6B7280",
      border: "#D6D3D1",
    };

  return <span style={CG.ownershipTag(s)}>📋 {type}</span>;
}

export function OfficeBadge({ type }) {
  if (type !== "office") return null;

  return <span style={CG.officeBadge}>مكتب/وسيط</span>;
}

export function StarRating({ rating, count, size = 12 }) {
  if (!count || count < 3 || !rating) {
    return <span style={CG.ratingEmpty(size)}>{count ? `${count} تقييم (غير كافٍ)` : "لا يوجد تقييم بعد"}</span>;
  }

  const r = parseFloat(rating) || 0;

  const starColor = r >= 4.5 ? "#16A34A"
                  : r >= 4   ? "#C8952A"
                  : r >= 3   ? "#D97706"
                  : "#9CA3AF";

  const bgColor  = r >= 4.5 ? "#F0FDF4"
                 : r >= 4   ? "#FFFBEB"
                 : r >= 3   ? "#FEF9C3"
                 : "#F3F4F6";

  return (
    <div style={CG.ratingWrap(bgColor)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} style={CG.ratingStar(size, i <= Math.round(r), starColor)}>★</span>
      ))}
      <span style={CG.ratingValue(size, starColor)}>
        {r.toFixed(1)}
        <span style={CG.ratingCount(size)}> ({count})</span>
      </span>
    </div>
  );
}
