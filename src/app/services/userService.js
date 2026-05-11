/**
 * userService.js
 * طبقة البيانات لعمليات المستخدم — المفضلة، المتابعون، إعلاناتي
 */

import { getSupabase } from "../../shared/services/supabaseClient.js";

// ── دالة وقت موحدة مثل لوحة التحكم ───────────────────────────────

function timeAgo(date) {
  if (!date) return "";

  const d = Math.floor((Date.now() - new Date(date).getTime()) / 60000);

  if (d < 60) return `${d} د`;
  if (d < 1440) return `${Math.floor(d / 60)} س`;
  return `${Math.floor(d / 1440)} يوم`;
}

// ── المفضلة ─────────────────────────────────────────────────────────

export async function fetchUserFavorites(userId) {
  if (!userId) return [];
  const sb = getSupabase();
  const { data } = await sb
    .from("favorites")
    .select("listing_id")
    .eq("user_id", userId);

  return (data || []).map(f => Number(f.listing_id));
}

export async function addFavorite(userId, listingId) {
  const sb = getSupabase();
  await sb.from("favorites").insert({
    user_id: userId,
    listing_id: listingId,
  });
}

export async function removeFavorite(userId, listingId) {
  const sb = getSupabase();
  await sb
    .from("favorites")
    .delete()
    .eq("user_id", userId)
    .eq("listing_id", listingId);
}

// ── المتابعون ────────────────────────────────────────────────────────

export async function fetchUserFollows(userId) {
  if (!userId) return [];

  const sb = getSupabase();
  const { data } = await sb
    .from("follows")
    .select("seller_id")
    .eq("follower_id", userId);

  return (data || []).map(f => f.seller_id);
}

/**
 * جلب الأشخاص الذين يتابعهم المستخدم مع ملفاتهم الشخصية
 */
export async function fetchFollowingWithProfiles(followerId) {
  if (!followerId) return [];

  const sb = getSupabase();
  if (!sb) return [];

  const { data: followData } = await sb
    .from("follows")
    .select("seller_id")
    .eq("follower_id", followerId);

  const ids = (followData || []).map(f => f.seller_id);
  if (!ids.length) return [];

  const { data: profiles } = await sb
    .from("profiles")
    .select("id, name, account_type")
    .in("id", ids);

  return profiles || [];
}

export async function addFollow(followerId, sellerId) {
  const sb = getSupabase();
  await sb.from("follows").insert({
    follower_id: followerId,
    seller_id: sellerId,
  });
}

export async function removeFollow(followerId, sellerId) {
  const sb = getSupabase();
  await sb
    .from("follows")
    .delete()
    .eq("follower_id", followerId)
    .eq("seller_id", sellerId);
}

export async function upsertFollow(followerId, sellerId) {
  const sb = getSupabase();

  await sb.from("follows").upsert(
    {
      follower_id: followerId,
      seller_id: sellerId,
    },
    {
      onConflict: "follower_id,seller_id",
    }
  );
}

// ── إعلاناتي ─────────────────────────────────────────────────────────

export async function fetchMyListings(userId) {
  if (!userId) return [];

  const sb = getSupabase();

  const { data } = await sb
    .from("listings")
    .select("*, listing_images(url,is_main)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return (data || []).map(l => ({
    id: l.id,
    title: l.title,
    price: l.price,
    currency: l.currency || "USD",
    type: l.type,
    category: l.category,
    city: l.city,
    district: l.district || "",
    total_area: l.total_area,
    rooms: l.rooms,
    baths: l.baths,
    status: l.status || "active",
    admin_status: l.admin_status || null,

    // مهم: إبقاء التواريخ الأصلية ليستعملها الكرت والتفاصيل
    created_at: l.created_at,
    updated_at: l.updated_at,
    expires_at: l.expires_at,

    // مثل لوحة التحكم تمامًا
    time: "منذ " + timeAgo(l.created_at),

    // يبقى هذا للحسابات الداخلية مثل مدة الإعلان
    daysOld: Math.floor((Date.now() - new Date(l.created_at).getTime()) / 86400000),

    views: l.views || 0,
    leads: 0,

    photo:
      (l.listing_images || []).find(i => i.is_main)?.url ||
      (l.listing_images || [])[0]?.url ||
      null,

    rejection_reason: l.rejection_reason || null,
  }));
}

// ── إحصائيات المستخدم ────────────────────────────────────────────

export async function fetchUserStats(userId) {
  if (!userId) return null;

  const sb = getSupabase();

  const [{ data: ownListings }, { count: messagesCount }] = await Promise.all([
    sb.from("listings").select("id, views").eq("user_id", userId),
    sb
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("receiver_id", userId),
  ]);

  const listingIds = (ownListings || []).map(x => x.id);

  let favoritesCount = 0;

  if (listingIds.length) {
    const { count } = await sb
      .from("favorites")
      .select("*", { count: "exact", head: true })
      .in("listing_id", listingIds);

    favoritesCount = count || 0;
  }

  const totalViews = (ownListings || []).reduce(
    (sum, l) => sum + (Number(l.views) || 0),
    0
  );

  return {
    views: totalViews,
    messages: messagesCount || 0,
    favorites: favoritesCount,
    listings: (ownListings || []).length,
  };
}

export async function updateLastSeen(userId) {
  if (!userId) return;

  const sb = getSupabase();

  await sb
    .from("profiles")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", userId);
}

export async function toggleFollowDB(userId, sellerId, isFollowed) {
  const sb = getSupabase();

  if (isFollowed) {
    return sb
      .from("follows")
      .delete()
      .eq("follower_id", userId)
      .eq("seller_id", sellerId);
  }

  return sb.from("follows").insert({
    follower_id: userId,
    seller_id: sellerId,
  });
}

export async function toggleFavDB(userId, listingId, isFaved) {
  const sb = getSupabase();

  if (isFaved) {
    return sb
      .from("favorites")
      .delete()
      .eq("user_id", userId)
      .eq("listing_id", listingId);
  }

  return sb.from("favorites").insert({
    user_id: userId,
    listing_id: listingId,
  });
}

export async function fetchProfilesByIds(ids = [], select = "id,name,account_type") {
  if (!ids?.length) return [];

  const sb = getSupabase();

  const { data } = await sb
    .from("profiles")
    .select(select)
    .in("id", ids);

  return data || [];
}
