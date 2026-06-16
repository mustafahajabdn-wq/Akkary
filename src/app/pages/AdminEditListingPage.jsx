import React, { useState, useEffect } from "react";
import { Navigate, useParams, useNavigate } from "react-router-dom";
import { C } from "../../shared/constants/colors.js";
import { BackButton } from "../../shared/components/common/BackButton.jsx";
import { IslamicPattern, Wave } from "../../shared/components/icons.jsx";
import { S } from "../../shared/styles/primitives.js";
import { getSupabase } from "../../shared/services/supabaseClient.js";
import { fetchListingRow } from "../services/listingService.js";
import { getCurrentAuthUser } from "../services/authService.js";
import { fetchProfile } from "../services/profileService.js";

// ── تعريف كل أعمدة جدول listings مع نوع كل عمود ──
// type: text | number | integer | boolean | jsonb | date | datetime
const COLUMNS = [
  { key: "id", type: "integer", readonly: true },
  { key: "user_id", type: "text", readonly: true },
  { key: "title", type: "text" },
  { key: "description", type: "text", multiline: true },
  { key: "price", type: "number" },
  { key: "currency", type: "text" },
  { key: "type", type: "text" },
  { key: "category", type: "text" },
  { key: "city", type: "text" },
  { key: "district", type: "text" },
  { key: "baths", type: "integer" },
  { key: "ownership", type: "text" },
  { key: "phone", type: "text" },
  { key: "whatsapp", type: "boolean" },
  { key: "lat", type: "number" },
  { key: "lng", type: "number" },
  { key: "views", type: "integer", readonly: true },
  { key: "status", type: "text" },
  { key: "created_at", type: "datetime", readonly: true },
  { key: "qa_enabled", type: "boolean" },
  { key: "net_area", type: "number" },
  { key: "floor", type: "integer" },
  { key: "total_floors", type: "integer" },
  { key: "building_age", type: "text" },
  { key: "kitchen", type: "text" },
  { key: "elevator", type: "text" },
  { key: "parking", type: "text" },
  { key: "condition", type: "text" },
  { key: "compound", type: "boolean" },
  { key: "furnished", type: "text" },
  { key: "finishing", type: "text" },
  { key: "solar", type: "boolean" },
  { key: "light_score", type: "integer" },
  { key: "pool", type: "boolean" },
  { key: "ceil_height", type: "number" },
  { key: "truck_access", type: "boolean" },
  { key: "land_area", type: "number" },
  { key: "build_area", type: "number" },
  { key: "total_units", type: "integer" },
  { key: "rooms", type: "integer" },
  { key: "soil_type", type: "text" },
  { key: "total_area", type: "number" },
  { key: "facade", type: "number" },
  { key: "shop_location", type: "text" },
  { key: "facing_dir", type: "text" },
  { key: "zone_class", type: "text" },
  { key: "water_source", type: "text" },
  { key: "balconies", type: "integer" },
  { key: "occupancy", type: "text" },
  { key: "location_detail", type: "text", multiline: true },
  { key: "phone2", type: "text" },
  { key: "video_url", type: "text" },
  { key: "extra_fields", type: "jsonb", multiline: true },
  { key: "village", type: "text" },
  { key: "sort_order", type: "integer" },
  { key: "expires_at", type: "date" },
  { key: "whatsapp_clicks", type: "integer", readonly: true },
  { key: "phone_clicks", type: "integer", readonly: true },
  { key: "admin_status", type: "text" },
  { key: "rejection_reason", type: "text", multiline: true },
  { key: "external_url", type: "text" },
  { key: "content_hash", type: "text", readonly: true },
  { key: "messenger_id", type: "text" },
  { key: "content_flag", type: "text" },
  { key: "content_score", type: "integer" },
  { key: "gender", type: "text" },
  { key: "heating", type: "text" },
  { key: "beach_dist", type: "text" },
  { key: "area", type: "integer" },
  { key: "warehouse_cold", type: "text" },
  { key: "warehouse_mezzanine", type: "text" },
  { key: "warehouse_office", type: "text" },
  { key: "warehouse_split", type: "text" },
  { key: "warehouse_type", type: "text" },
  { key: "beds", type: "integer" },
  { key: "salle", type: "integer" },
  { key: "map_lat", type: "number" },
  { key: "map_lng", type: "number" },
  { key: "location_accuracy", type: "text" },
  { key: "geo_source", type: "text" },
];

const SECTIONS = [
  {
    title: "🏷️ المعلومات الأساسية",
    keys: ["id", "user_id", "title", "description", "price", "currency", "type", "category", "status", "admin_status", "rejection_reason"],
  },
  {
    title: "📍 الموقع",
    keys: ["city", "district", "village", "location_detail", "lat", "lng", "map_lat", "map_lng", "location_accuracy", "geo_source", "facing_dir", "zone_class", "beach_dist"],
  },
  {
    title: "📐 المساحات والأبعاد",
    keys: ["net_area", "total_area", "land_area", "build_area", "area", "facade", "ceil_height"],
  },
  {
    title: "🏠 تفاصيل العقار",
    keys: ["rooms", "salle", "beds", "baths", "balconies", "floor", "total_floors", "total_units", "building_age", "ownership", "occupancy", "condition", "finishing", "furnished"],
  },
  {
    title: "🔧 المرافق والخدمات",
    keys: ["kitchen", "elevator", "parking", "heating", "compound", "solar", "pool", "light_score", "truck_access", "soil_type", "water_source", "shop_location"],
  },
  {
    title: "🏬 حقول المستودعات",
    keys: ["warehouse_type", "warehouse_cold", "warehouse_mezzanine", "warehouse_office", "warehouse_split"],
  },
  {
    title: "📞 التواصل",
    keys: ["phone", "phone2", "whatsapp", "messenger_id", "gender"],
  },
  {
    title: "📊 الإحصائيات",
    keys: ["views", "whatsapp_clicks", "phone_clicks", "content_score", "content_flag", "content_hash"],
  },
  {
    title: "⚙️ إعدادات أخرى",
    keys: ["qa_enabled", "sort_order", "expires_at", "created_at", "video_url", "external_url"],
  },
  {
    title: "🧩 حقول إضافية (JSON)",
    keys: ["extra_fields"],
  },
];

function getColumn(key) {
  return COLUMNS.find(c => c.key === key) || { key, type: "text" };
}

function formatForInput(value, type) {
  if (value === null || value === undefined) return "";
  if (type === "jsonb") {
    try {
      return typeof value === "string" ? value : JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }
  if (type === "datetime") {
    return String(value);
  }
  if (type === "date") {
    return String(value).slice(0, 10);
  }
  return String(value);
}

function parseForSave(value, type) {
  if (value === "" || value === null || value === undefined) return null;
  if (type === "number") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  if (type === "integer") {
    const n = parseInt(value, 10);
    return Number.isFinite(n) ? n : null;
  }
  if (type === "boolean") {
    return value === true || value === "true";
  }
  if (type === "jsonb") {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  return value;
}

function FieldInput({ col, value, onChange, DC }) {
  const sx = {
    input: {
      width: "100%",
      padding: "9px 11px",
      borderRadius: 10,
      border: "1.5px solid #E0DBD0",
      fontSize: 13,
      fontFamily: "Tajawal, sans-serif",
      background: col.readonly ? "#F3F1EB" : "#fff",
      color: col.readonly ? "#9A9A9A" : "#1A1A1A",
      outline: "none",
      boxSizing: "border-box",
      direction: "ltr",
      textAlign: "right",
    },
  };

  if (col.type === "boolean") {
    return (
      <select
        style={{ ...sx.input, appearance: "none", WebkitAppearance: "none" }}
        value={value === true ? "true" : value === false ? "false" : ""}
        onChange={e => onChange(e.target.value === "" ? null : e.target.value === "true")}
        disabled={col.readonly}
      >
        <option value="">—</option>
        <option value="true">نعم (true)</option>
        <option value="false">لا (false)</option>
      </select>
    );
  }

  if (col.multiline || col.type === "jsonb") {
    return (
      <textarea
        style={{ ...sx.input, minHeight: col.type === "jsonb" ? 110 : 70, resize: "vertical", lineHeight: 1.6, fontFamily: col.type === "jsonb" ? "monospace" : "Tajawal, sans-serif" }}
        value={value ?? ""}
        onChange={e => onChange(e.target.value)}
        readOnly={col.readonly}
        dir={col.type === "jsonb" ? "ltr" : "rtl"}
      />
    );
  }

  return (
    <input
      style={sx.input}
      type={col.type === "number" || col.type === "integer" ? "number" : col.type === "date" ? "date" : "text"}
      value={value ?? ""}
      onChange={e => onChange(e.target.value)}
      readOnly={col.readonly}
      step={col.type === "number" ? "any" : undefined}
    />
  );
}

export default function AdminEditListingPage({ DC: DCProp }) {
  const DC = DCProp || C;
  const { id } = useParams();
  const navigate = useNavigate();

  const [original, setOriginal] = useState(null);
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const authUser = await getCurrentAuthUser().catch(() => null);
      if (!alive) return;
      if (!authUser?.id) {
        setIsAuthorized(false);
        setAuthChecked(true);
        return;
      }
      const profile = await fetchProfile(authUser.id).catch(() => null);
      if (!alive) return;
      setIsAuthorized(["admin", "support"].includes(profile?.role));
      setAuthChecked(true);
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const row = await fetchListingRow(id);
      if (!alive) return;
      setOriginal(row);
      const initial = {};
      COLUMNS.forEach(col => {
        initial[col.key] = formatForInput(row?.[col.key], col.type);
      });
      setValues(initial);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [id]);

  if (authChecked && !isAuthorized) {
    return <Navigate to="/" replace />;
  }

  const setField = (key, val) => {
    setValues(p => ({ ...p, [key]: val }));
    setSavedMsg("");
  };

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg("");
    setSavedMsg("");

    const updates = {};
    COLUMNS.forEach(col => {
      if (col.readonly) return;
      updates[col.key] = parseForSave(values[col.key], col.type);
    });

    try {
      const sb = getSupabase();
      const { error } = await sb.from("listings").update(updates).eq("id", id);
      if (error) throw error;
      setSavedMsg("✅ تم حفظ التعديلات بنجاح");
    } catch (e) {
      setErrorMsg("❌ فشل الحفظ: " + (e?.message || "خطأ غير معروف"));
    } finally {
      setSaving(false);
    }
  };

  const sx = {
    page: { minHeight: "100vh", background: DC.bg, paddingBottom: 100, direction: "rtl" },
    hero: { background: C.primary, padding: "44px 16px 50px", position: "relative", overflow: "hidden" },
    title: { position: "relative", zIndex: 1, color: "#fff", fontSize: 20, fontWeight: 950, marginTop: 16 },
    subtitle: { position: "relative", zIndex: 1, color: "rgba(255,255,255,.75)", fontSize: 12, marginTop: 4 },
    body: { padding: "0 14px", marginTop: -28, position: "relative", zIndex: 2 },
    section: {
      background: "#fff",
      borderRadius: 18,
      padding: "16px 14px",
      marginBottom: 12,
      border: "1px solid #E0DBD0",
      boxShadow: "0 6px 18px rgba(0,0,0,0.05)",
    },
    sectionTitle: { fontSize: 13, fontWeight: 900, color: C.primary, marginBottom: 12 },
    fieldRow: { marginBottom: 10 },
    fieldLabel: { fontSize: 11, fontWeight: 800, color: "#5A5A5A", marginBottom: 4, display: "flex", justifyContent: "space-between" },
    readonlyTag: { fontSize: 10, color: "#C8952A", fontWeight: 800 },
    saveBar: {
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 999,
      background: "#fff", borderTop: "1px solid #E0DBD0",
      padding: "12px 14px", display: "flex", gap: 10, alignItems: "center",
      boxShadow: "0 -6px 20px rgba(0,0,0,0.06)",
    },
    saveBtn: {
      flex: 1, padding: "13px 0", borderRadius: 14, border: "none",
      background: C.primary, color: "#fff", fontSize: 15, fontWeight: 900,
      fontFamily: "Tajawal, sans-serif", cursor: "pointer",
    },
    msg: { fontSize: 12, fontWeight: 800, textAlign: "center", flex: 1 },
  };

  if (loading) {
    return (
      <div style={sx.page}>
        <div style={sx.hero}>
          <IslamicPattern opacity={0.1} color="#FFFFFF" />
          <div style={S.absTopRight14}>
            <BackButton onPress={() => navigate(-1)} />
          </div>
          <div style={sx.title}>تعديل الإعلان</div>
          <Wave />
        </div>
        <div style={{ textAlign: "center", padding: 40, color: DC.text3 }}>جارٍ التحميل...</div>
      </div>
    );
  }

  if (!original) {
    return (
      <div style={sx.page}>
        <div style={sx.hero}>
          <IslamicPattern opacity={0.1} color="#FFFFFF" />
          <div style={S.absTopRight14}>
            <BackButton onPress={() => navigate(-1)} />
          </div>
          <div style={sx.title}>الإعلان غير موجود</div>
          <Wave />
        </div>
      </div>
    );
  }

  return (
    <div style={sx.page}>
      <div style={sx.hero}>
        <IslamicPattern opacity={0.1} color="#FFFFFF" />
        <div style={S.absTopRight14}>
          <BackButton onPress={() => navigate(-1)} />
        </div>
        <div style={sx.title}>تعديل الإعلان #{id}</div>
        <div style={sx.subtitle}>{original?.title || "بدون عنوان"}</div>
        <Wave />
      </div>

      <div style={sx.body}>
        {SECTIONS.map(section => (
          <div key={section.title} style={sx.section}>
            <div style={sx.sectionTitle}>{section.title}</div>
            {section.keys.map(key => {
              const col = getColumn(key);
              return (
                <div key={key} style={sx.fieldRow}>
                  <div style={sx.fieldLabel}>
                    <span>{key}</span>
                    {col.readonly && <span style={sx.readonlyTag}>للقراءة فقط</span>}
                  </div>
                  <FieldInput
                    col={col}
                    value={values[key]}
                    onChange={v => setField(key, v)}
                    DC={DC}
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div style={sx.saveBar}>
        {savedMsg && <div style={{ ...sx.msg, color: "#16A34A" }}>{savedMsg}</div>}
        {errorMsg && <div style={{ ...sx.msg, color: "#DC2626" }}>{errorMsg}</div>}
        {!savedMsg && !errorMsg && (
          <button type="button" style={sx.saveBtn} onClick={handleSave} disabled={saving}>
            {saving ? "جارٍ الحفظ..." : "💾 حفظ كل التعديلات"}
          </button>
        )}
        {(savedMsg || errorMsg) && (
          <button type="button" style={{ ...sx.saveBtn, flex: "0 0 100px" }} onClick={handleSave} disabled={saving}>
            حفظ
          </button>
        )}
      </div>
    </div>
  );
}
