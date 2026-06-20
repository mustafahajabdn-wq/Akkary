import {
  buildAdminHeaders,
  buildSupabaseUrl,
  pickHeaders,
  readJsonBody,
  requireAdminUser,
  sendJson,
} from "../_lib/adminUtils.js";

const NO_BODY_METHODS = new Set(["GET", "HEAD"]);
const ALLOWED_METHODS = new Set(["GET", "HEAD", "POST", "PATCH", "DELETE"]);

const ALLOWED_REST_TABLES = new Set([
  "ad_codes",
  "ads",
  "admin_queries",
  "app_settings",
  "account_upgrade_requests" ,
  "blocked_users",
  "cities",
  "conversations",
  "districts",
  "error_logs",
  "favorites",
  "listing_images",
  "listings",
  "messages",
  "notifications",
  "profiles",
  "property_fields",
  "property_types",
  "push_subscriptions",
  "reports",
  "saved_searches",
  "villages",
]);

const ALLOWED_RPC = new Set([
  "get_listings_columns",
  "cleanup_duplicate_property_fields",
  "fill_missing_core_property_fields",
  "exec_sql",
  "run_admin_query",
]);

const ADMIN_ONLY_RPC = new Set([
  "cleanup_duplicate_property_fields",
  "fill_missing_core_property_fields",
  "exec_sql",
  "run_admin_query",
]);

const ALLOWED_FUNCTIONS = new Set(["send-push"]);
const GEO_TABLES = new Set(["cities", "districts", "villages"]);

function normalizeBody(body, headers) {
  if (body == null) return undefined;
  if (typeof body === "string") {
    const contentType = headers["Content-Type"] || headers["content-type"];
    if (!contentType) headers["Content-Type"] = "application/json";
    return body;
  }
  headers["Content-Type"] = headers["Content-Type"] || headers["content-type"] || "application/json";
  return JSON.stringify(body);
}

function extractErrorMessage(payload, fallback) {
  if (!payload) return fallback;
  if (typeof payload === "string") return payload || fallback;
  return (
    payload.message ||
    payload.hint ||
    payload.error ||
    payload.error_description ||
    payload.msg ||
    fallback
  );
}

function fail(status, message) {
  const error = new Error(message);
  error.status = status;
  throw error;
}

function parseInternalPath(path) {
  if (!path || typeof path !== "string") fail(400, "Missing request path");
  if (path.startsWith("http://") || path.startsWith("https://")) fail(400, "Absolute request paths are not allowed");
  if (!path.startsWith("/")) fail(400, "Request path must start with /");
  if (path.includes("\\") || path.includes("..") || path.includes("//")) fail(400, "Unsafe request path");

  let url;
  try {
    url = new URL(path, "https://admin.local");
  } catch {
    fail(400, "Invalid request path");
  }

  const parts = url.pathname.split("/").filter(Boolean);
  return { url, parts };
}

function hasAllowedPage(allowedPages, ...pages) {
  if (!Array.isArray(allowedPages)) return false;
  return pages.some((page) => allowedPages.includes(page));
}

function assertAllowedAdminRequest({ path, method, role, allowedPages }) {
  const upperMethod = String(method || "GET").toUpperCase();
  if (!ALLOWED_METHODS.has(upperMethod)) fail(405, "Admin method is not allowed");

  const isFullAdmin = role === "admin";

  const { parts } = parseInternalPath(path);

  if (parts[0] === "rest" && parts[1] === "v1") {
    if (parts[2] === "rpc") {
      const rpcName = parts[3];
      if (!ALLOWED_RPC.has(rpcName)) fail(403, "RPC path is not in the admin allowlist");
      if (ADMIN_ONLY_RPC.has(rpcName)) {
        // exec_sql / run_admin_query  →  محرر SQL (تتطلب صلاحية adminSQL)
        // cleanup_*  / fill_missing_*  →  أدوات صفحة الحقول (تتطلب صلاحية adminPropertyFields)
        const isSqlRpc = rpcName === "exec_sql" || rpcName === "run_admin_query";
        const isPropertyFieldsRpc =
          rpcName === "cleanup_duplicate_property_fields" ||
          rpcName === "fill_missing_core_property_fields";
        const allowed =
          isFullAdmin ||
          (isSqlRpc && hasAllowedPage(allowedPages, "adminSQL")) ||
          (isPropertyFieldsRpc && hasAllowedPage(allowedPages, "adminPropertyFields"));
        if (!allowed) fail(403, "This RPC requires elevated permissions");
      }
      if (upperMethod !== "POST") fail(405, "RPC calls must use POST");
      return;
    }

    const tableName = parts[2];
    if (!ALLOWED_REST_TABLES.has(tableName)) fail(403, "REST table path is not in the admin allowlist");

    if (GEO_TABLES.has(tableName)) {
      const canManageGeo = isFullAdmin || hasAllowedPage(allowedPages, "adminListings");
      if (!canManageGeo) {
        fail(403, "Geographic area administration requires listings permission");
      }

      if (upperMethod === "DELETE") {
        fail(405, "Deleting geographic records is not allowed from this page");
      }
    }

    // تعديل إعدادات التطبيق:
    // - role_permissions يبقى للمدير الكامل فقط
    // - باقي مفاتيح app_settings (مثل property_types) يحتاج صلاحية adminPropertyFields
    if (tableName === "app_settings" && upperMethod !== "GET" && !isFullAdmin) {
      const isRolePermissions = String(path).includes("role_permissions");
      if (isRolePermissions) {
        fail(403, "Updating role permissions requires a full admin role");
      }
      if (!hasAllowedPage(allowedPages, "adminPropertyFields", "adminSettings")) {
        fail(403, "Updating app settings requires the property fields permission");
      }
    }
    // محرر SQL: قراءة سجلات الاستعلامات / حفظها / حذفها  →  صلاحية adminSQL
    if (tableName === "admin_queries" && !isFullAdmin) {
      if (!hasAllowedPage(allowedPages, "adminSQL")) {
        fail(403, "Admin SQL queries require the SQL permission");
      }
    }
    return;
  }

  if (parts[0] === "functions" && parts[1] === "v1") {
    const functionName = parts[2];
    if (!ALLOWED_FUNCTIONS.has(functionName)) fail(403, "Function path is not in the admin allowlist");
    if (upperMethod !== "POST") fail(405, "Function calls must use POST");
    return;
  }

  fail(403, "Admin path is not allowed");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { ok: false, error: "Method Not Allowed" });
  }

  try {
    const admin = await requireAdminUser(req);
    const { path, method = "GET", body = null, headers: incomingHeaders = {} } = await readJsonBody(req);
    const upperMethod = String(method || "GET").toUpperCase();

    assertAllowedAdminRequest({ path, method: upperMethod, role: admin.role, allowedPages: admin.allowedPages });

    const headers = buildAdminHeaders({ ...incomingHeaders });
    const requestInit = {
      method: upperMethod,
      headers,
    };

    if (!NO_BODY_METHODS.has(upperMethod)) {
      requestInit.body = normalizeBody(body, headers);
    }

    const upstream = await fetch(buildSupabaseUrl(path), requestInit);
    const contentType = upstream.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    let data = null;
    let text = null;

    if (upstream.status !== 204) {
      if (isJson) {
        data = await upstream.json().catch(() => null);
      } else {
        text = await upstream.text().catch(() => "");
      }
    }

    if (!upstream.ok) {
      return sendJson(res, upstream.status, {
        ok: false,
        error: extractErrorMessage(data ?? text, upstream.statusText || "Admin request failed"),
        data,
        text,
        headers: pickHeaders(upstream.headers, ["content-range", "location", "content-type"]),
        status: upstream.status,
      });
    }

    return sendJson(res, 200, {
      ok: true,
      data,
      text,
      headers: pickHeaders(upstream.headers, ["content-range", "location", "content-type"]),
      status: upstream.status,
    });
  } catch (error) {
    return sendJson(res, error.status || 500, {
      ok: false,
      error: error.message || "Unexpected admin proxy error",
    });
  }
}
