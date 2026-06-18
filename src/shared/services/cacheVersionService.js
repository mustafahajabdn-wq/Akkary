import { getSupabase } from "./supabaseClient.js";

export const FORCE_CACHE_VERSION_KEY = "force_cache_version";

const LOCAL_VERSION_KEY = "aqari_force_cache_version";
const RELOAD_GUARD_KEY = "aqari_force_cache_reload_in_progress";
const POLL_INTERVAL_MS = 60 * 1000;

let watcherStarted = false;
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

  // أول تشغيل بعد نشر الميزة: نعتمد القيمة الحالية دون إعادة تحميل متكرر.
  if (!localVersion) {
    writeLocalVersion(normalized);
    return;
  }

  if (localVersion === normalized) return;
  await requestLocalCacheRefresh(normalized);
}

async function checkRemoteVersion() {
  try {
    const remoteVersion = await fetchRemoteVersion();

    // إذا لم يُنشأ الإعداد بعد، نخزن خط أساس محلياً.
    // عند أول ضغطة من لوحة الإدارة سيتغير من 0 إلى رقم الإصدار الجديد.
    if (!remoteVersion) {
      if (!readLocalVersion()) writeLocalVersion("0");
      return;
    }

    await applyRemoteVersion(remoteVersion);
  } catch (error) {
    console.warn("Cache version check failed:", error);
  }
}

export function startCacheVersionWatcher() {
  if (watcherStarted || typeof window === "undefined") return () => {};

  watcherStarted = true;
  installServiceWorkerMessageListener();

  const sb = getSupabase();

  checkRemoteVersion();
  pollTimer = window.setInterval(checkRemoteVersion, POLL_INTERVAL_MS);

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
          if (version !== undefined) applyRemoteVersion(version);
        }
      )
      .subscribe();
  } catch (error) {
    console.warn("Cache version realtime unavailable; polling remains active:", error);
  }

  return () => {
    watcherStarted = false;

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
