import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { C } from "../../shared/constants/colors.js";
import { IslamicPattern, Wave } from "../../shared/components/icons.jsx";
import { fetchAppSettings } from "../services/configService.js";
import { S, mergeStyles } from "../../shared/styles/primitives.js";

// لون واتساب الرسمي
const WA_GREEN = "#25D366";
const WA_DARK = "#128C7E";
const WA_LIGHT = "#DCF8C6";
function AddChoicePage({
  setPage,
  user
}) {
  const navigate = useNavigate();
  const canOpenImporter = user?.role === "admin" || (Array.isArray(user?.allowedPages) && user.allowedPages.includes("importer"));
  const sx = {
    s1: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      fontFamily: "Tajawal,sans-serif",
      direction: "rtl",
      padding: 24
    },
    s2: {
      fontSize: 16,
      fontWeight: 800,
      marginBottom: 8
    },
    s3: untilText => ({
      fontSize: 13,
      color: "#6B7280",
      marginBottom: untilText ? 8 : 20
    }),
    s4: {
      fontSize: 12,
      color: "#C8952A",
      fontWeight: 700,
      background: "#FEF3C7",
      padding: "6px 14px",
      borderRadius: 20,
      marginBottom: 20,
      display: "inline-block"
    },
    s5: {
      padding: "10px 24px",
      background: "#1A4A2E",
      color: "white",
      border: "none",
      borderRadius: 10,
      fontSize: 13,
      fontWeight: 700,
      cursor: "pointer",
      fontFamily: "inherit"
    },
    s6: {
      maxWidth: 430,
      margin: "0 auto",
      minHeight: "100vh",
      fontFamily: "Tajawal,sans-serif",
      direction: "rtl",
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "center",
      position: "relative",
      background: "#E8EDE9"
    },
    s7: {
      width: "100%",
      background: "#FFFCF6",
      borderRadius: "24px 24px 0 0",
      padding: "24px 20px 120px",
      boxShadow: "0 -14px 40px rgba(26,74,46,0.10)",
      borderTop: "1px solid rgba(200,149,42,0.16)",
      position: "relative",
      zIndex: 1
    },
    s8: {
      width: 40,
      height: 4,
      background: "#E5E7EB",
      borderRadius: 2,
      margin: "0 auto 20px"
    },
    s9: {
      fontSize: 16,
      fontWeight: 900,
      color: "#111",
      marginBottom: 20,
      textAlign: "center"
    },
    s10: {
      display: "flex",
      gap: 12,
      marginBottom: 16
    },
    s11: {
      flex: 1,
      padding: "20px 8px",
      borderRadius: 14,
      border: "2px solid #E5E7EB",
      background: "#F9F7F0",
      cursor: "pointer",
      fontFamily: "Tajawal,sans-serif",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 6
    },
    s12: {
      fontSize: 34
    },
    s13: {
      fontSize: 14,
      fontWeight: 800,
      color: "#111"
    },
    s14: {
      fontSize: 11,
      color: "#6B7280"
    },
    s15: {
      flex: 1,
      padding: "20px 8px",
      borderRadius: 14,
      border: "2px solid #FEF3C7",
      background: "#FFFBEB",
      cursor: "pointer",
      fontFamily: "Tajawal,sans-serif",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 6
    },
    s16: {
      fontSize: 34
    },
    s17: {
      fontSize: 14,
      fontWeight: 800,
      color: "#C8952A"
    },
    s18: {
      fontSize: 11,
      color: "#C2410C"
    },
    s19: {
      width: "100%",
      padding: "16px 8px",
      borderRadius: 14,
      border: "2px solid #E0D5FF",
      background: "#F5F0FF",
      cursor: "pointer",
      fontFamily: "Tajawal,sans-serif",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 6,
      marginBottom: 16
    },
    s20: {
      fontSize: 30
    },
    s21: {
      fontSize: 14,
      fontWeight: 800,
      color: "#5B21B6"
    },
    s22: {
      fontSize: 11,
      color: "#7C3AED"
    },
    s23: {
      width: "100%",
      padding: "10px",
      background: "none",
      border: "none",
      cursor: "pointer",
      fontFamily: "Tajawal,sans-serif",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      color: "#9CA3AF",
      fontSize: 12,
      fontWeight: 700
    },
    s24: showWa => ({
      transition: "transform 0.2s",
      display: "inline-block",
      transform: showWa ? "rotate(180deg)" : "rotate(0deg)"
    }),
    s25: showWa => ({
      overflow: "hidden",
      maxHeight: showWa ? 200 : 0,
      transition: "max-height 0.3s ease",
      marginTop: showWa ? 8 : 0
    }),
    s26: {
      display: "flex",
      gap: 12,
      paddingTop: 4
    },
    s27: (WA_LIGHT, WA_GREEN) => ({
      flex: 1,
      padding: "14px 8px",
      borderRadius: 14,
      border: `2px solid ${WA_LIGHT}`,
      background: WA_GREEN,
      cursor: "pointer",
      fontFamily: "Tajawal,sans-serif",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 5
    }),
    s28: {
      fontSize: 12,
      fontWeight: 800,
      color: "white"
    },
    s29: {
      fontSize: 10,
      color: "rgba(255,255,255,0.8)"
    },
    s30: (WA_LIGHT, WA_GREEN) => ({
      flex: 1,
      padding: "14px 8px",
      borderRadius: 14,
      border: `2px solid ${WA_LIGHT}`,
      background: WA_GREEN,
      cursor: "pointer",
      fontFamily: "Tajawal,sans-serif",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 5
    }),
    s31: {
      fontSize: 12,
      fontWeight: 800,
      color: "white"
    },
    s32: {
      fontSize: 10,
      color: "rgba(255,255,255,0.8)"
    }
  };
  if (user?.isSuspended) {
    const until = user?.suspendedUntil;
    let untilText = "";
    if (until) {
      const diff = new Date(until) - new Date();
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor(diff / 3600000);
      const mins = Math.floor(diff / 60000);
      if (days >= 1) untilText = `ينتهي خلال ${days} يوم`;else if (hours >= 1) untilText = `ينتهي خلال ${hours} ساعة`;else untilText = `ينتهي خلال ${mins} دقيقة`;
    }
    return <div style={sx.s1}>
      <div style={S.textCenter}>
        <div style={S.font48Mb12}>🚫</div>
        <div style={sx.s2}>حسابك موقوف</div>
        <div style={sx.s3(untilText)}>لا يمكنك نشر إعلانات حالياً</div>
        {untilText && <div style={sx.s4}>⏱ {untilText}</div>}
        <br />
        <button onClick={() => setPage("home")} style={sx.s5}>العودة</button>
      </div>
    </div>;
  }
  const [waOffer, setWaOffer] = useState(null);
  const [waRequest, setWaRequest] = useState(null);
  const [showWa, setShowWa] = useState(false);
  useEffect(() => {
    fetchAppSettings(["whatsapp_offer", "whatsapp_request"]).then(map => {
      if (map.whatsapp_offer) setWaOffer(map.whatsapp_offer);
      if (map.whatsapp_request) setWaRequest(map.whatsapp_request);
    });
  }, []);
  const openWa = (number, msg) => {
    const clean = number?.replace(/\D/g, "");
    if (!clean) return;
    window.open(`https://wa.me/${clean}?text=${encodeURIComponent(msg)}`, "_blank");
  };
  const msgOffer = `🏠 إعلان للبيع/الإيجار
━━━━━━━━━━━━━━━
النوع: بيع / إيجار
المنطقة: 
السعر: 
التفاصيل: `;
  const msgRequest = `🔍 مطلوب للشراء/الاستئجار
━━━━━━━━━━━━━━━
النوع: شراء / استئجار
المنطقة: 
الميزانية: 
التفاصيل: `;
  return <div style={sx.s6} onClick={() => setPage("home")}>

      {/* النقش الإسلامي في الخلفية */}
      <IslamicPattern opacity={0.18} color="#1A4A2E" width={430} height={700} />

      <div onClick={e => e.stopPropagation()} style={sx.s7}>
        <div style={sx.s8} />
        <div style={sx.s9}>ماذا تريد أن تنشر؟</div>

        {/* أزرار النشر الرئيسية */}
        <div style={sx.s10}>
          <button onClick={() => setPage("add")} style={sx.s11}>
            <span style={sx.s12}>🏠</span>
            <span style={sx.s13}>إعلان عقار</span>
            <span style={sx.s14}>بيع أو إيجار</span>
          </button>
          <button onClick={() => setPage("want")} style={sx.s15}>
            <span style={sx.s16}>🔍</span>
            <span style={sx.s17}>طلب عقار</span>
            <span style={sx.s18}>أنا أبحث عن عقار</span>
          </button>
        </div>

        {/* بطاقة استيراد الإعلانات — حسب الصلاحية الفعلية */}
        {canOpenImporter && <button onClick={() => navigate("/importer")} style={sx.s19}>
            <span style={sx.s20}>📥</span>
            <span style={sx.s21}>استيراد إعلانات</span>
            <span style={sx.s22}>رفع إعلانات دفعةً واحدة</span>
          </button>}

        {/* زر خيارات إضافية */}
        <button onClick={() => setShowWa(p => !p)} style={sx.s23}>
          <span>خيارات إضافية</span>
          <span style={sx.s24(showWa)}>▾</span>
        </button>

        {/* أزرار واتساب — بلون واتساب الرسمي */}
        <div style={sx.s25(showWa)}>
          <div style={sx.s26}>
            <button onClick={() => openWa(waOffer, msgOffer)} style={sx.s27(WA_LIGHT, WA_GREEN)}>
              <span style={S.font24}>💬</span>
              <span style={sx.s28}>أنشر عبر واتساب</span>
              <span style={sx.s29}>بيع أو إيجار</span>
            </button>
            <button onClick={() => openWa(waRequest, msgRequest)} style={sx.s30(WA_LIGHT, WA_GREEN)}>
              <span style={S.font24}>💬</span>
              <span style={sx.s31}>أطلب عبر واتساب</span>
              <span style={sx.s32}>أبحث عن عقار</span>
            </button>
          </div>
        </div>

      </div>
    </div>;
}
export default AddChoicePage;
