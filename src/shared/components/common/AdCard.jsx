import React from "react";
import { C } from "../../constants/colors.js";
import { IslamicPattern } from "../icons.jsx";
import { S } from "../../styles/primitives.js";
function AdCard({
  ad,
  onPress,
  onImpression,
  DC,
  size = "normal"
}) {
  const sx = {
    s1: {
      position: "absolute",
      top: 8,
      right: 8,
      background: "#C8952A",
      color: "white",
      fontSize: 9,
      fontWeight: 900,
      borderRadius: 6,
      padding: "2px 7px",
      zIndex: 1
    },
    s2: {
      fontSize: 10,
      fontWeight: 700,
      color: "#C8952A",
      background: "#FEF3C7",
      borderRadius: 999,
      padding: "2px 8px",
      border: "1px solid #E8B84B"
    },
    s3: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 6
    },
    s4: DC => ({
      fontSize: 11,
      color: DC.text3
    }),
    s5: C => ({
      fontSize: 11,
      color: C.primary,
      fontWeight: 700
    }),
    s6: {
      display: "flex"
    },
    s7: {
      width: 130,
      height: 130,
      flexShrink: 0,
      position: "relative",
      background: "#FEF3C7",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden"
    },
    s8: {
      fontSize: 36
    },
    s9: {
      flex: 1,
      padding: "10px 12px",
      minWidth: 0
    },
    s10: DC => ({
      fontSize: 14,
      fontWeight: 800,
      color: DC.text,
      marginBottom: 4,
      lineHeight: 1.3
    }),
    s11: {
      marginBottom: 5
    },
    s12: DC => ({
      fontSize: 12,
      color: DC.text2,
      lineHeight: 1.5,
      overflow: "hidden",
      display: "-webkit-box",
      WebkitLineClamp: 2,
      WebkitBoxOrient: "vertical"
    }),
    s13: {
      width: "100%",
      height: 200,
      position: "relative",
      background: "#FEF3C7",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden"
    },
    s14: {
      fontSize: 56
    },
    s15: {
      padding: "12px 14px"
    },
    s16: DC => ({
      fontSize: 15,
      fontWeight: 900,
      color: DC.text,
      marginBottom: 6
    }),
    s17: {
      marginBottom: 6
    },
    s18: DC => ({
      fontSize: 13,
      color: DC.text2,
      lineHeight: 1.6,
      marginBottom: 6
    }),
    s19: {
      position: "relative",
      width: "100%",
      paddingTop: "56.6%",
      overflow: "hidden",
      background: "#FEF3C7"
    },
    s20: {
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      objectFit: "cover"
    },
    s21: {
      position: "absolute",
      inset: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 56
    },
    s22: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: "60%",
      background: "linear-gradient(transparent, rgba(0,0,0,0.72))"
    },
    s23: {
      position: "absolute",
      bottom: 12,
      right: 14,
      left: 14
    },
    s24: {
      fontSize: 15,
      fontWeight: 900,
      color: "white",
      marginBottom: 4,
      lineHeight: 1.3,
      textShadow: "0 1px 4px rgba(0,0,0,0.4)"
    },
    s25: {
      display: "flex",
      gap: 8,
      alignItems: "center",
      flexWrap: "wrap"
    },
    s26: {
      fontSize: 11,
      color: "rgba(255,255,255,0.85)"
    },
    s27: {
      fontSize: 11,
      color: "#E8B84B",
      fontWeight: 700
    },
    s28: {
      width: "100%",
      height: 250,
      position: "relative",
      background: "#FEF3C7",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden"
    },
    s29: {
      fontSize: 64
    },
    s30: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: 120,
      background: "linear-gradient(transparent, rgba(0,0,0,0.7))"
    },
    s31: {
      position: "absolute",
      bottom: 12,
      right: 12,
      left: 12
    },
    s32: {
      fontSize: 16,
      fontWeight: 900,
      color: "white",
      marginBottom: 4
    },
    s33: {
      fontSize: 11,
      color: "rgba(255,255,255,0.8)"
    },
    s34: {
      fontSize: 11,
      color: "#E8B84B",
      fontWeight: 700
    },
    s35: {
      padding: "10px 14px"
    },
    s36: {
      marginBottom: 4
    },
    s37: DC => ({
      fontSize: 12,
      color: DC.text2,
      lineHeight: 1.5,
      overflow: "hidden",
      display: "-webkit-box",
      WebkitLineClamp: 2,
      WebkitBoxOrient: "vertical"
    })
  };
  if (!DC) DC = C;
  React.useEffect(() => {
    if (!ad?.id) return;
    const key = `ad_imp_${ad.id}_${new Date().toDateString()}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    onImpression?.(ad.id);
  }, [ad?.id]);
  const categoryEmoji = {
    "مكتب عقاري": "🏢",
    "ورشة بناء": "🔨",
    "نقل أثاث": "🚛",
    "مواد بناء": "🧱",
    ديكور: "🎨",
    "تمويل عقاري": "💰"
  }[ad.category] || "📢";
  const badge = <div style={sx.s1}>
      🌟 مدفوع
    </div>;
  const categoryChip = ad.category && <span style={sx.s2}>
      {categoryEmoji} {ad.category}
    </span>;
  const footer = <div style={sx.s3}>
      {ad.city && <span style={sx.s4(DC)}>📍 {ad.city}</span>}
      {ad.phone && <span style={sx.s5(C)}>
          📞 {ad.phone}
        </span>}
    </div>;
  const wrapper = children => {
    const sx = {
      s1: DC => ({
        background: DC.white,
        borderRadius: 14,
        overflow: "hidden",
        border: "1.5px solid #E8B84B",
        marginBottom: 10,
        cursor: "pointer",
        boxShadow: "0 2px 8px rgba(200,149,42,0.12)"
      }),
      s2: {
        height: 3,
        background: "linear-gradient(90deg,#C8952A,#E8B84B)"
      }
    };
    return <div onClick={() => onPress && onPress(ad)} style={sx.s1(DC)}>
      <div style={sx.s2} />
      {children}
    </div>;
  };
  if (size === "normal") {
    return wrapper(<div style={sx.s6}>
        <div style={sx.s7}>
          {ad.image_url ? <img src={ad.image_url} alt={ad.title} style={S.coverImage} /> : <span style={sx.s8}>{categoryEmoji}</span>}
          {badge}
        </div>

        <div style={sx.s9}>
          <div style={sx.s10(DC)}>
            {ad.title}
          </div>

          <div style={sx.s11}>{categoryChip}</div>

          {ad.description && <div style={sx.s12(DC)}>
              {ad.description}
            </div>}

          {footer}
        </div>
      </div>);
  }
  if (size === "large") {
    return wrapper(<>
        <div style={sx.s13}>
          {ad.image_url ? <img src={ad.image_url} alt={ad.title} style={S.coverImage} /> : <span style={sx.s14}>{categoryEmoji}</span>}
          {badge}
        </div>

        <div style={sx.s15}>
          <div style={sx.s16(DC)}>
            {ad.title}
          </div>

          <div style={sx.s17}>{categoryChip}</div>

          {ad.description && <div style={sx.s18(DC)}>
              {ad.description}
            </div>}

          {footer}
        </div>
      </>);
  }
  if (size === "banner") {
    return wrapper(<div style={sx.s19}>
        {ad.image_url ? <img src={ad.image_url} alt={ad.title} style={sx.s20} /> : <div style={sx.s21}>
            {categoryEmoji}
          </div>}

        {badge}

        <div style={sx.s22} />

        <div style={sx.s23}>
          <div style={sx.s24}>
            {ad.title}
          </div>

          <div style={S.centerBetween}>
            <div style={sx.s25}>
              {categoryChip}
              {ad.city && <span style={sx.s26}>
                  📍 {ad.city}
                </span>}
            </div>

            {ad.phone && <span style={sx.s27}>
                📞 {ad.phone}
              </span>}
          </div>
        </div>
      </div>);
  }
  return wrapper(<div style={sx.s28}>
      {ad.image_url ? <img src={ad.image_url} alt={ad.title} style={S.coverImage} /> : <span style={sx.s29}>{categoryEmoji}</span>}

      {badge}

      <div style={sx.s30} />

      <div style={sx.s31}>
        <div style={sx.s32}>
          {ad.title}
        </div>

        <div style={S.centerBetween}>
          {ad.city && <span style={sx.s33}>
              📍 {ad.city}
            </span>}

          {ad.phone && <span style={sx.s34}>
              📞 {ad.phone}
            </span>}
        </div>

        <div style={sx.s35}>
          <div style={sx.s36}>{categoryChip}</div>

          {ad.description && <div style={sx.s37(DC)}>
              {ad.description}
            </div>}
        </div>
      </div>
    </div>);
}
export { AdCard };
