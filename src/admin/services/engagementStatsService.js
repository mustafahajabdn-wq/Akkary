import { adminGet } from "./adminApi.js";

const PAGE_SIZE = 1000;
const ID_CHUNK_SIZE = 100;

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

function uniqueSorted(values) {
  return [...new Set(values.map(value => String(value || "").trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "ar"));
}

function getPeriodStart(period) {
  const now = new Date();

  if (period === "today") {
    now.setHours(0, 0, 0, 0);
    return now.toISOString();
  }

  if (period === "week") {
    now.setDate(now.getDate() - 7);
    return now.toISOString();
  }

  if (period === "month") {
    now.setDate(now.getDate() - 30);
    return now.toISOString();
  }

  return "";
}

async function safeGet(path) {
  try {
    return await adminGet(path, []);
  } catch (error) {
    console.warn("[engagementStats] fetch skipped", path, error);
    return [];
  }
}

async function safeGetAll(basePath) {
  const allRows = [];

  for (let offset = 0; ; offset += PAGE_SIZE) {
    const separator = basePath.includes("?") ? "&" : "?";
    const page = asArray(
      await safeGet(`${basePath}${separator}limit=${PAGE_SIZE}&offset=${offset}`)
    );

    allRows.push(...page);
    if (page.length < PAGE_SIZE) break;
  }

  return allRows;
}

async function fetchRowsForListingIds(table, ids) {
  const rows = [];

  for (let index = 0; index < ids.length; index += ID_CHUNK_SIZE) {
    const chunk = ids.slice(index, index + ID_CHUNK_SIZE);
    const inFilter = chunk.map(encodeURIComponent).join(",");

    rows.push(
      ...(await safeGetAll(
        `/rest/v1/${table}?listing_id=in.(${inFilter})&select=listing_id&order=listing_id.asc`
      ))
    );
  }

  return rows;
}

function buildListingsStatsPath(filters = {}) {
  const params = new URLSearchParams();
  params.set(
    "select",
    "id,views,phone_clicks,whatsapp_clicks,created_at,city,type,category"
  );
  params.set("order", "id.asc");

  const periodStart = getPeriodStart(filters.period);
  if (periodStart) params.set("created_at", `gte.${periodStart}`);
  if (filters.city) params.set("city", `eq.${filters.city}`);
  if (filters.type) params.set("type", `eq.${filters.type}`);
  if (filters.category) params.set("category", `eq.${filters.category}`);

  return `/rest/v1/listings?${params.toString()}`;
}

export async function getAdminEngagementFilterOptions() {
  const rows = await safeGetAll(
    "/rest/v1/listings?select=city,type,category&order=id.asc"
  );

  return {
    cities: uniqueSorted(rows.map(row => row?.city)),
    types: uniqueSorted(rows.map(row => row?.type)),
    categories: uniqueSorted(rows.map(row => row?.category)),
  };
}

export async function getAdminEngagementStats(filters = {}) {
  const listingRows = await safeGetAll(buildListingsStatsPath(filters));
  const ids = listingRows
    .map(listing => String(listing?.id ?? "").trim())
    .filter(Boolean);

  const [favoriteRows, conversationRows] = ids.length
    ? await Promise.all([
        fetchRowsForListingIds("favorites", ids),
        fetchRowsForListingIds("conversations", ids),
      ])
    : [[], []];

  const totals = listingRows.reduce(
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
    favorites: favoriteRows.length,
    conversations: conversationRows.length,
    listings: listingRows.length,
  };
}

export async function enrichAdminListingsEngagement(listings = []) {
  const rows = asArray(listings);
  const ids = [
    ...new Set(
      rows.map(item => String(item?.id ?? "").trim()).filter(Boolean)
    ),
  ];

  if (!ids.length) return rows;

  const [favoriteRows, conversationRows] = await Promise.all([
    fetchRowsForListingIds("favorites", ids),
    fetchRowsForListingIds("conversations", ids),
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
