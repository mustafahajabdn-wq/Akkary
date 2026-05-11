/**
 * pushNotifications.js
 * منطق الاشتراك/إلغاء الاشتراك. في Push — يعتمد على pushService لعمليات DB
 */
import {
  removeOldEndpointSubscription,
  upsertPushSubscription,
  deletePushSubscriptionByEndpoint,
  deleteAllUserSubscriptions,
} from "./pushService.js";

const VAPID_PUBLIC_KEY = "BAu5s2RIYvScGUt4wLq1ju1Ka-zoF05GFBh10escCfxck6i6uv2VUkVVyUZvzYeKjSdxhVJh08sRVfWmkPS-Z68";

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

export async function subscribeToPush(userId) {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window))
      return { error: 'المتصفح لا يدعم الإشعارات' };
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return { error: 'لم تسمح بالإشعارات' };
    const sw = await navigator.serviceWorker.ready;
    const subscription = await sw.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
    if (userId) {
      await removeOldEndpointSubscription(subscription.endpoint, userId);
      await upsertPushSubscription(userId, subscription);
    }
    return { success: true };
  } catch (e) {
    return { error: e.message };
  }
}

export async function unsubscribeFromPush(userId) {
  try {
    const sw = await navigator.serviceWorker.ready;
    const sub = await sw.pushManager.getSubscription();
    const endpoint = sub?.endpoint || null;
    if (sub) await sub.unsubscribe();
    if (userId) {
      if (endpoint) {
        await deletePushSubscriptionByEndpoint(userId, endpoint);
      } else {
        await deleteAllUserSubscriptions(userId);
      }
    }
    return { success: true };
  } catch (e) {
    return { error: e.message };
  }
}

export async function getPushStatus() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  const sw = await navigator.serviceWorker.ready;
  const sub = await sw.pushManager.getSubscription();
  return sub ? 'subscribed' : 'unsubscribed';
}
