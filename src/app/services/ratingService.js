/**
 * ratingService.js
 * طبقة البيانات للتقييمات والبلاغات (تغذية راجعة من المستخدمين)
 */

import { getSupabase } from "../../shared/services/supabaseClient.js";

// ── التقييمات ─────────────────────────────────────────────────────

/**
 * التحقق من وجود محادثة بين مستخدمين
 * (شرط مسبق لإمكانية التقييم)
 */
export async function checkConversationExists(buyerId, sellerId) {
  const sb = getSupabase();
  const { data } = await sb
    .from("conversations")
    .select("id")
    .or(
      `and(buyer_id.eq.${buyerId},seller_id.eq.${sellerId}),and(buyer_id.eq.${sellerId},seller_id.eq.${buyerId})`
    )
    .limit(1);
  return !!(data?.length);
}

/**
 * إضافة/استبدال تقييم لبائع (يحذف القديم ويضيف جديد)
 */
export async function upsertRating(raterId, sellerId, rating, comment) {
  const sb = getSupabase();
  await sb.from("ratings").delete().eq("rater_id", raterId).eq("seller_id", sellerId);
  return sb.from("ratings").insert({
    rater_id: raterId,
    seller_id: sellerId,
    rating,
    comment: comment?.trim() || null,
    created_at: new Date().toISOString(),
  });
}

/**
 * جلب إحصائيات تقييم بائع: المتوسط مقرَّب لرقم عشري واحد + عدد التقييمات
 */
export async function fetchSellerRatingStats(sellerId) {
  if (!sellerId) return { avg: 0, count: 0 };
  const sb = getSupabase();
  if (!sb) return { avg: 0, count: 0 };
  const { data } = await sb.from("ratings").select("rating").eq("seller_id", sellerId);
  if (!data?.length) return { avg: 0, count: 0 };
  const avg = data.reduce((a, r) => a + r.rating, 0) / data.length;
  return { avg: Math.round(avg * 10) / 10, count: data.length };
}

// ── البلاغات ──────────────────────────────────────────────────────

/**
 * التحقق إن كان المستخدم قد بلّغ سابقاً عن نفس العنصر
 */
export async function checkExistingReport(reporterId, source, itemId, conversationId = null) {
  const sb = getSupabase();
  let query = sb
    .from("reports")
    .select("id,status,created_at")
    .eq("reporter_id", reporterId)
    .eq("source", source)
    .limit(1);

  if (source === "listing") query = query.eq("listing_id", itemId);
  else query = query.eq("reported_user_id", itemId);
  if (source === "chat" && conversationId) query = query.eq("conversation_id", conversationId);

  return query.maybeSingle();
}

/**
 * إنشاء بلاغ جديد
 */
export async function insertReport(row) {
  const sb = getSupabase();
  return sb.from("reports").insert(row);
}
