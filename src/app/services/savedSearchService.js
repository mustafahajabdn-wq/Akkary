/**
 * savedSearchService.js
 * طبقة البيانات للبحوث المحفوظة
 */

import { getSupabase } from "../../shared/services/supabaseClient.js";

/**
 * جلب كل البحوث المحفوظة لمستخدم (الأحدث أولاً)
 */
export async function fetchUserSavedSearches(userId) {
  if (!userId) return [];
  const sb = getSupabase();
  if (!sb) return [];
  const { data } = await sb
    .from("saved_searches")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return data || [];
}

/**
 * البحث عن saved_search موجودة بنفس النص لمستخدم معيّن
 * يُرجع الـ row إذا كانت موجودة، أو null
 */
export async function findSavedSearchByQuery(userId, query) {
  if (!userId || !query) return null;
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb
    .from("saved_searches")
    .select("id")
    .eq("user_id", userId)
    .eq("query", query)
    .maybeSingle();
  return data || null;
}

/**
 * إضافة بحث محفوظ جديد
 * يُرجع { error } لتسهيل التعامل مع فشل العملية في الواجهة
 */
export async function insertSavedSearch(userId, query, notif = true) {
  if (!userId || !query) return { error: new Error("userId and query required") };
  const sb = getSupabase();
  if (!sb) return { error: new Error("Supabase not ready") };
  return sb.from("saved_searches").insert({ user_id: userId, query, notif });
}

/**
 * تحديث حالة الإشعار لبحث محفوظ
 */
export async function updateSavedSearchNotif(searchId, notif) {
  const sb = getSupabase();
  await sb.from("saved_searches").update({ notif }).eq("id", searchId);
}

/**
 * حذف بحث محفوظ
 */
export async function deleteSavedSearch(searchId) {
  const sb = getSupabase();
  await sb.from("saved_searches").delete().eq("id", searchId);
}


/**
 * إنشاء بحث محفوظ بصف كامل
 */
export async function createSavedSearch(row) {
  const sb = getSupabase();
  const result = await sb.from("saved_searches").insert(row).select().single();

  if (!result?.error) return result;

  const message = String(result.error?.message || "").toLowerCase();
  const mayBeSchemaMismatch =
    result.error?.code === "PGRST204" ||
    message.includes("column") ||
    message.includes("schema cache");

  if (!mayBeSchemaMismatch) return result;

  const fallback = {
    user_id: row.user_id,
    query: row.query,
    city: row.city ?? null,
    district: row.district ?? null,
    type: row.type ?? null,
    category: row.category ?? null,
    min_price: row.min_price ?? null,
    max_price: row.max_price ?? null,
    ownership_type: row.ownership_type ?? null,
    notif: row.notif ?? true
  };

  return sb.from("saved_searches").insert(fallback).select().single();
}
