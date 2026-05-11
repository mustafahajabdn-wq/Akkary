/**
 * storyService.js
 * طبقة البيانات للستوريات
 */

import { getSupabase } from "../../shared/services/supabaseClient.js";

/**
 * إضافة ستوري جديد
 */
export async function insertStory(storyData) {
  const sb = getSupabase();
  return sb.from("stories").insert(storyData);
}

/**
 * حذف ستوري
 */
export async function deleteStory(storyId) {
  const sb = getSupabase();
  await sb.from("stories").delete().eq("id", storyId);
}

/**
 * جلب الستوريات للمستخدمين المتابَعين + المستخدم الحالي
 */
export async function fetchStories(followedIds, currentUserId) {
  const sb = getSupabase();
  const ids = [...new Set([...(followedIds || []), currentUserId].filter(Boolean))];
  if (!ids.length) return [];

  const { data } = await sb
    .from("stories")
    .select("*")
    .in("user_id", ids)
    .gte("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });
  if (!data?.length) return [];

  // جلب الملفات الشخصية بشكل منفصل
  const uids = [...new Set(data.map((s) => s.user_id))];
  const { data: profiles } = await sb
    .from("profiles")
    .select("id,name,account_type")
    .in("id", uids);

  const profMap = {};
  (profiles || []).forEach((p) => {
    profMap[p.id] = p;
  });

  return data.map((s) => ({ ...s, profiles: profMap[s.user_id] || null }));
}


/**
 * زيادة مشاهدة ستوري مع fallback لتحديث مباشر
 */
export async function incrementStoryViews(storyId, currentViews = 0) {
  if (!storyId) return;
  const sb = getSupabase();
  const { error } = await sb.rpc("increment_story_views", { story_id: storyId });
  if (error) {
    await sb.from("stories").update({ views: (currentViews || 0) + 1 }).eq("id", storyId);
  }
}
