import React, { useEffect, useMemo, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { C, getListingTypeStyle } from "../../shared/constants/colors.js";
import { IslamicPattern, Wave } from "../../shared/components/icons.jsx";
import { listingService } from "../services/listingService.js";
import { fetchProfile } from "../services/profileService.js";
import { fetchAppSetting, fetchPropertyTypes, fetchPropertyFields } from "../services/propertyService.js";
import { getAllGeoCoords, getCities, getDistricts as getDistrictsCache, getVillageNamesByDistrictId } from "../services/geoCache.js";
import { getCurrentAuthUser, getAccessToken } from "../services/authService.js";
import { uploadToListingImages, uploadListingFileWithFallback } from "../services/mediaService.js";
import { ensureLeafletLoaded } from "../../shared/utils/leafletLoader.js";
import { S, mergeStyles } from "../../shared/styles/primitives.js";
import { AW } from "../../shared/styles/addWant.styles.js";
import { resolveMapLocation } from "../../shared/utils/mapLocation.js";
import { AP } from "./AddPage.styles.js";

const FIXED_COLUMNS = new Set(["title","description","price","currency","type","category","city","district","village","phone","phone2","lat","lng","map_lat","map_lng","location_accuracy","geo_source","location_detail","video_url","external_url","messenger_id","ownership","total_area","net_area","land_area","build_area","rooms","baths","floor","total_floors","total_units","balconies","building_age","condition","finishing","furnished","occupancy","heating","kitchen","elevator","parking","compound","solar","pool","truck_access","facade","facing_dir","shop_location","zone_class","soil_type","water_source","ceil_height","light_score","salle","gender","beach_dist","warehouse_cold","warehouse_mezzanine","warehouse_office","warehouse_split","warehouse_type","beds"]);
const IGNORED_ADD_FIELDS = new Set(["whatsapp2"]);
const BOOLEAN_FIELDS = new Set(["elevator","parking","compound","solar","pool","truck_access","warehouse_cold","warehouse_mezzanine","warehouse_office","warehouse_split"]);
const FORCE_NUMBER_FIELDS = new Set(["price","net_area"]);
const FORCE_INTEGER_FIELDS = new Set(["salle"]);
const DIGITS_ONLY_TEXT_FIELDS = new Set(["phone","phone2"]);
const REQUIRED_FIELDS = new Set(["title", "city"]);
const REVIEW_MESSAGE = "تم إرسال إعلانك بنجاح، وهو الآن قيد المراجعة. سيظهر للعامة بعد موافقة الإدارة.";
const REVIEW_MESSAGE_WITH_IMAGE_WARNING = "تم إرسال إعلانك بنجاح، وهو الآن قيد المراجعة. فشل رفع بعض الصور، ويمكنك تعديل الإعلان لاحقاً.";

function normalizeDigits(value) {
  return String(value ?? "").replace(/[٠-٩]/g, d => String("٠١٢٣٤٥٦٧٨٩".indexOf(d))).replace(/[۰-۹]/g, d => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
}
function onlyDigits(value) { return normalizeDigits(value).replace(/[^0-9]/g, ""); }
function toNumberOrNull(value) {
  const raw = normalizeDigits(value).replace(",", ".").replace(/[^0-9.]/g, "");
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : null;
}
function toIntegerOrNull(value) {
  const raw = onlyDigits(value);
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
}
function normalizeBooleanValue(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") { if (value === 1) return true; if (value === 0) return false; return null; }
  const v = String(value).trim().toLowerCase();
  if (!v) return null;
  if (["true","1","yes","y","on","نعم","يوجد","موجود"].includes(v)) return true;
  if (["false","0","no","n","off","لا","لا يوجد","غير موجود"].includes(v)) return false;
  return null;
}

const CITY_COORDS = {
  "دمشق":[33.5138,36.2765],"حلب":[36.2021,37.1343],"حمص":[34.7324,36.7137],
  "اللاذقية":[35.5317,35.7917],"طرطوس":[34.8891,35.8866],"حماة":[35.1333,36.75],
  "دير الزور":[35.3361,40.1406],"الرقة":[35.95,39.0],"إدلب":[35.9306,36.6339],
  "السويداء":[32.7089,36.5672],"درعا":[32.6189,36.1021],"القنيطرة":[33.1264,35.8244],
  "ريف دمشق":[33.55,36.4]
};

function normalizeFacebookIdentifier(value) {
  const raw = String(value || "").trim();
  if (!raw) return { ok: true, value: "" };
  let cleaned = raw.replace(/^@/, "").trim();
  try {
    let urlText = cleaned;
    if (/^(www\.)?(facebook\.com|fb\.com|m\.me)\//i.test(urlText)) urlText = "https://" + urlText;
    if (/^https?:\/\//i.test(urlText)) {
      const url = new URL(urlText);
      const host = url.hostname.toLowerCase().replace(/^www\./, "");
      const isFacebook = host === "facebook.com" || host === "fb.com" || host === "m.me" || host.endsWith(".facebook.com");
      if (!isFacebook) return { ok: false, value: "", error: "أدخل رابط Facebook صحيح مثل facebook.com/username" };
      const idParam = url.searchParams.get("id");
      if (idParam && /^[0-9]{5,30}$/.test(idParam)) return { ok: true, value: idParam };
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts.length > 0) cleaned = parts[0].replace(/^@/, "").trim();
    }
  } catch {}
  if (/^[0-9]{5,30}$/.test(cleaned)) return { ok: true, value: cleaned };
  if (/^[A-Za-z0-9.]{5,80}$/.test(cleaned)) return { ok: true, value: cleaned };
  return { ok: false, value: "", error: "معرّف Facebook غير صحيح. استخدم مثلًا: facebook.com/username أو username" };
}

function mergeProfileContactDefaults(base, profile) {
  if (!profile) return base;
  const defaults = { phone: profile.phone || "", phone2: profile.phone2 || "", messenger_id: profile.messenger_id || "" };
  const next = { ...base };
  Object.entries(defaults).forEach(([key, value]) => {
    if (!value) return;
    if (next[key] === undefined || next[key] === null || next[key] === "") next[key] = value;
  });
  return next;
}

const waitImageLoad = img => new Promise((resolve, reject) => { img.onload = () => resolve(); img.onerror = () => reject(new Error("تعذر قراءة الصورة")); });
const canvasToBlob = (canvas, type, quality) => new Promise((resolve, reject) => {
  canvas.toBlob(blob => { if (!blob) return reject(new Error("تعذر ضغط الصورة")); resolve(blob); }, type, quality);
});

function drawRoundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function addWatermark(ctx, width, height) {
  const label = "طابو أخضر";
  const fontSize = Math.max(22, Math.round(Math.min(width, height) * 0.04));
  const padX = Math.round(fontSize * 0.7);
  const padY = Math.round(fontSize * 0.45);
  const margin = Math.max(18, Math.round(fontSize * 0.8));
  ctx.save();
  ctx.direction = "rtl";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `700 ${fontSize}px Arial, Tahoma, sans-serif`;
  const textWidth = ctx.measureText(label).width;
  const boxWidth = Math.round(textWidth + padX * 2);
  const boxHeight = Math.round(fontSize + padY * 2);
  const x = Math.round((width - boxWidth) / 2);
  const y = height - boxHeight - margin;
  const radius = Math.round(boxHeight / 2);
  ctx.shadowColor = "rgba(0,0,0,0.18)";
  ctx.shadowBlur = Math.max(8, Math.round(fontSize * 0.35));
  ctx.fillStyle = "rgba(22, 163, 74, 0.82)";
  drawRoundedRect(ctx, x, y, boxWidth, boxHeight, radius);
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.fillStyle = "rgba(255,255,255,0.98)";
  ctx.fillText(label, x + boxWidth / 2, y + boxHeight / 2 + 1);
  ctx.restore();
}

async function compressImage(file) {
  if (!file.type.startsWith("image/")) return file;
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.decoding = "async";
  img.src = url;
  try {
    await waitImageLoad(img);
    const maxSide = 1600;
    const ratio = Math.min(1, maxSide / Math.max(img.width, img.height));
    const width = Math.max(1, Math.round(img.width * ratio));
    const height = Math.max(1, Math.round(img.height * ratio));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("تعذر تجهيز canvas");
    ctx.drawImage(img, 0, 0, width, height);
    addWatermark(ctx, width, height);
    const blob = await canvasToBlob(canvas, "image/jpeg", 0.82);
    canvas.width = 1;
    canvas.height = 1;
    return new File([blob], `${file.name.replace(/\.[^.]+$/, "") || "image"}.jpg`, { type: "image/jpeg", lastModified: Date.now() });
  } finally {
    URL.revokeObjectURL(url);
    img.src = "";
  }
}

function FacingPicker({ value, onChange }) {
  const dirs = [["شمال غرب","↖"],["شمال","↑"],["شمال شرق","↗"],["غرب","←"],[null,"🧭"],["شرق","→"],["جنوب غرب","↙"],["جنوب","↓"],["جنوب شرق","↘"]];
  const selected = value ? String(value).split("،").map(v => v.trim()).filter(Boolean) : [];
  const toggle = v => {
    const next = selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v];
    onChange(next.length ? next.join("،") : "");
  };
  return (
    <div>
      <div style={AP.facingGrid}>
        {dirs.map(([v, arrow], i) =>
          v === null ? (
            <div key={i} style={AP.facingCenterCell}><span style={AP.facingArrowMuted}>{arrow}</span></div>
          ) : (() => {
            const active = selected.includes(v);
            return (
              <button key={v} type="button" onClick={() => toggle(v)} style={AP.facingDirectionBtn(active)}>
                <span style={AP.facingDirectionIcon}>{arrow}</span>
                <span style={AP.facingDirectionLabel}>{v.replace("شمال ", "ش ").replace("جنوب ", "ج ")}</span>
              </button>
            );
          })()
        )}
      </div>
      {selected.length > 0 && (
        <div style={AP.selectedFacingWrap}>
          {selected.map(v => (
            <span key={v} style={AP.selectedFacingTag}>
              {v} <span onClick={() => toggle(v)} style={AP.selectedFacingRemove}>✕</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function LightPicker({ value, onChange }) {
  const score = parseInt(value, 10) || 0;
  return (
    <div style={AP.lightRow}>
      {[1,2,3,4,5].map(n => (
        <button key={n} type="button" onClick={() => onChange(score === n ? 0 : n)} style={AP.lightButton(n <= score)}>☀️</button>
      ))}
      <span style={AP.lightLabel}>{["","ضعيفة","مقبولة","جيدة","ممتازة","استثنائية"][score] || ""}</span>
    </div>
  );
}

function CitySelect({ value, onChange, error = false }) {
  const [opts, setOpts] = React.useState([]);
  React.useEffect(() => { getCities().then(data => { setOpts(data?.length ? data : []); }); }, []);
  return (
    <select style={AW.input({ error })} value={value || ""} onChange={e => {
      const city = opts.find(c => c.name === e.target.value);
      onChange(e.target.value, city?.id || null);
    }}>
      <option value="">— اختر المدينة —</option>
      {opts.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
    </select>
  );
}

function DistrictSelect({ value, onChange, dynValues, error = false }) {
  const [opts, setOpts] = React.useState([]);
  const city = dynValues?.city || "";
  React.useEffect(() => {
    if (!city) { setOpts([]); return; }
    getDistrictsCache(city).then(data => setOpts((data || []).map(d => ({ id: d.id, name: d.name }))));
  }, [city]);
  return (
    <select style={{ ...AW.input({ error }), opacity: city ? 1 : 0.5, cursor: city ? "pointer" : "not-allowed" }} value={value || ""} onChange={e => {
      const d = opts.find(o => o.name === e.target.value);
      onChange(e.target.value, d?.id || null);
    }} disabled={!city}>
      <option value="">{city ? "— اختر الحي —" : "اختر المدينة أولاً"}</option>
      {opts.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
    </select>
  );
}

function VillageSelect({ value, onChange, dynValues, error = false }) {
  const [opts, setOpts] = React.useState([]);
  const districtId = dynValues?._districtId || null;
  React.useEffect(() => {
    if (!districtId) { setOpts([]); return; }
    getVillageNamesByDistrictId(districtId).then(data => setOpts(data || []));
  }, [districtId]);
  if (!opts.length) return null;
  return (
    <select style={{ ...AW.input({ error }), opacity: districtId ? 1 : 0.5, cursor: districtId ? "pointer" : "not-allowed" }} value={value || ""} onChange={e => onChange(e.target.value)} disabled={!districtId}>
      <option value="">— اختر القرية —</option>
      {opts.map(v => <option key={v} value={v}>{v}</option>)}
    </select>
  );
}

function LocationMap({ dynValues, onLatLng, currentLat, currentLng }) {
  const [open, setOpen] = React.useState(false);
  const [tempLat, setTempLat] = React.useState(currentLat || null);
  const [tempLng, setTempLng] = React.useState(currentLng || null);
  const [locLoading, setLocLoading] = React.useState(false);
  const mapRef = useRef(null);
  const mapInst = useRef(null);
  const markerRef = useRef(null);

  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const init = () => {
      if (cancelled || !mapRef.current || mapInst.current) return;
      const L = window.L;
      const cityCoords = CITY_COORDS[dynValues?.city] || [33.51, 36.29];
      const initCoords = tempLat && tempLng ? [tempLat, tempLng] : cityCoords;
      const initZoom = tempLat && tempLng ? 15 : dynValues?.village ? 15 : dynValues?.district ? 13 : 12;
      const map = L.map(mapRef.current, { zoomControl: true }).setView(initCoords, initZoom);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "" }).addTo(map);
      const marker = L.marker(initCoords, { draggable: true, opacity: tempLat ? 1 : 0.5 }).addTo(map);
      marker.on("dragend", e => { const p = e.target.getLatLng(); setTempLat(p.lat); setTempLng(p.lng); marker.setOpacity(1); });
      map.on("click", e => { marker.setLatLng(e.latlng); setTempLat(e.latlng.lat); setTempLng(e.latlng.lng); marker.setOpacity(1); });
      mapInst.current = map;
      markerRef.current = marker;
      setTimeout(() => map.invalidateSize(), 200);
      if (!tempLat && (dynValues?.district || dynValues?.village)) {
        const city = dynValues.city || "";
        const q = dynValues.village ? `${dynValues.village}, ${dynValues.district || ""}, ${city}, سوريا` : `${dynValues.district}, ${city}, سوريا`;
        fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`)
          .then(r => r.json())
          .then(data => {
            if (data?.[0] && mapInst.current) {
              const c = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
              mapInst.current.setView(c, dynValues.village ? 15 : 13, { animate: true });
              markerRef.current?.setLatLng(c).setOpacity(0.5);
            }
          }).catch(() => {});
      }
    };
    ensureLeafletLoaded({ addZFix: true }).then(() => { if (!cancelled) init(); });
    return () => {
      cancelled = true;
      if (mapInst.current) { mapInst.current.remove(); mapInst.current = null; markerRef.current = null; }
    };
  }, [open]);

  React.useEffect(() => {
    if (!open || !mapInst.current) return;
    const coords = CITY_COORDS[dynValues?.city];
    if (coords) {
      mapInst.current.setView(coords, 12, { animate: true });
      markerRef.current?.setLatLng(coords).setOpacity(0.5);
      setTempLat(null);
      setTempLng(null);
    }
  }, [dynValues?.city, open]);

  React.useEffect(() => {
    if (!open || !mapInst.current || !dynValues?.city) return;
    const q = dynValues.village
      ? `${dynValues.village}, ${dynValues.district || ""}, ${dynValues.city}, سوريا`
      : dynValues.district ? `${dynValues.district}, ${dynValues.city}, سوريا` : null;
    if (!q) return;
    fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`)
      .then(r => r.json())
      .then(data => {
        if (data?.[0] && mapInst.current) {
          const c = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
          mapInst.current.setView(c, dynValues.village ? 15 : 13, { animate: true });
          markerRef.current?.setLatLng(c).setOpacity(0.5);
          setTempLat(null);
          setTempLng(null);
        }
      }).catch(() => {});
  }, [dynValues?.district, dynValues?.village, open]);

  const handleGPS = () => {
    setLocLoading(true);
    navigator.geolocation?.getCurrentPosition(
      pos => {
        setTempLat(pos.coords.latitude);
        setTempLng(pos.coords.longitude);
        setLocLoading(false);
        if (mapInst.current && markerRef.current) {
          const c = [pos.coords.latitude, pos.coords.longitude];
          mapInst.current.setView(c, 16, { animate: true });
          markerRef.current.setLatLng(c).setOpacity(1);
        }
      },
      () => setLocLoading(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const confirm = async () => {
    if (tempLat && tempLng) {
      let extras = null;
      if (!dynValues?.city) {
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${tempLat}&lon=${tempLng}&format=json&accept-language=ar&zoom=10`);
          const data = await r.json();
          const addr = data?.address || {};
          const candidates = [addr.state, addr.region, addr.province, addr.county, addr.city, addr.town, addr.village].filter(Boolean);
          const cities = await getCities();
          const matched = (cities || [])
            .slice()
            .sort((a, b) => b.name.length - a.name.length)
            .find(c => candidates.some(cand => cand && (cand.includes(c.name) || c.name.includes(cand))));
          if (matched) extras = { city: matched.name, cityId: matched.id };
        } catch {}
      }
      onLatLng(tempLat, tempLng, extras);
    }
    setOpen(false);
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} style={AP.mapOpenButton}>
        <span style={S.font24}>📍</span>
        <div style={S.textRight}>
          <div style={AP.mapOpenTitle}>
            {currentLat ? `✅ تم التحديد (${Number(currentLat).toFixed(4)}, ${Number(currentLng).toFixed(4)})` : "تحديد الموقع على الخريطة"}
          </div>
          <div style={AP.mapOpenHint}>اضغط لتحديد الموقع بدقة</div>
        </div>
      </button>
      {open && createPortal(
        <div style={AP.mapOverlay}>
          <div style={AP.mapHeader}>
            <button type="button" onClick={() => setOpen(false)} style={AP.mapBackButton}>→</button>
            <span style={AP.mapHeaderTitle}>📍 تحديد الموقع</span>
            <button type="button" onClick={handleGPS} style={AP.mapGpsButton}>{locLoading ? "⏳" : "📡 موقعي"}</button>
          </div>
          <div style={AP.mapCanvasWrap}><div ref={mapRef} style={AP.mapCanvas} /></div>
          <div style={AP.mapFooter}>
            <button type="button" onClick={confirm} style={AP.mapConfirmButton(!!(tempLat && tempLng))}>
              {tempLat && tempLng ? "✅ حفظ الموقع" : "حدد موقعاً على الخريطة"}
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

function CollapsibleSection({ title, icon, children, defaultOpen = false, headerColor }) {
  const [open, setOpen] = React.useState(defaultOpen);
  const bg = headerColor || "#F8F6F1";
  const isColored = !!headerColor;
  return (
    <div style={AP.sectionWrap(headerColor)}>
      <button type="button" onClick={() => setOpen(p => !p)} style={AP.sectionHeader(open, bg)}>
        <div style={AP.sectionHeaderRow}>
          <span style={S.font16}>{icon}</span>
          <span style={AP.sectionHeaderTitle(isColored)}>{title}</span>
        </div>
        <span style={AP.sectionHeaderArrow(isColored)}>{open ? "▲" : "▼"}</span>
      </button>
      {open && <div style={AP.sectionBody}>{children}</div>}
    </div>
  );
}

function DynField({ field, value, onChange, dynValues = {}, setDynExternal, error = false }) {
  const v = value ?? "";
  const ui = field.ui || {};
  const ph = ui.placeholder || field.label;
  const s = AW.input({ error });
  const sx = {
    s1: { fontSize: 15 },
    s2: s => ({ ...s, minHeight: 100, resize: "vertical" }),
    s3: (s, ui) => ({ ...s, paddingLeft: ui.suffix ? 40 : s.padding })
  };

  if (field.field_key === "city") {
    return (
      <CitySelect value={v} error={error} onChange={(val, cityId) => {
        setDynExternal?.("__batch", { city: val, _cityId: cityId || null, district: "", _districtId: null, village: "", location_detail: "", lat: null, lng: null });
      }} />
    );
  }

  if (field.field_key === "village") return <VillageSelect value={v} onChange={onChange} dynValues={dynValues} error={error} />;
  if (field.field_key === "lng") return null;

  if (field.field_type === "map") {
    return (
      <LocationMap dynValues={dynValues} currentLat={dynValues.lat} currentLng={dynValues.lng}
        onLatLng={(lat, lng, extras) => {
          if (extras?.city) {
            setDynExternal?.("__batch", { lat, lng, city: extras.city, _cityId: extras.cityId || null });
          } else {
            setDynExternal?.("lat", lat);
            setDynExternal?.("lng", lng);
          }
        }} />
    );
  }

  if (field.field_key === "lat" || field.field_key === "lng") return null;

  if (field.field_key === "district") {
    return (
      <DistrictSelect value={v} onChange={(val, distId) => {
        setDynExternal?.("__batch", { district: val, _districtId: distId || null, village: "", location_detail: "", lat: null, lng: null });
      }} dynValues={dynValues} error={error} />
    );
  }

  if (field.field_key === "facing_dir") return <FacingPicker value={v} onChange={onChange} />;
  if (field.field_key === "light_score") return <LightPicker value={v} onChange={onChange} />;

  if (field.field_key === "messenger_id") {
    return (
      <input style={s} placeholder="facebook.com/username أو username" value={v}
        onChange={e => onChange(e.target.value)}
        onBlur={e => { const parsed = normalizeFacebookIdentifier(e.target.value); if (parsed.ok && parsed.value) onChange(parsed.value); }}
        dir="ltr" />
    );
  }

  if (field.field_type === "boolean" || BOOLEAN_FIELDS.has(field.field_key)) {
    return (
      <label style={AP.checkboxRow}>
        <input type="checkbox" checked={normalizeBooleanValue(v) === true} onChange={e => onChange(e.target.checked)} style={AP.checkboxInput} />
        <span style={sx.s1}>{field.label}</span>
      </label>
    );
  }

  if (ui.widget === "toggle" && field.options?.length) {
    return (
      <div style={AP.fieldToggleGrid(field.options.length)}>
        {field.options.map(opt => {
          const active = v === opt;
          const icon = ui.icons?.[opt] || "";
          const color = ui.colors?.[opt] || C.primary;
          const label = ui.labels?.[opt] || opt;
          const btnStyle = AW.iconChoiceButton({ active, color, bg: `${color}15`, border: color });
          return (
            <button key={opt} type="button" onClick={() => onChange(opt)} style={btnStyle}>
              {icon && <span style={S.font24}>{icon}</span>}
              <span style={AP.fieldToggleLabel(active, color)}>{label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  if (field.field_type === "select" && field.options?.length && field.field_key !== "category") {
    return (
      <select style={s} value={v} onChange={e => onChange(e.target.value)}>
        <option value="">{ph}</option>
        {field.options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }

  if (field.field_type === "textarea") {
    return <textarea style={sx.s2(s)} placeholder={ph} value={v} onChange={e => onChange(e.target.value)} />;
  }

  if (DIGITS_ONLY_TEXT_FIELDS.has(field.field_key)) {
    return <input style={s} type="tel" inputMode="numeric" pattern="[0-9]*" dir="ltr" placeholder={ph} value={v} onChange={e => onChange(onlyDigits(e.target.value))} />;
  }

  if (FORCE_NUMBER_FIELDS.has(field.field_key) || FORCE_INTEGER_FIELDS.has(field.field_key) || field.field_type === "number" || field.field_type === "integer") {
    const isInteger = FORCE_INTEGER_FIELDS.has(field.field_key) || field.field_type === "integer";
    const inp = (
      <input style={sx.s3(s, ui)} type="number" inputMode={isInteger ? "numeric" : "decimal"} step={isInteger ? "1" : "any"}
        min={ui.min ?? 0} max={ui.max ?? undefined} placeholder={ph} value={v} onChange={e => onChange(e.target.value)} />
    );
    if (!ui.suffix) return inp;
    return <div style={AP.textareaWrap}>{inp}<span style={AP.suffix}>{ui.suffix}</span></div>;
  }

  return <input style={s} placeholder={ph} value={v} onChange={e => onChange(e.target.value)} />;
}

function AddPage({ user, onPublished }) {
  const navigate = useNavigate();
  const [dynValues, setDynValues] = useState({});
  const [currentUserId, setCurrentUserId] = useState(null);
  const [hasDraft, setHasDraft] = useState(false);
  const [propTypes, setPropTypes] = useState([]);
  const [propFields, setPropFields] = useState([]);
  const [images, setImages] = useState([]);
  const [videoFile, setVideoFile] = useState(null);
  const videoInputRef = React.useRef(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [maxVideoMb, setMaxVideoMb] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [geoCoords, setGeoCoords] = useState({ districts: {}, villages: {} });
  const [triedSubmit, setTriedSubmit] = useState(false);
  const listingTypeStyle = getListingTypeStyle(dynValues.type || "sell");

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/");
  };

  const sx = {
    hidden: { display: "none" },
    progressFill: (uploadProgress) => ({
      height: "100%", background: listingTypeStyle.color, width: `${uploadProgress}%`,
      transition: "width 0.4s ease", boxShadow: `0 0 8px ${listingTypeStyle.color}99`
    }),
    submitWrap: { ...AP.stickyFooterWrap }
  };

  React.useEffect(() => {
    let alive = true;
    const hydrate = async uid => {
      if (!uid || !alive) return;
      let draft = {};
      try { const saved = localStorage.getItem(`addpage_draft:${uid}`); if (saved) draft = JSON.parse(saved) || {}; } catch { draft = {}; }
      const hasSavedDraft = Object.keys(draft || {}).length > 0;
      let profile = null;
      try { profile = await fetchProfile(uid); } catch { profile = null; }
      if (!alive) return;
      // setCurrentUserId AFTER setDynValues so the save-effect doesn't fire
      // with an empty/partial state before the draft is merged, which would
      // overwrite the stored draft in localStorage.
      setDynValues(prev => {
        const base = hasSavedDraft ? { ...prev, ...draft } : prev;
        return mergeProfileContactDefaults(base, profile);
      });
      setCurrentUserId(uid);
      setHasDraft(hasSavedDraft);
    };
    const uid = user?.id || null;
    if (uid) hydrate(uid);
    else getCurrentAuthUser().then(authUser => { if (authUser?.id) hydrate(authUser.id); });
    return () => { alive = false; };
  }, [user?.id]);

  const clearLocation = () => setDynValues(p => ({ ...p, district: "", _districtId: null, village: "", location_detail: "", lat: null, lng: null }));

  React.useEffect(() => {
    if (!currentUserId) return;
    try { localStorage.setItem(`addpage_draft:${currentUserId}`, JSON.stringify(dynValues)); } catch {}
  }, [dynValues, currentUserId]);

  const setDyn = (key, val) => {
    if (key === "__batch") setDynValues(p => ({ ...p, ...val }));
    else setDynValues(p => ({ ...p, [key]: val }));
  };

  useEffect(() => {
    setDynValues(p => ({ ...p, type: p.type || "sell", category: p.category || propTypes[0]?.name || "" }));
  }, [propTypes]);

  const category = dynValues.category || "";

  useEffect(() => {
    fetchAppSetting("max_video_size_mb").then(value => { if (value != null) setMaxVideoMb(parseInt(value, 10) || 50); });
    fetchPropertyTypes("id,name,icon").then(data => { if (data?.length) setPropTypes(data); });
    fetchPropertyFields("*").then(data => {
      if (data?.length) {
        setPropFields(data);
        const defaults = {};
        data.forEach(f => { if (f.ui?.default !== undefined) defaults[f.field_key] = f.ui.default; });
        if (Object.keys(defaults).length) setDynValues(p => ({ ...defaults, ...p }));
      }
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    getAllGeoCoords()
      .then(data => { if (!cancelled) setGeoCoords(data || { districts: {}, villages: {} }); })
      .catch(() => { if (!cancelled) setGeoCoords({ districts: {}, villages: {} }); });
    return () => { cancelled = true; };
  }, []);

  const currentFields = useMemo(() => {
    const typeObj = propTypes.find(t => t.name === category);
    if (!typeObj) return [];
    return propFields.filter(f => f.type_id === typeObj.id && f.field_key !== "category" && f.field_key !== "type" && !IGNORED_ADD_FIELDS.has(f.field_key));
  }, [propTypes, propFields, category]);

  const sections = useMemo(() => {
    const map = {};
    currentFields.forEach(f => { const sec = f.section || "تفاصيل"; if (!map[sec]) map[sec] = []; map[sec].push(f); });
    return Object.entries(map);
  }, [currentFields]);

  const onSelectVideo = e => {
    const file = e.target.files?.[0];
    if (videoInputRef.current) videoInputRef.current.value = "";
    if (!file) return;
    const sizeMb = file.size / 1024 / 1024;
    if (sizeMb > maxVideoMb) {
      setError(`حجم الفيديو (${sizeMb.toFixed(1)}MB) يتجاوز الحد المسموح (${maxVideoMb}MB)`);
      setSuccessMessage("");
      return;
    }
    setVideoFile(file);
    setError("");
    setSuccessMessage("");
  };

  const onSelectImages = e => {
    const files = Array.from(e.target.files || []).filter(f => f.type.startsWith("image/"));
    setImages(files.slice(0, 10));
  };

  const goToMyListingsAfterReviewMessage = message => {
    setError("");
    setSuccessMessage(message);
    setLoading(false);
    window.setTimeout(() => { navigate("/my-listings", { replace: true, state: { message } }); }, 1400);
  };

  const handleSubmit = async e => {
    e?.preventDefault?.();
    if (loading) return;
    setError("");
    setSuccessMessage("");
    setLoading(true);
    setTriedSubmit(true);

    if (!dynValues.title || String(dynValues.title).trim() === "") {
      setError("⚠️ الرجاء إدخال عنوان الإعلان");
      setLoading(false);
      return;
    }

    if (!dynValues.city || String(dynValues.city).trim() === "") {
      setError("⚠️ الرجاء اختيار المدينة");
      setLoading(false);
      return;
    }

    try {
      const authUser = await getCurrentAuthUser();
      if (!authUser) throw new Error("يجب تسجيل الدخول أولاً");

      const parsedMessenger = normalizeFacebookIdentifier(dynValues.messenger_id);
      if (!parsedMessenger.ok) throw new Error(parsedMessenger.error);

      const INTERNAL = new Set(["_cityId","_districtId"]);
      const cols = FIXED_COLUMNS;
      const NUMBER_FIELDS = new Set(["lat","lng","map_lat","map_lng","price","total_area","net_area","land_area","build_area","facade","ceil_height","beach_dist"]);
      const INT_FIELDS = new Set(["rooms","baths","floor","total_floors","total_units","balconies","building_age","light_score","salle","beds"]);

      const cleanDyn = Object.fromEntries(
        Object.entries(dynValues)
          .map(([k, v]) => {
            const field = currentFields.find(f => f.field_key === k);
            if (v === "" || v === null || v === undefined) return [k, null];
            if (DIGITS_ONLY_TEXT_FIELDS.has(k)) { const digits = onlyDigits(v); return [k, digits || null]; }
            if (BOOLEAN_FIELDS.has(k) || field?.field_type === "boolean") return [k, normalizeBooleanValue(v)];
            if (field?.field_type === "map") return [k, null];
            if (NUMBER_FIELDS.has(k) || FORCE_NUMBER_FIELDS.has(k) || field?.field_type === "number") return [k, toNumberOrNull(v)];
            if (INT_FIELDS.has(k) || FORCE_INTEGER_FIELDS.has(k) || field?.field_type === "integer") return [k, toIntegerOrNull(v)];
            return [k, v];
          })
          .filter(([, v]) => v !== null)
      );

      if (parsedMessenger.value) cleanDyn.messenger_id = parsedMessenger.value;
      else delete cleanDyn.messenger_id;

      // أرقام الهاتف هي نفسها أرقام الواتساب، لذلك لا نرسل حقول whatsapp إطلاقًا.
      delete cleanDyn.whatsapp;
      delete cleanDyn.whatsapp2;

      if (dynValues.lat !== null && dynValues.lat !== undefined && dynValues.lat !== "") cleanDyn.lat = Number(dynValues.lat);
      if (dynValues.lng !== null && dynValues.lng !== undefined && dynValues.lng !== "") cleanDyn.lng = Number(dynValues.lng);

      const fixedDyn = Object.fromEntries(Object.entries(cleanDyn).filter(([k]) => cols.has(k) && !INTERNAL.has(k)));
      const extraFields = Object.fromEntries(Object.entries(cleanDyn).filter(([k]) => !cols.has(k) && !INTERNAL.has(k)));

      const mapLocation = resolveMapLocation({
        lat: cleanDyn.lat, lng: cleanDyn.lng,
        city: dynValues.city, district: dynValues.district, village: dynValues.village,
        geoCoords
      });

      const payload = {
        user_id: authUser.id,
        title: dynValues.title || "",
        type: dynValues.type || "sell",
        category: dynValues.category || "",
        city: dynValues.city || "",
        phone: onlyDigits(dynValues.phone || ""),
        ...fixedDyn,
        ...mapLocation,
        extra_fields: Object.keys(extraFields).length ? extraFields : null
      };

      // حماية نهائية: لا ترسل whatsapp إلى جدول listings لأنه Boolean في قاعدة البيانات.
      delete payload.whatsapp;
      delete payload.whatsapp2;

      const listing = await listingService.createListing(payload, { status: "draft" });
      if (!listing?.id) throw new Error("تعذر إنشاء الإعلان");

      const imageRows = [];
      let uploadFailed = false;
      setUploadProgress(0);

      for (let i = 0; i < images.length; i++) {
        setUploadProgress(Math.round((i / images.length) * 80));
        try {
          const original = images[i];
          let compressed = await compressImage(original).catch(() => null);
          const useOriginal = !compressed || compressed.size >= original.size;
          const finalFile = useOriginal ? original : compressed;
          const safeExts = ["jpg","jpeg","png","webp","gif","bmp","heic","heif"];
          const origExt = (original.name.split(".").pop() || "jpg").toLowerCase();
          const ext = useOriginal ? (safeExts.includes(origExt) ? origExt : "jpg") : "jpg";
          const ct = useOriginal ? original.type || "image/jpeg" : "image/jpeg";
          const path = `${authUser.id}/${listing.id}-${Date.now()}-${i}.${ext}`;
          const publicUrl = await uploadToListingImages(path, finalFile, { upsert: true, contentType: ct });
          imageRows.push({ listing_id: listing.id, url: publicUrl, is_main: i === 0 });
        } catch { uploadFailed = true; }
      }

      setUploadProgress(images.length > 0 ? 80 : 0);

      if (images.length > 0 && imageRows.length === 0) {
        await listingService.deleteListing(listing.id);
        throw new Error("فشل رفع الصور — تم حذف الإعلان");
      }

      if (imageRows.length) await listingService.attachImages(listing.id, imageRows);

      if (videoFile && listing?.id) {
        try {
          setUploadProgress(82);
          const ext = (videoFile.name.split(".").pop() || "mp4").toLowerCase();
          const safeExt = ["mp4","mov","webm","m4v"].includes(ext) ? ext : "mp4";
          const rnd = Math.random().toString(36).slice(2, 7);
          const vPath = `videos/${authUser.id}/${listing.id}-${Date.now()}-${rnd}.${safeExt}`;
          const vType = videoFile.type || "video/mp4";
          const accessToken = await getAccessToken();
          let videoUrl = null;
          try { videoUrl = await uploadListingFileWithFallback(vPath, videoFile, { contentType: vType, cacheControl: "3600", accessToken }); } catch {}
          if (!videoUrl && accessToken) {
            const retryPath = `videos/${authUser.id}/${listing.id}-retry-${Date.now()}.${safeExt}`;
            videoUrl = await uploadListingFileWithFallback(retryPath, videoFile, { contentType: vType, cacheControl: "3600", accessToken });
          }
          if (videoUrl) await listingService.attachVideo(listing.id, videoUrl);
          setUploadProgress(100);
          setVideoFile(null);
        } catch (ve) {
          alert(`⚠️ فشل رفع الفيديو\n${ve.message}\n\nتم نشر الإعلان بدون فيديو — يمكنك تعديله لاحقاً.`);
        }
      }

      try { if (authUser?.id) localStorage.removeItem(`addpage_draft:${authUser.id}`); } catch {}

      await listingService.activateListing(listing.id);
      onPublished?.();

      if (uploadFailed) { goToMyListingsAfterReviewMessage(REVIEW_MESSAGE_WITH_IMAGE_WARNING); return; }
      goToMyListingsAfterReviewMessage(REVIEW_MESSAGE);
      return;
    } catch (err) {
      console.error(err);
      const msg = err?.message || "حدث خطأ أثناء نشر الإعلان";
      alert("❌ " + msg);
      setSuccessMessage("");
      setError(msg);
    } finally {
      setLoading(false);
      setTimeout(() => setUploadProgress(0), 1500);
    }
  };

  return (
    <div style={AP.pageRoot} dir="rtl">
      <div style={S.primaryHero(listingTypeStyle.color)}>
        <IslamicPattern opacity={0.1} color="#FFFFFF" width={430} height={200} />
        <div style={S.relZ1}>
          <div style={AP.heroTopRow}>
            <button type="button" onClick={handleBack} style={AP.heroBackButton} aria-label="رجوع">←</button>
            <span style={AP.heroTitle}>🏠 إضافة إعلان</span>
            <div style={AP.heroSpacer} />
          </div>
          <div style={AP.heroMetaRow}>
            <div style={AP.heroMetaText}>أضف تفاصيل عقارك</div>
            {hasDraft && (
              <button type="button" onClick={() => {
                // Re-apply propFields defaults and propTypes defaults instead of wiping to {}
                const fieldDefaults = {};
                propFields.forEach(f => { if (f.ui?.default !== undefined) fieldDefaults[f.field_key] = f.ui.default; });
                const firstCategory = propTypes[0]?.name || "";
                setDynValues({ ...fieldDefaults, type: "sell", category: firstCategory });
                setSuccessMessage("");
                setError("");
                setHasDraft(false);
                try { const uid = currentUserId || user?.id; if (uid) localStorage.removeItem(`addpage_draft:${uid}`); } catch {}
              }} style={AP.clearDraftButton}>🗑 مسح المسودة</button>
            )}
          </div>
        </div>
        <Wave />
      </div>

      <div style={AP.pageInner}>
        <form id="add-listing-form" onSubmit={handleSubmit} style={AP.formGrid}>
          <div style={AP.typeGrid}>
            {["sell", "rent"].map(v => {
              const typeStyle = getListingTypeStyle(v);
              const active = dynValues.type === v;
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => setDyn("type", v)}
                  style={AW.iconChoiceButton({ active, color: typeStyle.color, bg: typeStyle.bg, border: typeStyle.border })}
                >
                  <span style={S.font24}>{typeStyle.icon}</span>
                  <span style={AP.typeLabel(active, typeStyle.color)}>{typeStyle.label}</span>
                </button>
              );
            })}
          </div>

          <div style={AP.categoryGrid}>
            {propTypes.map(t => {
              const active = category === t.name;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setDynValues(p => ({ ...p, category: t.name }))}
                  style={AW.compactButton({ active, color: listingTypeStyle.color, bg: listingTypeStyle.bg, border: listingTypeStyle.border })}
                >
                  <span style={S.font22}>{t.icon || "🏠"}</span>
                  <span style={AP.categoryLabel(active, listingTypeStyle.color)}>{t.name}</span>
                </button>
              );
            })}
          </div>

          {sections.map(([secName, fields]) => {
            const secIcon = fields[0]?.section_icon || "📋";
            const defOpen = fields.some(f => f.ui?.defaultOpen === true);
            const headerColor = listingTypeStyle.color;
            return (
              <CollapsibleSection key={secName} title={secName} icon={secIcon} defaultOpen={defOpen} headerColor={headerColor}>
                <div style={AP.fieldsGrid}>
                  {fields.filter(f => f.field_key !== "lng").map(f => {
                    const isRequired = REQUIRED_FIELDS.has(f.field_key);
                    const hasError = isRequired && triedSubmit && (!dynValues[f.field_key] || String(dynValues[f.field_key]).trim() === "");
                    return (
                      <div key={f.field_key} style={AP.fieldColumn(f)}>
                        {!["map","boolean"].includes(f.field_type) && f.ui?.widget !== "toggle" && (
                          <div style={AW.label()}>
                            {f.label}
                            {isRequired && <span style={{ color: "#DC2626", marginRight: 4, fontWeight: 800 }}>*</span>}
                          </div>
                        )}
                        <DynField
                          field={f}
                          value={dynValues[f.field_key]}
                          onChange={val => setDyn(f.field_key, val)}
                          dynValues={dynValues}
                          setDynExternal={setDyn}
                          error={hasError}
                        />
                      </div>
                    );
                  })}
                </div>
              </CollapsibleSection>
            );
          })}

          <label style={{ ...AW.input(), display: "block", cursor: "pointer", textAlign: "center", color: C.text2 }}>
            📸 اختر الصور
            <input type="file" accept="image/*" multiple onChange={onSelectImages} style={sx.hidden} />
          </label>

          {images.length > 0 && <div style={AP.uploadCount}>{images.length} صورة مختارة</div>}

          <label style={{ ...AW.input(), display: "block", cursor: "pointer", textAlign: "center", color: C.text2, borderStyle: videoFile ? "solid" : "dashed", borderColor: videoFile ? listingTypeStyle.color : C.border }}>
            {videoFile ? (
              <div style={AP.videoRow}>
                <span style={AP.videoName}>🎬 {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(1)}MB)</span>
                <button type="button" onClick={e => { e.preventDefault(); setVideoFile(null); }} style={AP.videoRemove}>✕</button>
              </div>
            ) : (
              <span>🎬 إضافة فيديو (اختياري — حتى {maxVideoMb}MB)</span>
            )}
            <input ref={videoInputRef} type="file" accept="video/*" onChange={onSelectVideo} style={S.hidden} />
          </label>

          {successMessage && <div style={AP.successBox}>{successMessage}</div>}
          {error && <div style={AP.errorBox}>{error}</div>}

          {loading && uploadProgress > 0 && (
            <div style={AP.uploadProgressWrap}>
              <div style={AP.uploadProgressTrack}>
                <div style={sx.progressFill(uploadProgress)} />
              </div>
            </div>
          )}

          <div style={sx.submitWrap}>
            <button type="submit" disabled={loading} style={AW.submitButton({ loading, color: listingTypeStyle.color })}>
              {loading ? "جارٍ النشر..." : "نشر الإعلان"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddPage;
