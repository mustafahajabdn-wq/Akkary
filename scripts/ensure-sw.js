import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const swPath = join(process.cwd(), "src", "app", "sw-custom.js");

if (!existsSync(swPath)) {
  mkdirSync(dirname(swPath), { recursive: true });
  writeFileSync(
    swPath,
    `import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

self.skipWaiting();
clientsClaim();

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({ cacheName: 'pages-cache' })
);

registerRoute(
  ({ url }) => url.hostname.includes('supabase.co') && url.pathname.includes('/storage/') && !/\\.(mp4|mov|webm|m4v)(\\?|$)/i.test(url.pathname),
  new CacheFirst({
    cacheName: 'supabase-images',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 3 * 24 * 60 * 60,
        purgeOnQuotaError: true,
      }),
    ],
  })
);

registerRoute(
  ({ url }) => /(^|\\.)tile\\.openstreetmap\\.org$/i.test(url.hostname),
  new CacheFirst({
    cacheName: 'map-tiles-cache',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 3,
        maxAgeSeconds: 24 * 60 * 60,
        purgeOnQuotaError: true,
      }),
    ],
  })
);

registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images-cache',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 2 * 24 * 60 * 60,
        purgeOnQuotaError: true,
      }),
    ],
  })
);

self.addEventListener('push', (event) => {
  let data = { title: 'طابو أخضر', body: '', icon: '/icons/icon-192.png', url: '/' };
  if (event.data) {
    try { data = { ...data, ...event.data.json() }; }
    catch { data.body = event.data.text() || ''; }
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { url: data.url || '/' },
      dir: 'rtl',
      lang: 'ar',
      vibrate: [200, 100, 200],
      tag: 'tabu-push',
      renotify: true,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  navigator.clearAppBadge && navigator.clearAppBadge().catch(() => {});
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const client = clientList.find((item) => item.url.includes(self.location.origin));
      if (client) {
        client.focus();
        client.navigate(url);
      } else {
        clients.openWindow(url);
      }
    })
  );
});
`,
    "utf8"
  );
}
