import React from "react";
import { C } from "../../shared/constants/colors.js";
import { IslamicPattern, Wave } from "../../shared/components/icons.jsx";
import { BackButton } from "../../shared/components/common/BackButton.jsx";

const appVersion = "1.0.0 Beta";
const lastUpdated = "2026";

function AboutPage({ setPage, DC }) {
  DC = DC || C;

  const sx = {
    page: {
      minHeight: "100vh",
      background: DC.bg,
      color: DC.text,
      fontFamily: "Tajawal, sans-serif",
      direction: "rtl",
      paddingBottom: 42,
    },
    hero: {
      position: "relative",
      overflow: "hidden",
      background: `linear-gradient(135deg, ${C.primary} 0%, #0F3020 100%)`,
      padding: "18px 18px 56px",
      color: "white",
    },
    topBar: {
      position: "relative",
      zIndex: 2,
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-start",
      maxWidth: 820,
      margin: "0 auto 18px",
    },
    heroInner: {
      position: "relative",
      zIndex: 1,
      maxWidth: 820,
      margin: "0 auto",
      textAlign: "center",
    },
    logoWrap: {
      width: 170,
      height: 170,
      borderRadius: 34,
      overflow: "hidden",
      background: "rgba(255,255,255,0.12)",
      border: "1px solid rgba(255,255,255,0.24)",
      boxShadow: "0 16px 36px rgba(0,0,0,0.28)",
      margin: "0 auto 18px",
    },
    logoImage: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      display: "block",
    },
    badge: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      padding: "5px 13px",
      borderRadius: 999,
      background: "rgba(200,149,42,0.18)",
      border: "1px solid rgba(246,214,128,0.45)",
      color: C.gold2,
      fontSize: 12,
      fontWeight: 800,
      marginBottom: 10,
    },
    title: {
      fontSize: 26,
      fontWeight: 900,
      margin: "0 0 10px",
      lineHeight: 1.35,
    },
    subtitle: {
      maxWidth: 640,
      margin: "0 auto",
      fontSize: 14,
      lineHeight: 1.9,
      color: "rgba(255,255,255,0.82)",
      fontWeight: 500,
    },
    body: {
      maxWidth: 820,
      margin: "-24px auto 0",
      padding: "0 14px",
      position: "relative",
      zIndex: 3,
    },
    card: {
      background: DC.white,
      border: "1px solid " + DC.border,
      borderRadius: 18,
      padding: 18,
      boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: 900,
      color: DC.text,
      marginBottom: 8,
    },
    paragraph: {
      fontSize: 13.5,
      lineHeight: 1.95,
      color: DC.text2 || DC.text,
      margin: 0,
    },
    featureGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
      gap: 10,
      marginTop: 12,
    },
    feature: {
      background: DC.bg,
      border: "1px solid " + DC.border,
      borderRadius: 14,
      padding: 13,
    },
    featureIcon: {
      fontSize: 22,
      marginBottom: 7,
    },
    featureTitle: {
      fontSize: 13,
      fontWeight: 900,
      color: DC.text,
      marginBottom: 4,
    },
    featureText: {
      fontSize: 12,
      lineHeight: 1.7,
      color: DC.text3,
      margin: 0,
    },
    telegramButton: {
      width: "100%",
      border: "none",
      borderRadius: 14,
      background: "#229ED9",
      color: "white",
      padding: "12px 14px",
      fontSize: 14,
      fontWeight: 900,
      fontFamily: "inherit",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      marginTop: 12,
    },
    version: {
      textAlign: "center",
      color: DC.text3,
      fontSize: 12,
      lineHeight: 1.8,
      marginTop: 16,
    },
  };

  const goBack = () => {
    if (setPage) {
      setPage("profile");
      return;
    }

    if (window.history.length > 1) {
      window.history.back();
    }
  };

  return (
    <div style={sx.page}>
      <div style={sx.hero}>
        <IslamicPattern opacity={0.1} color="#FFFFFF" />

        <div style={sx.topBar}>
          <BackButton onPress={goBack} />
        </div>

        <div style={sx.heroInner}>
          <div style={sx.logoWrap}>
            <img
              src="/images/about-logo.jpg"
              alt="طابو أخضر"
              style={sx.logoImage}
            />
          </div>

          <div style={sx.badge}>تطبيق عقاري في سوريا</div>

          <h1 style={sx.title}>حول طابو أخضر</h1>

          <p style={sx.subtitle}>
            طابو أخضر بابٌ عقاريّ واضح؛ يجمع إعلانات البيع والإيجار،
            ويقرّب الباحث من مطلوبه بالمدينة والمنطقة والسعر والخريطة.
          </p>
        </div>

        <Wave fill={DC.bg} />
      </div>

      <main style={sx.body}>
        <section style={sx.card}>
          <div style={sx.sectionTitle}>ما هو طابو أخضر؟</div>
          <p style={sx.paragraph}>
            مساحة رقمية للعقار، تُعرض فيها الشقق والمنازل والمحلات والأراضي
            عرضًا بيّنًا: صورة، وصف، موقع، وسيلة تواصل؛ بلا لبسٍ ولا إطالة.
          </p>
        </section>

        <section style={sx.card}>
          <div style={sx.sectionTitle}>ماذا يقدّم؟</div>

          <div style={sx.featureGrid}>
            <div style={sx.feature}>
              <div style={sx.featureIcon}>🔍</div>
              <div style={sx.featureTitle}>بحث واضح</div>
              <p style={sx.featureText}>
                فلاتر للمدينة والمنطقة والنوع والسعر والمساحة.
              </p>
            </div>

            <div style={sx.feature}>
              <div style={sx.featureIcon}>🗺️</div>
              <div style={sx.featureTitle}>خريطة العقارات</div>
              <p style={sx.featureText}>
                موقع دقيق أو تقريبي بحسب بيانات الإعلان.
              </p>
            </div>

            <div style={sx.feature}>
              <div style={sx.featureIcon}>📱</div>
              <div style={sx.featureTitle}>تجربة تطبيق</div>
              <p style={sx.featureText}>
                واجهة خفيفة للهاتف، صالحة للتثبيت كتطبيق ويب.
              </p>
            </div>
          </div>

          <button
            type="button"
            style={sx.telegramButton}
            onClick={() => window.open("https://t.me/M20Y27", "_blank", "noopener,noreferrer")}
          >
            <span>✈️</span>
            <span>تواصل عبر تلغرام @M20Y27</span>
          </button>
        </section>

        <div style={sx.version}>
          الإصدار الحالي: {appVersion}
          <br />
          آخر تحديث: {lastUpdated}
        </div>
      </main>
    </div>
  );
}

export default AboutPage;
