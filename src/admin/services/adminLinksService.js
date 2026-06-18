import { getSupabase } from "../../shared/services/supabaseClient.js";

function handleError(error, context) {
  if (!error) return;
  console.error(`[adminLinksService] ${context}`, error);
  throw new Error(error.message || context);
}

function normalizeUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  try {
    const url = new URL(withProtocol);
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('الرابط يجب أن يبدأ بـ http أو https');
    }
    return url.toString();
  } catch {
    throw new Error('الرابط غير صحيح');
  }
}

export async function fetchAdminLinks() {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("admin_links")
    .select("id,title,url,category,description,sort_order,created_at,updated_at")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  handleError(error, "fetchAdminLinks");
  return Array.isArray(data) ? data : [];
}

export async function createAdminLink(payload) {
  const sb = getSupabase();
  const row = {
    title: String(payload?.title || "").trim(),
    url: normalizeUrl(payload?.url),
    category: String(payload?.category || "عام").trim() || "عام",
    description: String(payload?.description || "").trim() || null,
    sort_order: Number.isFinite(Number(payload?.sort_order)) ? Number(payload.sort_order) : 0,
  };

  if (!row.title) throw new Error("اسم الرابط مطلوب");
  if (!row.url) throw new Error("الرابط مطلوب");

  const { data, error } = await sb
    .from("admin_links")
    .insert(row)
    .select("id,title,url,category,description,sort_order,created_at,updated_at")
    .single();

  handleError(error, "createAdminLink");
  return data;
}

export async function updateAdminLink(id, payload) {
  if (!id) throw new Error("معرّف الرابط مفقود");

  const sb = getSupabase();
  const patch = {
    title: String(payload?.title || "").trim(),
    url: normalizeUrl(payload?.url),
    category: String(payload?.category || "عام").trim() || "عام",
    description: String(payload?.description || "").trim() || null,
    sort_order: Number.isFinite(Number(payload?.sort_order)) ? Number(payload.sort_order) : 0,
    updated_at: new Date().toISOString(),
  };

  if (!patch.title) throw new Error("اسم الرابط مطلوب");
  if (!patch.url) throw new Error("الرابط مطلوب");

  const { data, error } = await sb
    .from("admin_links")
    .update(patch)
    .eq("id", id)
    .select("id,title,url,category,description,sort_order,created_at,updated_at")
    .single();

  handleError(error, "updateAdminLink");
  return data;
}

export async function deleteAdminLink(id) {
  if (!id) throw new Error("معرّف الرابط مفقود");

  const sb = getSupabase();
  const { error } = await sb
    .from("admin_links")
    .delete()
    .eq("id", id);

  handleError(error, "deleteAdminLink");
}
