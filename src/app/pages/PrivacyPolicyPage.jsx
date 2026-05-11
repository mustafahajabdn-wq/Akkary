import React from "react";
import { C } from "../../shared/constants/colors.js";
import { BackButton } from "../../shared/components/common/BackButton.jsx";
import { IslamicPattern, Wave } from "../../shared/components/icons.jsx";
import { S } from "../../shared/styles/primitives.js";

function PrivacyPolicyPage({ setPage, DC }) {
  DC = DC || C;

  const sections = [
    ["🪪", "بيانات الحساب", "نستخدم الاسم ورقم الهاتف وما يتصل بالحساب لتقديم الخدمة وإدارة الإعلانات."],
    ["📍", "الموقع", "نستخدم الموقع لإظهار العقارات على الخريطة، وقد يكون الموقع دقيقًا أو تقريبيًا حسب اختيار صاحب الإعلان."],
    ["🖼️", "الصور والإعلانات", "تظهر الصور والوصف والسعر والمدينة والحي ضمن الإعلان حتى يراه الباحثون بوضوح."],
    ["💬", "التواصل", "تساعد بيانات التواصل على ربط الباحث بصاحب الإعلان داخل المنصة."],
    ["🔔", "الإشعارات", "قد تصلك تنبيهات عن الرسائل أو الأبحاث المحفوظة أو حالة إعلانك إذا فعّلت الإشعارات."],
    ["⭐", "المفضلة والمتابعات", "نحفظ المفضلة والمتابعات والأبحاث المحفوظة لتعود إليها بسرعة."],
  ];

  const sx = {
    page: { minHeight: "100vh", background: DC.bg, paddingBottom: 34, direction: "rtl" },
    hero: { background: C.primary, padding: "48px 16px 54px", position: "relative", overflow: "hidden" },
    title: { position: "relative", zIndex: 1, color: "#fff", fontSize: 23, fontWeight: 950, marginTop: 18 },
    subtitle: { position: "relative", zIndex: 1, color: "rgba(255,255,255,.82)", fontSize: 13, lineHeight: 1.9, marginTop: 8 },
    content: { padding: "14px 14px 0" },
    intro: { background: DC.white, border: "1px solid " + DC.border, borderRadius: 18, padding: 15, marginTop: -32, position: "relative", zIndex: 2, boxShadow: "0 10px 26px rgba(0,0,0,.08)" },
    introTitle: { fontSize: 15, fontWeight: 900, color: C.primary, marginBottom: 6 },
    text: { fontSize: 12.5, lineHeight: 2, color: DC.text2, margin: 0 },
    card: { background: DC.white, border: "1px solid " + DC.border, borderRadius: 16, padding: 14, marginTop: 10 },
    head: { display: "flex", alignItems: "center", gap: 10, marginBottom: 7 },
    icon: { width: 34, height: 34, borderRadius: 12, background: "#E8F4F0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 },
    cardTitle: { fontSize: 14, fontWeight: 900, color: DC.text },
  };

  return (
    <div style={sx.page}>
      <div style={sx.hero}>
        <IslamicPattern opacity={0.1} color="#FFFFFF" />
        <div style={S.absTopRight14}>
          <BackButton onPress={() => setPage ? setPage("profile") : window.history.back()} />
        </div>
        <div style={sx.title}>سياسة الخصوصية</div>
        <div style={sx.subtitle}>بيان مختصر عن استعمال البيانات داخل طابو أخضر.</div>
        <Wave />
      </div>

      <div style={sx.content}>
        <div style={sx.intro}>
          <div style={sx.introTitle}>خصوصيتك محل عناية</div>
          <p style={sx.text}>نستخدم البيانات اللازمة لتشغيل المنصة وإظهار الإعلانات وتسهيل التواصل والتنبيهات.</p>
        </div>

        {sections.map(([icon, title, body]) => (
          <section key={title} style={sx.card}>
            <div style={sx.head}>
              <div style={sx.icon}>{icon}</div>
              <div style={sx.cardTitle}>{title}</div>
            </div>
            <p style={sx.text}>{body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}

export default PrivacyPolicyPage;
