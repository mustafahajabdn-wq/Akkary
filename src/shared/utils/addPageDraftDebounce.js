import { installListingWhatsAppMessage } from "../../app/utils/listingWhatsAppMessage.js";

const DRAFT_KEY_PREFIX = "addpage_draft:";
const INSTALL_FLAG = "__aqariAddPageDraftDebounceInstalled";

export function installAddPageDraftDebounce(delayMs = 700) {
  if (typeof window === "undefined" || typeof Storage === "undefined") return;

  // يُحمّل مع نقطة تشغيل التطبيق نفسها، ويعمل فقط داخل صفحات الإعلانات.
  installListingWhatsAppMessage();

  if (window[INSTALL_FLAG]) return;

  window[INSTALL_FLAG] = true;

  const nativeSetItem = Storage.prototype.setItem;
  const nativeRemoveItem = Storage.prototype.removeItem;
  const nativeClear = Storage.prototype.clear;
  const pending = new Map();

  const isAddPageDraft = (storage, key) =>
    storage === window.localStorage &&
    typeof key === "string" &&
    key.startsWith(DRAFT_KEY_PREFIX);

  const flushKey = key => {
    const entry = pending.get(key);
    if (!entry) return;

    window.clearTimeout(entry.timer);
    pending.delete(key);

    try {
      nativeSetItem.call(window.localStorage, key, entry.value);
    } catch {}
  };

  const flushAll = () => {
    Array.from(pending.keys()).forEach(flushKey);
  };

  Storage.prototype.setItem = function setItemWithAddPageDraftDebounce(key, value) {
    if (!isAddPageDraft(this, key)) {
      return nativeSetItem.call(this, key, value);
    }

    const normalizedKey = String(key);
    const previous = pending.get(normalizedKey);
    if (previous) window.clearTimeout(previous.timer);

    const timer = window.setTimeout(() => {
      const latest = pending.get(normalizedKey);
      if (!latest || latest.timer !== timer) return;

      pending.delete(normalizedKey);

      try {
        nativeSetItem.call(window.localStorage, normalizedKey, latest.value);
      } catch {}
    }, Math.max(0, Number(delayMs) || 700));

    pending.set(normalizedKey, {
      value: String(value),
      timer,
    });
  };

  Storage.prototype.removeItem = function removeItemWithPendingDraftCancel(key) {
    if (isAddPageDraft(this, key)) {
      const normalizedKey = String(key);
      const entry = pending.get(normalizedKey);

      if (entry) {
        window.clearTimeout(entry.timer);
        pending.delete(normalizedKey);
      }
    }

    return nativeRemoveItem.call(this, key);
  };

  Storage.prototype.clear = function clearWithPendingDraftCancel() {
    if (this === window.localStorage) {
      pending.forEach(entry => window.clearTimeout(entry.timer));
      pending.clear();
    }

    return nativeClear.call(this);
  };

  window.addEventListener("pagehide", flushAll);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushAll();
  });
}
