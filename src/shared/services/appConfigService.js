/**
 * طبقة البيانات المشتركة لإعدادات التطبيق العامة.
 *
 * مبدأ مهم:
 * لا تجعل الصفحات تسأل app_settings مباشرة. كل القراءة تمر من هنا فقط.
 * هذا الملف يجمع إعدادات app_settings في طلب واحد، ثم يخزنها في الذاكرة
 * و localStorage، ويمنع تكرار الطلب إذا نادت عدة صفحات الدالة في الوقت نفسه.
 */

import { getSupabase } from "./supabaseClient.js";

const SETTINGS_CACHE_KEY = "aqari_app_settings_cache_v1";
const SETTINGS_CACHE_TTL_MS = 5 * 60 * 1000; // 5 دقائق؛ زدها إلى 15 دقيقة إن كانت الإعدادات قليلة التغيير.
const PROPERTY_TYPES_CACHE_KEY = "aqari_property_types_cache_v1";
const PROPERTY_TYPES_CACHE_TTL_MS = 15 * 60 * 1000;

let appSettingsCache = null;
let appSettingsLoadedAt = 0;
let appSettingsPromise = null;

let propertyTypesCache = null;
let propertyTypesLoadedAt = 0;
let propertyTypesPromise = null;

function now() {
  return Date.now();
}

function isFresh(ts, ttl = SETTINGS_CACHE_TTL_MS) {
  return ts && now() - ts < ttl;
}

function normalizeValue(value) {
  // Supabase قد يعيد jsonb ككائن، وقد تعود بعض القيم كنصوص.
  // لا نغامر بتحويل كل نص إلى JSON حتى لا نكسر القيم العادية مثل أرقام واتساب.
  return value;
}

function rowsToMap(rows = []) {
  return Object.fromEntries(
    (rows || [])
      .filter((row) => row?.key != null)
      .map((row) => [row.key, normalizeValue(row.value)])
  );
}

function pickKeys(map = {}, keys = []) {
  if (!Array.isArray(keys) || keys.length === 0) return { ...(map || {}) };

  const out = {};
  keys.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(map, key)) {
      out[key] = map[key];
    }
  });
  return out;
}

function readLocalSettingsCache() {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(SETTINGS_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed?.data || !isFresh(parsed?.ts)) return null;

    return {
      data: parsed.data,
      ts: parsed.ts,
    };
  } catch {
    return null;
  }
}

function writeLocalSettingsCache(data) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(
      SETTINGS_CACHE_KEY,
      JSON.stringify({
        ts: now(),
        data: data || {},
      })
    );
  } catch {
    // تجاهل: localStorage قد يكون ممتلئاً أو محظوراً.
  }
}

function setSettingsCache(data, ts = now()) {
  appSettingsCache = data || {};
  appSettingsLoadedAt = ts;

  if (typeof window !== "undefined") {
    window._appSettings = appSettingsCache;
  }
}

async function fetchAllAppSettingsFromDB() {
  const sb = getSupabase();
  if (!sb) return {};

  const { data, error } = await sb
    .from("app_settings")
    .select("key,value");

  if (error) {
    console.warn("Failed to load app settings:", error);
    return appSettingsCache || readLocalSettingsCache()?.data || {};
  }

  return rowsToMap(data || []);
}

/**
 * يجلب كل إعدادات app_settings مرة واحدة فقط.
 * - الذاكرة أولاً.
 * - localStorage ثانياً.
 * - Supabase ثالثاً.
 * - إذا وُجد طلب جارٍ، تعود الدالة بنفس الوعد بدل إنشاء طلب جديد.
 */
export async function getAppSettings({ refresh = false } = {}) {
  if (!refresh && appSettingsCache && isFresh(appSettingsLoadedAt)) {
    return appSettingsCache;
  }

  if (!refresh) {
    const local = readLocalSettingsCache();
    if (local?.data) {
      setSettingsCache(local.data, local.ts);
      return appSettingsCache;
    }
  }

  if (!refresh && appSettingsPromise) {
    return appSettingsPromise;
  }

  appSettingsPromise = fetchAllAppSettingsFromDB()
    .then((map) => {
      setSettingsCache(map);
      writeLocalSettingsCache(map);
      return map;
    })
    .finally(() => {
      appSettingsPromise = null;
    });

  return appSettingsPromise;
}

export async function loadAppSettings(options = {}) {
  await getAppSettings(options);
}

export async function fetchAppSettings(keys = [], options = {}) {
  const map = await getAppSettings(options);
  return pickKeys(map, keys);
}

export async function fetchAppSetting(key, options = {}) {
  if (!key) return null;
  const map = await fetchAppSettings([key], options);
  return map[key] ?? null;
}

export function getCachedAppSettings(keys = []) {
  const map = appSettingsCache || readLocalSettingsCache()?.data || {};
  return pickKeys(map, keys);
}

export function invalidateAppSettingsCache() {
  appSettingsCache = null;
  appSettingsLoadedAt = 0;
  appSettingsPromise = null;

  if (typeof window !== "undefined") {
    window._appSettings = {};
    try {
      localStorage.removeItem(SETTINGS_CACHE_KEY);
    } catch {}
  }
}

function normalizePropertyTypes(types = []) {
  return (types || []).map((t) => ({
    ...t,
    key: String(t.id),
    name_ar: t.name,
  }));
}

function readLocalPropertyTypesCache() {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(PROPERTY_TYPES_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed?.data) || !isFresh(parsed?.ts, PROPERTY_TYPES_CACHE_TTL_MS)) return null;

    return {
      data: parsed.data,
      ts: parsed.ts,
    };
  } catch {
    return null;
  }
}

function writeLocalPropertyTypesCache(data) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(
      PROPERTY_TYPES_CACHE_KEY,
      JSON.stringify({
        ts: now(),
        data: data || [],
      })
    );
  } catch {}
}

function setPropertyTypesCache(types, ts = now()) {
  propertyTypesCache = normalizePropertyTypes(types || []);
  propertyTypesLoadedAt = ts;

  if (typeof window !== "undefined") {
    window._propertyTypes = propertyTypesCache;
  }
}

function projectRows(rows = [], select = "*") {
  if (!select || select === "*") return rows || [];

  const keys = String(select)
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean)
    .filter((k) => !k.includes("(") && !k.includes(":"));

  if (!keys.length) return rows || [];

  return (rows || []).map((row) => {
    const out = {};
    keys.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(row, key)) {
        out[key] = row[key];
      }
    });
    return out;
  });
}

async function fetchPropertyTypesFromDB() {
  const sb = getSupabase();
  if (!sb) return [];

  const { data: types, error } = await sb
    .from("property_types")
    .select("id,name,icon,sort_order,active")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.warn("Failed to load property types:", error);
    return propertyTypesCache || readLocalPropertyTypesCache()?.data || [];
  }

  return normalizePropertyTypes(types || []);
}

export async function getPropertyTypes({ refresh = false } = {}) {
  if (!refresh && propertyTypesCache && isFresh(propertyTypesLoadedAt, PROPERTY_TYPES_CACHE_TTL_MS)) {
    return propertyTypesCache;
  }

  if (!refresh) {
    const local = readLocalPropertyTypesCache();
    if (local?.data) {
      setPropertyTypesCache(local.data, local.ts);
      return propertyTypesCache;
    }
  }

  if (!refresh && propertyTypesPromise) {
    return propertyTypesPromise;
  }

  propertyTypesPromise = fetchPropertyTypesFromDB()
    .then((types) => {
      setPropertyTypesCache(types);
      writeLocalPropertyTypesCache(propertyTypesCache);
      return propertyTypesCache;
    })
    .finally(() => {
      propertyTypesPromise = null;
    });

  return propertyTypesPromise;
}

export async function fetchCachedPropertyTypes(select = "*", options = {}) {
  const types = await getPropertyTypes(options);
  return projectRows(types, select);
}

export async function fetchCachedPropertyTypeByName(name, options = {}) {
  if (!name) return null;

  const types = await getPropertyTypes(options);
  return types.find((type) => type.name === name || type.name_ar === name || type.key === String(name)) || null;
}

export function invalidatePropertyTypesCache() {
  propertyTypesCache = null;
  propertyTypesLoadedAt = 0;
  propertyTypesPromise = null;

  if (typeof window !== "undefined") {
    window._propertyTypes = [];
    try {
      localStorage.removeItem(PROPERTY_TYPES_CACHE_KEY);
    } catch {}
  }
}

export async function loadPropertyTypes(options = {}) {
  await getPropertyTypes(options);
}

export async function loadCurrencies() {
  const sb = getSupabase();

  const { data: currencies, error } = await sb
    .from("currencies")
    .select("code,name_ar,symbol,rate_to_usd")
    .eq("active", true);

  if (error) {
    console.warn("Failed to load currencies:", error);
    window._currencies = [];
    return;
  }

  if (currencies?.length) {
    window._currencies = currencies;
  }
}

export async function loadAnnouncements() {
  const sb = getSupabase();

  const { data: announcements, error } = await sb
    .from("announcements")
    .select("*")
    .eq("active", true);

  if (error) {
    console.warn("Failed to load announcements:", error);
    window._announcements = [];
    return;
  }

  if (announcements?.length) {
    window._announcements = announcements;
  }
}

export async function loadAppData() {
  await Promise.all([
    loadAppSettings(),
    loadPropertyTypes(),
    loadCurrencies(),
    loadAnnouncements(),
  ]);
}

export async function loadCitiesFromDB(citiesRef, districtsRef) {
  // المصدر الوحيد لبيانات المدن والأحياء هو geoCache.
  // أبقينا هذه الدالة للتوافق مع الاستدعاءات القديمة فقط.
  const {
    getCities,
    getDistrictsGroupedByCity,
  } = await import("../../app/services/geoCache.js");

  const [cityRows, districtsMap] = await Promise.all([
    getCities(),
    getDistrictsGroupedByCity(),
  ]);

  if (citiesRef?.current && cityRows?.length) {
    citiesRef.current = cityRows.map((city) => city.name).filter(Boolean);
  }

  if (districtsRef?.current && districtsMap && Object.keys(districtsMap).length) {
    districtsRef.current = districtsMap;
  }
}

export async function loadRolePermissions(role, options = {}) {
  const value = await fetchAppSetting("role_permissions", options);
  if (!value) return null;

  try {
    const perms = typeof value === "string" ? JSON.parse(value) : value;
    return perms?.[role] || [];
  } catch {
    return null;
  }
}
