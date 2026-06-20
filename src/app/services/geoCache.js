// geoCache.js — المصدر الوحيد لبيانات المدينة/المنطقة أو الحي/القرية داخل التطبيق
// المدن والمناطق تُحمَّل دفعة واحدة ثم تُقرأ محلياً في كل الصفحات.
// القرى تبقى lazy حسب المنطقة، لكنها محفوظة في localStorage.

import { getSupabase } from "../../shared/services/supabaseClient.js";

const VERSION = "v7";
const DAY_MS = 24 * 60 * 60 * 1000;
const KEY_LOCATIONS = `geo_locations_${VERSION}`; // { cities, districts, ... }
const KEY_VILLAGES = `geo_villages_${VERSION}`;   // { districtId: [{id,name,lat,lng}] }
const KEY_ALL_COORDS = `geo_all_coords_${VERSION}`;

let locationsMemory = null;
let locationsPromise = null;
let allCoordsMemory = null;
let allCoordsPromise = null;

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function loadEnvelope(key, maxAgeMs = DAY_MS) {
  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    if (parsed.ts && Date.now() - parsed.ts > maxAgeMs) return null;
    return parsed.data ?? parsed;
  } catch {
    return null;
  }
}

function saveEnvelope(key, data) {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
  } catch {}
}

function normalizeText(v) {
  return String(v ?? "").trim();
}

function toCoord(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function byArabicName(a, b) {
  return String(a?.name || "").localeCompare(String(b?.name || ""), "ar");
}

function normalizeDistrict(row, cityName = "") {
  return {
    id: row?.id ?? null,
    name: normalizeText(row?.name),
    city_id: row?.city_id ?? null,
    city_name: normalizeText(cityName || row?.cities?.name || row?.city_name),
    lat: toCoord(row?.lat),
    lng: toCoord(row?.lng),
  };
}

function buildLocationCache(citiesRows = [], districtsRows = []) {
  const cities = (citiesRows || [])
    .map((row) => ({ id: row?.id ?? null, name: normalizeText(row?.name) }))
    .filter((row) => row.name);

  const cityById = {};
  const cityByName = {};
  cities.forEach((city) => {
    if (city.id !== null && city.id !== undefined) cityById[String(city.id)] = city;
    cityByName[city.name] = city;
  });

  const districtsByCity = {};
  const districtById = {};
  const allDistricts = [];

  (districtsRows || []).forEach((row) => {
    const cityName = normalizeText(row?.cities?.name || cityById[String(row?.city_id)]?.name || row?.city_name);
    const district = normalizeDistrict(row, cityName);
    if (!district.name) return;

    if (district.id !== null && district.id !== undefined) {
      districtById[String(district.id)] = district;
    }

    allDistricts.push(district);

    if (district.city_name) {
      if (!districtsByCity[district.city_name]) districtsByCity[district.city_name] = [];
      districtsByCity[district.city_name].push(district);
    }
  });

  Object.keys(districtsByCity).forEach((cityName) => {
    districtsByCity[cityName].sort(byArabicName);
  });
  allDistricts.sort(byArabicName);

  return {
    cities,
    cityById,
    cityByName,
    districtsByCity,
    districtById,
    allDistricts,
  };
}

async function fetchLocationsFromDB() {
  const sb = getSupabase();
  if (!sb) return buildLocationCache([], []);

  const [citiesRes, districtsRes] = await Promise.all([
    sb.from("cities").select("id,name,sort_order").order("sort_order"),
    sb.from("districts").select("id,name,city_id,lat,lng,sort_order,cities(name)").order("sort_order"),
  ]);

  if (citiesRes.error) throw citiesRes.error;
  if (districtsRes.error) throw districtsRes.error;

  return buildLocationCache(citiesRes.data || [], districtsRes.data || []);
}

export async function loadLocationCache(options = {}) {
  const force = Boolean(options.force);

  if (!force && locationsMemory) return locationsMemory;

  if (!force) {
    const cached = loadEnvelope(KEY_LOCATIONS);
    if (cached?.cities?.length) {
      locationsMemory = cached;
      return cached;
    }
  }

  if (!force && locationsPromise) return locationsPromise;

  locationsPromise = fetchLocationsFromDB()
    .then((data) => {
      locationsMemory = data;
      if (data?.cities?.length) saveEnvelope(KEY_LOCATIONS, data);
      return data;
    })
    .finally(() => {
      locationsPromise = null;
    });

  return locationsPromise;
}

export async function primeGeoCache(options = {}) {
  return loadLocationCache(options);
}

export async function refreshGeoCache() {
  locationsMemory = null;
  locationsPromise = null;
  allCoordsMemory = null;
  allCoordsPromise = null;

  if (canUseStorage()) {
    try {
      window.localStorage.removeItem(KEY_LOCATIONS);
      window.localStorage.removeItem(KEY_VILLAGES);
      window.localStorage.removeItem(KEY_ALL_COORDS);
    } catch {}
  }

  return loadLocationCache({ force: true });
}

export async function getCities(_sbIgnored) {
  const cache = await loadLocationCache();
  return cache.cities || [];
}

export async function getCityNames() {
  const rows = await getCities();
  return rows.map((city) => city.name).filter(Boolean);
}

export async function getCityByName(arg1, arg2) {
  const cityName = normalizeText(typeof arg1 === "string" || arg2 === undefined ? arg1 : arg2);
  if (!cityName) return null;
  const cache = await loadLocationCache();
  return cache.cityByName?.[cityName] || null;
}

// توافق رجعي: بعض الاستدعاءات القديمة كانت تمرّر sb كوسيط أول
function resolveCityName(arg1, arg2) {
  return typeof arg1 === "string" || arg2 === undefined ? arg1 : arg2;
}

function resolveDistrictId(arg1, arg2) {
  return (typeof arg1 === "string" || typeof arg1 === "number" || arg2 === undefined) ? arg1 : arg2;
}

export async function getDistricts(arg1, arg2) {
  const cityName = normalizeText(resolveCityName(arg1, arg2));
  if (!cityName) return [];

  const cache = await loadLocationCache();
  return cache.districtsByCity?.[cityName] || [];
}

export async function getAllDistricts() {
  const cache = await loadLocationCache();
  return cache.allDistricts || [];
}

export async function getAllDistrictNames() {
  const rows = await getAllDistricts();
  return [...new Set(rows.map((row) => row.name).filter(Boolean))];
}

export async function getDistrictByName(name, cityName = "") {
  const normalizedName = normalizeText(name);
  const normalizedCity = normalizeText(cityName);
  if (!normalizedName) return null;

  const cache = await loadLocationCache();

  if (normalizedCity && cache.districtsByCity?.[normalizedCity]) {
    const local = cache.districtsByCity[normalizedCity].find((d) => d.name === normalizedName);
    if (local) return local;
  }

  return (cache.allDistricts || []).find((d) => d.name === normalizedName) || null;
}

export async function getDistrictsGroupedByCity() {
  const cache = await loadLocationCache();
  const result = {};
  Object.entries(cache.districtsByCity || {}).forEach(([cityName, rows]) => {
    result[cityName] = (rows || []).map((row) => row.name).filter(Boolean);
  });
  return result;
}

export async function getVillages(arg1, arg2) {
  const districtId = resolveDistrictId(arg1, arg2);
  if (!districtId) return [];

  const allVillages = loadEnvelope(KEY_VILLAGES, DAY_MS) || {};
  if (allVillages[districtId]) return allVillages[districtId];

  const sb = getSupabase();
  if (!sb) return [];

  const { data, error } = await sb
    .from("villages")
    .select("id,name,lat,lng,district_id")
    .eq("district_id", districtId)
    .order("sort_order");

  if (error) throw error;

  const result = (data || [])
    .map((row) => ({
      id: row?.id ?? null,
      name: normalizeText(row?.name),
      district_id: row?.district_id ?? districtId,
      lat: toCoord(row?.lat),
      lng: toCoord(row?.lng),
    }))
    .filter((row) => row.name)
    .sort(byArabicName);

  allVillages[districtId] = result;
  saveEnvelope(KEY_VILLAGES, allVillages);
  return result;
}

export async function getVillageNamesByDistrictId(districtId) {
  const rows = await getVillages(districtId);
  return rows.map((row) => row.name).filter(Boolean);
}

export async function getAllGeoCoords(_sbIgnored) {
  if (allCoordsMemory) return allCoordsMemory;

  const cached = loadEnvelope(KEY_ALL_COORDS);
  if (cached) {
    allCoordsMemory = cached;
    return cached;
  }

  if (allCoordsPromise) return allCoordsPromise;

  allCoordsPromise = (async () => {
    const cache = await loadLocationCache();
    const result = { districts: {}, villages: {} };

    (cache.allDistricts || []).forEach((district) => {
      if (district.city_name && district.name && district.lat !== null && district.lng !== null) {
        result.districts[`${district.city_name}|${district.name}`] = [district.lat, district.lng];
      }
    });

    const sb = getSupabase();
    if (sb) {
      const { data } = await sb.from("villages").select("id,name,lat,lng,district_id");
      (data || []).forEach((village) => {
        const district = cache.districtById?.[String(village?.district_id)];
        const villageName = normalizeText(village?.name);
        const lat = toCoord(village?.lat);
        const lng = toCoord(village?.lng);
        if (!district || !villageName || lat === null || lng === null) return;
        result.villages[`${district.city_name}|${district.name}|${villageName}`] = [lat, lng];
      });
    }

    allCoordsMemory = result;
    saveEnvelope(KEY_ALL_COORDS, result);
    return result;
  })().finally(() => {
    allCoordsPromise = null;
  });

  return allCoordsPromise;
}
