import { getSupabase } from "../../shared/services/supabaseClient.js";
import { shouldStartListingRealtime } from "../../shared/utils/realtimePolicy.js";
import { getCachedAuthUser } from "../../shared/services/sessionCacheService.js";
import { removeListingMediaUrls } from "./mediaService.js";

function handleError(error, context) {
  if (error) {
    console.error(`[listingService] ${context}`, error);
    throw new Error(error.message || context);
  }
}

function formatListingTimeAgo(createdAt) {
  if (!createdAt) return "";

  const createdMs = new Date(createdAt).getTime();
  if (!Number.isFinite(createdMs)) return "";

  const diff = Math.max(0, Date.now() - createdMs);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const month = 30 * day;
  const year = 365 * day;

  if (diff < minute) return "الآن";
  if (diff < hour) return `منذ ${Math.floor(diff / minute)} د`;
  if (diff < day) return `منذ ${Math.floor(diff / hour)} س`;
  if (diff < month) return `منذ ${Math.floor(diff / day)} يوم`;
  if (diff < year) return `منذ ${Math.floor(diff / month)} شهر`;
  return `منذ ${Math.floor(diff / year)} سنة`;
}

function mapListingDetail(l) {
  if (!l) return null;

  return {
    ...l,
    seller: l.profiles?.name || l.seller || "مستخدم",
    verified: l.profiles?.verified || l.verified || false,
    daysOld: l.created_at ? Math.floor((Date.now() - new Date(l.created_at)) / 86400000) : l.daysOld,
    timeAgo: formatListingTimeAgo(l.created_at),
    sellerId: l.user_id,
    sellerName: l.profiles?.name || l.sellerName || "",
    sellerAccountType: l.profiles?.account_type || l.sellerAccountType || "individual",
    sellerPhone: l.profiles?.phone || l.sellerPhone || "",
    sellerInit: (l.profiles?.name || l.seller || "م")[0],
    accountType: l.profiles?.account_type || l.accountType || "individual",
    photo: l.listing_images?.find(i => i.is_main)?.url || l.listing_images?.[0]?.url || l.photo || null,
    images: (l.listing_images || [])
      .sort((a, b) => (b.is_main ? 1 : 0) - (a.is_main ? 1 : 0))
      .map(i => i.url),
    desc: l.description || l.desc || "",
    priceNum: parseFloat(String(l.price || "0").replace(/,/g, "")) || 0,
    _skipFetch: true
  };
}

export const listingService = {
  async createListing(payload, { status = "draft", adminStatus = "pending" } = {}) {
    const sb = getSupabase();

    const { data, error } = await sb
      .from("listings")
      .insert({
        ...payload,
        status,
        admin_status: adminStatus
      })
      .select("id")
      .single();

    handleError(error, "createListing");
    return data;
  },

  async updateListing(listingId, patch) {
    const sb = getSupabase();

    const { error } = await sb
      .from("listings")
      .update(patch)
      .eq("id", listingId);

    handleError(error, "updateListing");
  },

  async activateListing(listingId) {
    const sb = getSupabase();

    const { error } = await sb
      .from("listings")
      .update({ status: "active" })
      .eq("id", listingId);

    handleError(error, "activateListing");
  },

  async attachVideo(listingId, videoUrl) {
    if (!videoUrl) return;

    const sb = getSupabase();

    const { error } = await sb
      .from("listings")
      .update({ video_url: videoUrl })
      .eq("id", listingId);

    handleError(error, "attachVideo");
  },

  async attachImages(listingId, images) {
    if (!images?.length) return;

    const sb = getSupabase();

    const rows = images.map((img, i) => ({
      listing_id: listingId,
      url: typeof img === "string" ? img : img.url,
      is_main: typeof img === "string" ? i === 0 : !!img.is_main
    }));

    const { error } = await sb
      .from("listing_images")
      .insert(rows);

    handleError(error, "attachImages");
  },

  async deleteListing(listingId) {
    return deleteListingCompletely(listingId);
  },

  async bumpListing(listingId) {
    const sb = getSupabase();

    const { error } = await sb
      .from("listings")
      .update({ bumped_at: new Date().toISOString() })
      .eq("id", listingId);

    handleError(error, "bumpListing");
  }
};

export async function updateListingBasic(listingId, { title, price }) {
  const sb = getSupabase();

  await sb
    .from("listings")
    .update({ title, price })
    .eq("id", listingId);
}

export async function incrementAdImpressions(adId) {
  const sb = getSupabase();

  const { error } = await sb.rpc("increment_ad_impressions", {
    ad_id: adId
  });

  if (error) {
    const { data } = await sb
      .from("ads")
      .select("impressions")
      .eq("id", adId)
      .maybeSingle();

    await sb
      .from("ads")
      .update({
        impressions: Number(data?.impressions || 0) + 1
      })
      .eq("id", adId);
  }
}

export async function countUserListings(userId) {
  if (!userId) return 0;

  const sb = getSupabase();
  if (!sb) return 0;

  const { count } = await sb
    .from("listings")
    .select("*", {
      count: "exact",
      head: true
    })
    .eq("user_id", userId);

  return count || 0;
}

export async function insertWantListing(payload) {
  const sb = getSupabase();

  if (!sb) {
    return {
      error: new Error("Supabase not ready")
    };
  }

  return sb
    .from("listings")
    .insert(payload);
}

export async function fetchListingDetail(listingId, options = {}) {
  if (!listingId) return null;

  const { publicOnly = true } = options;
  const sb = getSupabase();

  let query = sb
    .from("listings")
    .select("*, profiles(id,name,verified,account_type,phone), listing_images(url,is_main)")
    .eq("id", listingId);

  if (publicOnly) {
    query = query
      .eq("status", "active")
    .eq("admin_status", "approved")
    .lte("created_at", new Date().toISOString());
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error("[listingService] fetchListingDetail", error);
    return null;
  }

  return mapListingDetail(data);
}

export async function fetchListingRow(listingId) {
  if (!listingId) return null;

  const sb = getSupabase();

  const { data } = await sb
    .from("listings")
    .select("*, listing_images(url,is_main)")
    .eq("id", listingId)
    .single();

  return data || null;
}

export async function updateListingStatus(listingId, status) {
  if (!listingId) return;

  const sb = getSupabase();

  await sb
    .from("listings")
    .update({ status })
    .eq("id", listingId);
}

export async function deleteListingCompletely(listingId) {
  if (!listingId) {
    throw new Error("رقم الإعلان غير موجود");
  }

  const sb = getSupabase();
  if (!sb) {
    throw new Error("Supabase client unavailable");
  }

  const user = await getCachedAuthUser();

  if (!user?.id) throw new Error("يجب تسجيل الدخول أولًا");

  const { data: listing, error: listingError } = await sb
    .from("listings")
    .select("id, user_id, video_url")
    .eq("id", listingId)
    .maybeSingle();

  if (listingError) throw listingError;
  if (!listing) throw new Error("الإعلان غير موجود");

  if (listing.user_id !== user.id) {
    throw new Error("لا يمكنك حذف إعلان لا تملكه");
  }

  const { data: imgs, error: imgsError } = await sb
    .from("listing_images")
    .select("url")
    .eq("listing_id", listingId);

  if (imgsError) throw imgsError;

  const mediaUrls = [
    ...(imgs || []).map(img => img.url),
    listing.video_url
  ].filter(Boolean);

  if (mediaUrls.length) {
    await removeListingMediaUrls(mediaUrls);
  }

  await sb
    .from("favorites")
    .delete()
    .eq("listing_id", listingId);

  await sb
    .from("reports")
    .delete()
    .eq("listing_id", listingId);

  await sb
    .from("listing_images")
    .delete()
    .eq("listing_id", listingId);

  const { error: deleteError } = await sb
    .from("listings")
    .delete()
    .eq("id", listingId)
    .eq("user_id", user.id);

  if (deleteError) throw deleteError;

  return {
    ok: true,
    deleted_listing_id: listingId,
    deleted_media_count: mediaUrls.length
  };
}

export async function bumpListingById(listingId) {
  if (!listingId) return;

  const sb = getSupabase();

  await sb
    .from("listings")
    .update({
      bumped_at: new Date().toISOString()
    })
    .eq("id", listingId);
}

export async function incrementListingViews(listingId, currentViews = 0) {
  if (!listingId) return null;

  const sb = getSupabase();
  const nextViews = Number(currentViews || 0) + 1;

  const { error } = await sb
    .from("listings")
    .update({ views: nextViews })
    .eq("id", listingId);

  if (error) {
    console.warn("[listingService] incrementListingViews", error);
    return null;
  }

  return nextViews;
}

export async function incrementPhoneClicks(listingId) {
  if (!listingId) return;

  const sb = getSupabase();

  await sb.rpc("increment_phone_clicks", {
    listing_id: listingId
  });
}

export async function incrementWhatsappClicks(listingId) {
  if (!listingId) return;

  const sb = getSupabase();

  await sb.rpc("increment_whatsapp_clicks", {
    listing_id: listingId
  });
}

export async function fetchApprovedActiveListingsCount() {
  const sb = getSupabase();

  const { count } = await sb
    .from("listings")
    .select("id", {
      count: "exact",
      head: true
    })
    .eq("status", "active")
    .eq("admin_status", "approved")
    .lte("created_at", new Date().toISOString());

  return count || 0;
}

export async function fetchPendingListingsCount() {
  const sb = getSupabase();

  const { count } = await sb
    .from("listings")
    .select("id", {
      count: "exact",
      head: true
    })
    .eq("admin_status", "pending");

  return count || 0;
}

export async function fetchListingViewsFallback(listingId) {
  const row = await fetchListingRow(listingId);
  return Number(row?.views || 0);
}

export function mapListingSummary(l) {
  if (!l) return null;

  return {
    ...l,
    seller: l.profiles?.name || "مستخدم",
    verified: l.profiles?.verified || false,
    daysOld: l.created_at ? Math.floor((Date.now() - new Date(l.created_at)) / 86400000) : 0,
    timeAgo: formatListingTimeAgo(l.created_at),
    sellerId: l.user_id,
    sellerName: l.profiles?.name || "",
    sellerAccountType: l.profiles?.account_type || "individual",
    sellerPhone: l.profiles?.phone || "",
    sellerInit: (l.profiles?.name || "م")[0],
    accountType: l.profiles?.account_type || "individual",
    photo: l.listing_images?.find(i => i.is_main)?.url || l.listing_images?.[0]?.url || null,
    images: (l.listing_images || [])
      .sort((a, b) => (b.is_main ? 1 : 0) - (a.is_main ? 1 : 0))
      .map(i => i.url),
    desc: l.description || "",
    priceNum: parseFloat(String(l.price || "0").replace(/,/g, "")) || 0,
    rooms: l.rooms ?? null,
    video_url: l.video_url || null,
    external_url: l.external_url || null
  };
}

function filterValueToArray(value) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (value === 0) return ["0"];
  if (value === "" || value === null || value === undefined || value === "الكل") return [];
  return String(value).split(/[،,]/).map(x => x.trim()).filter(Boolean);
}

function isFilledFilterValue(value) {
  if (Array.isArray(value)) return value.length > 0;
  return value !== undefined && value !== null && value !== "" && value !== "الكل" && value !== "newest";
}

function escapePostgrestLikeValue(value) {
  return String(value).replace(/[%*_]/g, "").replace(/[(),]/g, "").trim();
}


function expandFacingSearchValues(value) {
  const raw = String(value || "").trim();
  const variants = {
    "شمالي": ["شمال", "شمالي"],
    "شمال": ["شمال", "شمالي"],
    "جنوبي": ["جنوب", "جنوبي", "قبلي"],
    "جنوب": ["جنوب", "جنوبي", "قبلي"],
    "قبلي": ["جنوب", "جنوبي", "قبلي"],
    "شرقي": ["شرق", "شرقي"],
    "شرق": ["شرق", "شرقي"],
    "غربي": ["غرب", "غربي"],
    "غرب": ["غرب", "غربي"],
    "شمال شرقي": ["شمال شرق", "شمال شرقي"],
    "شمال شرق": ["شمال شرق", "شمال شرقي"],
    "شمال غربي": ["شمال غرب", "شمال غربي"],
    "شمال غرب": ["شمال غرب", "شمال غربي"],
    "جنوب شرقي": ["جنوب شرق", "جنوب شرقي"],
    "جنوب شرق": ["جنوب شرق", "جنوب شرقي"],
    "جنوب غربي": ["جنوب غرب", "جنوب غربي"],
    "جنوب غرب": ["جنوب غرب", "جنوب غربي"]
  };

  return variants[raw] || [raw];
}

function buildFacingOrFilter(values) {
  const terms = [...new Set(
    filterValueToArray(values)
      .flatMap(expandFacingSearchValues)
      .map(escapePostgrestLikeValue)
      .filter(Boolean)
  )];

  return terms.length ? terms.map(v => `facing_dir.ilike.%${v}%`).join(",") : "";
}

function normalizeListingType(value) {
  if (!isFilledFilterValue(value)) return null;

  const map = {
    "للبيع": "sell",
    "بيع": "sell",
    sell: "sell",
    "للإيجار": "rent",
    "للايجار": "rent",
    "إيجار": "rent",
    "ايجار": "rent",
    rent: "rent",
    lease: "rent",
    "تأجير": "rent",
    "مطلوب شراء": "want_buy",
    want_buy: "want_buy",
    "مطلوب إيجار": "want_rent",
    "مطلوب ايجار": "want_rent",
    want_rent: "want_rent"
  };

  return map[value] || value;
}

function normalizeTextSearchValue(value) {
  if (!isFilledFilterValue(value)) return null;
  return String(value).split("(")[0].trim();
}

function getCategoryFilterValues(value) {
  if (!isFilledFilterValue(value)) return [];
  const v = String(value || "").trim();
  if (v === "محل" || v === "محل تجاري") return ["محل تجاري", "محل"];
  return [v];
}

function buildAreaRangeOrFilter(minArea, maxArea) {
  const min = isFilledFilterValue(minArea) ? Number(minArea) : null;
  const max = isFilledFilterValue(maxArea) ? Number(maxArea) : null;

  if ((min !== null && !Number.isFinite(min)) || (max !== null && !Number.isFinite(max))) return "";
  if (min === null && max === null) return "";

  const columns = ["net_area", "total_area", "land_area", "build_area"];

  return columns.map(col => {
    const parts = [];
    if (min !== null) parts.push(`${col}.gte.${min}`);
    if (max !== null) parts.push(`${col}.lte.${max}`);
    return parts.length === 1 ? parts[0] : `and(${parts.join(",")})`;
  }).join(",");
}

function applyApprovedListingsQueryFilters(query, filterInput = {}) {
  const advanced = filterInput?.filters || {};

  const activeType = filterInput?.activeType ?? advanced.activeType ?? "الكل";
  const activeCity = filterInput?.activeCity ?? advanced.activeCity ?? "الكل";
  const activeDistrict = filterInput?.activeDistrict ?? advanced.activeDistrict ?? "الكل";
  const activeVillage = filterInput?.activeVillage ?? advanced.activeVillage ?? "الكل";

  const type = normalizeListingType(activeType);
  if (type) query = query.eq("type", type);

  if (isFilledFilterValue(activeCity)) query = query.eq("city", activeCity);
  if (isFilledFilterValue(activeDistrict)) query = query.eq("district", activeDistrict);
  if (isFilledFilterValue(activeVillage)) query = query.eq("village", activeVillage);

  if (isFilledFilterValue(advanced.category)) {
    const categoryValues = getCategoryFilterValues(advanced.category);
    if (categoryValues.length === 1) query = query.eq("category", categoryValues[0]);
    else if (categoryValues.length > 1) query = query.in("category", categoryValues);
  }
  const pricedOnly = advanced.pricedOnly === true || advanced.pricedOnly === "true" || advanced.priceMode === "priced";
  const hasPriceRange = isFilledFilterValue(advanced.minPrice) || isFilledFilterValue(advanced.maxPrice);
  const hasCurrencyFilter = isFilledFilterValue(advanced.currency);

  if (hasCurrencyFilter) query = query.eq("currency", advanced.currency);

  // عند تفعيل خيار "إظهار فقط الإعلانات المذكور سعرها" أو استعمال أي فلتر سعر،
  // لا تُعرض إعلانات السعر عند التواصل لأنها مخزنة بسعر 0.
  if (pricedOnly || hasPriceRange || hasCurrencyFilter) {
    query = query.gt("price", 0);
  }

  if (isFilledFilterValue(advanced.minPrice)) query = query.gte("price", Number(advanced.minPrice));
  if (isFilledFilterValue(advanced.maxPrice)) query = query.lte("price", Number(advanced.maxPrice));

  const areaRangeOr = buildAreaRangeOrFilter(advanced.minArea, advanced.maxArea);
  if (areaRangeOr) query = query.or(areaRangeOr);

  if (isFilledFilterValue(advanced.beds)) {
    if (advanced.beds === "5+") {
      query = query.gte("rooms", 5);
    } else {
      query = query.eq("rooms", Number(advanced.beds));
    }
  }

  const floorList = filterValueToArray(advanced.floor).map(Number).filter(Number.isFinite);
  if (floorList.length === 1) query = query.eq("floor", floorList[0]);
  else if (floorList.length > 1) query = query.in("floor", floorList);

  const ownership = normalizeTextSearchValue(advanced.ownership);
  if (ownership) query = query.ilike("ownership", `%${ownership}%`);

  // الجهة: الإضافة تحفظ أحياناً "شمال/جنوب/شرق/غرب"،
  // والفلتر يعرض "شمالي/جنوبي/شرقي/غربي"؛ لذلك نستخدم OR بالمرادفات.
  const facingOr = buildFacingOrFilter(advanced.facing);
  if (facingOr) query = query.or(facingOr);

  if (isFilledFilterValue(advanced.condition)) query = query.eq("condition", advanced.condition);
  if (isFilledFilterValue(advanced.finishing)) query = query.eq("finishing", advanced.finishing);
  if (isFilledFilterValue(advanced.heating)) query = query.eq("heating", advanced.heating);

  if (advanced.elevator === "يوجد") query = query.eq("elevator", true);
  if (advanced.elevator === "لا يوجد") query = query.eq("elevator", false);

  if (advanced.parking === "يوجد") query = query.eq("parking", true);
  if (advanced.parking === "لا يوجد") query = query.eq("parking", false);

  if (advanced.furnished === "مفروش") query = query.eq("furnished", "مفروش");
  if (advanced.furnished === "غير مفروش") query = query.neq("furnished", "مفروش");

  if (advanced._newOnly) {
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    query = query.gte("created_at", oneMonthAgo);
  }

  return query;
}

export async function fetchApprovedListingsPage({
  limit = 50,
  beforeCreatedAt = null,
  filters = {}
} = {}) {
  const sb = getSupabase();
  if (!sb) return [];

  let query = sb
    .from("listings")
    .select("*, profiles(id,name,verified,account_type,phone), listing_images(url,is_main)")
    .eq("status", "active")
    .eq("admin_status", "approved")
    .lte("created_at", new Date().toISOString());

  query = applyApprovedListingsQueryFilters(query, filters);

  query = query
    .order("created_at", {
      ascending: false
    })
    .limit(limit);

  if (beforeCreatedAt) {
    query = query.lt("created_at", beforeCreatedAt);
  }

  const { data, error } = await query;

  handleError(error, "fetchApprovedListingsPage");

  return (data || []).map(mapListingSummary);
}

export function subscribeToListingsChanges(onChange) {
  if (!shouldStartListingRealtime()) return () => {};

  const sb = getSupabase();
  if (!sb) return () => {};

  const ch = sb
    .channel("listings-changes")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "listings"
      },
      () => onChange?.()
    )
    .subscribe();

  return () => sb.removeChannel(ch);
                  }
