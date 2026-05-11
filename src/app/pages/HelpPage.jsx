import React from "react";
import { C } from "../../shared/constants/colors.js";
import { BackButton } from "../../shared/components/common/BackButton.jsx";
import { IslamicPattern, Wave } from "../../shared/components/icons.jsx";
import { S } from "../../shared/styles/primitives.js";

const helpSections = [
  {
    icon: "🌿",
    title: "ما طابو أخضر؟",
    body: [
      "طابو أخضر منصة عقارية تجمع شتات العروض والطلبات في موضع واحد؛ فيها يلتقي من يعرض عقارًا بمن يطلبه، ومن يبيع بمن يشتري، ومن يؤجّر بمن يستأجر.",
      "غايتنا أن نقرّب لك البعيد، ونرتّب لك الخيارات، ونكشف لك الطريق؛ فلا تضيع بين الإعلانات، ولا تمضي في طلبك على غير هدى."
    ]
  },
  {
    icon: "🔍",
    title: "البحث عن عقار",
    body: [
      "البحث يبدأ من الفلاتر؛ فهي مفاتيح السوق. بها تحدد النوع، والمدينة، والحي، والسعر، والمساحة، والطابق، والغرف، والجهة، ونوع الطابو.",
      "كلما أحكمت الفلاتر صارت النتائج أدنى إلى مطلبك، وأقرب إلى ما في بالك."
    ]
  },
  {
    icon: "✨",
    title: "الفلتر السريع",
    body: [
      "تحت الفلاتر تجد أزرارًا خفيفة مثل: جديد، شقة، محل. جُعلت هذه الأزرار لاختصار الطريق لمن أراد العجلة.",
      "زر جديد يعرض الإعلانات الحديثة، وزر شقة يفتح لك باب الشقق، وزر محل يقرّب إليك المحلات التجارية. وإذا ضغطت الخيار المختار مرة أخرى عاد البحث كما كان.",
      "فالفلتر السريع لمن أراد السرعة، والفلاتر المفصلة لمن أراد الدقة."
    ]
  },
  {
    icon: "🏷️",
    title: "أنواع الإعلانات",
    body: [
      "للبيع: عقار معروض لمن أراد الشراء.",
      "للإيجار: عقار معروض لمن أراد السكن أو العمل بأجرة.",
      "مطلوب شراء: طلب يكتبه من يبحث عن عقار ليشتريه.",
      "مطلوب للإيجار: طلب يكتبه من يبحث عن عقار ليستأجره.",
      "ولكل نوع لون يميّزه في القائمة والخريطة، حتى تعرفه من النظرة الأولى."
    ]
  },
  {
    icon: "➕",
    title: "إضافة إعلان",
    body: [
      "إذا أردت نشر إعلان، فاضغط زر الإضافة، ثم اختر نوع الإعلان وفئته، واكتب ما يعرّف الناس بعقارك.",
      "اجعل عنوانك قصيرًا دالًا، ووصفك صادقًا غير مموّه، واذكر السعر إن شئت، واختر المدينة والحي بدقة، وأضف الصور ما استطعت، فإن الصورة شاهدة.",
      "وقد يمر الإعلان بالمراجعة قبل ظهوره، صيانةً للمنصة وحفظًا لجودة ما يُنشر فيها."
    ]
  },
  {
    icon: "🗺️",
    title: "الخريطة والبالونات",
    body: [
      "الخريطة عين ثانية ترى بها مواضع العقارات. تظهر الإعلانات فيها كبالونات ملوّنة، ولكل لون دلالة على نوع الإعلان.",
      "إذا كان السعر مذكورًا ظهر داخل البالونة، وإذا لم يكن مذكورًا ظهرت علامة الرسالة 💬، ومعناها أن السعر يُعرف عند التواصل."
    ]
  },
  {
    icon: "📍",
    title: "الدقيق والتقريبي",
    body: [
      "الموقع الدقيق: إذا حدّد صاحب الإعلان موضع العقار بدقة، ظهرت البالونة في مكانها مباشرة، بلا دائرة نابضة. وهذا يدل على أن النقطة أقرب إلى موضع العقار نفسه.",
      "الموقع التقريبي: إذا كان الموضع غير محدد بدقة، أو أراد صاحب الإعلان حفظ شيء من الخصوصية، ظهر الإعلان في ناحية تقريبية وتراه بدائرة نابضة حوله.",
      "والدائرة النابضة معناها: العقار في هذه الجهة أو قربها، لا في هذه النقطة بعينها؛ فاسأل صاحبه عن الموضع التفصيلي عند التواصل."
    ]
  },
  {
    icon: "⭐",
    title: "المحفوظات",
    body: [
      "إذا وجدت بحثًا يوافق حاجتك فاحفظه؛ فحفظ البحث يعيدك إلى نفس الشروط بلا تعب ولا إعادة.",
      "وهذا نافع لمن يراقب حيًا محددًا، أو ينتظر سعرًا مناسبًا، أو يبحث عن صفة نادرة في السوق."
    ]
  },
  {
    icon: "🔔",
    title: "تنبيه إعلان مناسب",
    body: [
      "إذا حفظت بحثًا وفعّلت التنبيه، صار طابو أخضر يرقب لك الجديد.",
      "فإذا نُشر إعلان يوافق شروط بحثك، جاءك إشعار يخبرك به. مثال ذلك: تحفظ بحثًا عن شقة للبيع في حي معيّن، بسعر ومساحة محددين، فإذا ظهر إعلان مطابق وصلك التنبيه سريعًا.",
      "وهذه من أنفع مزايا المنصة لمن يتابع السوق بجد، ولا يريد أن يفوته العرض الملائم."
    ]
  },
  {
    icon: "📣",
    title: "الإشعارات",
    body: [
      "الإشعارات رسل قصيرة تنبّهك إلى ما يهمك: رسالة جديدة، أو إعلان يوافق بحثًا محفوظًا، أو قبول إعلانك ومراجعته، أو أمر مهم في حسابك.",
      "ولكي تنتفع بها، اسمح للتطبيق بإرسال الإشعارات، وفعّل التنبيهات في الأبحاث المحفوظة التي تعنيك.",
      "فالإشعار عين ساهرة؛ يخبرك بالجديد من غير أن تظل واقفًا على الباب."
    ]
  },
  {
    icon: "🤍",
    title: "المفضلة والحالات",
    body: [
      "إذا أعجبك إعلان، فاضغط القلب واحفظه في المفضلة، فتجمع ما لفت نظرك وتعود إليه عند المقارنة أو التواصل.",
      "أما الحالات فهي باب لمتابعة البائعين وأصحاب المكاتب؛ فإذا تابعت بائعًا رأيت ما ينشره من جديده وعروضه وأخباره."
    ]
  },
  {
    icon: "🛡️",
    title: "نصائح الأمان",
    body: [
      "لا تدفع مالًا قبل المعاينة والتحقق، ولا تعتمد على الصور وحدها، وتأكد من الأوراق والملكية قبل الاتفاق.",
      "احذر العرض الرخيص بلا سبب واضح، ولا تشارك معلوماتك الحساسة إلا عند الحاجة ومع من تثق به.",
      "ومن تأنّى سلم، ومن استعجل ندم."
    ]
  }
];

const quickFaq = [
  ["ما معنى 💬 على الخريطة؟", "تعني أن السعر غير مذكور، وأن معرفته تكون عند التواصل مع صاحب الإعلان."],
  ["ما فائدة حفظ البحث؟", "يجعلك تعود إلى نفس الشروط سريعًا، ويمكنك ربطه بتنبيه عند ظهور إعلان مناسب."],
  ["هل الموقع دقيق دائمًا؟", "ليس دائمًا؛ إن رأيت دائرة نابضة فالموقع تقريبي وفي تلك الناحية لا في النقطة بعينها."],
  ["لماذا لا يظهر إعلاني مباشرة؟", "قد يمر الإعلان بالمراجعة قبل النشر، حفظًا لجودة المحتوى وسلامة المنصة."]
];

function HelpPage({ setPage, DC }) {
  DC = DC || C;

  const sx = {
    page: {
      minHeight: "100vh",
      background: DC.bg,
      paddingBottom: 34
    },
    hero: {
      background: `linear-gradient(135deg, ${C.primary} 0%, #0F3020 100%)`,
      padding: "48px 16px 54px",
      position: "relative",
      overflow: "hidden"
    },
    title: {
      position: "relative",
      zIndex: 1,
      color: "#fff",
      fontSize: 23,
      fontWeight: 950,
      marginTop: 18
    },
    subtitle: {
      position: "relative",
      zIndex: 1,
      color: "rgba(255,255,255,.82)",
      fontSize: 13,
      lineHeight: 1.9,
      marginTop: 8,
      maxWidth: 520
    },
    content: {
      padding: "14px 14px 0"
    },
    introCard: {
      background: DC.white,
      border: "1px solid " + DC.border,
      borderRadius: 18,
      padding: "15px 16px",
      marginTop: -32,
      position: "relative",
      zIndex: 2,
      boxShadow: "0 10px 26px rgba(0,0,0,.08)"
    },
    introTitle: {
      fontSize: 15,
      fontWeight: 900,
      color: C.primary,
      marginBottom: 6
    },
    introText: {
      fontSize: 12.5,
      lineHeight: 2,
      color: DC.text2,
      margin: 0
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "1fr",
      gap: 10,
      marginTop: 14
    },
    card: {
      background: DC.white,
      border: "1px solid " + DC.border,
      borderRadius: 16,
      padding: "14px 14px 13px",
      overflow: "hidden"
    },
    cardHead: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      marginBottom: 8
    },
    iconBox: {
      width: 34,
      height: 34,
      borderRadius: 12,
      background: "#E8F4F0",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 18,
      flexShrink: 0
    },
    cardTitle: {
      fontSize: 14,
      fontWeight: 900,
      color: DC.text
    },
    paragraph: {
      fontSize: 12.5,
      lineHeight: 2,
      color: DC.text2,
      margin: "5px 0 0"
    },
    faqTitle: {
      marginTop: 18,
      marginBottom: 8,
      fontSize: 12,
      fontWeight: 900,
      color: DC.text3
    },
    faqCard: {
      background: DC.white,
      border: "1px solid " + DC.border,
      borderRadius: 16,
      overflow: "hidden"
    },
    faqRow: i => ({
      padding: "13px 14px",
      borderBottom: i < quickFaq.length - 1 ? "1px solid " + DC.border : "none"
    }),
    question: {
      fontSize: 13,
      fontWeight: 900,
      color: DC.text,
      marginBottom: 5
    },
    answer: {
      fontSize: 12,
      lineHeight: 1.9,
      color: DC.text2
    },
    closeWord: {
      marginTop: 14,
      padding: "14px 15px",
      borderRadius: 16,
      background: "#FFFBEB",
      border: "1px solid #FEF3C7",
      color: "#92400E",
      fontSize: 12.5,
      lineHeight: 2,
      fontWeight: 700
    }
  };

  return (
    <div style={sx.page} dir="rtl">
      <div style={sx.hero}>
        <IslamicPattern opacity={0.1} color="#FFFFFF" />
        <div style={S.absTopRight14}>
          <BackButton onPress={() => setPage ? setPage("settings") : window.history.back()} />
        </div>
        <div style={sx.title}>مساعدة طابو أخضر</div>
        <div style={sx.subtitle}>
          دليلك إلى العقار، ورفيقك في البحث، وعونك في العرض والطلب؛ بيانٌ موجز، واضح السبيل، يقرّب لك ما تحتاجه في المنصة.
        </div>
        <Wave />
      </div>

      <div style={sx.content}>
        <div style={sx.introCard}>
          <div style={sx.introTitle}>مرحبًا بك</div>
          <p style={sx.introText}>
            هنا خلاصة ما يعينك على استعمال طابو أخضر: كيف تبحث، وكيف تنشر، وكيف تحفظ، وكيف تقرأ الخريطة، ومتى يصلك التنبيه.
          </p>
        </div>

        <div style={sx.grid}>
          {helpSections.map(section => (
            <section key={section.title} style={sx.card}>
              <div style={sx.cardHead}>
                <div style={sx.iconBox}>{section.icon}</div>
                <div style={sx.cardTitle}>{section.title}</div>
              </div>
              {section.body.map((p, i) => (
                <p key={i} style={sx.paragraph}>{p}</p>
              ))}
            </section>
          ))}
        </div>

        <div style={sx.faqTitle}>أسئلة يكثر ورودها</div>
        <div style={sx.faqCard}>
          {quickFaq.map(([q, a], i) => (
            <div key={q} style={sx.faqRow(i)}>
              <div style={sx.question}>{q}</div>
              <div style={sx.answer}>{a}</div>
            </div>
          ))}
        </div>

        <div style={sx.closeWord}>
          طابو أخضر صُنع ليجمع المتفرق، ويهديك إلى الطريق الأقرب. فاستعمل الفلاتر بإحكام، واحفظ ما يهمك، وفعّل التنبيه لما تنتظره، وتحقق قبل الاتفاق؛ تبلغ حاجتك على بصيرة وتمضي مطمئنًا.
        </div>
      </div>
    </div>
  );
}

export default HelpPage;
