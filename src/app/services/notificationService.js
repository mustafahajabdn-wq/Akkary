import { getSupabase } from "../../shared/services/supabaseClient.js";
import { shouldStartRealtime } from "../../shared/utils/realtimePolicy.js";

function getNotificationConversationId(notification) {
  return (
    notification?.conversation_id ||
    notification?.data?.conversation_id ||
    notification?.data?.conversationId ||
    null
  );
}

export async function fetchUnreadNotificationsCount(userId) {
  if (!userId) return 0;
  const sb = getSupabase();
  const { count } = await sb
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);
  return count || 0;
}

export async function fetchNotifications(userId, limit = 50) {
  if (!userId) return [];
  const sb = getSupabase();
  const { data } = await sb
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data || [];
}

export async function fetchNotificationConversationMap(userId, notifications = []) {
  const msgNotifs = (notifications || []).filter((n) => n.type === "message" && getNotificationConversationId(n));
  if (!msgNotifs.length || !userId) return {};
  const sb = getSupabase();
  const convIds = [...new Set(msgNotifs.map((n) => getNotificationConversationId(n)).filter(Boolean))];
  const { data } = await sb
    .from("conversations")
    .select("id, buyer_id, seller_id, listing_id, listings(title), buyer:profiles!buyer_id(name,account_type), seller:profiles!seller_id(name,account_type)")
    .in("id", convIds);

  const map = {};
  (data || []).forEach((c) => {
    const other = c.buyer_id === userId ? c.seller : c.buyer;
    map[c.id] = {
      id: c.id,
      otherId: c.buyer_id === userId ? c.seller_id : c.buyer_id,
      otherName: other?.name || "مستخدم",
      otherType: other?.account_type || "individual",
      property: c.listings?.title || "",
      listing_id: c.listing_id,
    };
  });
  return map;
}

export async function listNotificationsWithContext(userId, limit = 50) {
  const rows = await fetchNotifications(userId, limit);
  const convMap = await fetchNotificationConversationMap(userId, rows);
  return rows.map((n) => ({
    id: n.id,
    text: n.text || "",
    time: n.created_at ? new Date(n.created_at).toLocaleDateString("ar") : "",
    read: n.is_read || false,
    type: n.type || "general",
    listing_id: n.listing_id,
    conv: getNotificationConversationId(n) ? convMap[getNotificationConversationId(n)] || null : null,
  }));
}

export function subscribeToNotificationChanges(userId, onChange) {
  if (!userId) return () => {};
  if (!shouldStartRealtime({ requireRealtimePage: true })) return () => {};
  const sb = getSupabase();
  const channel = sb
    .channel("notifs-page-" + userId)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: "user_id=eq." + userId }, onChange)
    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "notifications", filter: "user_id=eq." + userId }, onChange)
    .on("postgres_changes", { event: "DELETE", schema: "public", table: "notifications", filter: "user_id=eq." + userId }, onChange)
    .subscribe();

  return () => {
    try { sb.removeChannel(channel); } catch {}
  };
}

export async function deleteNotification(id) {
  if (!id) return { error: null };
  const sb = getSupabase();
  return sb.from("notifications").delete().eq("id", id);
}

export async function deleteAllNotifications(userId) {
  if (!userId) return { error: null };
  const sb = getSupabase();
  return sb.from("notifications").delete().eq("user_id", userId);
}

export async function markNotificationRead(id) {
  if (!id) return { error: null };
  const sb = getSupabase();
  return sb.from("notifications").update({ is_read: true }).eq("id", id);
}
