import React, { useState, useEffect } from "react";
import { C } from "../../shared/constants/colors.js";
import { IslamicPattern, Wave } from "../../shared/components/icons.jsx";
import { S } from "../../shared/styles/primitives.js";
import { fetchAppSettings } from "../services/configService.js";

// ── رقم واتساب الافتراضي — يُحمَّل من إعدادات التطبيق ──
const FALLBACK_WA = "963000000000";

const TYPES   = ["شقة", "منزل", "أرض", "محل تجاري", "مكتب", "مستودع", "فيلا", "استوديو", "غرفة", "عقار آخر"];
const OFFERS  = ["للبيع", "للإيجار", "مطلوب شراء", "مطلوب إيجار"];
const CITIES  = ["دمشق", "حلب", "حمص", "حماة", "اللاذقية", "طرطوس", "دير الزور", "الرقة", "إدلب", "السويداء", "درعا", "القنيطرة", "ريف دمشق"];

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: C.primary, marginBottom: 6, paddingRight: 2 }}>
        {label}
      </div>
      {children}
    </div>
  );
}

const inputSx = {
  width: "100%",
  padding: "11px 13px",
  borderRadius: 12,
  border: "1.5px solid #E0DBD0",
  fontSize: 14,
  fontFamily: "Tajawal, sans-serif",
  background: "#fff",
  color: "#1A1A1A",
  outline: "none",
  boxSizing: "border-box",
  direction: "rtl",
};

function ChipGroup({ options, value, onChange }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
      {options.map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          style={{
            padding: "7px 14px",
            borderRadius: 20,
            border: value === opt ? "none" : "1.5px solid #E0DBD0",
            background: value === opt ? C.primary : "#fff",
            color: value === opt ? "#fff" : C.text2,
            fontSize: 13,
            fontWeight: value === opt ? 800 : 500,
            fontFamily: "Tajawal, sans-serif",
            cursor: "pointer",
            transition: "all 0.15s",
          }}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function AddViaWhatsAppPage({ setPage, DC }) {
  DC = DC || C;

  const [waNumber, setWaNumber] = useState(FALLBACK_WA);
  const [form, setForm] = useState({
    offer: "للبيع",
    type: "شقة",
    city: "",
    district: "",
    area: "",
    price: "",
    desc: "",
  });
  const [sent, setSent] = useState(false);

  useEffect(() => {
    fetchAppSettings(["whatsapp_offer"]).then(map => {
      if (map?.whatsapp_offer) {
        const clean = map.whatsapp_offer.replace(/[^0-9]/g, "");
        if (clean) setWaNumber(clean);
      }
    }).catch(() => {});
  }, []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const isValid = true; // الزر مفعّل دائماً

  const buildMessage = () => {
    const cityLine = form.city
      ? `${form.city}${form.district ? " — " + form.district : ""}`
      : "(لم يُحدَّد)";
    const descLine = form.desc.trim() || "(لم يُكتب وصف)";

    const lines = [
      `إعلان عقاري — ${form.offer}`,
      `النوع: ${form.type}`,
      `الموقع: ${cityLine}`,
      form.area  ? `المساحة: ${form.area} م²` : null,
      form.price ? `السعر: ${form.price}` : null,
      `التفاصيل: ${descLine}`,
      ``,
      `— أُرسل عبر طابو أخضر`,
    ].filter(l => l !== null).join("\n");
    return lines;
  };

  const openWhatsApp = (url) => {
    const isFB = /FBAN|FBAV|FB_IAB/i.test(navigator.userAgent);

    // داخل متصفح فيسبوك المدمج: التحويل المباشر أكثر موثوقية
    if (isFB) {
      window.location.href = url;
      return;
    }

    // المتصفحات العادية: فتح في تبويب جديد
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.click();
  };

  const handleSend = () => {
    if (!isValid) return;
    const msg = buildMessage();
    const url = `https://api.whatsapp.com/send?phone=${waNumber}&text=${encodeURIComponent(msg)}`;
    openWhatsApp(url);
    setSent(true);
  };

  const sx = {
    page: { minHeight: "100vh", background: DC.bg, direction: "rtl", paddingBottom: 40 },
    hero: { background: C.primary, padding: "48px 16px 54px", position: "relative", overflow: "hidden" },
    heroTitle: { position: "relative", zIndex: 1, color: "#fff", fontSize: 22, fontWeight: 950, marginTop: 18 },
    heroSub: { position: "relative", zIndex: 1, color: "rgba(255,255,255,.75)", fontSize: 13, marginTop: 6, lineHeight: 1.8 },
    body: { padding: "0 14px", marginTop: -30, position: "relative", zIndex: 2 },
    card: {
      background: "#fff",
      borderRadius: 20,
      padding: "20px 16px",
      boxShadow: "0 10px 28px rgba(0,0,0,0.08)",
      border: "1px solid #E0DBD0",
      marginBottom: 14,
    },
    sectionLabel: { fontSize: 11, fontWeight: 900, color: C.text3, letterSpacing: 1, marginBottom: 12, textTransform: "uppercase" },
    sendBtn: {
      width: "100%",
      padding: "15px 0",
      borderRadius: 16,
      border: "none",
      background: isValid ? "#25D366" : "#ccc",
      color: "#fff",
      fontSize: 16,
      fontWeight: 900,
      fontFamily: "Tajawal, sans-serif",
      cursor: isValid ? "pointer" : "not-allowed",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      boxShadow: isValid ? "0 4px 16px rgba(37,211,102,0.35)" : "none",
      transition: "all 0.2s",
    },
    sentBox: {
      background: "#fff",
      borderRadius: 20,
      padding: 24,
      textAlign: "center",
      boxShadow: "0 10px 28px rgba(0,0,0,0.08)",
      border: "1px solid #E0DBD0",
    },
    sentIcon: { fontSize: 48, marginBottom: 12 },
    sentTitle: { fontSize: 18, fontWeight: 900, color: C.primary, marginBottom: 8 },
    sentSub: { fontSize: 13, color: C.text2, lineHeight: 1.8, marginBottom: 20 },
    resetBtn: {
      padding: "10px 24px",
      borderRadius: 20,
      border: `2px solid ${C.primary}`,
      background: "transparent",
      color: C.primary,
      fontSize: 14,
      fontWeight: 800,
      fontFamily: "Tajawal, sans-serif",
      cursor: "pointer",
    },
  };

  return (
    <div style={sx.page}>
      {/* Hero */}
      <div style={sx.hero}>
        <IslamicPattern opacity={0.1} color="#FFFFFF" />
        <div style={S.absTopRight14}>
          <button
            onClick={() => window.location.href = "https://www.blabladar.com"}
            style={{
              background: "rgba(255,255,255,0.2)", border: "none",
              borderRadius: 20, padding: "7px 14px", color: "#fff",
              fontSize: 13, fontWeight: 800, fontFamily: "Tajawal, sans-serif",
              cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
            }}
          >
            🏠 الرئيسية
          </button>
        </div>
        <div style={sx.heroTitle}>أعلن بدون تسجيل دخول</div>
        <div style={sx.heroSub}>
          أملأ التفاصيل وسنرسلها مباشرة عبر واتساب 💬
        </div>
        <Wave />
      </div>

      <div style={sx.body}>
        {sent ? (
          <div style={sx.sentBox}>
            <div style={sx.sentIcon}>✅</div>
            <div style={sx.sentTitle}>تم فتح واتساب!</div>
            <div style={sx.sentSub}>
              تحقق من تطبيق واتساب وأرسل الرسالة المُعدَّة.{"\n"}
              يمكنك أيضاً إضافة صور الإعلان في المحادثة.
            </div>
            <button style={sx.resetBtn} onClick={() => { setSent(false); setForm({ offer: "للبيع", type: "شقة", city: "", district: "", area: "", price: "", desc: "" }); }}>
              إعلان جديد
            </button>
          </div>
        ) : (
          <>
            {/* نوع العرض */}
            <div style={sx.card}>
              <div style={sx.sectionLabel}>نوع العرض</div>
              <ChipGroup options={OFFERS} value={form.offer} onChange={v => set("offer", v)} />
            </div>

            {/* نوع العقار */}
            <div style={sx.card}>
              <div style={sx.sectionLabel}>نوع العقار</div>
              <ChipGroup options={TYPES} value={form.type} onChange={v => set("type", v)} />
            </div>

            {/* الموقع */}
            <div style={sx.card}>
              <div style={sx.sectionLabel}>الموقع</div>
              <Field label="المدينة *">
                <select
                  value={form.city}
                  onChange={e => set("city", e.target.value)}
                  style={{ ...inputSx, appearance: "none", WebkitAppearance: "none" }}
                >
                  <option value="">اختر المدينة</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="الحي أو المنطقة">
                <input
                  style={inputSx}
                  placeholder="مثال: المزة، الفردوس..."
                  value={form.district}
                  onChange={e => set("district", e.target.value)}
                />
              </Field>
            </div>

            {/* التفاصيل */}
            <div style={sx.card}>
              <div style={sx.sectionLabel}>التفاصيل</div>
              <Field label="المساحة (م²)">
                <input
                  style={inputSx}
                  type="number"
                  placeholder="مثال: 120"
                  value={form.area}
                  onChange={e => set("area", e.target.value)}
                  inputMode="numeric"
                />
              </Field>
              <Field label="السعر">
                <input
                  style={inputSx}
                  placeholder="مثال: 50,000$ أو 500,000 ليرة"
                  value={form.price}
                  onChange={e => set("price", e.target.value)}
                />
              </Field>
              <Field label="وصف الإعلان *">
                <textarea
                  style={{ ...inputSx, minHeight: 100, resize: "vertical", lineHeight: 1.7 }}
                  placeholder="اكتب تفاصيل إضافية عن العقار..."
                  value={form.desc}
                  onChange={e => set("desc", e.target.value)}
                />
              </Field>
            </div>

            {/* ملاحظة الصور */}
            <div style={{ background: "#FEF3C7", borderRadius: 12, padding: "10px 14px", marginBottom: 14, fontSize: 12, color: "#92400E", lineHeight: 1.7 }}>
              📸 بعد إرسال الرسالة، يمكنك إضافة صور العقار مباشرة في محادثة واتساب.
            </div>

            {/* زر الإرسال */}
            <button type="button" style={sx.sendBtn} onClick={handleSend} disabled={!isValid}>
              <span style={{ fontSize: 20 }}>💬</span>
              إرسال عبر واتساب
            </button>


          </>
        )}
      </div>
    </div>
  );
}

export default AddViaWhatsAppPage;
