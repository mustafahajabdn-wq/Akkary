const CITY_COORDS = {
  "دمشق": [33.5138, 36.2765],
  "حلب": [36.2021, 37.1343],
  "حمص": [34.7324, 36.7137],
  "اللاذقية": [35.5317, 35.7917],
  "طرطوس": [34.8891, 35.8866],
  "حماة": [35.1333, 36.75],
  "دير الزور": [35.3361, 40.1406],
  "الرقة": [35.95, 39.0],
  "إدلب": [35.9306, 36.6339],
  "السويداء": [32.7089, 36.5672],
  "درعا": [32.6189, 36.1021],
  "القنيطرة": [33.1264, 35.8244],
  "ريف دمشق": [33.55, 36.4]
};
const APPROX_VILLAGE_RADIUS_M = 450;
const APPROX_DISTRICT_RADIUS_M = 700;
const APPROX_CITY_RADIUS_M = 1200;
const normalizeText = v => String(v ?? "").trim();
const toCoord = v => v === null || v === undefined || v === "" ? NaN : Number(v);
const hasCoords = (lat, lng) => Number.isFinite(lat) && Number.isFinite(lng);
const buildDistrictKey = (city, district) => {
  const c = normalizeText(city),
    d = normalizeText(district);
  return c && d ? `${c}|${d}` : null;
};
const buildVillageKey = (city, district, village) => {
  const c = normalizeText(city),
    d = normalizeText(district),
    v = normalizeText(village);
  return c && d && v ? `${c}|${d}|${v}` : null;
};
const distM = (lat1, lng1, lat2, lng2) => {
  const R = 6371e3,
    toRad = d => d * Math.PI / 180,
    dLat = toRad(lat2 - lat1),
    dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
};
export function resolveDetailMapMeta(item, geo) {
  if (!item) return {
    lat: 33.51,
    lng: 36.29,
    isApprox: true,
    label: "الموقع",
    hasRealCoords: false
  };
  const city = normalizeText(item.city),
    district = normalizeText(item.district),
    village = normalizeText(item.village);
  const rawLat = toCoord(item.lat),
    rawLng = toCoord(item.lng),
    hasRealCoords = hasCoords(rawLat, rawLng);
  const districtKey = buildDistrictKey(city, district),
    villageKey = buildVillageKey(city, district, village);
  const label = village || district || city || "الموقع";
  if (hasRealCoords) {
    if (villageKey) {
      const vCoords = geo?.villages?.[villageKey];
      if (Array.isArray(vCoords) && hasCoords(Number(vCoords[0]), Number(vCoords[1])) && distM(rawLat, rawLng, Number(vCoords[0]), Number(vCoords[1])) <= APPROX_VILLAGE_RADIUS_M) return {
        lat: rawLat,
        lng: rawLng,
        isApprox: true,
        label,
        hasRealCoords: true
      };
    }
    if (!villageKey && districtKey) {
      const dCoords = geo?.districts?.[districtKey];
      if (Array.isArray(dCoords) && hasCoords(Number(dCoords[0]), Number(dCoords[1])) && distM(rawLat, rawLng, Number(dCoords[0]), Number(dCoords[1])) <= APPROX_DISTRICT_RADIUS_M) return {
        lat: rawLat,
        lng: rawLng,
        isApprox: true,
        label,
        hasRealCoords: true
      };
    }
    if (!villageKey && !districtKey) {
      const cc = CITY_COORDS[city];
      if (Array.isArray(cc) && hasCoords(Number(cc[0]), Number(cc[1])) && distM(rawLat, rawLng, Number(cc[0]), Number(cc[1])) <= APPROX_CITY_RADIUS_M) return {
        lat: rawLat,
        lng: rawLng,
        isApprox: true,
        label,
        hasRealCoords: true
      };
    }
    return {
      lat: rawLat,
      lng: rawLng,
      isApprox: false,
      label,
      hasRealCoords: true
    };
  }
  const fromVillage = villageKey && geo?.villages?.[villageKey];
  if (Array.isArray(fromVillage) && hasCoords(Number(fromVillage[0]), Number(fromVillage[1]))) return {
    lat: Number(fromVillage[0]),
    lng: Number(fromVillage[1]),
    isApprox: true,
    label,
    hasRealCoords: false
  };
  const fromDistrict = districtKey && geo?.districts?.[districtKey];
  if (Array.isArray(fromDistrict) && hasCoords(Number(fromDistrict[0]), Number(fromDistrict[1]))) return {
    lat: Number(fromDistrict[0]),
    lng: Number(fromDistrict[1]),
    isApprox: true,
    label,
    hasRealCoords: false
  };
  const fromCity = CITY_COORDS[city];
  if (Array.isArray(fromCity) && hasCoords(Number(fromCity[0]), Number(fromCity[1]))) return {
    lat: Number(fromCity[0]),
    lng: Number(fromCity[1]),
    isApprox: true,
    label,
    hasRealCoords: false
  };
  return {
    lat: 33.51,
    lng: 36.29,
    isApprox: true,
    label: city || "الموقع",
    hasRealCoords: false
  };
}
const safeSupabaseCall = operation => Promise.resolve(operation).catch(() => null);
export const reportStorageKey = (userId, itemType, itemId) => userId && itemId ? `report_sent:${userId}:${itemType}:${itemId}` : "";
