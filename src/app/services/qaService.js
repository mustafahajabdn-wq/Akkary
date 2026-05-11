/**
 * qaService.js
 * طبقة البيانات للأسئلة والأجوبة على الإعلانات
 */

import { getSupabase } from "../../shared/services/supabaseClient.js";

/**
 * جلب حالة الـ Q&A والأسئلة لإعلان معيّن
 */
export async function fetchQAData(listingId) {
  if (!listingId) return { enabled: false, questions: [] };
  const sb = getSupabase();

  const { data: listing } = await sb
    .from("listings")
    .select("qa_enabled")
    .eq("id", listingId)
    .single();

  const { data: questions } = await sb
    .from("questions")
    .select("*,profiles(name,avatar_url)")
    .eq("listing_id", listingId)
    .order("created_at");

  return { enabled: !!listing?.qa_enabled, questions: questions || [] };
}

/**
 * تفعيل/إيقاف الـ Q&A على إعلان
 */
export async function setQAEnabled(listingId, val) {
  const sb = getSupabase();
  await sb.from("listings").update({ qa_enabled: val }).eq("id", listingId);
}

/**
 * إضافة سؤال جديد
 */
export async function insertQuestion(listingId, userId, questionText) {
  const sb = getSupabase();
  await sb.from("questions").insert({
    listing_id: listingId,
    user_id: userId,
    question: questionText,
  });
}

/**
 * إشعار صاحب الإعلان بسؤال جديد
 */
export async function insertQuestionNotification(ownerId, senderName, listingId) {
  const sb = getSupabase();
  await sb.from("notifications").insert({
    user_id: ownerId,
    type: "question",
    title: "سؤال جديد",
    body: `${senderName} سألك عن إعلانك`,
    data: { listing_id: listingId },
  });
}

/**
 * الإجابة على سؤال
 */
export async function answerQuestion(questionId, text) {
  const sb = getSupabase();
  await sb
    .from("questions")
    .update({ answer: text.trim(), answered_at: new Date() })
    .eq("id", questionId);
}

/**
 * إشعار السائل بأنه تم الرد عليه
 */
export async function insertAnswerNotification(askerId, sellerName, listingId) {
  const sb = getSupabase();
  await sb.from("notifications").insert({
    user_id: askerId,
    type: "answer",
    title: "تم الرد على سؤالك",
    body: `${sellerName} أجاب على سؤالك`,
    data: { listing_id: listingId },
  });
}

/**
 * حذف سؤال (المستخدم يحذف سؤاله، أو الأدمن يحذف أي سؤال)
 */
export async function deleteQuestion(questionId, userId, isAdmin) {
  const sb = getSupabase();
  let query = sb.from("questions").delete().eq("id", questionId);
  if (!isAdmin) query = query.eq("user_id", userId);
  return query;
}
