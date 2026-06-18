import React from "react";
import ReactDOM from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.jsx";
import { installGlobalErrorLogger } from "../shared/services/errorLogger.js";
import { startVisitorPresence } from "../shared/services/visitorPresence.js";
import { shouldStartVisitorPresence } from "../shared/utils/realtimePolicy.js";
import { startCacheVersionWatcher } from "../shared/services/cacheVersionService.js";
import { installAddPageDraftDebounce } from "../shared/utils/addPageDraftDebounce.js";

// ── تجاهل تحذير قفل Supabase (معروف وغير ضار) ──────────────────
// يحدث عندما يتسابق طلبان على auth token (تبويبين، أو OAuth retry + subscribe)
if (typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", event => {
    const msg = event.reason?.message || "";

    if (
      msg.includes("Lock") &&
      msg.includes("was released because another request stole it")
    ) {
      event.preventDefault();
    }
  });
}

// تخفيف حفظ مسودة صفحة إضافة الإعلان: آخر تغيير فقط يُكتب بعد 700ms.
installAddPageDraftDebounce(700);

// تسجيل الدخول بواسطة Facebook جاهز ويعمل، لكنه مخفي مؤقتًا حتى يصبح تطبيق Meta منشورًا للعامة.
// لإظهاره لاحقًا: أعد استيراد installFacebookLoginEnhancer وشغّل installFacebookLoginEnhancer().

// تسجيل أخطاء المستخدمين
installGlobalErrorLogger();

// تسجيل حضور المتصفح بعد أول رسم للصفحة فقط، وليس أثناء فحوصات الأداء أو الصفحات العامة.
if (typeof window !== "undefined" && shouldStartVisitorPresence()) {
  const startPresence = () => startVisitorPresence();

  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(startPresence, { timeout: 2500 });
  } else {
    window.setTimeout(startPresence, 2000);
  }
}

const updateSW = registerSW({
  immediate: true,

  onNeedRefresh() {
    updateSW(true);
  },

  onRegisterError(error) {
    console.error("SW registration failed:", error);
  }
});

// مراقبة رقم إصدار الكاش من app_settings.
// عند تغييره من لوحة الإدارة يُمسح Cache Storage وتُعاد الصفحة بأحدث نسخة.
startCacheVersionWatcher();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
