import { fetchAppSettings } from "./appConfigService.js";

export const TRACKING_SETTING_KEYS = [
  "meta_pixel_enabled",
  "meta_pixel_id",
  "track_page_view",
  "track_property_view",
  "track_contact_click",
  "track_search"
];

export const DEFAULT_TRACKING_SETTINGS = {
  meta_pixel_enabled: "false",
  meta_pixel_id: "2011345186402436",
  track_page_view: "true",
  track_property_view: "true",
  track_contact_click: "true",
  track_search: "true"
};

let settingsCache = null;
let settingsPromise = null;
let initializedPixelId = null;

function normalizeBool(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  const v = String(value ?? "").trim().toLowerCase();
  if (["true", "1", "yes", "on", "enabled"].includes(v)) return true;
  if (["false", "0", "no", "off", "disabled", ""].includes(v)) return false;
  return fallback;
}

function normalizeSettings(raw = {}) {
  const merged = { ...DEFAULT_TRACKING_SETTINGS, ...(raw || {}) };

  return {
    meta_pixel_enabled: normalizeBool(merged.meta_pixel_enabled, false),
    meta_pixel_id: String(merged.meta_pixel_id || "").trim(),
    track_page_view: normalizeBool(merged.track_page_view, true),
    track_property_view: normalizeBool(merged.track_property_view, true),
    track_contact_click: normalizeBool(merged.track_contact_click, true),
    track_search: normalizeBool(merged.track_search, true)
  };
}

export async function getTrackingSettings({ refresh = false } = {}) {
  if (!refresh && settingsCache) return settingsCache;

  if (!refresh && settingsPromise) return settingsPromise;

  settingsPromise = fetchAppSettings(TRACKING_SETTING_KEYS)
    .then((raw) => {
      settingsCache = normalizeSettings(raw);
      if (typeof window !== "undefined") window._trackingSettings = settingsCache;
      return settingsCache;
    })
    .catch((error) => {
      console.warn("تعذر تحميل إعدادات التتبع", error);
      settingsCache = normalizeSettings({ meta_pixel_enabled: false });
      return settingsCache;
    })
    .finally(() => {
      settingsPromise = null;
    });

  return settingsPromise;
}

function injectMetaPixelScript() {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (window.fbq) return;

  !(function (f, b, e, v, n, t, s) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    t = b.createElement(e);
    t.async = true;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
}

export async function initMetaPixel({ refreshSettings = false } = {}) {
  const settings = await getTrackingSettings({ refresh: refreshSettings });

  if (!settings.meta_pixel_enabled || !settings.meta_pixel_id) return false;

  injectMetaPixelScript();

  if (!window.fbq) return false;

  if (initializedPixelId !== settings.meta_pixel_id) {
    window.fbq("init", settings.meta_pixel_id);
    initializedPixelId = settings.meta_pixel_id;
  }

  return true;
}

export async function trackMetaEvent(eventName, data = {}, settingKey = null) {
  if (!eventName || typeof window === "undefined") return false;

  const settings = await getTrackingSettings();

  if (!settings.meta_pixel_enabled) return false;
  if (settingKey && settings[settingKey] === false) return false;

  const ready = await initMetaPixel();
  if (!ready || !window.fbq) return false;

  window.fbq("track", eventName, data || {});
  return true;
}

export function trackPageView(data = {}) {
  return trackMetaEvent("PageView", data, "track_page_view");
}

export function trackPropertyView(property = {}) {
  if (!property?.id) return false;

  return trackMetaEvent(
    "ViewContent",
    {
      content_ids: [String(property.id)],
      content_name: property.title || "",
      content_category: property.category || "",
      content_type: "property",
      value: Number(property.price || 0),
      currency: property.currency || "USD",
      city: property.city || "",
      district: property.district || "",
      type: property.type || ""
    },
    "track_property_view"
  );
}

export function trackContactClick(property = {}, method = "contact") {
  if (!property?.id) return false;

  return trackMetaEvent(
    "Contact",
    {
      content_ids: [String(property.id)],
      content_name: property.title || "",
      content_category: property.category || "",
      method
    },
    "track_contact_click"
  );
}

export function trackSearch(query = "", extra = {}) {
  const q = String(query || "").trim();
  if (!q) return false;

  return trackMetaEvent(
    "Search",
    {
      search_string: q,
      ...extra
    },
    "track_search"
  );
}
