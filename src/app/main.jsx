import React from "react";
import ReactDOM from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.jsx";
import { installGlobalErrorLogger } from "../shared/services/errorLogger.js";
import { startVisitorPresence } from "../shared/services/visitorPresence.js";
import { shouldStartVisitorPresence } from "../shared/utils/realtimePolicy.js";
import { startCacheVersionWatcher } from "../shared/services/cacheVersionService.js";
import { installAddPageDraftDebounce } from "../shared/utils/addPageDraftDebounce.js";
import { installRestrictedAreaGuards } from "../shared/utils/installRestrictedAreaGuards.js";
import { installGeoCacheMigration } from "../shared/utils/installGeoCacheMigration.js";
import { installGeoCacheMigrationV9 } from "../shared/utils/installGeoCacheMigrationV9.js";
import { primeRestrictedAreaRules } from "../shared/services/restrictedAreaRulesService.js";
import RestrictedAreaNotice from "../shared/components/common/RestrictedAreaNotice.jsx";
import LocationTerminologyObserver from "../shared/components/common/LocationTerminologyObserver.jsx";
import ReportReasonObserver from "../shared/components/common/ReportReasonObserver.jsx";

installGeoCacheMigration();
installGeoCacheMigrationV9();

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

installAddPageDraftDebounce(700);
installRestrictedAreaGuards();

if (typeof window !== "undefined") {
  const primeRestrictions = () => primeRestrictedAreaRules();

  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(primeRestrictions, { timeout: 2500 });
  } else {
    window.setTimeout(primeRestrictions, 1200);
  }
}

installGlobalErrorLogger();

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

startCacheVersionWatcher();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
    <RestrictedAreaNotice />
    <LocationTerminologyObserver />
    <ReportReasonObserver />
  </React.StrictMode>
);
