import { adminCount, adminGet } from "./adminApi.js";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeNumber(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

function countByListingId(rows) {
  return asArray(rows).reduce((map, row) => {
    const key = String(row?.listing_id ?? "").trim();
    if (!key) return map;
    map[key] = (map[key] || 0) + 1;
    return map;
  }, {});
}

async function safeCount(path) {
  try {
    return await adminCount(path);
  } catch (error) {
    console.warn("[engagementStats] count skipped", path, error);
    return 0;
  }
}

async function safeGet(path) {
  try {
    return await adminGet(path, []);
  } catch (error) {
    console.warn("[engagementStats] fetch skipped", path, error);
    return [];
  }
}

export async function getAdminEngagementStats() {
  const [listingRows, favorites, conversations] = await Promise.all([
    safeGet(
      "/rest/v1/listings?select=views,phone_clicks,whatsapp_clicks&limit=10000"
    ),
    safeCount("/rest/v1/favorites?select=listing_id"),
    safeCount("/rest/v1/conversations?listing_id=not.is.null&select=listing_id"),
  ]);

  const totals = asArray(listingRows).reduce(
    (result, listing) => {
      result.views += safeNumber(listing?.views);
      result.phoneClicks += safeNumber(listing?.phone_clicks);
      result.whatsappClicks += safeNumber(listing?.whatsapp_clicks);
      return result;
    },
    {
      views: 0,
      phoneClicks: 0,
      whatsappClicks: 0,
    }
  );

  return {
    ...totals,
    favorites: safeNumber(favorites),
    conversations: safeNumber(conversations),
  };
}

export async function enrichAdminListingsEngagement(listings = []) {
  const rows = asArray(listings);
  const ids = [...new Set(rows.map(item => String(item?.id ?? "").trim()).filter(Boolean))];

  if (!ids.length) return rows;

  const inFilter = ids.map(encodeURIComponent).join(",");

  const [favoriteRows, conversationRows] = await Promise.all([
    safeGet(
      `/rest/v1/favorites?listing_id=in.(${inFilter})&select=listing_id&limit=10000`
    ),
    safeGet(
      `/rest/v1/conversations?listing_id=in.(${inFilter})&select=listing_id&limit=10000`
    ),
  ]);

  const favoritesMap = countByListingId(favoriteRows);
  const conversationsMap = countByListingId(conversationRows);

  return rows.map(listing => {
    const key = String(listing?.id ?? "");

    return {
      ...listing,
      favorites_count: favoritesMap[key] || 0,
      conversations_count: conversationsMap[key] || 0,
    };
  });
}
