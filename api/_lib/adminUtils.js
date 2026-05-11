const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_KEY_ADMIN ||
  "";
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  "";

export const ADMIN_ROLES = new Set(["admin", "moderator", "support", "level1", "level2"]);

export function ensureAdminEnv({ requireAnon = false } = {}) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || (requireAnon && !SUPABASE_ANON_KEY)) {
    const error = new Error(
      requireAnon
        ? "Missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or SUPABASE_ANON_KEY"
        : "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
    error.status = 500;
    throw error;
  }
  return { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY };
}

export function buildAdminHeaders(extra = {}) {
  const { SUPABASE_SERVICE_ROLE_KEY } = ensureAdminEnv();
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    ...extra,
  };
}

export function buildSupabaseUrl(path = "") {
  const { SUPABASE_URL } = ensureAdminEnv();
  if (!path) return SUPABASE_URL;
  if (path.startsWith("http")) {
    const error = new Error("Absolute upstream URLs are not allowed");
    error.status = 400;
    throw error;
  }
  return `${SUPABASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

export function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

export async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    if (!req.body.trim()) return {};
    try {
      return JSON.parse(req.body);
    } catch {
      const error = new Error("Invalid JSON body");
      error.status = 400;
      throw error;
    }
  }
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    const error = new Error("Invalid JSON body");
    error.status = 400;
    throw error;
  }
}

export function pickHeaders(headers = {}, names = []) {
  const out = {};
  for (const name of names) {
    const value = headers?.get ? headers.get(name) : headers?.[name];
    if (value != null && value !== "") out[name] = value;
  }
  return out;
}

export function getHeader(req, name) {
  const raw = req?.headers?.[name.toLowerCase()] ?? req?.headers?.[name];
  return Array.isArray(raw) ? raw[0] : raw;
}

export function getBearerToken(req) {
  const header = getHeader(req, "authorization") || "";
  const match = String(header).match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || "";
}

function isSuspended(profile) {
  if (!profile?.is_suspended) return false;
  if (!profile?.suspended_until) return true;
  return new Date(profile.suspended_until) > new Date();
}

// ── تحقّق Admin سريع ─────────────────────────────────────────
// ١) نفك JWT محلياً (بدون call) لاستخراج user.id — Supabase token موقّع.
// ٢) call واحد فقط: قراءة الـ profile من DB للتحقق من الدور والـ suspension.
// ٣) cache للـ profile لمدة 60 ثانية لتجنّب القراءة المتكررة في نفس الجلسة.
// النتيجة: من 2 calls إلى 0-1 call، ما يوفّر 100-300ms لكل طلب admin.

function decodeJwtPayload(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
    return JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

const PROFILE_CACHE_TTL_MS = 300_000; // 5 دقائق
const profileCache = new Map(); // userId → { profile, expiresAt }

function getCachedProfile(userId) {
  const entry = profileCache.get(userId);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    profileCache.delete(userId);
    return null;
  }
  return entry.profile;
}

function setCachedProfile(userId, profile) {
  profileCache.set(userId, { profile, expiresAt: Date.now() + PROFILE_CACHE_TTL_MS });
  if (profileCache.size > 200) {
    const firstKey = profileCache.keys().next().value;
    profileCache.delete(firstKey);
  }
}

export async function requireAdminUser(req) {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = ensureAdminEnv();
  const token = getBearerToken(req);
  if (!token) {
    const error = new Error("Missing user authorization token");
    error.status = 401;
    throw error;
  }

  // ① فك JWT محلياً — سريع (~0ms) ويحوي user.id والـ exp
  const payload = decodeJwtPayload(token);
  if (!payload?.sub) {
    const error = new Error("Invalid token payload");
    error.status = 401;
    throw error;
  }
  if (payload.exp && payload.exp * 1000 < Date.now()) {
    const error = new Error("Expired user session");
    error.status = 401;
    throw error;
  }

  const userId = payload.sub;

  // ② cache check — لا call إن كان الـ profile محفوظ ولم تنتهِ صلاحيته
  let profile = getCachedProfile(userId);

  if (!profile) {
    const profileResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=id,role,is_suspended,suspended_until&limit=1`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );

    if (!profileResponse.ok) {
      const error = new Error("Unable to verify admin profile");
      error.status = 403;
      throw error;
    }

    const rows = await profileResponse.json().catch(() => []);
    profile = Array.isArray(rows) ? rows[0] : null;
    if (!profile) {
      const error = new Error("Admin profile not found");
      error.status = 403;
      throw error;
    }
    setCachedProfile(userId, profile);
  }

  const role = profile?.role || "user";
  if (!ADMIN_ROLES.has(role) || isSuspended(profile)) {
    const error = new Error("Forbidden admin request");
    error.status = 403;
    throw error;
  }

  return { authUser: { id: userId, ...payload }, profile, role };
}
