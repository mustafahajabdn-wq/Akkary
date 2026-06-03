import React from "react";
import { C } from "../../shared/constants/colors.js";
import { BackButton } from "../../shared/components/common/BackButton.jsx";
import { IslamicPattern, Wave } from "../../shared/components/icons.jsx";
import { S } from "../../shared/styles/primitives.js";

function PrivacyPolicyPage({ setPage, DC }) {
  DC = DC || C;

  const sections = [
    [
      "🪪",
      "بيانات الحساب",
      "نستخدم ما تُدخله من اسم ورقم هاتف وما يتصل بالحساب في إدارة الخدمة، وتمكينك من نشر الإعلانات والتفاعل معها.",
    ],
    [
      "📍",
      "الموقع",
      "يُستخدم الموقع لإظهار العقارات على الخريطة وتسهيل الوصول إليها، وقد يكون دقيقًا أو تقريبيًا بحسب ما يحدده ناشر الإعلان.",
    ],
    [
      "🖼️",
      "الصور والإعلانات",
      "تُعرض الصور والوصف والسعر ومواصفات العقار والمدينة والحي ضمن الإعلان لتمكين المستخدمين من الاطلاع الواضح عليه.",
    ],
    [
      "💬",
      "التواصل",
      "تُستخدم بيانات التواصل لربط الباحثين بصاحب الإعلان داخل المنصة، وتيسير عملية الاستفسار والتفاعل بين الأطراف.",
    ],
    [
      "🔔",
      "الإشعارات",
      "قد تصلك إشعارات متعلقة بالرسائل، أو حالة الإعلانات، أو التنبيهات الخاصة بالخدمة عند تفعيلها.",
    ],
    [
      "⭐",
      "المفضلة والمتابعات",
      "نحفظ بيانات المفضلة والمتابعات والبحث المحفوظ لتمكينك من الرجوع إليها وتسهيل استخدام المنصة.",
    ],
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
    footer: { background: DC.white, border: "1px solid " + DC.border, borderRadius: 16, padding: 14, marginTop: 10 },
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
          <div style={sx.introTitle}>خصوصيتك محلّ عناية</div>
          <p style={sx.text}>
            نلتزم بحماية بياناتك، ولا نستخدم منها إلا ما يلزم لتشغيل المنصة، وعرض الإعلانات، وتيسير التواصل، وتحسين الخدمة.
          </p>
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

        <div style={sx.footer}>
          <p style={sx.text}>
            قد نقوم بجمع بيانات استخدام عامة مثل التفاعل والمشاهدات لتحسين الأداء وتطوير الخدمة، دون المساس بخصوصية المستخدم أو مشاركة بياناته مع أطراف خارجية إلا عند الضرورة القانونية.
          </p>
        </div>
      </div>
    </div>
  );
}

export default PrivacyPolicyPage;
