import { getSupabase } from "./supabaseClient.js";
import { getCachedCurrentUserId } from "./sessionCacheService.js";

const MAX_MESSAGE_LENGTH = 1000;
const MAX_STACK_LENGTH = 6000;
const MAX_EXTRA_LENGTH = 8000;

let installed = false;
const recentErrors = new Map();

function cut(value, max) {
  if (value === null || value === undefined) return null;
  const text = typeof value === "string" ? value : String(value);
  return text.length > max ? text.slice(0, max) + "..." : text;
}

function safeJson(value, max = MAX_EXTRA_LENGTH) {
  try {
    const json = JSON.stringify(value ?? {});
    const trimmed = json.length > max ? json.slice(0, max) + "..." : json;
    return JSON.parse(trimmed);
  } catch {
    return {
      note: "extra_not_serializable"
    };
  }
}

function getDeviceInfo() {
  if (typeof window === "undefined") return {};

  return {
    language: navigator.language || null,
    platform: navigator.platform || null,
    vendor: navigator.vendor || null,
    screen: {
      width: window.screen?.width || null,
      height: window.screen?.height || null
    },
    viewport: {
      width: window.innerWidth || null,
      height: window.innerHeight || null
    },
    online: navigator.onLine
  };
}

function shouldIgnoreError(message = "") {
  const msg = String(message || "");

  return (
    msg.includes("Lock") &&
    msg.includes("was released because another request stole it")
  );
}

function shouldThrottle(key) {
  const now = Date.now();
  const last = recentErrors.get(key) || 0;

  if (now - last < 8000) return true;

  recentErrors.set(key, now);

  if (recentErrors.size > 50) {
    const entries = Array.from(recentErrors.entries()).slice(-25);
    recentErrors.clear();
    entries.forEach(([k, v]) => recentErrors.set(k, v));
  }

  return false;
}

async function getCurrentUserIdSafe() {
  try {
    return await getCachedCurrentUserId();
  } catch {
    return null;
  }
}

export async function logClientError(error, context = {}) {
  try {
    const sb = getSupabase();
    if (!sb) return;

    const message =
      error?.message ||
      error?.reason?.message ||
      error?.toString?.() ||
      "Unknown client error";

    if (shouldIgnoreError(message)) return;

    const source = context?.source || "client";
    const key = `${source}:${message}`;

    if (shouldThrottle(key)) return;

    const stack =
      error?.stack ||
      error?.reason?.stack ||
      context?.stack ||
      null;

    const userId = context?.user_id || await getCurrentUserIdSafe();

    await sb.from("error_logs").insert({
      user_id: userId,
      level: context?.level || "error",
      message: cut(message, MAX_MESSAGE_LENGTH),
      stack: cut(stack, MAX_STACK_LENGTH),
      source,
      url: typeof window !== "undefined" ? window.location.href : null,
      pathname: typeof window !== "undefined" ? window.location.pathname : null,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      device: getDeviceInfo(),
      extra: safeJson(context?.extra || {})
    });
  } catch (logError) {
    console.error("[errorLogger] failed to send error log:", logError);
  }
}

export function installGlobalErrorLogger() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  window.addEventListener("error", event => {
    logClientError(event.error || event.message, {
      source: "window.error",
      extra: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }
    });
  });

  window.addEventListener("unhandledrejection", event => {
    const reason = event.reason;
    const message = reason?.message || String(reason || "");

    if (shouldIgnoreError(message)) {
      event.preventDefault();
      return;
    }

    logClientError(reason || message, {
      source: "unhandledrejection"
    });
  });
                   }
