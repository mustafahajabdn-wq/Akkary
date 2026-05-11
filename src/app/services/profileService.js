/**
 * profileService.js
 * طبقة البيانات للملف الشخصي والمصادقة
 */

import { getSupabase } from "../../shared/services/supabaseClient.js";
import { shouldStartUserBadgeRealtime } from "../../shared/utils/realtimePolicy.js";
import { loadRolePermissions } from "../../shared/services/appConfigService.js";

const PROFILE_CACHE_TTL_MS = 60 * 1000;
const profileCache = new Map();
const profilePromises = new Map();
const sellerProfileCache = new Map();
const sellerProfilePromises = new Map();

function now() {
  return Date.now();
}

function isFresh(entry, ttl = PROFILE_CACHE_TTL_MS) {
  return !!entry && now() - entry.ts < ttl;
}

function setProfileCache(userId, data) {
  if (!userId || !data) return;
  profileCache.set(userId, { ts: now(), data });
}

function setSellerProfileCache(userId, data) {
  if (!userId || !data) return;
  sellerProfileCache.set(userId, { ts: now(), data });
}

export function invalidateProfileCache(userId = null) {
  if (!userId) {
    profileCache.clear();
    sellerProfileCache.clear();
    profilePromises.clear();
    sellerProfilePromises.clear();
    return;
  }

  profileCache.delete(userId);
  sellerProfileCache.delete(userId);
  profilePromises.delete(userId);
  sellerProfilePromises.delete(userId);
}

/**
 * جلب الملف الشخصي للمستخدم
 */
export async function fetchProfile(userId, { refresh = false } = {}) {
  if (!userId) return null;

  if (!refresh) {
    const cached = profileCache.get(userId);
    if (isFresh(cached)) return cached.data;

    const pending = profilePromises.get(userId);
    if (pending) return pending;
  }

  const sb = getSupabase();
  if (!sb) return null;

  const promise = sb
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single()
    .then(({ data, error }) => {
      if (error) {
        console.error("fetchProfile error:", error);
        return null;
      }

      setProfileCache(userId, data);
      return data;
    })
    .finally(() => {
      profilePromises.delete(userId);
    });

  profilePromises.set(userId, promise);
  return promise;
}

/**
 * جلب الملف الشخصي الكامل للبائع
 */
export async function fetchSellerProfile(userId, { refresh = false } = {}) {
  if (!userId) return null;

  if (!refresh) {
    const cached = sellerProfileCache.get(userId);
    if (isFresh(cached)) return cached.data;

    const pending = sellerProfilePromises.get(userId);
    if (pending) return pending;
  }

  const sb = getSupabase();
  if (!sb) return null;

  const promise = sb
    .from("profiles")
    .select(
      "id,name,verified,account_type,avatar_url,cover_url,phone,phone2,whatsapp,whatsapp2,messenger_id,shamcash_code,shamcash_visible,created_at"
    )
    .eq("id", userId)
    .single()
    .then(({ data, error }) => {
      if (error) {
        console.error("fetchSellerProfile error:", error);
        return null;
      }

      const normalized = {
        ...data,

        // قيم افتراضية للتوافق مع أي واجهة قديمة كانت تتوقع هذه الحقول
        bio: null,
        rating_avg: 0,
        rating_count: 0,
      };

      setSellerProfileCache(userId, normalized);
      return normalized;
    })
    .finally(() => {
      sellerProfilePromises.delete(userId);
    });

  sellerProfilePromises.set(userId, promise);
  return promise;
}

/**
 * تحديث جزئي لحقول الملف الشخصي
 */
export async function updateProfile(userId, patch) {
  if (!userId || !patch) {
    return {
      data: null,
      error: new Error("Missing userId or patch"),
    };
  }

  const sb = getSupabase();

  if (!sb) {
    return {
      data: null,
      error: new Error("Supabase client unavailable"),
    };
  }

  const { data, error } = await sb
    .from("profiles")
    .update(patch)
    .eq("id", userId)
    .select("*")
    .single();

  if (error) {
    console.error("updateProfile error:", error);
  } else if (data) {
    setProfileCache(userId, data);
    sellerProfileCache.delete(userId);
  }

  return { data, error };
}

/**
 * رفع التعليق تلقائياً إذا انتهت المدة
 */
export async function liftSuspensionIfExpired(userId, suspendedUntil) {
  if (!userId || !suspendedUntil || new Date(suspendedUntil) >= new Date()) return;

  const sb = getSupabase();
  if (!sb) return;

  const { error } = await sb
    .from("profiles")
    .update({
      is_suspended: false,
      suspended_until: null,
    })
    .eq("id", userId);

  if (error) {
    console.error("liftSuspensionIfExpired error:", error);
  } else {
    const cached = profileCache.get(userId);
    if (cached?.data) {
      setProfileCache(userId, {
        ...cached.data,
        is_suspended: false,
        suspended_until: null,
      });
    }
  }
}

/**
 * جلب صلاحيات الأدوار من كاش app_settings الموحد.
 */
export async function fetchRolePermissions(role) {
  return (await loadRolePermissions(role)) || [];
}

/**
 * إنشاء أو تحديث profile للمستخدم الجديد
 */
export async function upsertProfile(userId, data) {
  if (!userId) return null;

  const sb = getSupabase();
  if (!sb) return null;

  const { data: result, error } = await sb
    .from("profiles")
    .upsert(
      {
        id: userId,
        ...data,
      },
      {
        onConflict: "id",
      }
    )
    .select("*")
    .single();

  if (error) {
    console.error("upsertProfile error:", error);
    return null;
  }

  setProfileCache(userId, result);
  sellerProfileCache.delete(userId);
  return result;
}

/**
 * عدد الإشعارات غير المقروءة
 */
export async function fetchUnreadNotificationsCount(userId) {
  if (!userId) return 0;

  const sb = getSupabase();
  if (!sb) return 0;

  const { count, error } = await sb
    .from("notifications")
    .select("id", { count: "exact" })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) {
    console.error("fetchUnreadNotificationsCount error:", error);
    return 0;
  }

  return count || 0;
}

/**
 * عدد الرسائل غير المقروءة
 */
export async function fetchUnreadMessagesCount(userId) {
  if (!userId) return 0;

  const sb = getSupabase();
  if (!sb) return 0;

  const { count, error } = await sb
    .from("messages")
    .select("id", { count: "exact" })
    .eq("receiver_id", userId)
    .eq("is_read", false);

  if (error) {
    console.error("fetchUnreadMessagesCount error:", error);
    return 0;
  }

  return count || 0;
}

/**
 * الاشتراك في تغييرات الإشعارات realtime
 */
export function subscribeToNotifications(userId, onChange) {
  if (!userId) return () => {};
  if (!shouldStartUserBadgeRealtime()) return () => {};

  const sb = getSupabase();
  if (!sb) return () => {};

  const ch = sb
    .channel("unread-notifs-" + userId)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: "user_id=eq." + userId,
      },
      onChange
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "notifications",
        filter: "user_id=eq." + userId,
      },
      onChange
    )
    .subscribe();

  return () => sb.removeChannel(ch);
}

/**
 * الاشتراك في تغييرات الرسائل غير المقروءة realtime
 */
export function subscribeToUnreadMessages(userId, onChange) {
  if (!userId) return () => {};
  if (!shouldStartUserBadgeRealtime()) return () => {};

  const sb = getSupabase();
  if (!sb) return () => {};

  const ch = sb
    .channel("unread-msgs-" + userId)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: "receiver_id=eq." + userId,
      },
      onChange
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "messages",
        filter: "receiver_id=eq." + userId,
      },
      onChange
    )
    .subscribe();

  return () => sb.removeChannel(ch);
}

/**
 * تحديث بيانات شام كاش
 */
export async function updateShamcash(userId, code, visible) {
  if (!userId) {
    return {
      data: null,
      error: new Error("Missing userId"),
    };
  }

  const sb = getSupabase();

  if (!sb) {
    return {
      data: null,
      error: new Error("Supabase client unavailable"),
    };
  }

  const { data, error } = await sb
    .from("profiles")
    .update({
      shamcash_code: code,
      shamcash_visible: visible,
    })
    .eq("id", userId)
    .select("*")
    .single();

  if (error) {
    console.error("updateShamcash error:", error);
  } else if (data) {
    setProfileCache(userId, data);
    sellerProfileCache.delete(userId);
  }

  return { data, error };
}
