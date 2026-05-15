/**
 * mapMarkers.js
 * دوال مشتركة لإنشاء ماركرات الخريطة — تُستخدم في MapViewPage و DetailPage
 */

import { getListingTypeStyle } from "../constants/colors.js";

/** ألوان البالون حسب نوع العقار */
export function getMarkerColor(type) {
  return getListingTypeStyle(type).color;
}

/** تسمية نوع العقار */
export function getTypeLabel(type) {
  return getListingTypeStyle(type).label;
}

const MAP_MARKER_STYLE_ID = "aqari-shared-map-marker-style";

export function ensureMapMarkerStyles() {
  if (
    typeof document === "undefined" ||
    document.getElementById(MAP_MARKER_STYLE_ID)
  ) {
    return;
  }

  const style = document.createElement("style");
  style.id = MAP_MARKER_STYLE_ID;
  style.textContent = `
    @keyframes mapPulse {
      0%   { transform: translate(-50%, -50%) scale(.6); opacity: .7; }
      70%  { transform: translate(-50%, -50%) scale(2.2); opacity: 0; }
      100% { transform: translate(-50%, -50%) scale(2.2); opacity: 0; }
    }

    @keyframes mapPulse2 {
      0%   { transform: translate(-50%, -50%) scale(.6); opacity: .5; }
      70%  { transform: translate(-50%, -50%) scale(1.6); opacity: 0; }
      100% { transform: translate(-50%, -50%) scale(1.6); opacity: 0; }
    }

    @keyframes detailMapPulse {
      0%   { transform: translate(-50%, -50%) scale(.65); opacity: .45; }
      70%  { transform: translate(-50%, -50%) scale(1.8); opacity: 0; }
      100% { transform: translate(-50%, -50%) scale(1.8); opacity: 0; }
    }

    @keyframes detailMapPulse2 {
      0%   { transform: translate(-50%, -50%) scale(.7); opacity: .35; }
      80%  { transform: translate(-50%, -50%) scale(2.2); opacity: 0; }
      100% { transform: translate(-50%, -50%) scale(2.2); opacity: 0; }
    }

    @keyframes aqariMarkerSpawn {
      0% {
        transform: translate3d(0, 0, 0) scale(.48);
        opacity: 0;
        filter: blur(1px) brightness(1.08);
      }

      62% {
        transform: translate3d(0, 0, 0) scale(1.08);
        opacity: 1;
        filter: blur(0) brightness(1);
      }

      100% {
        transform: translate3d(0, 0, 0) scale(1);
        opacity: 1;
        filter: none;
      }
    }

    .aqari-map-marker-shell,
    .aqari-map-cluster-shell,
    .aqari-map-approx-shell {
      transform: translate3d(0, 0, 0);
      transform-origin: center center;
      transition: transform 140ms ease, filter 140ms ease;
      will-change: transform;
      backface-visibility: hidden;
      pointer-events: auto;
      box-sizing: border-box;
    }

    .aqari-marker-pressed {
      transform: translate3d(0, 0, 0) scale(.92) !important;
      filter: brightness(.88);
    }

    .aqari-marker-spawn {
      animation: aqariMarkerSpawn 340ms cubic-bezier(.2,.9,.22,1.15) both;
    }

    .aqari-map-marker-shell *,
    .aqari-map-cluster-shell *,
    .aqari-map-approx-shell * {
      box-sizing: border-box;
    }
  `;

  document.head.appendChild(style);
}

function toNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === "") return fallback;

  const n = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(n) ? n : fallback;
}

function formatMarkerPrice(rawPrice, currency, short = true) {
  const cur = String(currency || "").trim().toUpperCase();

  let priceDisplay = "";

  if (short) {
    priceDisplay =
      rawPrice >= 1e6
        ? `${(rawPrice / 1e6).toFixed(1).replace(/\.0$/, "")}M`
        : rawPrice >= 1000
          ? `${Math.round(rawPrice / 1000)}K`
          : String(rawPrice);
  } else {
    priceDisplay = rawPrice.toLocaleString("en-US");
  }

  if (cur === "USD") return `$ ${priceDisplay}`;
  if (cur === "SYP") return `${priceDisplay} ل.س`;
  if (cur === "EUR") return `€ ${priceDisplay}`;
  if (cur === "TRY") return `₺ ${priceDisplay}`;

  return currency ? `${priceDisplay} ${currency}` : priceDisplay;
}

/**
 * تشغيل حركة ظهور الماركر بعد إضافته إلى الخريطة.
 */
export function playMarkerSpawn(marker, delay = 0) {
  if (!marker?.getElement) return;

  window.setTimeout(() => {
    const el = marker.getElement();
    if (!el) return;

    el.classList.remove("aqari-marker-spawn");

    // إجبار المتصفح على إعادة تشغيل الأنيميشن
    void el.offsetWidth;

    el.classList.add("aqari-marker-spawn");

    window.setTimeout(() => {
      el.classList.remove("aqari-marker-spawn");
    }, 420);
  }, delay);
}

/**
 * بالون السعر — مشترك بين MapViewPage و DetailPage
 *
 * @param {object} L
 * @param {object} item     - { type, price, priceNum, currency }
 * @param {object} options
 *   @param {boolean} options.approx   - pulse + dashed border
 *   @param {boolean} options.short    - سعر مختصر K/M أم كامل مع العملة
 *   @param {number}  options.anchorX
 *   @param {number}  options.anchorY
 */
export function createPriceMarkerIcon(L, item, options = {}) {
  const {
    approx = false,
    short = true,
    anchorX = 55,
    anchorY = 40,
  } = options;

  const bg = getMarkerColor(item?.type);
  const label = getTypeLabel(item?.type);

  const rawP = toNumber(item?.price ?? item?.priceNum ?? 0, 0);

  const priceText = rawP > 0
    ? formatMarkerPrice(rawP, item?.currency, short)
    : "💬";

  const pulseHTML = approx
    ? `<div style="position:absolute;top:50%;left:50%;width:36px;height:36px;border-radius:50%;background:${bg};opacity:.35;animation:mapPulse 2s ease-out infinite;"></div>
       <div style="position:absolute;top:50%;left:50%;width:36px;height:36px;border-radius:50%;background:${bg};opacity:.25;animation:mapPulse2 2s ease-out .4s infinite;"></div>`
    : "";

  const border = approx
    ? "1.5px dashed rgba(255,255,255,.6)"
    : "1px solid rgba(255,255,255,.3)";

  const opacity = approx ? 0.88 : 1;

  const html = `
    <div class="${approx ? "aqari-map-approx-shell" : "aqari-map-marker-shell"}" style="position:relative;display:inline-block;">
      ${pulseHTML}
      <div style="
        background:${bg};
        color:white;
        border-radius:20px;
        padding:5px 11px 5px 13px;
        font-size:12px;
        font-weight:600;
        white-space:nowrap;
        box-shadow:0 3px 12px rgba(0,0,0,.18);
        font-family:Tajawal,sans-serif;
        border:${border};
        display:inline-flex;
        align-items:center;
        gap:6px;
        position:relative;
        cursor:pointer;
        opacity:${opacity};
        direction:rtl;
      ">
        <span style="font-size:9.5px;opacity:.75;">${label}</span>
        <span style="width:1px;height:10px;background:rgba(255,255,255,.25);display:inline-block;"></span>
        <span style="font-size:12px;font-weight:700;direction:ltr;unicode-bidi:plaintext;">${priceText}</span>
        <div style="
          position:absolute;
          bottom:-6px;
          left:50%;
          transform:translateX(-50%);
          width:0;
          height:0;
          border-left:5px solid transparent;
          border-right:5px solid transparent;
          border-top:6px solid ${bg};
        "></div>
      </div>
    </div>
  `;

  return L.divIcon({
    className: "",
    html,
    iconSize: [null, null],
    iconAnchor: [anchorX, anchorY],
  });
}

/**
 * بالون الموقع التقريبي — يعرض اسم المنطقة
 * يُستخدم في DetailPage عندما يكون الموقع تقريبياً
 */
export function createApproxLabelIcon(
  L,
  label,
  { color = "#1A4A2E", anchorX = 70, anchorY = 58 } = {}
) {
  const html = `
    <div class="aqari-map-approx-shell" style="
      background:${color};
      color:#fff;
      border-radius:20px;
      padding:5px 11px 5px 13px;
      font-size:12px;
      font-weight:600;
      white-space:nowrap;
      box-shadow:0 3px 12px rgba(0,0,0,.18);
      font-family:Tajawal,sans-serif;
      border:1px solid rgba(255,255,255,.3);
      display:inline-flex;
      align-items:center;
      gap:6px;
      position:relative;
      opacity:.92;
      direction:rtl;
    ">
      <span style="font-size:9.5px;opacity:.75;background:rgba(255,255,255,.14);border-radius:10px;padding:2px 7px;">تقريبي</span>
      <span style="width:1px;height:10px;background:rgba(255,255,255,.25);display:inline-block;"></span>
      <span>📍 ${label}</span>
      <div style="
        position:absolute;
        bottom:-6px;
        left:50%;
        transform:translateX(-50%);
        width:0;
        height:0;
        border-left:5px solid transparent;
        border-right:5px solid transparent;
        border-top:6px solid ${color};
      "></div>
    </div>
  `;

  return L.divIcon({
    className: "",
    html,
    iconSize: [null, null],
    iconAnchor: [anchorX, anchorY],
  });
}

/**
 * نقطة pulse للموقع التقريبي
 * تُستخدم مع createApproxLabelIcon في DetailPage
 */
export function createPulseIcon(L, { color = "#1A4A2E" } = {}) {
  const html = `
    <div style="position:relative;width:42px;height:42px;">
      <div style="position:absolute;top:50%;left:50%;width:42px;height:42px;border-radius:50%;background:${color};opacity:.32;animation:detailMapPulse 2s ease-out infinite;"></div>
      <div style="position:absolute;top:50%;left:50%;width:42px;height:42px;border-radius:50%;background:${color};opacity:.22;animation:detailMapPulse2 2s ease-out .4s infinite;"></div>
      <div style="position:absolute;top:50%;left:50%;width:10px;height:10px;border-radius:50%;background:${color};border:2px solid rgba(255,255,255,.9);transform:translate(-50%,-50%);box-shadow:0 0 0 2px rgba(26,74,46,.16);"></div>
    </div>
  `;

  return L.divIcon({
    className: "",
    html,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// MapViewPage marker helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * العقار الدقيق = بالون عادي.
 * العقار التقريبي = نفس البالون + pulse.
 */
export function createMapItemIcon(L, item) {
  const approx =
    item?._locationAccuracy === "approx" ||
    item?.location_accuracy === "approx";

  return createPriceMarkerIcon(L, item, {
    approx,
    short: true,
    anchorX: 55,
    anchorY: 40,
  });
}

/**
 * العقار التقريبي المفرد = نفس بالون السعر + pulse.
 */
export function createMapApproxSingleIcon(L, item) {
  return createPriceMarkerIcon(L, item, {
    approx: true,
    short: true,
    anchorX: 55,
    anchorY: 40,
  });
}

/**
 * الكلاستر العادي = دائرة بيضاء واضحة مع مكبرة.
 */
export function createMapClusterIcon(L, count) {
  const size = count > 99 ? 70 : count > 20 ? 64 : 58;

  const html = `
    <div class="aqari-map-cluster-shell" style="
      width:${size}px;
      height:${size}px;
      border-radius:50%;
      background:rgba(255,255,255,.94);
      color:#111827;
      position:relative;
      display:flex;
      flex-direction:column;
      align-items:center;
      justify-content:center;
      gap:2px;
      font-family:Tajawal,sans-serif;
      font-weight:900;
      border:2px solid rgba(31,41,55,.34);
      box-shadow:0 8px 24px rgba(0,0,0,.26), 0 2px 8px rgba(0,0,0,.18);
      direction:rtl;
      overflow:hidden;
      backdrop-filter:blur(7px);
      -webkit-backdrop-filter:blur(7px);
    ">
      <span style="
        position:absolute;
        top:7px;
        left:8px;
        font-size:${size > 64 ? 16 : 14}px;
        line-height:1;
        opacity:.82;
        z-index:2;
        filter:grayscale(1);
      ">🔎</span>

      <span style="
        position:relative;
        z-index:2;
        font-size:${count > 99 ? 20 : 22}px;
        line-height:1;
        color:#111827;
      ">${count}</span>

      <span style="
        position:relative;
        z-index:2;
        font-size:11px;
        opacity:.78;
        line-height:1;
        color:#374151;
      ">عقار</span>
    </div>
  `;

  return L.divIcon({
    className: "",
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

/**
 * تجميع المواقع التقريبية = رمادي شفاف + pulse.
 */
export function createMapApproxStackIcon(L, count) {
  const bg = "rgba(55,65,81,.72)";
  const pulseColor = "#B45309";

  const html = `
    <div class="aqari-map-approx-shell" style="position:relative;display:inline-block;">
      <div style="position:absolute;top:50%;left:50%;width:36px;height:36px;border-radius:50%;background:${pulseColor};opacity:.35;animation:mapPulse 2s ease-out infinite;"></div>
      <div style="position:absolute;top:50%;left:50%;width:36px;height:36px;border-radius:50%;background:${pulseColor};opacity:.25;animation:mapPulse2 2s ease-out .4s infinite;"></div>

      <div style="
        background:${bg};
        color:white;
        border-radius:20px;
        padding:5px 11px 5px 13px;
        font-size:12px;
        font-weight:600;
        white-space:nowrap;
        box-shadow:0 3px 12px rgba(0,0,0,.18);
        font-family:Tajawal,sans-serif;
        border:1px solid rgba(255,255,255,.30);
        display:inline-flex;
        align-items:center;
        gap:6px;
        position:relative;
        cursor:pointer;
        opacity:.95;
        direction:rtl;
        backdrop-filter:blur(6px);
        -webkit-backdrop-filter:blur(6px);
      ">
        <span style="font-size:9.5px;opacity:.82;">عقارات</span>
        <span style="width:1px;height:10px;background:rgba(255,255,255,.25);display:inline-block;"></span>
        <span style="font-size:12px;font-weight:900;direction:ltr;">${count}</span>
        <div style="
          position:absolute;
          bottom:-6px;
          left:50%;
          transform:translateX(-50%);
          width:0;
          height:0;
          border-left:5px solid transparent;
          border-right:5px solid transparent;
          border-top:6px solid rgba(55,65,81,.72);
        "></div>
      </div>
    </div>
  `;

  return L.divIcon({
    className: "",
    html,
    iconSize: [null, null],
    iconAnchor: [55, 40],
  });
}
