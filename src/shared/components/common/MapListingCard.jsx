import React from "react";
import { C } from "../../constants/colors.js";
import {
  formatListingArea,
  formatListingLocation,
  formatListingPrice,
  formatListingRooms,
} from "../../utils/listingFormatters.js";

const CONTACT_PRICE_TEXT = "السعر عند التواصل";

function resolveAccuracy(item, mapMeta) {
  const isApprox =
    mapMeta?.isApprox === true ||
    item?._locationAccuracy === "approx" ||
    item?.location_accuracy === "approx" ||
    item?._approx === true;

  return isApprox ? "approx" : "exact";
}

export default function MapListingCard({
  item,
  mapMeta,
  variant = "map",
  DC = C,
  onOpen,
  onClose,
  showClose = false,
  showDetailsButton = true,
  detailsLabel = "عرض التفاصيل ←",
  style,
}) {
  if (!item) return null;

  const isDetail = variant === "detail";
  const accuracy = resolveAccuracy(item, mapMeta);
  const isApprox = accuracy === "approx";

  const priceText = formatListingPrice(item);
  const isContactPrice = priceText === CONTACT_PRICE_TEXT;

  const location = formatListingLocation(item);
  const rooms = formatListingRooms(item);
  const area = formatListingArea(item);

  const rootStyle = {
    position: "absolute",
    left: isDetail ? 14 : 0,
    right: isDetail ? 14 : 0,
    bottom: isDetail ? 16 : 0,
    zIndex: 1000,
    background: DC.white || "#fff",
    borderRadius: isDetail ? 18 : "22px 22px 0 0",
    padding: isDetail ? "12px 14px" : "16px",
    boxShadow: isDetail
      ? "0 4px 16px rgba(0,0,0,.15)"
      : "0 -4px 20px rgba(0,0,0,.15)",
    direction: "rtl",
    fontFamily: "Tajawal,sans-serif",
    ...style,
  };

  return (
    <div style={rootStyle}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: isDetail ? 14 : 15,
              fontWeight: 900,
              color: DC.text || "#111827",
              lineHeight: 1.45,
              marginBottom: 4,
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {item.title || "عقار بدون عنوان"}
          </div>

          <div
            style={{
              fontSize: isContactPrice ? 11 : isDetail ? 20 : 22,
              fontWeight: isContactPrice ? 800 : 900,
              color: isContactPrice ? DC.text3 || "#6B7280" : C.primary,
              marginBottom: 6,
              lineHeight: 1.2,
            }}
          >
            {priceText}
          </div>

          {location && (
            <div
              style={{
                fontSize: 12,
                color: DC.text3 || "#6B7280",
                marginBottom: 8,
                lineHeight: 1.4,
              }}
            >
              📍 {location}
            </div>
          )}

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 900,
                borderRadius: 999,
                padding: "4px 9px",
                background: isApprox ? "#FEF3C7" : "#E8F4F0",
                color: isApprox ? "#B45309" : C.primary,
                border: `1px solid ${isApprox ? "#F59E0B" : "#B7E4D3"}`,
              }}
            >
              {isApprox ? "〰️ موقع تقريبي" : "📍 موقع دقيق"}
            </span>

            {rooms && (
              <span
                style={{
                  fontSize: 11,
                  color: DC.text2 || "#374151",
                }}
              >
                🛏 {rooms}
              </span>
            )}

            {area && (
              <span
                style={{
                  fontSize: 11,
                  color: DC.text2 || "#374151",
                }}
              >
                📐 {area}
              </span>
            )}
          </div>
        </div>

        {showClose && (
          <button
            type="button"
            onClick={onClose}
            style={{
              border: "none",
              borderRadius: "50%",
              width: 32,
              height: 32,
              cursor: "pointer",
              background: DC.bg || "#F3F4F6",
              color: DC.text2 || "#374151",
              fontSize: 15,
              flexShrink: 0,
              fontFamily: "inherit",
            }}
            aria-label="إغلاق"
          >
            ✕
          </button>
        )}
      </div>

      {showDetailsButton && (
        <button
          type="button"
          onClick={onOpen}
          style={{
            width: "100%",
            marginTop: 14,
            padding: "13px",
            background: C.primary,
            color: "#fff",
            border: "none",
            borderRadius: 16,
            fontSize: 15,
            fontWeight: 900,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          {detailsLabel}
        </button>
      )}
    </div>
  );
}
