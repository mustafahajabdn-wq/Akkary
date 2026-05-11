/**
 * blockService.js
 * طبقة البيانات لحظر المستخدمين
 */

import { getSupabase } from "../../shared/services/supabaseClient.js";

/**
 * جلب كل المستخدمين المحظورين من قِبل مستخدم معيّن (مع ملفاتهم الشخصية)
 */
export async function fetchBlockedUsers(blockerId) {
  if (!blockerId) return [];

  const sb = getSupabase();
  if (!sb) return [];

  const { data: bdata, error: blockedError } = await sb
    .from("blocked_users")
    .select("blocked_id")
    .eq("blocker_id", blockerId);

  if (blockedError) {
    console.error("fetchBlockedUsers error:", blockedError);
    return [];
  }

  if (!bdata?.length) return [];

  const ids = bdata.map((b) => b.blocked_id).filter(Boolean);

  if (!ids.length) return [];

  const { data: profiles, error: profilesError } = await sb
    .from("profiles")
    .select("id,name,account_type")
    .in("id", ids);

  if (profilesError) {
    console.error("fetchBlockedUsers profiles error:", profilesError);
  }

  const profileMap = {};

  (profiles || []).forEach((p) => {
    profileMap[p.id] = p;
  });

  return bdata.map((b) => ({
    ...b,
    profile: profileMap[b.blocked_id] || null,
  }));
}

/**
 * فك حظر مستخدم
 */
export async function unblockUser(blockerId, blockedId) {
  if (!blockerId || !blockedId) return false;

  const sb = getSupabase();
  if (!sb) return false;

  const { error } = await sb
    .from("blocked_users")
    .delete()
    .eq("blocker_id", blockerId)
    .eq("blocked_id", blockedId);

  if (error) {
    console.error("unblockUser error:", error);
    return false;
  }

  return true;
}

/**
 * حظر مستخدم (upsert — لا يفشل لو الحظر موجود مسبقاً)
 */
export async function blockUser(blockerId, blockedId) {
  if (!blockerId || !blockedId) return false;

  const sb = getSupabase();
  if (!sb) return false;

  const { error } = await sb.from("blocked_users").upsert(
    {
      blocker_id: blockerId,
      blocked_id: blockedId,
    },
    {
      onConflict: "blocker_id,blocked_id",
    }
  );

  if (error) {
    console.error("blockUser error:", error);
    return false;
  }

  return true;
}

/**
 * التحقق إن كان مستخدم محظوراً من قِبل مستخدم آخر
 *
 * مهم:
 * نستخدم maybeSingle بدل single.
 * لأن عدم وجود حظر هو نتيجة طبيعية، وليس خطأ.
 * single كان يسبب 406 Not Acceptable إذا لم يجد صفًا.
 */
export async function isUserBlocked(blockerId, blockedId) {
  if (!blockerId || !blockedId) return false;

  const sb = getSupabase();
  if (!sb) return false;

  const { data, error } = await sb
    .from("blocked_users")
    .select("id")
    .eq("blocker_id", blockerId)
    .eq("blocked_id", blockedId)
    .maybeSingle();

  if (error) {
    console.error("isUserBlocked error:", error);
    return false;
  }

  return !!data;
}

/**
 * حظر مستخدم + إلغاء المتابعة بين الطرفين تلقائياً
 * يُستخدم في صفحة البائع: "حظر هذا الحساب"
 */
export async function blockUserAndCleanFollows(blockerId, blockedId) {
  if (!blockerId || !blockedId) return false;

  const sb = getSupabase();
  if (!sb) return false;

  const { error: blockError } = await sb.from("blocked_users").upsert(
    {
      blocker_id: blockerId,
      blocked_id: blockedId,
    },
    {
      onConflict: "blocker_id,blocked_id",
    }
  );

  if (blockError) {
    console.error("blockUserAndCleanFollows block error:", blockError);
    return false;
  }

  const { error: removeForwardFollowError } = await sb
    .from("follows")
    .delete()
    .eq("follower_id", blockerId)
    .eq("seller_id", blockedId);

  if (removeForwardFollowError) {
    console.error(
      "blockUserAndCleanFollows remove forward follow error:",
      removeForwardFollowError
    );
  }

  const { error: removeReverseFollowError } = await sb
    .from("follows")
    .delete()
    .eq("follower_id", blockedId)
    .eq("seller_id", blockerId);

  if (removeReverseFollowError) {
    console.error(
      "blockUserAndCleanFollows remove reverse follow error:",
      removeReverseFollowError
    );
  }

  return true;
}
