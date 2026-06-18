import { getSupabase } from "./supabaseClient.js";
import { clearAllRuntimeCache } from "../utils/cache.js";

export const FORCE_CACHE_VERSION_KEY = "force_cache_version";

const LOCAL_VERSION_KEY = "aqari_force_cache_version";
const RELOAD_GUARD_KEY = "aqari_force_cache_reload_in_progress";
const POLL_INTERVAL_MS = 60 * 1000;
const EMPTY_BASELINE_VERSION = "0";

let watcherStarted = false;
let baselineReady = false;
let realtimeChannel = null;
let pollTimer = null;
let messageListenerInstalled = false;
let refreshInProgress = false;

function normalizeVersion(value) {
  if (value === null || value === undefined) return "";

  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  return String(value).trim();
}

function readLocalVersion() {
  if (typeof window === "undefined") return "";

  try {
    return localStorage.getItem(LOCAL_VERSION_KEY) || "";
  } catch {
    return "";
  }
}

function writeLocalVersion(version) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(LOCAL_VERSION_KEY, normalizeVersion(version));
  } catch {}
}

function reloadWithVersion(version) {
  if (typeof window === "undefined") return;

  const normalized = normalizeVersion(version) || String(Date.now());

  try {
    if (sessionStorage.getItem(RELOAD_GUARD_KEY) === normalized) return;
    sessionStorage.setItem(RELOAD_GUARD_KEY, normalized);
  } catch {}

  const url = new URL(window.location.href);
  url.searchParams.set("app_version", normalized);
  window.location.replace(url.toString());
}

async function clearBrowserCachesDirectly() {
  if (typeof window === "undefined" || !("caches" in window)) return;

  const names = await caches.keys();
  await Promise.all(names.map(name => caches.delete(name)));
}

async function clearApplicationDataCaches() {
  try {
    // يمسح فقط كاش القوائم والتفاصيل والصور الخاص بالتطبيق.
    // لا يمسح جلسة الدخول أو مسودات إضافة الإعلانات.
    await clearAllRuntimeCache();
  } catch (error) {
    console.warn("Application data cache clear failed:", error);
  }
}

function installServiceWorkerMessageListener() {
  if (
    messageListenerInstalled ||
    typeof navigator === "undefined" ||
    !("serviceWorker" in navigator)
  ) {
    return;
  }

  messageListenerInstalled = true;

  navigator.serviceWorker.addEventListener("message", event => {
    if (event.data?.type !== "FORCE_APP_RELOAD") return;

    const version = normalizeVersion(event.data?.version) || String(Date.now());
    writeLocalVersion(version);
    reloadWithVersion(version);
  });
}

export async function requestLocalCacheRefresh(version = Date.now()) {
  if (typeof window === "undefined" || refreshInProgress) return;

  refreshInProgress = true;
  const normalized = normalizeVersion(version) || String(Date.now());
  writeLocalVersion(normalized);

  try {
    // Cache Storage وحده لا يكفي: تفاصيل الإعلانات والقوائم محفوظة أيضاً في localStorage.
    await clearApplicationDataCaches();

    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();

      try {
        await registration?.update();
      } catch (error) {
        console.warn("Service Worker update check failed:", error);
      }

      const worker = navigator.serviceWorker.controller || registration?.active;

      if (worker) {
        worker.postMessage({
          type: "FORCE_CACHE_REFRESH",
          version: normalized,
        });

        // احتياط إذا لم تصل رسالة الرجوع من Service Worker.
        window.setTimeout(() => reloadWithVersion(normalized), 2500);
        return;
      }
    }

    await clearBrowserCachesDirectly();
    reloadWithVersion(normalized);
  } catch (error) {
    console.error("Force cache refresh failed:", error);
    reloadWithVersion(normalized);
  }
}

async function fetchRemoteVersion() {
  const sb = getSupabase();

  const { data, error } = await sb
    .from("app_settings")
    .select("value")
    .eq("key", FORCE_CACHE_VERSION_KEY)
    .maybeSingle();

  if (error) throw error;
  return normalizeVersion(data?.value);
}

async function applyRemoteVersion(remoteVersion) {
  const normalized = normalizeVersion(remoteVersion);
  if (!normalized) return;

  const localVersion = readLocalVersion();

  if (!localVersion) {
    writeLocalVersion(normalized);
    return;
  }

  if (localVersion === normalized) return;
  await requestLocalCacheRefresh(normalized);
}

async function checkRemoteVersion({ initial = false } = {}) {
  try {
    const remoteVersion = await fetchRemoteVersion();
    const localVersion = readLocalVersion();

    if (initial && !baselineReady) {
      baselineReady = true;

      // الجهاز الذي يفتح التطبيق بعد تحديث سابق يحصل على أحدث ملفات أصلًا،
      // لذلك نعتمد النسخة الحالية كخط أساس دون إعادة تحميل إضافية.
      if (!localVersion) {
        writeLocalVersion(remoteVersion || EMPTY_BASELINE_VERSION);
        return;
      }
    }

    if (!remoteVersion) {
      if (!localVersion) writeLocalVersion(EMPTY_BASELINE_VERSION);
      return;
    }

    await applyRemoteVersion(remoteVersion);
  } catch (error) {
    console.warn("Cache version check failed:", error);

    if (initial && !baselineReady) {
      baselineReady = true;
      if (!readLocalVersion()) writeLocalVersion(EMPTY_BASELINE_VERSION);
    }
  }
}

export function startCacheVersionWatcher() {
  if (watcherStarted || typeof window === "undefined") return () => {};

  watcherStarted = true;
  installServiceWorkerMessageListener();

  const sb = getSupabase();

  checkRemoteVersion({ initial: true });
  pollTimer = window.setInterval(() => checkRemoteVersion(), POLL_INTERVAL_MS);

  const handleOnline = () => checkRemoteVersion();
  const handleVisibility = () => {
    if (document.visibilityState === "visible") checkRemoteVersion();
  };

  window.addEventListener("online", handleOnline);
  document.addEventListener("visibilitychange", handleVisibility);

  try {
    realtimeChannel = sb
      .channel("global-cache-version")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "app_settings",
          filter: `key=eq.${FORCE_CACHE_VERSION_KEY}`,
        },
        payload => {
          const version = payload?.new?.value;
          if (version === undefined) return;

          // حدث Realtime يعني أن القيمة تغيّرت الآن، حتى إن سبق الفحص الأول.
          if (!readLocalVersion()) writeLocalVersion(EMPTY_BASELINE_VERSION);
          baselineReady = true;
          applyRemoteVersion(version);
        }
      )
      .subscribe();
  } catch (error) {
    console.warn("Cache version realtime unavailable; polling remains active:", error);
  }

  return () => {
    watcherStarted = false;
    baselineReady = false;

    if (pollTimer) {
      window.clearInterval(pollTimer);
      pollTimer = null;
    }

    window.removeEventListener("online", handleOnline);
    document.removeEventListener("visibilitychange", handleVisibility);

    if (realtimeChannel) {
      sb.removeChannel(realtimeChannel).catch(() => {});
      realtimeChannel = null;
    }
  };
}
