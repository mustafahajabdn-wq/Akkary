/**
 * pushService.js
 * طبقة البيانات لاشتراكات Push — كل عمليات جدول push_subscriptions
 */

import { getSupabase } from "../../shared/services/supabaseClient.js";

/**
 * احذف أي اشتراك قديم لنفس الـ endpoint من مستخدم آخر
 */
export async function removeOldEndpointSubscription(endpoint, currentUserId) {
  const sb = getSupabase();
  await sb.from('push_subscriptions')
    .delete()
    .eq('endpoint', endpoint)
    .neq('user_id', currentUserId);
}

/**
 * أضف أو حدّث اشتراك push للمستخدم على هذا الجهاز
 */
export async function upsertPushSubscription(userId, subscription) {
  if (!userId) return;
  const sb = getSupabase();
  const endpoint = subscription.endpoint;
  await sb.from('push_subscriptions').upsert({
    user_id:      userId,
    endpoint,
    subscription: JSON.stringify(subscription),
    device:       navigator.userAgent.slice(0, 200),
    updated_at:   new Date().toISOString(),
  }, { onConflict: 'user_id,endpoint' });
}

/**
 * احذف اشتراك جهاز محدد للمستخدم
 */
export async function deletePushSubscriptionByEndpoint(userId, endpoint) {
  if (!userId) return;
  const sb = getSupabase();
  await sb.from('push_subscriptions')
    .delete()
    .eq('user_id', userId)
    .eq('endpoint', endpoint);
}

/**
 * احذف كل اشتراكات المستخدم (fallback)
 */
export async function deleteAllUserSubscriptions(userId) {
  if (!userId) return;
  const sb = getSupabase();
  await sb.from('push_subscriptions').delete().eq('user_id', userId);
}
