import { getSupabase } from "./supabaseClient.js";

const SESSION_CACHE_TTL_MS = 30 * 1000;

let cachedSession = null;
let cachedAt = 0;
let sessionPromise = null;

function now() {
  return Date.now();
}

function isFresh() {
  return cachedAt && now() - cachedAt < SESSION_CACHE_TTL_MS;
}

export function primeAuthSession(session) {
  cachedSession = session || null;
  cachedAt = now();
}

export function clearCachedSession() {
  cachedSession = null;
  cachedAt = 0;
  sessionPromise = null;
}

export async function getCachedSession({ refresh = false } = {}) {
  const sb = getSupabase();
  if (!sb) return null;

  if (!refresh && isFresh()) {
    return cachedSession;
  }

  if (!refresh && sessionPromise) {
    return sessionPromise;
  }

  sessionPromise = sb.auth
    .getSession()
    .then(({ data }) => {
      primeAuthSession(data?.session || null);
      return cachedSession;
    })
    .catch((error) => {
      if (import.meta.env?.DEV) {
        console.warn("[auth] getSession cache fallback:", error);
      }
      return cachedSession;
    })
    .finally(() => {
      sessionPromise = null;
    });

  return sessionPromise;
}

export async function getCachedAuthUser(options = {}) {
  const session = await getCachedSession(options);
  return session?.user || null;
}

export async function getCachedCurrentUserId(options = {}) {
  const user = await getCachedAuthUser(options);
  return user?.id || null;
}

/**
 * استخدمها فقط عند حاجة أمنية فعلية للتحقق من المستخدم من خادم Supabase.
 * أغلب الواجهات تحتاج getCachedSession/getCachedCurrentUserId لتجنب auth/v1/user المتكرر.
 */
export async function getVerifiedAuthUser() {
  const sb = getSupabase();
  if (!sb) return null;

  const { data, error } = await sb.auth.getUser();
  if (error) throw error;

  return data?.user || null;
}
