import { getSupabase } from "../../shared/services/supabaseClient.js";

const ADMIN_PROXY_URL = "/api/admin/request";
const ADMIN_UPLOAD_URL = "/api/admin/upload";

function normalizeExtraHeaders(extra = {}) {
  const headers = { ...extra };
  delete headers.apikey;
  delete headers.Authorization;
  delete headers.authorization;
  return headers;
}

async function getSessionAccessToken() {
  const supabase = getSupabase();
  const session = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
  const token = session?.data?.session?.access_token || null;

  if (!token) {
    const error = new Error("جلسة الإدارة غير صالحة أو منتهية");
    error.status = 401;
    throw error;
  }

  return token;
}

async function callAdminProxy(payload) {
  const token = await getSessionAccessToken();

  const response = await fetch(ADMIN_PROXY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok || result?.ok === false) {
    const message =
      result?.error ||
      result?.text ||
      result?.data?.message ||
      result?.data?.hint ||
      "Admin request failed";

    const error = new Error(message);
    error.status = response.status || result?.status;
    error.payload = result;
    throw error;
  }

  return result;
}

function serializeBody(body) {
  if (body == null) return undefined;

  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return body;
    }
  }

  return body;
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";

  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }

  return btoa(binary);
}

export async function adminRequest(path, options = {}, config = {}) {
  return proxyAdminRequest(path, options, config);
}

export async function proxyAdminRequest(path, options = {}, config = {}) {
  const method = String(options.method || "GET").toUpperCase();

  const result = await callAdminProxy({
    path,
    method,
    body: serializeBody(options.body),
    headers: normalizeExtraHeaders({
      ...(options.headers || {}),
      ...(config.extraHeaders || {}),
    }),
  });

  return {
    data: result?.data ?? null,
    text: result?.text ?? null,
    headers: result?.headers || {},
    status: result?.status || 200,
  };
}

export async function adminGet(path, fallback = []) {
  const { data } = await adminRequest(path);
  return data ?? fallback;
}

export async function adminPost(
  path,
  body,
  {
    prefer = "return=minimal",
    responseType = "json",
    fallback = null,
    headers = {},
  } = {}
) {
  const { data, text } = await adminRequest(
    path,
    {
      method: "POST",
      body,
      headers,
    },
    {
      extraHeaders: { Prefer: prefer },
    }
  );

  if (responseType === "text") return text ?? fallback;
  if (responseType === "none") return null;

  return data ?? fallback;
}

export async function adminPatch(
  path,
  body,
  {
    prefer = "return=minimal",
    responseType = "none",
    fallback = null,
    headers = {},
  } = {}
) {
  const { data, text } = await adminRequest(
    path,
    {
      method: "PATCH",
      body,
      headers,
    },
    {
      extraHeaders: { Prefer: prefer },
    }
  );

  if (responseType === "text") return text ?? fallback;
  if (responseType === "none") return null;

  return data ?? fallback;
}

export async function adminDelete(
  path,
  {
    prefer = "return=minimal",
    responseType = "none",
    fallback = null,
    headers = {},
  } = {}
) {
  const { data, text } = await adminRequest(
    path,
    {
      method: "DELETE",
      headers,
    },
    {
      extraHeaders: { Prefer: prefer },
    }
  );

  if (responseType === "text") return text ?? fallback;
  if (responseType === "none") return null;

  return data ?? fallback;
}

export async function adminCount(path) {
  const { headers } = await adminRequest(path, {}, {
    extraHeaders: {
      Prefer: "count=exact",
      Range: "0-0",
    },
  });

  return parseInt(headers?.["content-range"]?.split("/")[1] || "0", 10);
}

export async function adminInvokeRpc(
  fnName,
  payload = {},
  {
    responseType = "json",
    fallback = [],
    throwOnError = true,
  } = {}
) {
  try {
    const { data, text } = await adminRequest(`/rest/v1/rpc/${fnName}`, {
      method: "POST",
      body: payload,
    });

    if (responseType === "text") return text ?? fallback;
    if (responseType === "none") return null;

    return data ?? fallback;
  } catch (error) {
    if (!throwOnError) return fallback;
    throw error;
  }
}

export async function adminInvokeFunction(
  functionName,
  payload = {},
  {
    responseType = "json",
    fallback = {},
    throwOnError = true,
  } = {}
) {
  try {
    const { data, text } = await adminRequest(`/functions/v1/${functionName}`, {
      method: "POST",
      body: payload,
    });

    if (responseType === "text") return text ?? fallback;
    if (responseType === "none") return null;

    return data ?? fallback;
  } catch (error) {
    if (!throwOnError) return fallback;
    throw error;
  }
}

export async function roleProxyGet(path, fallback = []) {
  const { data } = await proxyAdminRequest(path);
  return data ?? fallback;
}

export async function roleProxyPost(
  path,
  body,
  {
    prefer = "return=minimal",
    responseType = "json",
    fallback = null,
    headers = {},
  } = {}
) {
  const { data, text } = await proxyAdminRequest(
    path,
    {
      method: "POST",
      body,
      headers,
    },
    {
      extraHeaders: { Prefer: prefer },
    }
  );

  if (responseType === "text") return text ?? fallback;
  if (responseType === "none") return null;

  return data ?? fallback;
}

export async function roleProxyPatch(
  path,
  body,
  {
    prefer = "return=minimal",
    responseType = "none",
    fallback = null,
    headers = {},
  } = {}
) {
  const { data, text } = await proxyAdminRequest(
    path,
    {
      method: "PATCH",
      body,
      headers,
    },
    {
      extraHeaders: { Prefer: prefer },
    }
  );

  if (responseType === "text") return text ?? fallback;
  if (responseType === "none") return null;

  return data ?? fallback;
}

export async function uploadAdminImage(path, file) {
  if (!file) return null;

  const token = await getSessionAccessToken();
  const base64 = arrayBufferToBase64(await file.arrayBuffer());

  const response = await fetch(ADMIN_UPLOAD_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      path,
      mimeType: file.type || "application/octet-stream",
      base64,
    }),
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok || result?.ok === false) {
    const error = new Error(result?.error || "Upload failed");
    error.status = response.status;
    error.payload = result;
    throw error;
  }

  return result?.publicUrl || null;
}

export async function deleteStoragePathsAdmin(paths = [], bucket = "listing-images") {
  const clean = [
    ...new Set(
      (Array.isArray(paths) ? paths : [])
        .map(path => String(path || "").trim().replace(/^\/+/, ""))
        .filter(Boolean)
        .filter(path => !path.includes(".."))
        .filter(path => !path.includes("\\"))
    )
  ];

  if (!clean.length) {
    return {
      ok: true,
      removed: 0,
      paths: []
    };
  }

  const token = await getSessionAccessToken();

  const response = await fetch("/api/admin/storage-delete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      bucket,
      paths: clean
    })
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok || result?.ok === false) {
    const error = new Error(result?.error || "Storage delete failed");
    error.status = response.status;
    error.payload = result;
    throw error;
  }

  return result;
          }
