const LISTINGS_KEY = "cache_v2_listings";
const DETAIL_KEY_PREFIX = "cache_v3_detail_";
const DETAIL_INDEX_KEY = "cache_v3_detail_index";
const MIGRATION_FLAG_KEY = "cache_v3_migrated";

const LEGACY_LISTINGS_KEY = "tabu_listings_cache_v1";
const LEGACY_DETAIL_KEY = "detailCache";
const LEGACY_LISTING_CACHE_KEY = "listing_cache";
const LEGACY_LISTING_ORDER_KEY = "listing_cache_order";

export const LISTINGS_TTL_MS = 24 * 60 * 60 * 1000;
export const DETAIL_FRESH_TTL_MS = 24 * 60 * 60 * 1000;
export const DETAIL_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const MAX_DETAIL_ITEMS = 50;
export const IMAGE_CACHE_NAMES = ["detail-images-v1", "supabase-images", "images-cache"];
const DETAIL_IMAGE_CACHE_NAME = "detail-images-v1";

function safeReadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function safeWriteJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function safeRemove(key) {
  try { localStorage.removeItem(key); } catch {}
}

function now() {
  return Date.now();
}

function isFresh(ts, ttl) {
  return Number(ts) > 0 && (now() - Number(ts) <= ttl);
}

function getAgeMs(ts) {
  return Number(ts) > 0 ? Math.max(0, now() - Number(ts)) : Infinity;
}

function normalizeItem(item) {
  if (!item?.id) return null;
  return { ...item, id: Number(item.id) || item.id };
}

function dedupeById(items = []) {
  const seen = new Map();
  for (const raw of items) {
    const item = normalizeItem(raw);
    if (!item?.id) continue;
    seen.set(String(item.id), item);
  }
  return Array.from(seen.values());
}

function getDetailKey(id) {
  return `${DETAIL_KEY_PREFIX}${id}`;
}

function getListingImageUrls(data) {
  return Array.from(new Set([
    ...(Array.isArray(data?.images) ? data.images : []),
    data?.photo,
  ].filter(Boolean).map((value) => String(value))));
}

async function pruneDetailImageCacheForRemovedEntries(removedEntries = []) {
  if (typeof window === "undefined" || !("caches" in window) || !removedEntries.length) return;

  try {
    const activeImageUrls = new Set();
    const activeIndex = readDetailIndex();
    activeIndex.forEach((entry) => {
      const stored = safeReadJSON(getDetailKey(entry?.id), null);
      getListingImageUrls(stored?.item).forEach((url) => activeImageUrls.add(url));
    });

    const urlsToDelete = new Set();
    removedEntries.forEach((entry) => {
      getListingImageUrls(entry?.item).forEach((url) => {
        if (!activeImageUrls.has(url)) urlsToDelete.add(url);
      });
    });

    if (!urlsToDelete.size) return;

    const cache = await window.caches.open(DETAIL_IMAGE_CACHE_NAME);
    await Promise.all(Array.from(urlsToDelete).map(async (url) => {
      try {
        await cache.delete(url, { ignoreSearch: false });
      } catch {}
    }));
  } catch {}
}

function readDetailIndex() {
  const list = safeReadJSON(DETAIL_INDEX_KEY, []);
  return Array.isArray(list) ? list : [];
}

function writeDetailIndex(index) {
  safeWriteJSON(DETAIL_INDEX_KEY, index);
}

function touchDetailIndex(id, updatedAt = now()) {
  let index = readDetailIndex().filter((entry) => String(entry?.id) !== String(id));
  index.push({ id: String(id), updatedAt });
  index.sort((a, b) => Number(a.updatedAt || 0) - Number(b.updatedAt || 0));

  const removedEntries = [];
  while (index.length > MAX_DETAIL_ITEMS) {
    const removed = index.shift();
    if (removed?.id == null) continue;
    const stored = safeReadJSON(getDetailKey(removed.id), null);
    if (stored?.item) removedEntries.push({ id: String(removed.id), item: stored.item });
    safeRemove(getDetailKey(removed.id));
  }
  writeDetailIndex(index);
  if (removedEntries.length) {
    void pruneDetailImageCacheForRemovedEntries(removedEntries);
  }
}

function cleanupExpiredDetails() {
  const index = readDetailIndex();
  const keep = [];
  const removedEntries = [];
  for (const entry of index) {
    const stored = safeReadJSON(getDetailKey(entry.id), null);
    if (!stored?.item) {
      safeRemove(getDetailKey(entry.id));
      continue;
    }
    if (!isFresh(stored.updatedAt, DETAIL_TTL_MS)) {
      removedEntries.push({ id: String(entry.id), item: stored.item });
      safeRemove(getDetailKey(entry.id));
      continue;
    }
    keep.push({ id: String(entry.id), updatedAt: Number(stored.updatedAt || entry.updatedAt || 0) });
  }
  writeDetailIndex(keep);
  if (removedEntries.length) {
    void pruneDetailImageCacheForRemovedEntries(removedEntries);
  }
}

function byteSize(value) {
  try {
    if (typeof Blob !== "undefined") return new Blob([String(value ?? "")]).size;
  } catch {}
  try {
    return new TextEncoder().encode(String(value ?? "")).length;
  } catch {
    return String(value ?? "").length;
  }
}

function getLocalStorageSize(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? byteSize(raw) : 0;
  } catch {
    return 0;
  }
}

function parseUrl(input) {
  try {
    if (typeof window !== "undefined") return new URL(String(input || ""), window.location.origin);
    return new URL(String(input || ""), "https://example.com");
  } catch {
    return null;
  }
}

function isMapTileUrl(input) {
  const url = parseUrl(input);
  if (!url) return false;
  if (/(^|\.)tile\.openstreetmap\.org$/i.test(url.hostname)) return true;
  return /\/\d+\/\d+\/\d+\.(png|jpg|jpeg|webp)$/i.test(url.pathname) && /(tile|map)/i.test(`${url.hostname}${url.pathname}`);
}

function isLeafletAssetUrl(input) {
  const value = String(input || "");
  return /(leaflet|marker-icon|marker-shadow)/i.test(value);
}

function isAppAssetUrl(input) {
  const url = parseUrl(input);
  if (!url) return false;
  return /(index\.html$|manifest|favicon|icon-\d+|apple-touch-icon|\/assets\/.*\.(js|css|woff2|png|svg)$)/i.test(url.pathname);
}

function pushSampleUrl(list, value, limit = 3) {
  if (!value || list.includes(value) || list.length >= limit) return;
  list.push(value);
}

export function formatBytes(bytes = 0) {
  const value = Number(bytes) || 0;
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(value >= 10 * 1024 ? 0 : 1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(value >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
}

export function getListingsCache({ allowStale = true } = {}) {
  const payload = safeReadJSON(LISTINGS_KEY, null);
  if (!payload || !Array.isArray(payload.items)) return null;
  if (!allowStale && !isFresh(payload.updatedAt, LISTINGS_TTL_MS)) return null;
  return payload;
}

export function setListingsCache(items = []) {
  const payload = {
    updatedAt: now(),
    items: dedupeById(items),
  };
  safeWriteJSON(LISTINGS_KEY, payload);
  return payload;
}

export function mergeListingsCache(items = []) {
  const current = getListingsCache({ allowStale: true })?.items || [];
  return setListingsCache([...current, ...items]);
}

export function clearListingsCache() {
  safeRemove(LISTINGS_KEY);
}

export function hasFreshListingsCache() {
  const payload = getListingsCache({ allowStale: true });
  return !!payload && isFresh(payload.updatedAt, LISTINGS_TTL_MS);
}

export function getDetailCacheEntry(id) {
  if (id == null) return null;
  const payload = safeReadJSON(getDetailKey(id), null);
  if (!payload?.item) return null;
  const updatedAt = Number(payload.updatedAt || payload.item?._cachedAt || 0);
  return {
    id: String(id),
    updatedAt,
    ageMs: getAgeMs(updatedAt),
    isFresh: isFresh(updatedAt, DETAIL_FRESH_TTL_MS),
    item: payload.item,
  };
}

export function getDetailCache(id, { allowStale = true } = {}) {
  const entry = getDetailCacheEntry(id);
  if (!entry?.item) return null;
  if (!allowStale && !entry.isFresh) return null;
  return entry.item;
}

export function hasFreshDetailCache(id) {
  return !!getDetailCacheEntry(id)?.isFresh;
}

export function setDetailCache(item) {
  const normalized = normalizeItem(item);
  if (!normalized?.id) return false;
  const updatedAt = now();
  const ok = safeWriteJSON(getDetailKey(normalized.id), { updatedAt, item: { ...normalized, _cachedAt: updatedAt } });
  if (ok) {
    touchDetailIndex(normalized.id, updatedAt);
    warmListingImages(normalized);
  }
  return ok;
}

export function warmListingImages(data) {
  if (typeof window === "undefined") return;
  // فحص خيار التحميل المسبق
  try { if (localStorage.getItem("warm_images_enabled") === "0") return; } catch {}
  const urls = getListingImageUrls(data);
  if (!urls.length) return;

  const warmOne = async (url) => {
    try {
      if (!("caches" in window)) {
        await fetch(url, { mode: "cors", credentials: "omit" });
        return;
      }
      const cache = await window.caches.open(DETAIL_IMAGE_CACHE_NAME);
      const matched = await cache.match(url, { ignoreVary: true, ignoreSearch: false });
      if (matched) return;
      const response = await fetch(url, {
        mode: "cors",
        credentials: "omit",
        cache: "force-cache",
      });
      if (!response) return;
      if (response.ok || response.type === "opaque") {
        try { await cache.put(url, response.clone()); } catch {}
      }
    } catch {}
  };

  // الأولى والثانية عند فتح التفاصيل — الباقي lazy عند السحب
  urls.slice(0, 2).forEach(url => void warmOne(url));
}

export function clearDetailCacheAll() {
  const index = readDetailIndex();
  index.forEach((entry) => {
    if (entry?.id != null) safeRemove(getDetailKey(entry.id));
  });
  writeDetailIndex([]);

  try {
    const keysToDelete = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key?.startsWith(DETAIL_KEY_PREFIX)) keysToDelete.push(key);
    }
    keysToDelete.forEach((key) => safeRemove(key));
  } catch {}
}

export async function clearImageCaches(cacheNames = IMAGE_CACHE_NAMES) {
  if (typeof window === "undefined" || !("caches" in window)) return { deleted: [], skipped: cacheNames };
  const deleted = [];
  const skipped = [];
  for (const name of cacheNames) {
    try {
      const ok = await window.caches.delete(name);
      if (ok) deleted.push(name);
      else skipped.push(name);
    } catch {
      skipped.push(name);
    }
  }
  return { deleted, skipped };
}

export async function clearAllRuntimeCache() {
  clearListingsCache();
  clearDetailCacheAll();
  const imageResult = await clearImageCaches();
  return { imageResult };
}

export async function inspectListingOffline(listingId) {
  const entry = getDetailCacheEntry(listingId);
  const images = Array.from(new Set([
    ...(Array.isArray(entry?.item?.images) ? entry.item.images : []),
    entry?.item?.photo,
  ].filter(Boolean)));

  const imageStatus = [];
  if (typeof window !== "undefined" && "caches" in window && images.length) {
    const cacheNames = await window.caches.keys();
    for (const url of images) {
      let foundIn = [];
      for (const name of cacheNames) {
        try {
          const cache = await window.caches.open(name);
          const matched = await cache.match(url, { ignoreVary: true, ignoreSearch: false });
          if (matched) foundIn.push(name);
        } catch {}
      }
      imageStatus.push({ url, foundIn, cached: foundIn.length > 0 });
    }
  }

  return {
    listingId: listingId != null ? String(listingId) : "",
    detailCached: !!entry?.item,
    detailFresh: !!entry?.isFresh,
    detailAgeMs: entry?.ageMs ?? Infinity,
    updatedAt: entry?.updatedAt || 0,
    title: entry?.item?.title || "",
    imageCount: images.length,
    cachedImages: imageStatus.filter((item) => item.cached).length,
    missingImages: imageStatus.filter((item) => !item.cached).length,
    images: imageStatus,
  };
}

export async function getCacheDiagnostics() {
  cleanupExpiredDetails();

  const listingsPayload = getListingsCache({ allowStale: true });
  const detailIndex = readDetailIndex();
  const detailEntries = detailIndex.map((entry) => getDetailCacheEntry(entry.id)).filter(Boolean);
  const detailFreshCount = detailEntries.filter((entry) => entry.isFresh).length;
  const detailStaleCount = detailEntries.length - detailFreshCount;

  const localKeys = [LISTINGS_KEY, DETAIL_INDEX_KEY, ...detailIndex.map((entry) => getDetailKey(entry.id))];
  const uniqueLocalKeys = Array.from(new Set(localKeys));
  const localBytes = uniqueLocalKeys.reduce((sum, key) => sum + getLocalStorageSize(key), 0);

  let storageEstimate = null;
  try {
    if (typeof navigator !== "undefined" && navigator.storage?.estimate) {
      const estimate = await navigator.storage.estimate();
      storageEstimate = {
        usage: Number(estimate?.usage || 0),
        quota: Number(estimate?.quota || 0),
      };
    }
  } catch {}

  let cacheStorage = { supported: false, caches: [], totalRequests: 0 };
  let maps = {
    tileCount: 0,
    tileCacheNames: [],
    tileSamples: [],
    leafletAssetCount: 0,
    leafletCached: false,
    leafletCacheNames: [],
    leafletSamples: [],
    appAssetCount: 0,
    appAssetCacheNames: [],
    appAssetSamples: [],
    relatedCaches: [],
  };
  if (typeof window !== "undefined" && "caches" in window) {
    try {
      const names = await window.caches.keys();
      const cacheItems = [];
      for (const name of names) {
        try {
          const cache = await window.caches.open(name);
          const reqs = await cache.keys();
          const item = {
            name,
            requestCount: reqs.length,
sampleUrls: reqs.map((req) => req.url),
            sampleItems: await Promise.all(reqs.map(async (req) => {
              try {
                const res = await cache.match(req);
                const cl = res?.headers?.get("content-length");
                const size = cl ? parseInt(cl) : 0;
                return { url: req.url, size };
              } catch { return { url: req.url, size: 0 }; }
            })),
            mapTileCount: 0,
            leafletAssetCount: 0,
            appAssetCount: 0,
            mapTileSamples: [],
            leafletSamples: [],
            appAssetSamples: [],
          };

          reqs.forEach((req) => {
            const url = req?.url || "";
            if (isMapTileUrl(url)) {
              item.mapTileCount += 1;
              pushSampleUrl(item.mapTileSamples, url);
              pushSampleUrl(maps.tileSamples, url);
            }
            if (isLeafletAssetUrl(url)) {
              item.leafletAssetCount += 1;
              pushSampleUrl(item.leafletSamples, url);
              pushSampleUrl(maps.leafletSamples, url);
            }
            if (isAppAssetUrl(url)) {
              item.appAssetCount += 1;
              pushSampleUrl(item.appAssetSamples, url);
              pushSampleUrl(maps.appAssetSamples, url);
            }
          });

          cacheItems.push(item);
        } catch {
          cacheItems.push({
            name,
            requestCount: 0,
            sampleUrls: [],
            mapTileCount: 0,
            leafletAssetCount: 0,
            appAssetCount: 0,
            mapTileSamples: [],
            leafletSamples: [],
            appAssetSamples: [],
          });
        }
      }

      const relatedCaches = cacheItems.filter((item) => item.mapTileCount || item.leafletAssetCount || item.appAssetCount);
      maps = {
        tileCount: cacheItems.reduce((sum, item) => sum + Number(item.mapTileCount || 0), 0),
        tileCacheNames: relatedCaches.filter((item) => item.mapTileCount > 0).map((item) => item.name),
        tileSamples: maps.tileSamples,
        leafletAssetCount: cacheItems.reduce((sum, item) => sum + Number(item.leafletAssetCount || 0), 0),
        leafletCached: cacheItems.some((item) => Number(item.leafletAssetCount || 0) > 0),
        leafletCacheNames: relatedCaches.filter((item) => item.leafletAssetCount > 0).map((item) => item.name),
        leafletSamples: maps.leafletSamples,
        appAssetCount: cacheItems.reduce((sum, item) => sum + Number(item.appAssetCount || 0), 0),
        appAssetCacheNames: relatedCaches.filter((item) => item.appAssetCount > 0).map((item) => item.name),
        appAssetSamples: maps.appAssetSamples,
        relatedCaches: relatedCaches.map((item) => ({
          name: item.name,
          requestCount: item.requestCount,
          mapTileCount: item.mapTileCount,
          leafletAssetCount: item.leafletAssetCount,
          appAssetCount: item.appAssetCount,
          mapTileSamples: item.mapTileSamples,
          leafletSamples: item.leafletSamples,
          appAssetSamples: item.appAssetSamples,
        })),
      };

      cacheStorage = {
        supported: true,
        caches: cacheItems,
        totalRequests: cacheItems.reduce((sum, item) => sum + Number(item.requestCount || 0), 0),
      };
    } catch {}
  }

  return {
    generatedAt: now(),
    listings: {
      exists: !!listingsPayload,
      count: Array.isArray(listingsPayload?.items) ? listingsPayload.items.length : 0,
      updatedAt: Number(listingsPayload?.updatedAt || 0),
      ageMs: getAgeMs(listingsPayload?.updatedAt),
      fresh: !!listingsPayload && isFresh(listingsPayload.updatedAt, LISTINGS_TTL_MS),
      bytes: getLocalStorageSize(LISTINGS_KEY),
    },
    details: {
      count: detailEntries.length,
      freshCount: detailFreshCount,
      staleCount: detailStaleCount,
      maxItems: MAX_DETAIL_ITEMS,
      indexBytes: getLocalStorageSize(DETAIL_INDEX_KEY),
      totalBytes: detailEntries.reduce((sum, entry) => sum + getLocalStorageSize(getDetailKey(entry.id)), 0),
      oldestAgeMs: detailEntries.length ? Math.max(...detailEntries.map((entry) => Number(entry.ageMs || 0))) : 0,
      newestAgeMs: detailEntries.length ? Math.min(...detailEntries.map((entry) => Number(entry.ageMs || 0))) : 0,
    },
    localStorage: {
      trackedKeys: uniqueLocalKeys.length,
      trackedBytes: localBytes,
    },
    cacheStorage,
    maps,
    storageEstimate,
  };
}

export function migrateLegacyCache() {
  try {
    if (localStorage.getItem(MIGRATION_FLAG_KEY) === "1") {
      cleanupExpiredDetails();
      return;
    }
  } catch {}

  let listingsMigrated = false;
  let detailsMigrated = false;

  // old listings
  try {
    const oldListings = safeReadJSON(LEGACY_LISTINGS_KEY, null);
    if (Array.isArray(oldListings) && oldListings.length > 0) {
      setListingsCache(oldListings);
      listingsMigrated = true;
    }
  } catch {}

  // detailCache
  try {
    const oldDetails = safeReadJSON(LEGACY_DETAIL_KEY, null);
    if (oldDetails && typeof oldDetails === "object") {
      Object.values(oldDetails).forEach((item) => {
        if (item?.id) setDetailCache(item);
      });
      detailsMigrated = true;
    }
  } catch {}

  // listing_cache + order
  try {
    const store = safeReadJSON(LEGACY_LISTING_CACHE_KEY, null);
    const order = safeReadJSON(LEGACY_LISTING_ORDER_KEY, []);
    if (store && typeof store === "object") {
      const orderedIds = Array.isArray(order) && order.length ? order : Object.keys(store);
      orderedIds.forEach((id) => {
        const item = store[id];
        if (item?.id) setDetailCache(item);
      });
      detailsMigrated = true;
    }
  } catch {}

  // remove old keys only after successful copy attempts and without throwing.
  if (listingsMigrated) safeRemove(LEGACY_LISTINGS_KEY);
  if (detailsMigrated) {
    safeRemove(LEGACY_DETAIL_KEY);
    safeRemove(LEGACY_LISTING_CACHE_KEY);
    safeRemove(LEGACY_LISTING_ORDER_KEY);
  }

  try { localStorage.setItem(MIGRATION_FLAG_KEY, "1"); } catch {}
  cleanupExpiredDetails();
                                                 }
