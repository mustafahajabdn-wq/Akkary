import { getSupabase } from "./supabaseClient.js";
import { fetchAppSetting } from "./appConfigService.js";
import { getCachedCurrentUserId } from "./sessionCacheService.js";

const SESSION_KEY = "visitor_presence_session_id";
const HEARTBEAT_INTERVAL_MS = 30000;
const ENABLED_CACHE_MS = 60000;

let started = false;
let timer = null;
let lastEnabledCheckAt = 0;
let cachedEnabled = true;
let heartbeatInFlight = false;
let consecutiveHeartbeatFailures = 0;

function getSessionId() {
  if (typeof window === "undefined") return null;

  try {
    let id = localStorage.getItem(SESSION_KEY);

    if (!id) {
      id =
        crypto?.randomUUID?.() ||
        `visitor_${Date.now()}_${Math.random().toString(36).slice(2)}`;

      localStorage.setItem(SESSION_KEY, id);
    }

    return id;
  } catch {
    return `visitor_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  }
}

function isBotUserAgent(userAgent = "") {
  const ua = String(userAgent || "");

  return /bot|crawler|spider|crawling|Googlebot|Google-InspectionTool|HeadlessChrome|Lighthouse|PageSpeed|bingbot|YandexBot|DuckDuckBot|facebookexternalhit|TelegramBot|Slackbot|SemrushBot|AhrefsBot/i.test(
    ua
  );
}

async function getUserIdSafe() {
  try {
    return await getCachedCurrentUserId();
  } catch {
    return null;
  }
}

async function isVisitorPresenceEnabled() {
  const now = Date.now();

  if (now - lastEnabledCheckAt < ENABLED_CACHE_MS) {
    return cachedEnabled;
  }

  lastEnabledCheckAt = now;

  try {
    const value = await fetchAppSetting("visitor_presence_enabled");
    cachedEnabled = value !== "false";
    return cachedEnabled;
  } catch {
    cachedEnabled = true;
    return true;
  }
}

function logHeartbeatWarning(error) {
  consecutiveHeartbeatFailures += 1;

  // في الإنتاج لا نطبع خطأ أحمر؛ لأن فشل نبضة واحدة غالبًا سببه شبكة/إغلاق تبويب/تبديل صفحة.
  if (import.meta.env?.DEV) {
    console.warn("[visitorPresence] heartbeat failed:", error);
  }
}

async function sendVisitorHeartbeat() {
  if (heartbeatInFlight) return;
  if (typeof window === "undefined") return;

  const sb = getSupabase();
  if (!sb) return;

  const userAgent = String(navigator.userAgent || "").slice(0, 300);

  // لا نسجل Googlebot وأدوات الفحص والبوتات في جدول المتواجدين.
  if (isBotUserAgent(userAgent)) return;

  heartbeatInFlight = true;

  try {
    const enabled = await isVisitorPresenceEnabled();
    if (!enabled) return;

    const sessionId = getSessionId();
    if (!sessionId) return;

    const userId = await getUserIdSafe();

    const { error } = await sb
      .from("visitor_presence")
      .upsert(
        {
          session_id: sessionId,
          user_id: userId,
          path: window.location.pathname || "/",
          user_agent: userAgent,
          last_seen_at: new Date().toISOString()
        },
        {
          onConflict: "session_id"
        }
      );

    if (error) throw error;

    consecutiveHeartbeatFailures = 0;
  } catch (error) {
    logHeartbeatWarning(error);
  } finally {
    heartbeatInFlight = false;
  }
}

function handleFocus() {
  void sendVisitorHeartbeat();
}

function handleVisibilityChange() {
  if (!document.hidden) {
    void sendVisitorHeartbeat();
  }
}

export function startVisitorPresence() {
  if (started || typeof window === "undefined") return;

  started = true;

  void sendVisitorHeartbeat();

  timer = window.setInterval(() => {
    void sendVisitorHeartbeat();
  }, HEARTBEAT_INTERVAL_MS);

  window.addEventListener("focus", handleFocus);
  document.addEventListener("visibilitychange", handleVisibilityChange);
}

export function stopVisitorPresence() {
  if (timer) {
    window.clearInterval(timer);
    timer = null;
  }

  window.removeEventListener("focus", handleFocus);
  document.removeEventListener("visibilitychange", handleVisibilityChange);

  started = false;
  heartbeatInFlight = false;
}
