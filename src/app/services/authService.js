/**
 * authService.js
 * طبقة المصادقة — المستخدم الحالي وتسجيل الدخول والخروج
 */

import { getSupabase } from "../../shared/services/supabaseClient.js";
import { clearCachedSession, getCachedAuthUser, getCachedCurrentUserId, getCachedSession, primeAuthSession } from "../../shared/services/sessionCacheService.js";
import { liftSuspensionIfExpired, upsertProfile } from "./profileService.js";
import { ADMIN_ROLES } from "../../shared/constants/access.js";

const GOOGLE_AUTH_METRICS_KEY = "aqari_google_auth_metrics_v1";

function readGoogleAuthMetrics() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(GOOGLE_AUTH_METRICS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeGoogleAuthMetrics(metrics) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(GOOGLE_AUTH_METRICS_KEY, JSON.stringify(metrics));
    window.__aqariGoogleAuthMetrics = metrics;
  } catch {
    // ignore storage errors
  }
}

function updateGoogleAuthMetrics(patch = {}) {
  const current = readGoogleAuthMetrics() || {};
  const next = { ...current, ...patch };
  writeGoogleAuthMetrics(next);
  return next;
}

function summarizeGoogleAuthMetrics(metrics) {
  if (!metrics?.startedAt) return null;
  const startedAt = metrics.startedAt;
  const returnedAt = metrics.returnedAt || null;
  const sessionReadyAt = metrics.sessionReadyAt || null;
  const uiUpdatedAt = metrics.uiUpdatedAt || null;

  return {
    startedAt,
    returnedAt,
    sessionReadyAt,
    uiUpdatedAt,
    totalToReturnMs: returnedAt ? returnedAt - startedAt : null,
    totalToSessionMs: sessionReadyAt ? sessionReadyAt - startedAt : null,
    totalToUiMs: uiUpdatedAt ? uiUpdatedAt - startedAt : null,
    returnToSessionMs: returnedAt && sessionReadyAt ? sessionReadyAt - returnedAt : null,
    sessionToUiMs: sessionReadyAt && uiUpdatedAt ? uiUpdatedAt - sessionReadyAt : null,
    path: metrics.path || null,
    source: metrics.source || null,
  };
}

function logGoogleAuthMetrics(metrics) {
  if (typeof window === "undefined") return;
  const summary = summarizeGoogleAuthMetrics(metrics);
  if (!summary) return;
  window.__aqariGoogleAuthMetricsSummary = summary;
  console.info("[auth][google] timings", summary);
}

export function startGoogleAuthMeasurement() {
  if (typeof window === "undefined") return;
  const startedAt = Date.now();
  updateGoogleAuthMetrics({
    flow: "google_oauth",
    startedAt,
    returnedAt: null,
    sessionReadyAt: null,
    uiUpdatedAt: null,
    path: window.location.pathname,
    source: "oauth_start",
  });
}

export function markGoogleAuthReturn(pathname = null) {
  const current = readGoogleAuthMetrics();
  if (!current?.startedAt || current.returnedAt) return;
  const next = updateGoogleAuthMetrics({
    returnedAt: Date.now(),
    path: pathname || current.path || null,
    source: "oauth_return",
  });
  logGoogleAuthMetrics(next);
}

export function markGoogleSessionAvailable(extra = {}) {
  const current = readGoogleAuthMetrics();
  if (!current?.startedAt || current.sessionReadyAt) return;
  const next = updateGoogleAuthMetrics({
    sessionReadyAt: Date.now(),
    source: extra.source || current.source || null,
    path: extra.path || current.path || null,
  });
  logGoogleAuthMetrics(next);
}

export function markGoogleUiUpdated(extra = {}) {
  const current = readGoogleAuthMetrics();
  if (!current?.startedAt || current.uiUpdatedAt) return;
  const next = updateGoogleAuthMetrics({
    uiUpdatedAt: Date.now(),
    source: extra.source || current.source || null,
    path: extra.path || current.path || null,
  });
  logGoogleAuthMetrics(next);
}

export function buildOptimisticUser(authUser, fallback = {}) {
  if (!authUser?.id) {
    return {
      id: fallback.id,
      email: fallback.email || "",
      phone: fallback.phone || "",
      name: fallback.name || fallback.email?.split("@")[0] || "مستخدم",
      accountType: fallback.accountType || "individual",
      role: fallback.role || "user",
      isAdmin: !!fallback.isAdmin,
      isSuspended: !!fallback.isSuspended,
      suspendedUntil: fallback.suspendedUntil || null,
      video_allowed: !!fallback.video_allowed,
      allowedPages: fallback.allowedPages || [],
    };
  }

  return {
    id: authUser.id,
    email: authUser.email || fallback.email || "",
    phone: fallback.phone || authUser.phone || "",
    name:
      fallback.name ||
      authUser.user_metadata?.name ||
      authUser.user_metadata?.full_name ||
      authUser.email?.split("@")[0] ||
      "مستخدم",
    accountType: fallback.accountType || authUser.user_metadata?.account_type || "individual",
    role: fallback.role || "user",
    isAdmin: !!fallback.isAdmin,
    isSuspended: !!fallback.isSuspended,
    suspendedUntil: fallback.suspendedUntil || null,
    video_allowed: !!fallback.video_allowed,
    allowedPages: fallback.allowedPages || [],
  };
}

export async function getCurrentUserId(options = {}) {
  return getCachedCurrentUserId(options);
}

export async function getCurrentAuthUser(options = {}) {
  return getCachedAuthUser(options);
}

export async function getAccessToken() {
  const sb = getSupabase();
  if (!sb) return null;
  const fresh = await sb.auth.getSession();
  return fresh?.data?.session?.access_token || null;
}

export async function buildTrustedUser(authUser, fallback = {}) {
  if (!authUser?.id) {
    return {
      id: fallback.id,
      email: fallback.email || "",
      phone: fallback.phone || "",
      name: fallback.name || fallback.email?.split("@")[0] || "مستخدم",
      accountType: fallback.accountType || "individual",
      role: fallback.role || "user",
      isAdmin: !!fallback.isAdmin,
      isSuspended: !!fallback.isSuspended,
      suspendedUntil: fallback.suspendedUntil || null,
    };
  }

  const sb = getSupabase();
  const { data: profile } = await sb
    .from("profiles")
    .select("id,name,phone,account_type,role,is_suspended,suspended_until")
    .eq("id", authUser.id)
    .maybeSingle();

  if (!profile) {
    return {
      id: authUser.id,
      email: authUser.email || fallback.email || "",
      phone: fallback.phone || authUser.phone || "",
      name: authUser.user_metadata?.name || authUser.user_metadata?.full_name || fallback.name || authUser.email?.split("@")[0] || "مستخدم",
      accountType: fallback.accountType || authUser.user_metadata?.account_type || "individual",
      role: fallback.role || "user",
      isAdmin: false,
      isSuspended: false,
      suspendedUntil: null,
    };
  }

  await liftSuspensionIfExpired(authUser.id, profile.suspended_until);
  const isActuallySuspended = !!profile.is_suspended && !(profile.suspended_until && new Date(profile.suspended_until) < new Date());

  return {
    id: authUser.id,
    email: authUser.email || fallback.email || "",
    phone: profile.phone || fallback.phone || authUser.phone || "",
    name: profile.name || authUser.user_metadata?.name || authUser.user_metadata?.full_name || authUser.email?.split("@")[0] || "مستخدم",
    accountType: profile.account_type || fallback.accountType || "individual",
    role: profile.role || "user",
    isAdmin: ADMIN_ROLES.includes(profile.role),
    isSuspended: isActuallySuspended,
    suspendedUntil: isActuallySuspended ? profile.suspended_until || null : null,
  };
}

export async function signUpWithEmail({ email, password, name, accountType = "individual", termsAcceptedAt = null }) {
  const sb = getSupabase();
  const safeAccountType = accountType || "individual";

  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: { data: { name, account_type: safeAccountType } },
  });

  if (error) throw error;

  if (data?.user) {
    await upsertProfile(data.user.id, {
      name,
      account_type: safeAccountType,
      terms_accepted_at: termsAcceptedAt || new Date().toISOString(),
    });
  }

  return data;
}

export async function signInWithEmailPassword({ email, password }) {
  const sb = getSupabase();
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signInWithGoogleOAuth(redirectTo) {
  const sb = getSupabase();
  const { error } = await sb.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });
  if (error) throw error;
}

export async function sendPhoneOtp(fullPhone) {
  const sb = getSupabase();
  const { error } = await sb.auth.signInWithOtp({ phone: fullPhone });
  if (error) throw error;
}

export async function verifyPhoneOtp(fullPhone, token) {
  const sb = getSupabase();
  const { data, error } = await sb.auth.verifyOtp({ phone: fullPhone, token, type: "sms" });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const sb = getSupabase();
  if (!sb) return;
  clearCachedSession();
  await sb.auth.signOut();
}


export function isAuthAvailable() {
  return !!getSupabase();
}

export async function getCurrentSession(options = {}) {
  return getCachedSession(options);
}

export function subscribeToAuthStateChange(handler) {
  const sb = getSupabase();
  if (!sb) return () => {};
  const { data: { subscription } = {} } = sb.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT") {
      clearCachedSession();
    } else {
      primeAuthSession(session || null);
    }

    handler?.(event, session);
  });
  return () => subscription?.unsubscribe?.();
    }
