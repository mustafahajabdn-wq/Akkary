import React, { useEffect } from "react";
import { C } from "../../shared/constants/colors.js";
import { ImageGallery } from "../../shared/components/common/ImageGallery.jsx";
import { incrementAdViews, fetchAdUniqueClicksCount, recordAdClick } from "../services/adService.js";
import { S, mergeStyles } from "../../shared/styles/primitives.js";
export default function AdDetailPage({
  ad,
  setPage,
  prevPage = "home",
  DC,
  setSeller,
  user
}) {
  const sx = {
    s1: DC => ({
      padding: 40,
      textAlign: "center",
      color: DC.text3
    }),
    s2: {
      marginTop: 12,
      fontSize: 14
    },
    s3: C => ({
      marginTop: 16,
      padding: "10px 24px",
      background: C.primary,
      color: "white",
      border: "none",
      borderRadius: 10,
      fontSize: 14,
      fontWeight: 700,
      fontFamily: "inherit",
      cursor: "pointer"
    }),
    s4: DC => ({
      background: DC.bg,
      minHeight: "100vh",
      paddingBottom: 40
    }),
    s5: C => ({
      background: C.primary,
      padding: "48px 20px 24px",
      position: "relative"
    }),
    s6: {
      position: "absolute",
      top: 14,
      right: 16,
      width: 34,
      height: 34,
      borderRadius: "50%",
      background: "rgba(255,255,255,0.15)",
      border: "none",
      fontSize: 18,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "white"
    },
    s7: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      background: "#C8952A",
      color: "white",
      borderRadius: 20,
      padding: "4px 14px",
      fontSize: 11,
      fontWeight: 900,
      marginBottom: 12
    },
    s8: {
      fontSize: 20,
      fontWeight: 900,
      color: "white",
      lineHeight: 1.3
    },
    s9: {
      fontSize: 13,
      color: "rgba(255,255,255,0.7)",
      marginTop: 6
    },
    s10: {
      padding: "16px 16px 0"
    },
    s11: {
      borderRadius: 14,
      overflow: "hidden",
      marginBottom: 14
    },
    s12: DC => ({
      background: DC.white,
      borderRadius: 14,
      padding: 16,
      border: "1.5px solid #E8B84B",
      marginBottom: 12
    }),
    s13: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 10
    },
    s14: DC => ({
      fontSize: 13,
      color: DC.text3
    }),
    s15: DC => ({
      fontSize: 14,
      fontWeight: 700,
      color: DC.text
    }),
    s16: DC => ({
      fontSize: 14,
      color: DC.text2,
      lineHeight: 1.8,
      borderTop: "1px solid " + DC.border,
      paddingTop: 10,
      marginTop: 6
    }),
    s17: DC => ({
      marginTop: 10,
      fontSize: 11,
      color: DC.text3,
      display: "flex",
      gap: 12
    }),
    s18: {
      display: "flex",
      flexDirection: "column",
      gap: 10
    },
    s19: C => ({
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      padding: "14px",
      background: C.primary,
      color: "white",
      borderRadius: 12,
      fontSize: 15,
      fontWeight: 800,
      textDecoration: "none"
    }),
    s20: (DC, C) => ({
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      padding: "14px",
      background: DC.white,
      color: C.primary,
      borderRadius: 12,
      fontSize: 15,
      fontWeight: 800,
      textDecoration: "none",
      border: "1.5px solid " + C.primary
    }),
    s21: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      padding: "14px",
      background: "#25D366",
      color: "white",
      borderRadius: 12,
      fontSize: 15,
      fontWeight: 800,
      textDecoration: "none"
    },
    s22: C => ({
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      padding: "14px",
      background: "#F0F9F4",
      color: C.primary,
      borderRadius: 12,
      fontSize: 15,
      fontWeight: 800,
      border: "1.5px solid " + C.primary,
      fontFamily: "inherit",
      cursor: "pointer",
      width: "100%"
    })
  };
  if (!DC) DC = C;
  const [uniqueClicks, setUniqueClicks] = React.useState(null);

  // عدّ المشاهدات + النقرات الفريدة
  useEffect(() => {
    if (!ad?.id) return;

    // زيادة views
    incrementAdViews(ad.id, ad.views);

    // جلب عدد النقرات الفريدة
    fetchAdUniqueClicksCount(ad.id).then(c => {
      if (c !== null) setUniqueClicks(c);
    });

    // تسجيل نقرة فريدة إذا كان المستخدم مسجلاً
    if (user?.id) recordAdClick(ad.id, user.id);
  }, [ad?.id]);
  if (!ad) return <div style={sx.s1(DC)}>
      <div style={S.font40}>📢</div>
      <div style={sx.s2}>الإعلان غير متاح</div>
      <button onClick={() => setPage(prevPage)} style={sx.s3(C)}>رجوع</button>
    </div>;
  const categoryEmoji = {
    "مكتب عقاري": "🏢",
    "ورشة بناء": "🔨",
    "نقل أثاث": "🚛",
    "مواد بناء": "🧱",
    "ديكور": "🎨",
    "تمويل عقاري": "💰"
  }[ad.category] || "📢";
  const allImages = [...(ad.image_url ? [ad.image_url] : []), ...(ad.images || [])].filter(Boolean);
  return <div style={sx.s4(DC)}>

      {/* هيدر */}
      <div style={sx.s5(C)}>
        <button onClick={() => setPage(prevPage)} style={sx.s6}>←</button>
        <div style={S.textCenter}>
          <div style={sx.s7}>
            🌟 إعلان مدفوع
          </div>
          <div style={sx.s8}>
            {ad.title}
          </div>
          {ad.category && <div style={sx.s9}>
              {categoryEmoji} {ad.category}
            </div>}
        </div>
      </div>

      <div style={sx.s10}>

        {/* الصور */}
        {allImages.length > 0 && <div style={sx.s11}>
            <ImageGallery images={allImages} />
          </div>}

        {/* بطاقة المعلومات */}
        <div style={sx.s12(DC)}>

          {ad.city && <div style={sx.s13}>
              <span style={sx.s14(DC)}>📍</span>
              <span style={sx.s15(DC)}>{ad.city}</span>
            </div>}

          {ad.description && <div style={sx.s16(DC)}>
              {ad.description}
            </div>}

          {(ad.views > 0 || ad.impressions > 0) && <div style={sx.s17(DC)}>
              {ad.impressions > 0 && <span>📊 {ad.impressions} ظهور</span>}
              {ad.views > 0 && <span>👁 {ad.views} مشاهدة</span>}
              {uniqueClicks > 0 && <span>🖱 {uniqueClicks} زيارة فريدة</span>}
            </div>}
        </div>

        {/* أزرار التواصل */}
        <div style={sx.s18}>
          {ad.phone && <a href={`tel:${ad.phone}`} style={sx.s19(C)}>
              📞 {ad.phone}
            </a>}
          {ad.phone2 && <a href={`tel:${ad.phone2}`} style={sx.s20(DC, C)}>
              📞 {ad.phone2}
            </a>}
          {ad.phone && <a href={`https://wa.me/${ad.phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer" style={sx.s21}>
              💬 واتساب
            </a>}

          {/* زر ملف المعلن — يظهر فقط إذا عنده حساب */}
          {ad.user_id && setSeller && <button onClick={() => {
          setSeller({
            sellerId: ad.user_id,
            sellerName: ad.owner_name || ad.contact_name || ad.title,
            seller: ad.title,
            user_id: ad.user_id,
            prevPage: "adDetail"
          });
          setPage("sellerProfile");
        }} style={sx.s22(C)}>
              👤 عرض ملف المعلن
            </button>}
        </div>
      </div>
    </div>;
}