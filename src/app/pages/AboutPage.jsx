import React from "react";
import { C } from "../../shared/constants/colors.js";
import { IslamicPattern, Wave } from "../../shared/components/icons.jsx";

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
      padding: "24px 18px 50px",
      color: "white",
    },
    heroInner: {
      position: "relative",
      zIndex: 1,
      maxWidth: 820,
      margin: "0 auto",
    },
    backButton: {
      border: "none",
      background: "rgba(255,255,255,0.16)",
      color: "white",
      borderRadius: 12,
      padding: "9px 13px",
      fontFamily: "inherit",
      fontSize: 13,
      fontWeight: 800,
      cursor: "pointer",
      marginBottom: 18,
    },
    badge: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      background: "rgba(255,255,255,0.12)",
      border: "1px solid rgba(255,255,255,0.18)",
      borderRadius: 999,
      padding: "6px 12px",
      fontSize: 12,
      fontWeight: 800,
      color: "rgba(255,255,255,0.88)",
      marginBottom: 12,
    },
    title: {
      fontSize: 25,
      fontWeight: 950,
      margin: 0,
      letterSpacing: "-0.2px",
    },
    subtitle: {
      fontSize: 13.5,
      lineHeight: 2,
      color: "rgba(255,255,255,0.78)",
      margin: "9px 0 0",
      maxWidth: 620,
    },
    content: {
      maxWidth: 820,
      margin: "-28px auto 0",
      padding: "0 14px",
      position: "relative",
      zIndex: 2,
    },
    card: {
      background: DC.white,
      border: "1px solid " + DC.border,
      borderRadius: 20,
      boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
      padding: "18px 18px 20px",
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: 950,
      color: C.primary,
      margin: "0 0 8px",
    },
    text: {
      fontSize: 14,
      lineHeight: 2,
      color: DC.text2,
      margin: 0,
    },
    list: {
      margin: "8px 0 0",
      paddingInlineStart: 22,
      color: DC.text2,
      fontSize: 14,
      lineHeight: 2,
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
      gap: 10,
      marginTop: 12,
    },
    stat: {
      background: DC.bg,
      border: "1px solid " + DC.border,
      borderRadius: 16,
      padding: "12px 13px",
    },
    statIcon: {
      fontSize: 22,
      marginBottom: 7,
    },
    statTitle: {
      fontSize: 13,
      fontWeight: 900,
      color: DC.text,
      marginBottom: 4,
    },
    statText: {
      fontSize: 12,
      color: DC.text3,
      lineHeight: 1.7,
    },
    versionRow: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      padding: "11px 0",
      borderTop: "1px solid " + DC.border,
      fontSize: 13,
    },
    versionLabel: {
      color: DC.text3,
      fontWeight: 700,
    },
    versionValue: {
      color: DC.text,
      fontWeight: 900,
      direction: "ltr",
    },
  };

  return (
    <div style={sx.page}>
      <div style={sx.hero}>
        <IslamicPattern opacity={0.09} color="#FFFFFF" />

        <div style={sx.heroInner}>
          <button type="button" onClick={() => setPage?.("profile")} style={sx.backButton}>
            → رجوع
          </button>

          <div style={sx.badge}>🌿 تطبيق عقاري في سوريا</div>
          <h1 style={sx.title}>حول طابو أخضر</h1>
          <p style={sx.subtitle}>
            طابو أخضر تطبيق عقاري يساعد المستخدمين على البحث عن الشقق والمنازل والمحلات والأراضي للبيع والإيجار، مع عرض التفاصيل والصور والموقع ووسائل التواصل مع المعلن.
          </p>
        </div>

        <Wave fill={DC.bg} />
      </div>

      <main style={sx.content}>
        <section style={sx.card}>
          <h2 style={sx.sectionTitle}>ما هو طابو أخضر؟</h2>
          <p style={sx.text}>
            طابو أخضر مساحة رقمية تجمع الإعلانات العقارية في مكان واحد، وتسهّل على الباحث الوصول إلى العقار المناسب بحسب النوع، المدينة، المنطقة، السعر، المساحة، والمواصفات.
          </p>
        </section>

        <section style={sx.card}>
          <h2 style={sx.sectionTitle}>ماذا يقدّم؟</h2>
          <ul style={sx.list}>
            <li>تصفح أحدث إعلانات البيع والإيجار.</li>
            <li>البحث بالفلاتر حسب المدينة والمنطقة ونوع العقار.</li>
            <li>عرض الصور والتفاصيل والموقع على الخريطة.</li>
            <li>التواصل المباشر مع صاحب الإعلان أو المكتب.</li>
            <li>حفظ الإعلانات والبحث المحفوظ ومتابعة الجديد.</li>
          </ul>
        </section>

        <section style={sx.card}>
          <h2 style={sx.sectionTitle}>مزايا أساسية</h2>
          <div style={sx.grid}>
            <div style={sx.stat}>
              <div style={sx.statIcon}>🔍</div>
              <div style={sx.statTitle}>بحث واضح</div>
              <div style={sx.statText}>فلاتر تساعدك في الوصول إلى العقار الأقرب لحاجتك.</div>
            </div>
            <div style={sx.stat}>
              <div style={sx.statIcon}>🗺️</div>
              <div style={sx.statTitle}>خريطة العقارات</div>
              <div style={sx.statText}>عرض المواقع الدقيقة أو التقريبية بحسب بيانات الإعلان.</div>
            </div>
            <div style={sx.stat}>
              <div style={sx.statIcon}>📱</div>
              <div style={sx.statTitle}>تجربة تطبيق</div>
              <div style={sx.statText}>واجهة مناسبة للهاتف مع إمكانية التثبيت كتطبيق ويب.</div>
            </div>
          </div>
        </section>

        <section style={sx.card}>
          <h2 style={sx.sectionTitle}>معلومات الإصدار</h2>
          <div style={sx.versionRow}>
            <span style={sx.versionLabel}>الإصدار الحالي</span>
            <span style={sx.versionValue}>{appVersion}</span>
          </div>
          <div style={sx.versionRow}>
            <span style={sx.versionLabel}>آخر تحديث</span>
            <span style={sx.versionValue}>{lastUpdated}</span>
          </div>
        </section>
      </main>
    </div>
  );
}

export default AboutPage;
