import { createClient } from "@supabase/supabase-js";
import {
  ensureAdminEnv,
  readJsonBody,
  requireAdminUser,
  sendJson
} from "../_lib/adminUtils.js";

const ALLOWED_BUCKETS = new Set(["listing-images"]);
const SAFE_STORAGE_PATH = /^[\w./-]+$/;
const MAX_DELETE_PER_REQUEST = 300;

function cleanPaths(paths = []) {
  return [
    ...new Set(
      (Array.isArray(paths) ? paths : [])
        .map(path => String(path || "").trim().replace(/^\/+/, ""))
        .filter(Boolean)
        .filter(path => !path.includes(".."))
        .filter(path => !path.includes("\\"))
        .filter(path => SAFE_STORAGE_PATH.test(path))
    )
  ];
}

function chunk(arr, size) {
  const out = [];

  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }

  return out;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, {
      ok: false,
      error: "Method Not Allowed"
    });
  }

  try {
    await requireAdminUser(req);

    const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = ensureAdminEnv();

    const {
      bucket = "listing-images",
      paths = []
    } = await readJsonBody(req);

    if (!ALLOWED_BUCKETS.has(bucket)) {
      return sendJson(res, 400, {
        ok: false,
        error: "Bucket is not allowed"
      });
    }

    const clean = cleanPaths(paths);

    if (!clean.length) {
      return sendJson(res, 200, {
        ok: true,
        bucket,
        removed: 0,
        paths: []
      });
    }

    if (clean.length > MAX_DELETE_PER_REQUEST) {
      return sendJson(res, 413, {
        ok: false,
        error: `Too many files. Max is ${MAX_DELETE_PER_REQUEST} per request`
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    const removed = [];

    for (const batch of chunk(clean, 100)) {
      const { data, error } = await supabase
        .storage
        .from(bucket)
        .remove(batch);

      if (error) throw error;

      removed.push(...(Array.isArray(data) ? data : batch.map(name => ({ name }))));
    }

    return sendJson(res, 200, {
      ok: true,
      bucket,
      removed: removed.length,
      paths: clean,
      data: removed
    });
  } catch (error) {
    return sendJson(res, error.status || 500, {
      ok: false,
      error: error.message || "Unexpected storage delete error"
    });
  }
}
