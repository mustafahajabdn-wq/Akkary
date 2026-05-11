import { buildAdminHeaders, buildSupabaseUrl, readJsonBody, requireAdminUser, sendJson } from "../_lib/adminUtils.js";

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const SAFE_UPLOAD_PATH = /^[\w./-]+$/;

function assertUploadPath(path) {
  if (!path || typeof path !== "string") {
    const error = new Error("Missing upload path");
    error.status = 400;
    throw error;
  }
  if (path.startsWith("/") || path.includes("..") || path.includes("//") || path.includes("\\")) {
    const error = new Error("Unsafe upload path");
    error.status = 400;
    throw error;
  }
  if (!SAFE_UPLOAD_PATH.test(path)) {
    const error = new Error("Upload path contains unsupported characters");
    error.status = 400;
    throw error;
  }
}

function assertImageMimeType(mimeType) {
  if (!String(mimeType || "").startsWith("image/")) {
    const error = new Error("Only image uploads are allowed");
    error.status = 415;
    throw error;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { ok: false, error: "Method Not Allowed" });
  }

  try {
    await requireAdminUser(req);

    const { path, mimeType = "application/octet-stream", base64 } = await readJsonBody(req);
    if (!base64) {
      return sendJson(res, 400, { ok: false, error: "Missing file data" });
    }

    assertUploadPath(path);
    assertImageMimeType(mimeType);

    const buffer = Buffer.from(base64, "base64");
    if (!buffer.length || buffer.length > MAX_UPLOAD_BYTES) {
      return sendJson(res, 413, { ok: false, error: "Upload file is empty or too large" });
    }

    const upstream = await fetch(buildSupabaseUrl(`/storage/v1/object/listing-images/${path}`), {
      method: "POST",
      headers: buildAdminHeaders({
        "Content-Type": mimeType,
        "x-upsert": "true",
      }),
      body: buffer,
    });

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => "");
      return sendJson(res, upstream.status, {
        ok: false,
        error: text || upstream.statusText || "Upload failed",
      });
    }

    return sendJson(res, 200, {
      ok: true,
      publicUrl: buildSupabaseUrl(`/storage/v1/object/public/listing-images/${path}`),
    });
  } catch (error) {
    return sendJson(res, error.status || 500, {
      ok: false,
      error: error.message || "Unexpected upload error",
    });
  }
}
