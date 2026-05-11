import React from "react";
import { C } from "../../constants/colors.js";

export function LoadMoreButton({
  onPress,
  loading = false,
  hasMore = true,
  label = "تحميل المزيد",
}) {
  if (!hasMore) return null;

  return (
    <div style={{ textAlign: "center", padding: "16px 0" }}>
      <button
        onClick={onPress}
        disabled={loading}
        style={{
          padding: "10px 28px",
          borderRadius: 20,
          border: "1.5px solid " + C.border,
          background: loading ? C.bg : C.white,
          color: loading ? C.text3 : C.primary,
          fontSize: 13,
          fontWeight: 700,
          cursor: loading ? "not-allowed" : "pointer",
          fontFamily: "Tajawal, sans-serif",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          transition: "all 0.2s",
        }}
      >
        {loading ? "⏳ جارٍ التحميل..." : "⬇️ " + label}
      </button>
    </div>
  );
}
