import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

// تفعيل Service Worker   الجديد فوراً بدون انتظار
self.skipWaiting();
clientsClaim();

// Precache — يُضاف تلقائياً من vite-plugin-pwa
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

const TRACKING_HOST_RE = /(facebook\.com|fbcdn\.net|google-analytics\.com|googletagmanager\.com|doubleclick\.net|clarity\.ms|hotjar\.com)$/i;

function isTrackingOrBeacon(url) {
  const host = url.hostname.replace(/^www\./, "");
  return TRACKING_HOST_RE.test(host) ||
    url.pathname.includes("/tr/") ||
    url.pathname.includes("/collect") ||
    url.pathname.includes("/g/collect");
}

function isAppIconOrManifestAsset(url) {
  const path = url.pathname.toLowerCase();
  const file = path.split("/").pop() || "";

  return file === "favicon.ico" ||
    file === "apple-touch-icon.png" ||
    /^icon-\d+\.png$/i.test(file) ||
    file === "manifest.webmanifest";
}

// ── Navigation: NetworkFirst للصفحات — الشبكة أولاً، الكاش عند الفشل ──
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: 'pages-cache',
  })
);

// ── Cache صور Supabase Storage ─────────────────────────────────
registerRoute(
  ({ url }) => url.hostname.includes('supabase.co') && url.pathname.includes('/storage/') && !/\.(mp4|mov|webm|m4v)(\?|$)/i.test(url.pathname),
  new CacheFirst({
    cacheName: 'supabase-images',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 3 * 24 * 60 * 60, // 3 أيام
        purgeOnQuotaError: true,
      }),
    ],
  })
);

// ── Cache بلاطات الخرائط (OSM / Leaflet) — محدود جداً ──────────
registerRoute(
  ({ url }) => /(^|\.)tile\.openstreetmap\.org$/i.test(url.hostname),
  new CacheFirst({
    cacheName: 'map-tiles-cache',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 3,
        maxAgeSeconds: 1 * 24 * 60 * 60, // يوم واحد
        purgeOnQuotaError: true,
      }),
    ],
  })
);

// ── Cache صور عامة ───────────────────────────────────────────────
registerRoute(
  ({ request, url }) =>
    request.destination === 'image' &&
    !isTrackingOrBeacon(url) &&
    !isAppIconOrManifestAsset(url) &&
    !(url.hostname.includes('supabase.co') && url.pathname.includes('/storage/')) &&
    !/(^|\.)tile\.openstreetmap\.org$/i.test(url.hostname),
  new CacheFirst({
    cacheName: 'images-cache',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 2 * 24 * 60 * 60, // 2 أيام
        purgeOnQuotaError: true,
      }),
    ],
  })
);

// ── Push Notifications ──────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = { title: 'طابو أخضر', body: '', icon: '/icons/icon-192.png', url: '/' };
  if (event.data) {
    try { data = { ...data, ...event.data.json() }; }
    catch { data.body = event.data.text() || ''; }
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body:    data.body,
      icon:    data.icon || '/icons/icon-192.png',
      badge:   '/icons/icon-192.png',
      data:    { url: data.url || '/' },
      dir:     'rtl',
      lang:    'ar',
      vibrate: [200, 100, 200],
      tag:     'tabu-push',
      renotify: true,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  navigator.clearAppBadge && navigator.clearAppBadge().catch(() => {});
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cs) => {
      const c = cs.find(c => c.url.includes(self.location.origin));
      if (c) { c.focus(); c.navigate(url); }
      else clients.openWindow(url);
    })
  );
});
