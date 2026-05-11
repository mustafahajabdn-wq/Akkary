import { getSupabase } from "../../shared/services/supabaseClient.js";

export async function fetchProfileMenuCounts(userId) {
  if (!userId) return { savedSearchCount: 0, blockedUsers: [], activeAdsCount: 0 };
  const sb = getSupabase();
  const [saved, blocked, activeAds] = await Promise.all([
    sb.from("saved_searches").select("id", { count: "exact", head: true }).eq("user_id", userId),
    sb.from("blocked_users").select("blocked_id").eq("blocker_id", userId),
    sb.from("ads").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("status", "approved").eq("active", true),
  ]);

  return {
    savedSearchCount: saved.count || 0,
    blockedUsers: blocked.data || [],
    activeAdsCount: activeAds.count || 0,
  };
}
