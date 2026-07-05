const SITE_URL = "https://www.blabladar.com";
const FALLBACK_WA = "963000000000";
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;

function cleanPhone(value = "") {
  return String(value || "").replace(/[^0-9]/g, "");
}

function escapeHtml(value = "") {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function fetchWhatsappOffer() {
  if (!SUPABASE_URL || !SUPABASE_KEY) return FALLBACK_WA;

  try {
    const endpoint = `${SUPABASE_URL}/rest/v1/app_settings?select=value&key=eq.whatsapp_offer&limit=1`;
    const response = await fetch(endpoint, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) return FALLBACK_WA;

    const rows = await response.json();
    const value = rows?.[0]?.value;
    const clean = cleanPhone(
      typeof value === "string" || typeof value === "number"
        ? value
        : JSON.stringify(value || "")
    );

    return clean || FALLBACK_WA;
  } catch (error) {
    console.warn("[add-whatsapp] failed to load whatsapp_offer:", error);
    return FALLBACK_WA;
  }
}

function buildHtml(waNumber) {
  const safeNumber = cleanPhone(waNumber) || FALLBACK_WA;
  const safeJsonNumber = JSON.stringify(safeNumber);

  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="robots" content="noindex, nofollow">
  <meta name="theme-color" content="#1A4A2E">
  <meta http-equiv="Cache-Control" content="no-store, no-cache, must-revalidate, max-age=0">
  <meta http-equiv="Pragma" content="no-cache">
  <meta http-equiv="Expires" content="0">
  <title>أعلن عبر واتساب | طابو أخضر</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      background: #F4F7F5;
      color: #1A1A1A;
      font-family: Tajawal, Arial, sans-serif;
      direction: rtl;
    }
    .hero {
      position: relative;
      overflow: hidden;
      background: #1A4A2E;
      padding: 44px 16px 54px;
      color: #fff;
    }
    .home {
      position: absolute;
      top: 14px;
      right: 14px;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      border: 0;
      border-radius: 20px;
      background: rgba(255,255,255,.18);
      color: #fff;
      padding: 7px 14px;
      font: inherit;
      font-size: 13px;
      font-weight: 800;
      text-decoration: none;
    }
    .title { position: relative; z-index: 1; margin: 22px 0 6px; font-size: 22px; font-weight: 950; }
    .sub { position: relative; z-index: 1; margin: 0; color: rgba(255,255,255,.78); font-size: 13px; line-height: 1.8; }
    .wrap { position: relative; z-index: 2; margin-top: -30px; padding: 0 14px 40px; }
    .card {
      max-width: 620px;
      margin: 0 auto 14px;
      background: #fff;
      border: 1px solid #E0DBD0;
      border-radius: 20px;
      padding: 20px 16px;
      box-shadow: 0 10px 28px rgba(0,0,0,.08);
    }
    .section-label {
      margin: 0 0 12px;
      color: #737373;
      font-size: 11px;
      font-weight: 900;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .chips { display: flex; flex-wrap: wrap; gap: 7px; }
    .chip {
      border: 1.5px solid #E0DBD0;
      border-radius: 20px;
      background: #fff;
      color: #555;
      padding: 7px 14px;
      font: inherit;
      font-size: 13px;
      font-weight: 600;
    }
    .chip.active { border-color: #1A4A2E; background: #1A4A2E; color: #fff; font-weight: 900; }
    label { display: block; margin: 0 0 14px; }
    .label { display: block; margin: 0 0 6px; padding-right: 2px; color: #1A4A2E; font-size: 12px; font-weight: 900; }
    input, select, textarea {
      width: 100%;
      border: 1.5px solid #E0DBD0;
      border-radius: 12px;
      background: #fff;
      color: #1A1A1A;
      padding: 11px 13px;
      font: inherit;
      font-size: 14px;
      outline: 0;
      direction: rtl;
    }
    textarea { min-height: 105px; resize: vertical; line-height: 1.7; }
    .note {
      max-width: 620px;
      margin: 0 auto 14px;
      border-radius: 12px;
      background: #FEF3C7;
      color: #92400E;
      padding: 10px 14px;
      font-size: 12px;
      line-height: 1.7;
    }
    .send {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      max-width: 620px;
      margin: 0 auto;
      border: 0;
      border-radius: 16px;
      background: #25D366;
      color: #fff;
      padding: 15px 0;
      font: inherit;
      font-size: 16px;
      font-weight: 950;
      box-shadow: 0 4px 16px rgba(37,211,102,.35);
    }
    .sent {
      display: none;
      max-width: 620px;
      margin: 0 auto 14px;
      border: 1px solid #BBF7D0;
      border-radius: 16px;
      background: #F0FDF4;
      color: #166534;
      padding: 12px 14px;
      font-size: 13px;
      line-height: 1.8;
      text-align: center;
    }
    .disabled { opacity: .55; pointer-events: none; }
  </style>
</head>
<body>
  <header class="hero">
    <a class="home" href="${escapeHtml(SITE_URL)}/">🏠 الرئيسية</a>
    <h1 class="title">أعلن بدون تسجيل دخول</h1>
    <p class="sub">املأ التفاصيل وسنرسلها مباشرة عبر واتساب 💬</p>
  </header>

  <main class="wrap">
    <section class="card" aria-label="نوع العرض">
      <p class="section-label">نوع العرض</p>
      <div class="chips" data-group="offer">
        <button class="chip active" type="button" data-value="للبيع">للبيع</button>
        <button class="chip" type="button" data-value="للإيجار">للإيجار</button>
        <button class="chip" type="button" data-value="مطلوب شراء">مطلوب شراء</button>
        <button class="chip" type="button" data-value="مطلوب إيجار">مطلوب إيجار</button>
      </div>
    </section>

    <section class="card" aria-label="نوع العقار">
      <p class="section-label">نوع العقار</p>
      <div class="chips" data-group="type">
        <button class="chip active" type="button" data-value="شقة">شقة</button>
        <button class="chip" type="button" data-value="منزل">منزل</button>
        <button class="chip" type="button" data-value="أرض">أرض</button>
        <button class="chip" type="button" data-value="محل تجاري">محل تجاري</button>
        <button class="chip" type="button" data-value="مكتب">مكتب</button>
        <button class="chip" type="button" data-value="مستودع">مستودع</button>
        <button class="chip" type="button" data-value="فيلا">فيلا</button>
        <button class="chip" type="button" data-value="استوديو">استوديو</button>
        <button class="chip" type="button" data-value="غرفة">غرفة</button>
        <button class="chip" type="button" data-value="عقار آخر">عقار آخر</button>
      </div>
    </section>

    <section class="card" aria-label="الموقع">
      <p class="section-label">الموقع</p>
      <label>
        <span class="label">المدينة *</span>
        <select id="city">
          <option value="">اختر المدينة</option>
          <option>دمشق</option>
          <option>حلب</option>
          <option>حمص</option>
          <option>حماة</option>
          <option>اللاذقية</option>
          <option>طرطوس</option>
          <option>دير الزور</option>
          <option>الرقة</option>
          <option>إدلب</option>
          <option>السويداء</option>
          <option>درعا</option>
          <option>القنيطرة</option>
          <option>ريف دمشق</option>
        </select>
      </label>
      <label>
        <span class="label">الحي أو المنطقة</span>
        <input id="district" type="text" placeholder="مثال: المزة، الفردوس...">
      </label>
    </section>

    <section class="card" aria-label="التفاصيل">
      <p class="section-label">التفاصيل</p>
      <label>
        <span class="label">المساحة (م²)</span>
        <input id="area" type="number" inputmode="numeric" placeholder="مثال: 120">
      </label>
      <label>
        <span class="label">السعر</span>
        <input id="price" type="text" placeholder="مثال: 50,000$ أو 500,000 ليرة">
      </label>
      <label>
        <span class="label">وصف الإعلان *</span>
        <textarea id="desc" placeholder="اكتب تفاصيل إضافية عن العقار..."></textarea>
      </label>
    </section>

    <div class="note">📸 بعد إرسال الرسالة، يمكنك إضافة صور العقار مباشرة في محادثة واتساب.</div>
    <div id="sent" class="sent">تم فتح واتساب. تحقق من التطبيق وأرسل الرسالة المُعدّة.</div>
    <button id="send" class="send" type="button"><span>💬</span> إرسال عبر واتساب</button>
  </main>

  <script>
    (function () {
      var waNumber = ${safeJsonNumber};
      var state = { offer: "للبيع", type: "شقة" };

      function $(id) { return document.getElementById(id); }
      function val(id) { var el = $(id); return el && el.value ? String(el.value).trim() : ""; }

      function setGroup(groupEl, button) {
        var group = groupEl.getAttribute("data-group");
        var buttons = groupEl.querySelectorAll(".chip");
        for (var i = 0; i < buttons.length; i += 1) buttons[i].className = "chip";
        button.className = "chip active";
        state[group] = button.getAttribute("data-value") || button.textContent || "";
      }

      function buildMessage() {
        var city = val("city");
        var district = val("district");
        var area = val("area");
        var price = val("price");
        var desc = val("desc") || "(لم يُكتب وصف)";
        var cityLine = city ? city + (district ? " — " + district : "") : "(لم يُحدَّد)";
        var lines = [
          "إعلان عقاري — " + state.offer,
          "النوع: " + state.type,
          "الموقع: " + cityLine,
          area ? "المساحة: " + area + " م²" : null,
          price ? "السعر: " + price : null,
          "التفاصيل: " + desc,
          "",
          "— أُرسل عبر طابو أخضر"
        ];
        var out = [];
        for (var i = 0; i < lines.length; i += 1) if (lines[i] !== null) out.push(lines[i]);
        return out.join("\n");
      }

      function openWhatsApp(url) {
        var ua = navigator.userAgent || "";
        var inApp = /FBAN|FBAV|FB_IAB|Instagram/i.test(ua);

        if (inApp) {
          window.location.href = url;
          return;
        }

        var opened = null;
        try { opened = window.open(url, "_blank", "noopener,noreferrer"); } catch (e) {}
        if (!opened) window.location.href = url;
      }

      document.addEventListener("click", function (event) {
        var target = event.target;
        if (!target || !target.className || String(target.className).indexOf("chip") === -1) return;
        var groupEl = target.parentNode;
        if (!groupEl || !groupEl.getAttribute("data-group")) return;
        setGroup(groupEl, target);
      });

      $("send").addEventListener("click", function () {
        if (!waNumber || waNumber === "963000000000") {
          alert("تعذر تحميل رقم واتساب حاليًا. افتح الصفحة مرة أخرى أو تواصل مع الإدارة.");
          return;
        }

        var url = "https://api.whatsapp.com/send?phone=" + encodeURIComponent(waNumber) + "&text=" + encodeURIComponent(buildMessage());
        $("sent").style.display = "block";
        openWhatsApp(url);
      });
    }());
  </script>
</body>
</html>`;
}

export default async function handler(req, res) {
  const waNumber = await fetchWhatsappOffer();

  res.statusCode = 200;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.end(buildHtml(waNumber));
}
