import React from "react";
import { useNavigate } from "react-router-dom";
import { C } from "../../shared/constants/colors.js";
import { IslamicPattern, Wave } from "../../shared/components/icons.jsx";

const styles = {
  page: {
    minHeight: "100vh",
    background: C.bg,
    fontFamily: "Tajawal, sans-serif",
    direction: "rtl",
    paddingBottom: 40,
  },
  hero: {
    position: "relative",
    overflow: "hidden",
    background: C.primary,
    padding: "22px 18px 38px",
    color: "white",
  },
  heroContent: {
    position: "relative",
    zIndex: 1,
    maxWidth: 760,
    margin: "0 auto",
  },
  backBtn: {
    border: "none",
    background: "rgba(255,255,255,0.16)",
    color: "white",
    borderRadius: 12,
    padding: "9px 12px",
    fontFamily: "inherit",
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 900,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.72)",
    lineHeight: 1.8,
  },
  content: {
    maxWidth: 760,
    margin: "-22px auto 0",
    padding: "0 16px",
    position: "relative",
    zIndex: 2,
  },
  card: {
    background: "white",
    borderRadius: 20,
    border: `1px solid ${C.border}`,
    boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
    padding: "18px 18px 20px",
  },
  intro: {
    fontSize: 14,
    color: C.text2,
    lineHeight: 2,
    marginBottom: 16,
  },
  section: {
    padding: "14px 0",
    borderTop: `1px solid ${C.border}`,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 900,
    color: C.text,
    marginBottom: 8,
  },
  list: {
    margin: 0,
    paddingInlineStart: 22,
    color: C.text2,
    fontSize: 14,
    lineHeight: 2,
  },
  paragraph: {
    color: C.text2,
    fontSize: 14,
    lineHeight: 2,
    margin: 0,
  },
  note: {
    marginTop: 16,
    background: C.primary + "12",
    border: `1px solid ${C.primary}33`,
    color: C.primary,
    borderRadius: 14,
    padding: "12px 14px",
    fontSize: 13,
    fontWeight: 800,
    lineHeight: 1.8,
  },
};

function TermsPage() {
  const navigate = useNavigate();

  return (
    <div style={styles.page}>
      <div style={styles.hero}>
        <IslamicPattern opacity={0.1} color="#FFFFFF" width={430} height={200} />

        <div style={styles.heroContent}>
          <button type="button" onClick={() => navigate(-1)} style={styles.backBtn}>
            ← رجوع
          </button>

          <div style={styles.title}>الشروط والأحكام</div>
          <div style={styles.subtitle}>
            يرجى قراءة هذه الشروط بعناية قبل استخدام المنصة أو نشر أي إعلان.
          </div>
        </div>

        <Wave />
      </div>

      <main style={styles.content}>
        <div style={styles.card}>
          <p style={styles.intro}>
            باستخدامك لمنصة طابو أخضر، أو بإنشاء حساب، أو بنشر إعلان، فإنك تقرّ بأنك قرأت هذه الشروط ووافقت عليها، وتتعهد بالالتزام بها.
          </p>

          <section style={styles.section}>
            <div style={styles.sectionTitle}>1. طبيعة الخدمة</div>
            <p style={styles.paragraph}>
              طابو أخضر منصة تقنية لعرض الإعلانات العقارية وربط المعلنين بالمهتمين. المنصة ليست طرفًا في أي بيع أو شراء أو إيجار أو اتفاق يتم بين المستخدمين.
            </p>
          </section>

          <section style={styles.section}>
            <div style={styles.sectionTitle}>2. مسؤولية المستخدم</div>
            <ul style={styles.list}>
              <li>يتحمل المستخدم المسؤولية الكاملة عن صحة البيانات التي يضيفها.</li>
              <li>يجب أن يكون للمستخدم الحق في نشر الإعلان، سواء كان مالكًا أو مفوضًا أو وسيطًا مخولًا.</li>
              <li>يمنع نشر إعلانات وهمية أو مضللة أو عقارات غير متاحة.</li>
              <li>يمنع وضع صور أو فيديوهات أو روابط لا تخص العقار المعلن عنه.</li>
            </ul>
          </section>

          <section style={styles.section}>
            <div style={styles.sectionTitle}>3. بيانات الإعلان</div>
            <ul style={styles.list}>
              <li>يجب أن تكون معلومات العقار والسعر والموقع ووسائل التواصل صحيحة قدر الإمكان.</li>
              <li>يحق لإدارة المنصة مراجعة الإعلان قبل نشره للعامة.</li>
              <li>قد يتم تعديل أو رفض أو حذف أي إعلان يخالف الشروط أو يسبب لبسًا للمستخدمين.</li>
            </ul>
          </section>

          <section style={styles.section}>
            <div style={styles.sectionTitle}>4. المحتوى المحظور</div>
            <ul style={styles.list}>
              <li>يمنع نشر أي محتوى مخالف للقانون أو العرف العام.</li>
              <li>يمنع نشر محتوى مسيء أو احتيالي أو ينتهك حقوق الآخرين.</li>
              <li>يمنع استخدام المنصة للإزعاج أو التضليل أو جمع بيانات المستخدمين بطرق غير مشروعة.</li>
            </ul>
          </section>

          <section style={styles.section}>
            <div style={styles.sectionTitle}>5. حقوق المنصة</div>
            <ul style={styles.list}>
              <li>تحتفظ المنصة بحق مراجعة الإعلانات والحسابات عند الحاجة.</li>
              <li>تحتفظ المنصة بحق حذف أي إعلان مخالف أو تعليق أي حساب يستخدم المنصة بشكل غير مناسب.</li>
              <li>يجوز للمنصة تطوير أو تعديل بعض الميزات أو السياسات لتحسين الخدمة.</li>
            </ul>
          </section>

          <section style={styles.section}>
            <div style={styles.sectionTitle}>6. التواصل والخصوصية</div>
            <p style={styles.paragraph}>
              قد تُستخدم بيانات التواصل التي يضيفها المستخدم داخل الإعلان لتسهيل التواصل بين الأطراف، وقد تُحفظ بعض البيانات التشغيلية مثل عدد النقرات وتاريخ النشر والمراجعة لأغراض تحسين الخدمة والحماية.
            </p>
          </section>

          <section style={styles.section}>
            <div style={styles.sectionTitle}>7. الرسوم</div>
            <p style={styles.paragraph}>
              قد تفرض المنصة رسومًا رمزية أو اختيارية على بعض الخدمات أو العمليات وفق السياسة المعتمدة داخل التطبيق، ويتم توضيح ذلك عند الحاجة.
            </p>
          </section>

          <section style={styles.section}>
            <div style={styles.sectionTitle}>8. إخلاء المسؤولية</div>
            <p style={styles.paragraph}>
              لا تضمن المنصة صحة جميع الإعلانات المنشورة، ولا تتحمل مسؤولية الاتفاقات أو الصفقات التي تتم بين المستخدمين خارج نطاق إدارتها المباشرة.
            </p>
          </section>

          <div style={styles.note}>
            استمرارك في استخدام المنصة يعني موافقتك على هذه الشروط، وقد يتم تحديثها عند الحاجة.
          </div>
        </div>
      </main>
    </div>
  );
}

export default TermsPage;
