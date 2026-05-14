import {
  adminCount,
  adminDelete,
  adminGet,
  adminInvokeFunction,
  adminInvokeRpc,
  adminPatch,
  adminPost,
  roleProxyGet,
  roleProxyPatch,
  roleProxyPost,
  uploadAdminImage,
  deleteStoragePathsAdmin
} from "./adminApi.js";
import { invalidateAppSettingsCache } from "../../shared/services/appConfigService.js";

const LISTING_IMAGES_BUCKET = "listing-images";
const SAFE_STORAGE_PATH = /^[\w./-]+$/;

export function uploadAdImage(file, path) {
  return uploadAdminImage(path, file);
}

function asArray(value) {
  if (Array.isArray(value)) return value;

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
}

function extractAdminStoragePath(value) {
  if (!value) return null;

  const raw = String(value).trim();
  if (!raw) return null;

  try {
    const parsed = new URL(raw);
    const path = parsed.pathname;

    const publicMarker = `/storage/v1/object/public/${LISTING_IMAGES_BUCKET}/`;
    const signedMarker = `/storage/v1/object/sign/${LISTING_IMAGES_BUCKET}/`;

    let bucketPath = null;

    if (path.includes(publicMarker)) {
      bucketPath = path.slice(path.indexOf(publicMarker) + publicMarker.length);
    } else if (path.includes(signedMarker)) {
      bucketPath = path.slice(path.indexOf(signedMarker) + signedMarker.length);
    }

    if (!bucketPath) return null;

    const clean = decodeURIComponent(bucketPath)
      .split("?")[0]
      .split("#")[0]
      .replace(/^\/+/, "");

    if (!clean || clean.includes("..") || clean.includes("\\") || !SAFE_STORAGE_PATH.test(clean)) {
      return null;
    }

    return clean;
  } catch {
    const clean = raw
      .split("?")[0]
      .split("#")[0]
      .replace(/^\/+/, "");

    if (!clean || clean.includes("..") || clean.includes("\\") || !SAFE_STORAGE_PATH.test(clean)) {
      return null;
    }

    return clean;
  }
}

function adStorageUrls(ad) {
  return [ad?.image_url, ...asArray(ad?.images)].filter(Boolean);
}


async function safeAdminDelete(path) {
  try {
    await adminDelete(path);
  } catch (error) {
    // تنظيف اختياري: بعض الجداول القديمة لا تملك listing_id أو data.
    // لا نوقف حذف الإعلان بسبب سجل تنظيف غير موجود أو عمود غير موجود.
    console.warn("admin optional cleanup skipped", path, error);
  }
}

async function deleteListingNotificationsCascade(listingId, conversationIds = []) {
  const ids = Array.isArray(conversationIds)
    ? conversationIds.map(id => String(id).trim()).filter(Boolean)
    : [];

  const tasks = [
    // إن كان لدى notifications عمود listing_id مباشر.
    safeAdminDelete(`/rest/v1/notifications?listing_id=eq.${listingId}`),

    // الإشعارات الحديثة تحفظ listing_id داخل data.
    safeAdminDelete(`/rest/v1/notifications?data->>listing_id=eq.${listingId}`)
  ];

  if (ids.length) {
    // إشعارات الرسائل تحفظ conversation_id داخل data، لا كعمود مستقل.
    tasks.push(
      safeAdminDelete(`/rest/v1/notifications?data->>conversation_id=in.(${ids.join(",")})`)
    );
  }

  await Promise.all(tasks);
}

async function removeAdminStorageUrls(urls = []) {
  const paths = [
    ...new Set(
      (Array.isArray(urls) ? urls : [])
        .map(extractAdminStoragePath)
        .filter(Boolean)
    )
  ];

  if (!paths.length) return;

  await deleteStoragePathsAdmin(paths).catch(error => {
    console.warn("admin storage cleanup failed", error);
  });
}

export function fetchAdCodes() {
  return adminGet("/rest/v1/ad_codes?order=created_at.desc&limit=50", []);
}

export function createAdCode(payload) {
  return adminPost("/rest/v1/ad_codes", payload);
}

export function deleteAdCode(id) {
  return adminDelete(`/rest/v1/ad_codes?id=eq.${id}`);
}

export function fetchAdminAds() {
  return adminGet("/rest/v1/ads?order=created_at.desc&select=*,profiles(name,phone)", []);
}

export async function approveAdWithNotification(ad) {
  await adminPatch(`/rest/v1/ads?id=eq.${ad.id}`, {
    status: "approved",
    active: true
  });

  if (ad?.user_id) {
    await adminPost("/rest/v1/notifications", {
      user_id: ad.user_id,
      text: `✅ تم قبول إعلانك المدفوع "${ad.title}" وهو الآن نشط`,
      type: "ad_approved"
    });
  }
}

export async function rejectAdWithNotification(ad, reason) {
  await adminPatch(`/rest/v1/ads?id=eq.${ad.id}`, {
    status: "rejected",
    active: false,
    rejection_reason: reason
  });

  if (ad?.user_id) {
    await adminPost("/rest/v1/notifications", {
      user_id: ad.user_id,
      text: `❌ تم رفض إعلانك "${ad.title}" — السبب: ${reason}`,
      type: "ad_rejected"
    });
  }
}

export async function saveAdminAd(payload, editingId) {
  if (editingId) {
    const oldRows = await adminGet(
      `/rest/v1/ads?id=eq.${editingId}&select=image_url,images`,
      []
    );

    const oldAd = Array.isArray(oldRows) ? oldRows[0] : null;

    await adminPatch(`/rest/v1/ads?id=eq.${editingId}`, payload);

    const nextUrls = new Set(adStorageUrls(payload));
    const urlsToRemove = adStorageUrls(oldAd).filter(url => !nextUrls.has(url));

    await removeAdminStorageUrls(urlsToRemove);

    return null;
  }

  const rows = await adminPost(
    "/rest/v1/ads",
    { ...payload, views: 0 },
    {
      prefer: "return=representation",
      fallback: [{}]
    }
  );

  return Array.isArray(rows) ? rows[0] || null : null;
}

export async function deleteAdminAd(id) {
  const oldRows = await adminGet(
    `/rest/v1/ads?id=eq.${id}&select=image_url,images`,
    []
  );

  const oldAd = Array.isArray(oldRows) ? oldRows[0] : null;

  await adminDelete(`/rest/v1/ads?id=eq.${id}`);
  await removeAdminStorageUrls(adStorageUrls(oldAd));
}

export function updateAdminAd(id, payload) {
  return adminPatch(`/rest/v1/ads?id=eq.${id}`, payload);
}

export function getPushSubscriptionsCount() {
  return adminCount("/rest/v1/push_subscriptions?select=id");
}

export async function sendAdminBroadcast({
  title,
  body,
  url = "/notifications",
  withPush = true
}) {
  const users = await adminGet("/rest/v1/profiles?select=id", []);

  if (!Array.isArray(users) || !users.length) {
    return {
      totalUsers: 0,
      pushResult: {
        sent: 0,
        failed: 0
      }
    };
  }

  const BATCH = 500;

  for (let i = 0; i < users.length; i += BATCH) {
    const batch = users.slice(i, i + BATCH).map(u => ({
      user_id: u.id,
      text: `${title}: ${body}`,
      type: "broadcast"
    }));

    await adminPost("/rest/v1/notifications", batch);
  }

  let pushResult = {
    sent: 0,
    failed: 0,
    total: 0
  };

  if (withPush) {
    try {
      pushResult = await adminInvokeFunction(
        "send-push",
        {
          title,
          body,
          url: url || "/notifications"
        },
        {
          fallback: {}
        }
      );
    } catch {
      pushResult = {
        sent: 0,
        failed: 0,
        total: 0
      };
    }
  }

  return {
    totalUsers: users.length,
    pushResult
  };
}

export async function getAdminDashboardStats() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);

  const [
    listings,
    users,
    pending,
    reports,
    todayListings,
    weekListings,
    todayUsers
  ] = await Promise.all([
    adminCount("/rest/v1/listings?status=eq.active&admin_status=eq.approved&select=id"),
    adminCount("/rest/v1/profiles?select=id"),
    adminCount("/rest/v1/listings?admin_status=eq.pending&select=id"),
    adminCount("/rest/v1/reports?status=eq.pending&select=id"),
    adminCount(`/rest/v1/listings?created_at=gte.${todayStart.toISOString()}&admin_status=eq.approved&select=id`),
    adminCount(`/rest/v1/listings?created_at=gte.${weekStart.toISOString()}&admin_status=eq.approved&select=id`),
    adminCount(`/rest/v1/profiles?created_at=gte.${todayStart.toISOString()}&select=id`)
  ]);

  return {
    listings,
    users,
    pending,
    reports,
    todayListings,
    weekListings,
    todayUsers
  };
}


function normalizeListingTypeForMatch(value) {
  if (value === "للبيع" || value === "sell") return "sell";
  if (value === "للإيجار" || value === "rent" || value === "lease" || value === "تأجير") return "rent";
  if (value === "want_buy" || value === "مطلوب شراء") return "want_buy";
  if (value === "want_rent" || value === "مطلوب للإيجار" || value === "مطلوب إيجار") return "want_rent";
  return value ? String(value).trim() : "";
}

function hasSavedSearchValue(value) {
  if (Array.isArray(value)) return value.length > 0;
  return value !== undefined && value !== null && String(value).trim() !== "" && String(value).trim() !== "الكل";
}

function safeJsonObject(value) {
  if (!value) return {};
  if (typeof value === "object" && !Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
}

function toFiniteNumber(value) {
  if (value === undefined || value === null || value === "") return null;
  const normalized = String(value).replace(/[٬,]/g, "").trim();
  if (!normalized) return null;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

function getListingAreaForMatch(listing) {
  const extra = safeJsonObject(listing?.extra_fields);
  return toFiniteNumber(
    listing?.total_area ??
    listing?.area ??
    listing?.net_area ??
    listing?.land_area ??
    listing?.build_area ??
    extra.total_area ??
    extra.area
  );
}

function normalizeListFilter(value) {
  if (Array.isArray(value)) return value.map(v => String(v).trim()).filter(Boolean);
  if (!hasSavedSearchValue(value)) return [];
  return String(value)
    .split(/[،,]/)
    .map(v => v.trim())
    .filter(Boolean);
}

function textFilterMatches(filterValue, listingValue) {
  if (!hasSavedSearchValue(filterValue)) return true;
  return String(listingValue ?? "").trim() === String(filterValue).trim();
}

function getListingFloorForMatch(listing) {
  const extra = safeJsonObject(listing?.extra_fields);
  const value = listing?.floor ?? extra.floor;
  if (value === 0 || value === "0") return "0";
  if (value === undefined || value === null || value === "") return "";
  return String(value).trim();
}

function expandFacingForMatch(value) {
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

function facingFilterMatches(searchFacing, listing) {
  const selected = normalizeListFilter(searchFacing);
  if (!selected.length) return true;

  const extra = safeJsonObject(listing?.extra_fields);
  const listingFacing = String(
    listing?.facing_dir ??
    listing?.facing ??
    extra.facing_dir ??
    extra.facing ??
    ""
  ).trim();

  if (!listingFacing) return false;

  const candidates = selected.flatMap(expandFacingForMatch).filter(Boolean);
  return candidates.some(v => listingFacing.includes(v));
}

function floorFilterMatches(searchFloor, listing) {
  const floors = normalizeListFilter(searchFloor);
  if (!floors.length) return true;
  const listingFloor = getListingFloorForMatch(listing);
  return !!listingFloor && floors.includes(listingFloor);
}

function ownershipFilterMatches(searchOwnership, listing) {
  if (!hasSavedSearchValue(searchOwnership)) return true;
  const extra = safeJsonObject(listing?.extra_fields);
  const listingOwnership = String(listing?.ownership ?? extra.ownership ?? "").trim();
  if (!listingOwnership) return false;
  const needle = String(searchOwnership).split("(")[0].trim();
  return !needle || listingOwnership.includes(needle);
}

function numberRangeMatches({ min, max, value }) {
  const hasMin = hasSavedSearchValue(min);
  const hasMax = hasSavedSearchValue(max);
  if (!hasMin && !hasMax) return true;
  if (value === null) return false;

  const minNum = toFiniteNumber(min);
  const maxNum = toFiniteNumber(max);

  if (minNum !== null && value < minNum) return false;
  if (maxNum !== null && value > maxNum) return false;
  return true;
}

function savedSearchHasStructuredFilters(search) {
  return [
    "city",
    "district",
    "village",
    "type",
    "category",
    "min_price",
    "max_price",
    "min_area",
    "max_area",
    "currency",
    "floor",
    "facing",
    "beds",
    "ownership_type"
  ].some(key => hasSavedSearchValue(search?.[key]));
}

function savedSearchMatchesListing(search, listing) {
  if (!search?.user_id || search.notif === false || search.notif === "false") return false;
  if (!savedSearchHasStructuredFilters(search)) return false;

  if (!textFilterMatches(search.city, listing.city)) return false;
  if (!textFilterMatches(search.district, listing.district)) return false;
  if (!textFilterMatches(search.village, listing.village)) return false;
  if (!textFilterMatches(search.category, listing.category)) return false;
  if (!textFilterMatches(search.currency, listing.currency)) return false;

  const searchType = normalizeListingTypeForMatch(search.type);
  const listingType = normalizeListingTypeForMatch(listing.type);
  if (searchType && searchType !== "الكل" && searchType !== listingType) return false;

  const listingPrice = toFiniteNumber(listing.price ?? listing.priceNum);
  if (!numberRangeMatches({ min: search.min_price, max: search.max_price, value: listingPrice })) return false;

  const listingArea = getListingAreaForMatch(listing);
  if (!numberRangeMatches({ min: search.min_area, max: search.max_area, value: listingArea })) return false;

  if (!floorFilterMatches(search.floor, listing)) return false;
  if (!facingFilterMatches(search.facing, listing)) return false;
  if (!ownershipFilterMatches(search.ownership_type, listing)) return false;

  if (hasSavedSearchValue(search.beds)) {
    const wantedBeds = String(search.beds).trim();
    const listingRooms = toFiniteNumber(listing.rooms ?? listing.beds);
    if (wantedBeds === "5+") {
      if (listingRooms === null || listingRooms < 5) return false;
    } else if (listingRooms !== toFiniteNumber(wantedBeds)) {
      return false;
    }
  }

  return true;
}

function listingTypeArabic(type) {
  const t = normalizeListingTypeForMatch(type);
  if (t === "sell") return "للبيع";
  if (t === "rent") return "للإيجار";
  if (t === "want_buy") return "مطلوب شراء";
  if (t === "want_rent") return "مطلوب للإيجار";
  return "";
}

function buildListingMatchNotification(search, listing) {
  const listingTitle = listing?.title || [listingTypeArabic(listing?.type), listing?.category, listing?.city, listing?.district]
    .filter(Boolean)
    .join(" · ") || "إعلان جديد";
  const queryTitle = search?.query ? `«${String(search.query).slice(0, 80)}»` : "بحثك المحفوظ";
  const text = `🔔 إعلان جديد يطابق ${queryTitle}: ${listingTitle}`;

  return {
    user_id: search.user_id,
    type: "listing_match",
    text: text.slice(0, 280),
    is_read: false,
    data: {
      listing_id: listing.id,
      saved_search_id: search.id || null,
      url: `/listing/${listing.id}`
    }
  };
}

async function notifySavedSearchMatchesForListing(listing) {
  if (!listing?.id) return { matched: 0 };

  const status = listing.status || "active";
  const adminStatus = listing.admin_status || "approved";
  if (status !== "active" || adminStatus !== "approved") return { matched: 0 };

  const savedSearches = await adminGet("/rest/v1/saved_searches?notif=eq.true&select=*&limit=5000", []);
  const matches = (Array.isArray(savedSearches) ? savedSearches : [])
    .filter(search => savedSearchMatchesListing(search, listing));

  if (!matches.length) return { matched: 0 };

  const rows = matches.map(search => buildListingMatchNotification(search, listing));
  await adminPost("/rest/v1/notifications", rows, {
    prefer: "return=minimal"
  });

  await Promise.allSettled(
    rows.map(row => adminInvokeFunction(
      "send-push",
      {
        user_id: row.user_id,
        title: "عقار جديد يطابق بحثك",
        body: row.text.replace(/^🔔\s*/, ""),
        url: row.data.url
      },
      { fallback: {} }
    ))
  );

  return { matched: rows.length };
}

export async function uploadImportedImage(file) {
  if (!file) return null;

  const ext = (file.type?.split("/")[1] || "jpg").toLowerCase();
  const fname = `import_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

  return uploadAdminImage(fname, file);
}

export async function importListingRow(row) {
  const inserted = await adminPost("/rest/v1/listings", row, {
    prefer: "return=representation",
    fallback: []
  });

  const listing = Array.isArray(inserted) ? inserted[0] || null : inserted;

  try {
    await notifySavedSearchMatchesForListing(listing);
  } catch (error) {
    console.warn("saved search notification skipped", error);
  }

  return listing;
}

export async function attachImportedImages(listingId, imgRows = []) {
  if (!listingId || !imgRows.length) return true;

  await adminPost("/rest/v1/listing_images", imgRows, {
    prefer: "return=minimal"
  });

  return true;
}

function buildListingsQuery({
  statusFilter = "active",
  timeFilter = "all",
  listingId = null
} = {}) {
  let q =
    "/rest/v1/listings?order=created_at.desc&limit=100&select=id,title,city,district,type,category,price,currency,status,admin_status,views,whatsapp_clicks,phone_clicks,created_at,expires_at,rejection_reason,profiles(name),listing_images(url,is_main)";

  const cleanListingId = String(listingId || "").replace(/\D/g, "").replace(/^0+/, "");

  if (cleanListingId) {
    return q + `&id=eq.${encodeURIComponent(cleanListingId)}`;
  }

  if (statusFilter === "active") q += "&status=eq.active&admin_status=eq.approved";
  else if (statusFilter === "hidden") q += "&status=eq.hidden";
  else if (statusFilter === "flagged") q += "&admin_status=eq.flagged";
  else if (statusFilter === "hidden_by_reports") q += "&admin_status=eq.hidden_by_reports";
  else if (statusFilter === "rejected") q += "&admin_status=eq.rejected";
  else if (statusFilter === "pending") q += "&admin_status=eq.pending";

  const now = new Date();

  if (timeFilter === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    q += `&created_at=gte.${start.toISOString()}`;
  } else if (timeFilter === "week") {
    const start = new Date(now);
    start.setDate(now.getDate() - 7);
    q += `&created_at=gte.${start.toISOString()}`;
  } else if (timeFilter === "month") {
    const start = new Date(now);
    start.setDate(now.getDate() - 30);
    q += `&created_at=gte.${start.toISOString()}`;
  }

  return q;
}

export async function fetchAdminListings(filters) {
  const data = await adminGet(buildListingsQuery(filters), []);

  return (Array.isArray(data) ? data : []).map(item => ({
    ...item,
    listing_images: (item.listing_images || []).sort(
      (a, b) => (b.is_main ? 1 : 0) - (a.is_main ? 1 : 0)
    )
  }));
}

export function toggleAdminListingHidden(listing) {
  const status = listing.status === "hidden" ? "active" : "hidden";

  return adminPatch(`/rest/v1/listings?id=eq.${listing.id}`, {
    status
  }).then(() => status);
}

export async function deleteAdminListingCascade(id) {
  const [listingRows, imageRows] = await Promise.all([
    adminGet(`/rest/v1/listings?id=eq.${id}&select=id,video_url`, []),
    adminGet(`/rest/v1/listing_images?listing_id=eq.${id}&select=url`, [])
  ]);

  const listing = Array.isArray(listingRows) ? listingRows[0] : null;

  const storageUrls = [
    ...(Array.isArray(imageRows) ? imageRows.map(img => img.url) : []),
    listing?.video_url
  ].filter(Boolean);

  const convs = await adminGet(`/rest/v1/conversations?listing_id=eq.${id}&select=id`, []);
  const conversationIds = Array.isArray(convs) ? convs.map(c => c.id).filter(Boolean) : [];

  await Promise.all([
    adminDelete(`/rest/v1/listing_images?listing_id=eq.${id}`),
    adminDelete(`/rest/v1/reports?listing_id=eq.${id}`),
    adminDelete(`/rest/v1/favorites?listing_id=eq.${id}`),
    safeAdminDelete(`/rest/v1/questions?listing_id=eq.${id}`),
    deleteListingNotificationsCascade(id, conversationIds)
  ]);

  if (conversationIds.length) {
    const ids = conversationIds.join(",");

    await Promise.all([
      adminDelete(`/rest/v1/messages?conversation_id=in.(${ids})`),
      adminDelete(`/rest/v1/conversations?id=in.(${ids})`)
    ]);
  }

  await adminDelete(`/rest/v1/listings?id=eq.${id}`);
  await removeAdminStorageUrls(storageUrls);
}

export function approveAdminListing(id) {
  return adminPatch(`/rest/v1/listings?id=eq.${id}`, {
    status: "active",
    admin_status: "approved"
  });
}

export function toggleAdminListingFlag(listing) {
  const isHidden =
    listing.admin_status === "flagged" ||
    listing.admin_status === "hidden_by_reports";

  const admin_status = isHidden ? "approved" : "flagged";

  return adminPatch(`/rest/v1/listings?id=eq.${listing.id}`, {
    admin_status
  }).then(() => admin_status);
}

export function rejectAdminListing(id, reason) {
  return adminPatch(`/rest/v1/listings?id=eq.${id}`, {
    admin_status: "rejected",
    rejection_reason: reason || null
  });
}

export function extendAdminListing(id, listing, days) {
  const base = listing?.expires_at
    ? new Date(listing.expires_at)
    : new Date(listing?.created_at || Date.now());

  if (base < new Date()) base.setTime(Date.now());

  base.setDate(base.getDate() + days);

  const expires_at = base.toISOString();

  return adminPatch(`/rest/v1/listings?id=eq.${id}`, {
    expires_at,
    status: "active",
    admin_status: "approved"
  }).then(() => expires_at);
}

export async function fetchPendingListings() {
  const data = await adminGet(
    "/rest/v1/listings?admin_status=eq.pending&order=created_at.desc" +
      "&select=id,title,description,city,district,village,category,type,price,currency," +
      "phone,phone2,net_area,rooms,baths,floor,ownership,created_at,status,admin_status," +
      "user_id,video_url,profiles(name,phone,account_type,verified),listing_images(url,is_main)",
    []
  );

  return Array.isArray(data) ? data : [];
}

export function approveListing(listingId) {
  return adminPatch(`/rest/v1/listings?id=eq.${listingId}`, {
    status: "active",
    admin_status: "approved"
  });
}

export function rejectListing(listingId, reason) {
  return adminPatch(`/rest/v1/listings?id=eq.${listingId}`, {
    admin_status: "rejected",
    rejection_reason: reason || null
  });
}

export function suspendUserById(userId) {
  return adminPatch(`/rest/v1/profiles?id=eq.${userId}`, {
    is_suspended: true
  });
}

export async function loadAdminPropertyFieldsBoot() {
  const [types, fields, columns] = await Promise.all([
    adminGet("/rest/v1/property_types?select=id,name&order=sort_order", []),
    adminGet("/rest/v1/property_fields?select=*&order=type_id,sort_order,id", []),
    loadListingColumnsRpc()
  ]);

  return {
    types: Array.isArray(types) ? types : [],
    fields: Array.isArray(fields) ? fields : [],
    listingColumns: Array.isArray(columns) ? columns : []
  };
}

export async function loadListingColumnsRpc() {
  try {
    const data = await adminInvokeRpc("get_listings_columns", {}, {
      fallback: [],
      throwOnError: false
    });

    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function runPropertyFieldsMaintenance(fnName) {
  return adminInvokeRpc(fnName, {}, {
    responseType: "json",
    fallback: []
  });
}

export async function updatePropertyFieldIds(ids, patch) {
  await Promise.all(
    ids.map(id => adminPatch(`/rest/v1/property_fields?id=eq.${id}`, patch))
  );
}

export async function deletePropertyFieldIds(ids) {
  await Promise.all(
    ids.map(id => adminDelete(`/rest/v1/property_fields?id=eq.${id}`))
  );
}

export function createPropertyField(payload) {
  return adminPost("/rest/v1/property_fields", payload, {
    prefer: "return=representation",
    fallback: [{}]
  });
}

export async function fetchPushSubscriptionsBundle() {
  const data = await adminGet("/rest/v1/push_subscriptions?order=created_at.desc&select=*", []);
  const subs = Array.isArray(data) ? data : [];
  const profiles = {};

  if (subs.length) {
    const ids = [...new Set(subs.map(s => s.user_id).filter(Boolean))];

    if (ids.length) {
      const profileRows = await adminGet(
        `/rest/v1/profiles?id=in.(${ids.join(",")})&select=id,name,phone`,
        []
      );

      (Array.isArray(profileRows) ? profileRows : []).forEach(p => {
        profiles[p.id] = p;
      });
    }
  }

  return {
    subs,
    profiles
  };
}

export function deletePushSubscription(id) {
  return adminDelete(`/rest/v1/push_subscriptions?id=eq.${id}`);
}

export function deleteAllPushSubscriptions() {
  return adminDelete("/rest/v1/push_subscriptions?id=not.is.null");
}

export function sendPushToUser({
  userId,
  title,
  body,
  url = "/notifications"
}) {
  return adminInvokeFunction("send-push", {
    user_id: userId,
    title,
    body,
    url
  }, {
    fallback: {}
  });
}

export function sendPushToAll({
  title,
  body,
  url = "/notifications"
}) {
  return adminInvokeFunction("send-push", {
    title,
    body,
    url
  }, {
    fallback: {}
  });
}

export async function loadAdminReportsBundle() {
  const data = await adminGet("/rest/v1/reports?order=created_at.desc&select=*", []);

  if (!Array.isArray(data) || !data.length) {
    return {
      reports: [],
      listingMap: {},
      imgMap: {},
      profileMap: {}
    };
  }

  const listingIds = [...new Set(data.map(x => x.listing_id).filter(Boolean))];
  const reporterIds = [...new Set(data.map(x => x.reporter_id).filter(Boolean))];
  const reportedIds = [...new Set(data.map(x => x.reported_user_id).filter(Boolean))];

  const [listings, imgs] = await Promise.all([
    listingIds.length
      ? adminGet(
          `/rest/v1/listings?id=in.(${listingIds.join(",")})&select=id,title,city,district,type,status,admin_status,user_id,price,currency,total_area,rooms,salle,category,ownership,created_at,phone`,
          []
        )
      : [],
    listingIds.length
      ? adminGet(
          `/rest/v1/listing_images?listing_id=in.(${listingIds.join(",")})&select=listing_id,url,is_main&order=is_main.desc`,
          []
        )
      : []
  ]);

  const listingList = Array.isArray(listings) ? listings : [];
  const allUserIds = [
    ...new Set([
      ...reporterIds,
      ...reportedIds,
      ...listingList.map(l => l.user_id).filter(Boolean)
    ])
  ];

  const users = allUserIds.length
    ? await adminGet(
        `/rest/v1/profiles?id=in.(${allUserIds.join(",")})&select=id,name,phone,last_seen_at,max_listings,is_suspended,suspended_until,verified,role,account_type,video_allowed,created_at,admin_note`,
        []
      )
    : [];

  const listingCountMap = {};
  listingList.forEach(l => {
    if (l?.user_id) {
      listingCountMap[l.user_id] = (listingCountMap[l.user_id] || 0) + 1;
    }
  });

  const reportedCountMap = {};
  data.forEach(rep => {
    if (rep?.reported_user_id) {
      reportedCountMap[rep.reported_user_id] =
        (reportedCountMap[rep.reported_user_id] || 0) + 1;
    }
  });

  const imgMap = {};
  (Array.isArray(imgs) ? imgs : []).forEach(img => {
    if (!imgMap[img.listing_id]) imgMap[img.listing_id] = [];
    imgMap[img.listing_id].push(img.url);
  });

  const listingMap = {};
  listingList.forEach(item => {
    listingMap[item.id] = item;
  });

  const profileMap = {};
  (Array.isArray(users) ? users : []).forEach(profile => {
    profileMap[profile.id] = {
      ...profile,
      listing_count: listingCountMap[profile.id] || 0,
      phone_count: 0,
      report_count: reportedCountMap[profile.id] || 0,
      block_count: 0
    };
  });

  return {
    reports: data,
    listingMap,
    imgMap,
    profileMap
  };
}

export async function loadReportChatMessages(conversationId, reportedAt) {
  const cutoff = reportedAt
    ? `&created_at=lte.${encodeURIComponent(reportedAt)}`
    : "";

  const data = await adminGet(
    `/rest/v1/messages?conversation_id=eq.${conversationId}&order=created_at.desc&limit=10${cutoff}&select=id,content,sender_id,created_at,profiles(name)`,
    []
  );

  return (Array.isArray(data) ? data : []).reverse();
}

export async function getMutualBlockStatus(reporterId, reportedId) {
  const [reporterRows, reportedRows] = await Promise.all([
    adminGet(`/rest/v1/blocked_users?blocker_id=eq.${reporterId}&blocked_id=eq.${reportedId}&select=id`, []),
    adminGet(`/rest/v1/blocked_users?blocker_id=eq.${reportedId}&blocked_id=eq.${reporterId}&select=id`, [])
  ]);

  return {
    reporter: Array.isArray(reporterRows) && reporterRows.length > 0,
    reported: Array.isArray(reportedRows) && reportedRows.length > 0
  };
}

export async function blockUsersMutually(reporterId, reportedId) {
  await Promise.all([
    adminPost("/rest/v1/blocked_users", {
      blocker_id: reporterId,
      blocked_id: reportedId
    }),
    adminPost("/rest/v1/blocked_users", {
      blocker_id: reportedId,
      blocked_id: reporterId
    })
  ]);
}

export function patchReportedProfile(id, obj) {
  return adminPatch(`/rest/v1/profiles?id=eq.${id}`, obj);
}

export function setAdminListingVisibility(listingId, admin_status) {
  return adminPatch(`/rest/v1/listings?id=eq.${listingId}`, {
    admin_status
  });
}

export function deleteReportsByIds(ids) {
  return adminDelete(`/rest/v1/reports?id=in.(${ids.join(",")})`);
}

export function updateReportsByIds(ids, payload) {
  return adminPatch(`/rest/v1/reports?id=in.(${ids.join(",")})`, payload);
}

export function createUserBlock(blockerId, blockedId) {
  return adminPost("/rest/v1/blocked_users", {
    blocker_id: blockerId,
    blocked_id: blockedId
  });
}

export function deleteUserBlock(blockerId, blockedId) {
  return adminDelete(`/rest/v1/blocked_users?blocker_id=eq.${blockerId}&blocked_id=eq.${blockedId}`);
}

export async function fetchRolePermissions() {
  const rows = await roleProxyGet("/rest/v1/app_settings?key=eq.role_permissions&select=value", []);
  return Array.isArray(rows) ? rows[0]?.value || {} : {};
}

export async function saveRolePermissions(value) {
  const existing = await roleProxyGet("/rest/v1/app_settings?key=eq.role_permissions", []);

  if (Array.isArray(existing) && existing.length) {
    return roleProxyPatch("/rest/v1/app_settings?key=eq.role_permissions", {
      value
    });
  }

  return roleProxyPost("/rest/v1/app_settings", {
    key: "role_permissions",
    value
  });
}

export function fetchAppSettings() {
  return adminGet("/rest/v1/app_settings?order=key", []);
}

export async function updateAppSetting(key, value) {
  const result = await adminPost(
    "/rest/v1/app_settings?on_conflict=key",
    {
      key,
      value
    },
    {
      prefer: "resolution=merge-duplicates,return=minimal",
      responseType: "none"
    }
  );

  invalidateAppSettingsCache();
  return result;
}

export function fetchSavedAdminQueries() {
  return adminGet("/rest/v1/admin_queries?select=*&order=created_at.desc", []);
}

export async function executeAdminSql(query) {
  return adminInvokeRpc("exec_sql", {
    query
  }, {
    fallback: null,
    throwOnError: true
  });
}

export async function executeAdminSqlViaRpc(query) {
  return adminInvokeRpc("run_admin_query", {
    query_sql: query
  }, {
    fallback: null,
    throwOnError: true
  });
}

export function saveAdminQuery(payload) {
  return adminPost("/rest/v1/admin_queries", payload);
}

export function deleteAdminQuery(id) {
  return adminDelete(`/rest/v1/admin_queries?id=eq.${id}`);
}

export function deleteTableRow(tableName, id) {
  return adminDelete(`/rest/v1/${tableName}?id=eq.${id}`);
}

export async function fetchAdminUserDetail(userId) {
  const [profiles, list] = await Promise.all([
    adminGet(`/rest/v1/profiles?id=eq.${userId}&select=*`, []),
    adminGet(
      `/rest/v1/listings?user_id=eq.${userId}&order=created_at.desc&select=id,title,city,type,category,status,admin_status,views,whatsapp_clicks,phone_clicks,created_at,listing_images(url,is_main)`,
      []
    )
  ]);

  const profile = Array.isArray(profiles) ? profiles[0] || null : null;
  const listings = Array.isArray(list) ? list : [];

  const stats = {
    totalViews: listings.reduce((sum, item) => sum + (item.views || 0), 0),
    totalWA: listings.reduce((sum, item) => sum + (item.whatsapp_clicks || 0), 0),
    active: listings.filter(item => item.status === "active" && item.admin_status === "approved").length,
    total: listings.length
  };

  return {
    profile,
    listings,
    stats
  };
}

export function patchAdminUserProfile(userId, obj) {
  return adminPatch(`/rest/v1/profiles?id=eq.${userId}`, obj);
}

export async function fetchAdminProfileById(userId) {
  const rows = await adminGet(`/rest/v1/profiles?id=eq.${userId}&select=*&limit=1`, []);
  return Array.isArray(rows) ? rows[0] || null : null;
}

export async function fetchAdminUsers() {
  const data = await adminGet(
    "/rest/v1/profiles?order=last_seen_at.desc.nullslast&select=id,name,phone,account_type,verified,role,max_listings,video_allowed,created_at,last_seen_at,is_suspended,suspended_until,admin_note",
    []
  );

  const list = Array.isArray(data) ? data : [];
  const now = new Date();

  const toUnsuspend = list.filter(
    u => u.is_suspended && u.suspended_until && new Date(u.suspended_until) < now
  );

  if (toUnsuspend.length) {
    await Promise.all(
      toUnsuspend.map(u =>
        adminPatch(`/rest/v1/profiles?id=eq.${u.id}`, {
          is_suspended: false,
          suspended_until: null
        })
      )
    );
  }

  return list.map(u =>
    toUnsuspend.find(item => item.id === u.id)
      ? {
          ...u,
          is_suspended: false,
          suspended_until: null
        }
      : u
  );
}

export function patchAdminUser(id, obj) {
  if (obj && Object.prototype.hasOwnProperty.call(obj, "role")) {
    return roleProxyPatch(`/rest/v1/profiles?id=eq.${id}`, obj);
  }

  return adminPatch(`/rest/v1/profiles?id=eq.${id}`, obj);
}

export async function fetchPendingAccountUpgradeRequests() {
  const data = await adminGet(
    "/rest/v1/account_upgrade_requests?select=id,user_id,requested_type,status,note,created_at&status=eq.pending&order=created_at.desc",
    []
  );

  return Array.isArray(data) ? data : [];
}

export function updateAccountUpgradeRequestsForUser(
  userId,
  status,
  fromStatuses = ["pending", "approved"]
) {
  if (!userId || !status) return Promise.resolve(null);

  const safeStatuses = (fromStatuses || [])
    .map(item => String(item || "").trim())
    .filter(Boolean);

  const statusFilter = safeStatuses.length
    ? `&status=in.(${safeStatuses.map(encodeURIComponent).join(",")})`
    : "";

  return adminPatch(
    `/rest/v1/account_upgrade_requests?user_id=eq.${encodeURIComponent(userId)}${statusFilter}`,
    {
      status
    }
  );
}

export async function fetchAdminUserStats(userId) {
  const [listings, phones, reported, reporter, blocked] = await Promise.all([
    adminGet(`/rest/v1/listings?select=user_id&user_id=eq.${userId}&status=eq.active&admin_status=eq.approved`, []),
    adminGet(`/rest/v1/listings?select=phone&user_id=eq.${userId}&phone=not.is.null`, []),
    adminGet(`/rest/v1/reports?select=id&reported_user_id=eq.${userId}`, []),
    adminGet(`/rest/v1/reports?select=id&reporter_id=eq.${userId}`, []),
    adminGet(`/rest/v1/blocked_users?select=id&blocked_id=eq.${userId}`, [])
  ]);

  const uniquePhones = new Set(
    (Array.isArray(phones) ? phones : [])
      .map(item => item?.phone?.trim?.())
      .filter(Boolean)
  );

  return {
    listing_count: Array.isArray(listings) ? listings.length : 0,
    phone_count: uniquePhones.size,
    report_count: Array.isArray(reported) ? reported.length : 0,
    reporter_count: Array.isArray(reporter) ? reporter.length : 0,
    block_count: Array.isArray(blocked) ? blocked.length : 0
  };
}
