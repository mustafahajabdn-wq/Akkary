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

function getErrorMessage(error, context = {}) {
  return (
    context?.message ||
    error?.message ||
    error?.reason?.message ||
    error?.toString?.() ||
    "Unknown client error"
  );
}

export async function logClientError(error, context = {}) {
  try {
    const sb = getSupabase();
    if (!sb) return;

    const message = getErrorMessage(error, context);

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
    const message = event.message || "Unknown window error";
    const isScriptError = message === "Script error." && !event.error;

    logClientError(event.error || message, {
      source: "window.error",
      message,
      stack: event.error?.stack || null,
      extra: {
        filename: event.filename || null,
        lineno: event.lineno || null,
        colno: event.colno || null,
        is_script_error: isScriptError,
        note: isScriptError
          ? "Likely cross-origin script/WebView error; browser hides filename and stack."
          : null
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
      source: "unhandledrejection",
      message: message || "Unhandled promise rejection",
      stack: reason?.stack || null,
      extra: {
        reason_name: reason?.name || null,
        reason_status: reason?.status || null,
        reason_payload: reason?.payload || null
      }
    });
  });
}
