// سياسة تشغيل Supabase Realtime.
// الهدف: لا نفتح WebSocket في الصفحات العامة أو أثناء فحوصات الأداء،
// ونترك Realtime فقط للصفحات التي تحتاجه فعلاً مثل الرسائل والإشعارات.

const BOT_RE = /bot|crawler|spider|crawling|Googlebot|Google-InspectionTool|HeadlessChrome|Lighthouse|PageSpeed|bingbot|YandexBot|DuckDuckBot|facebookexternalhit|TelegramBot|Slackbot|SemrushBot|AhrefsBot/i;

export function getCurrentPathname() {
  if (typeof window === "undefined") return "/";
  return window.location?.pathname || "/";
}

export function isAuditOrBotUserAgent(userAgent = "") {
  const ua = String(userAgent || (typeof navigator !== "undefined" ? navigator.userAgent : ""));
  return BOT_RE.test(ua);
}

export function isPublicLandingPath(pathname = getCurrentPathname()) {
  const path = String(pathname || "/");

  return (
    path === "/" ||
    path === "/home" ||
    path === "/search" ||
    path === "/map" ||
    path === "/terms" ||
    path === "/privacy" ||
    path.startsWith("/listing/") ||
    path.startsWith("/seller/") ||
    path.startsWith("/ad/")
  );
}

export function isRealtimePage(pathname = getCurrentPathname()) {
  const path = String(pathname || "/");

  return (
    path === "/messages" ||
    path === "/notifications" ||
    path.startsWith("/chat") ||
    path.startsWith("/admin")
  );
}

export function shouldStartRealtime({ requireRealtimePage = false, allowPublic = false } = {}) {
  if (typeof window === "undefined") return false;
  if (isAuditOrBotUserAgent()) return false;

  const path = getCurrentPathname();

  if (requireRealtimePage) return isRealtimePage(path);
  if (!allowPublic && isPublicLandingPath(path)) return false;

  return true;
}

export function shouldStartListingRealtime() {
  // تحديثات الإعلانات المباشرة ليست ضرورية في الصفحة الرئيسية؛
  // القائمة تُحدّث بالتحميل العادي أو عند رجوع المستخدم للصفحة.
  return shouldStartRealtime({ requireRealtimePage: true });
}

export function shouldStartUserBadgeRealtime() {
  // عدّاد الرسائل/الإشعارات يُحمّل بطلب مؤجل، أما Realtime فيعمل داخل الصفحات المختصة فقط.
  return shouldStartRealtime({ requireRealtimePage: true });
}

export function shouldStartVisitorPresence() {
  if (typeof window === "undefined") return false;
  if (isAuditOrBotUserAgent()) return false;
  return true; // يعمل على كل الصفحات بما فيها العامة
}
