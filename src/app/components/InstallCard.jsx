import React, { useState } from "react";
import { C } from "../../shared/constants/colors.js";
import { S } from "../../shared/styles/primitives.js";

export default function InstallCard({
  DC,
  show = false,
  onInstall = () => {},
  onDismiss = () => {},
}) {
  const [showInstructions, setShowInstructions] = useState(false);

  const sx = {
    s1: (palette) => ({
      background: `linear-gradient(135deg, ${palette.primary} 0%, #0F3020 100%)`,
      borderRadius: 14,
      padding: "14px 16px",
      marginBottom: 12,
      display: "flex",
      alignItems: "center",
      gap: 12,
      position: "relative",
      overflow: "hidden",
      boxShadow: "0 2px 12px rgba(26,74,46,0.25)",
    }),
    s2: {
      position: "absolute",
      inset: 0,
      opacity: 0.06,
      backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
      backgroundSize: "20px 20px",
    },
    s3: {
      width: 48,
      height: 48,
      borderRadius: 12,
      background: "white",
      flexShrink: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
      position: "relative",
      zIndex: 1,
    },
    s4: {
      width: 38,
      height: 38,
      borderRadius: 8,
    },
    s5: {
      flex: 1,
      minWidth: 0,
      position: "relative",
      zIndex: 1,
    },
    s6: {
      fontSize: 13,
      fontWeight: 900,
      color: "white",
      marginBottom: 2,
    },
    s7: {
      fontSize: 11,
      color: "rgba(255,255,255,0.75)",
    },
    s8: {
      display: "flex",
      gap: 6,
      flexShrink: 0,
      position: "relative",
      zIndex: 1,
      alignItems: "center",
    },
    s9: (palette) => ({
      padding: "8px 14px",
      borderRadius: 20,
      border: "none",
      background: "white",
      color: palette.primary,
      fontSize: 12,
      fontWeight: 800,
      cursor: "pointer",
      fontFamily: "inherit",
      whiteSpace: "nowrap",
    }),
    s10: {
      position: "fixed",
      inset: 0,
      zIndex: 9999,
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "center",
    },
    s11: {
      background: "white",
      borderRadius: "20px 20px 0 0",
      padding: "24px 20px 40px",
      width: "100%",
      maxWidth: 430,
      fontFamily: "Tajawal,sans-serif",
      direction: "rtl",
    },
    s12: {
      width: 40,
      height: 4,
      borderRadius: 2,
      background: "#E5E7EB",
      margin: "0 auto 20px",
    },
    s13: {
      fontSize: 16,
      fontWeight: 800,
      color: "#1A2E20",
      textAlign: "center",
      marginBottom: 16,
    },
    s14: {
      background: "#F0FDF4",
      borderRadius: 12,
      padding: "14px 16px",
      marginBottom: 10,
      border: "1px solid #BBF7D0",
    },
    s15: {
      fontSize: 12,
      fontWeight: 800,
      color: "#16A34A",
      marginBottom: 6,
    },
    s16: {
      background: "#EFF6FF",
      borderRadius: 12,
      padding: "14px 16px",
      marginBottom: 20,
      border: "1px solid #BFDBFE",
    },
    s17: {
      fontSize: 12,
      fontWeight: 800,
      color: "#2563EB",
      marginBottom: 6,
    },
    s18: {
      width: "100%",
      padding: "13px",
      borderRadius: 12,
      border: "none",
      background: "#1A4A2E",
      color: "white",
      fontSize: 14,
      fontWeight: 700,
      cursor: "pointer",
      fontFamily: "inherit",
    },
    s19: {
      padding: "8px 10px",
      borderRadius: 20,
      border: "1px solid rgba(255,255,255,0.35)",
      background: "transparent",
      color: "white",
      fontSize: 12,
      fontWeight: 700,
      cursor: "pointer",
      fontFamily: "inherit",
      whiteSpace: "nowrap",
    },
  };

  if (!show) return null;

  const palette = DC || C;

  return (
    <>
      <div style={sx.s1(palette)}>
        <div style={sx.s2} />

        <div style={sx.s3}>
          <img src="/icons/icon-192.png" alt="" style={sx.s4} onError={(e) => {
            e.target.style.display = "none";
          }} />
        </div>

        <div style={sx.s5}>
          <div style={sx.s6}>📲 ثبّت طابو أخضر</div>
          <div style={sx.s7}>أسرع وأسهل — مباشرة من شاشتك</div>
        </div>

        <div style={sx.s8}>
          <button onClick={onInstall} style={sx.s9(palette)}>
            تثبيت
          </button>
          <button onClick={onDismiss} style={sx.s19}>
            لاحقًا
          </button>
        </div>
      </div>

      {showInstructions && (
        <div style={sx.s10} onClick={() => setShowInstructions(false)}>
          <div onClick={(e) => e.stopPropagation()} style={sx.s11}>
            <div style={sx.s12} />
            <div style={sx.s13}>كيف تثبّت التطبيق؟</div>
            <div style={sx.s14}>
              <div style={sx.s15}>🤖 Android Chrome</div>
              <div style={S.bodyText374151}>
                ١. اضغط ⋮ (القائمة) أعلى المتصفح<br />
                ٢. اختر <b>إضافة إلى الشاشة الرئيسية</b>
              </div>
            </div>
            <div style={sx.s16}>
              <div style={sx.s17}>🍎 iPhone Safari</div>
              <div style={S.bodyText374151}>
                ١. اضغط زر المشاركة ↑<br />
                ٢. اختر <b>إضافة إلى الشاشة الرئيسية</b>
              </div>
            </div>
            <button onClick={() => setShowInstructions(false)} style={sx.s18}>
              فهمت
            </button>
          </div>
        </div>
      )}
    </>
  );
}
