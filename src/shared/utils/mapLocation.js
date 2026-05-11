// mapLocation.js
// دوال موحدة لحساب نقطة العرض على الخريطة.
// lat/lng = الموقع الحقيقي إذا اختاره المستخدم.
// map_lat/map_lng = النقطة التي تستخدمها الخريطة دائماً، سواء كانت دقيقة أو تقريبية.

export const CITY_COORDS = {
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
  "ريف دمشق": [33.55, 36.4],
};

export function normalizeMapText(value) {
  return String(value ?? "").trim();
}

export function toMapCoord(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function hasMapCoords(lat, lng) {
  return toMapCoord(lat) !== null && toMapCoord(lng) !== null;
}

export function buildDistrictGeoKey(city, district) {
  const c = normalizeMapText(city);
  const d = normalizeMapText(district);
  return c && d ? `${c}|${d}` : null;
}

export function buildVillageGeoKey(city, district, village) {
  const c = normalizeMapText(city);
  const d = normalizeMapText(district);
  const v = normalizeMapText(village);
  return c && d && v ? `${c}|${d}|${v}` : null;
}

function readCoordPair(pair) {
  if (!Array.isArray(pair)) return null;
  const lat = toMapCoord(pair[0]);
  const lng = toMapCoord(pair[1]);
  if (lat === null || lng === null) return null;
  return { lat, lng };
}

export function resolveApproxMapPoint({ city, district, village, geoCoords = {} } = {}) {
  const cityName = normalizeMapText(city);
  const districtName = normalizeMapText(district);
  const villageName = normalizeMapText(village);

  const villageKey = buildVillageGeoKey(cityName, districtName, villageName);
  const villageCoords = villageKey ? readCoordPair(geoCoords?.villages?.[villageKey]) : null;
  if (villageCoords) {
    return {
      map_lat: villageCoords.lat,
      map_lng: villageCoords.lng,
      location_accuracy: "approx",
      geo_source: "village",
    };
  }

  const districtKey = buildDistrictGeoKey(cityName, districtName);
  const districtCoords = districtKey ? readCoordPair(geoCoords?.districts?.[districtKey]) : null;
  if (districtCoords) {
    return {
      map_lat: districtCoords.lat,
      map_lng: districtCoords.lng,
      location_accuracy: "approx",
      geo_source: "district",
    };
  }

  const cityCoords = readCoordPair(CITY_COORDS[cityName]);
  if (cityCoords) {
    return {
      map_lat: cityCoords.lat,
      map_lng: cityCoords.lng,
      location_accuracy: "approx",
      geo_source: "city",
    };
  }

  return {
    map_lat: null,
    map_lng: null,
    location_accuracy: "approx",
    geo_source: null,
  };
}

export function resolveMapLocation({ lat, lng, city, district, village, geoCoords = {} } = {}) {
  const exactLat = toMapCoord(lat);
  const exactLng = toMapCoord(lng);

  if (exactLat !== null && exactLng !== null) {
    return {
      map_lat: exactLat,
      map_lng: exactLng,
      location_accuracy: "exact",
      geo_source: "user",
    };
  }

  return resolveApproxMapPoint({ city, district, village, geoCoords });
}

export function getListingMapPoint(row, geoCoords = {}) {
  if (!row) return null;

  const mapLat = toMapCoord(row.map_lat);
  const mapLng = toMapCoord(row.map_lng);
  if (mapLat !== null && mapLng !== null) {
    return {
      lat: mapLat,
      lng: mapLng,
      accuracy: row.location_accuracy === "exact" ? "exact" : "approx",
      source: row.geo_source || (row.location_accuracy === "exact" ? "user" : null),
    };
  }

  const exactLat = toMapCoord(row.lat);
  const exactLng = toMapCoord(row.lng);
  if (exactLat !== null && exactLng !== null) {
    return {
      lat: exactLat,
      lng: exactLng,
      accuracy: row.location_accuracy === "approx" ? "approx" : "exact",
      source: row.geo_source || (row.location_accuracy === "approx" ? null : "user"),
    };
  }

  const approx = resolveApproxMapPoint({
    city: row.city,
    district: row.district,
    village: row.village,
    geoCoords,
  });

  if (approx.map_lat === null || approx.map_lng === null) return null;
  return {
    lat: approx.map_lat,
    lng: approx.map_lng,
    accuracy: "approx",
    source: approx.geo_source,
  };
}

export function resolveListingMapMeta(item, geoCoords = {}) {
  const city = normalizeMapText(item?.city);
  const district = normalizeMapText(item?.district);
  const village = normalizeMapText(item?.village);
  const label = village || district || city || "الموقع";

  const point = getListingMapPoint(item, geoCoords);

  if (!point) {
    const fallback = readCoordPair(CITY_COORDS[city]) || { lat: 33.51, lng: 36.29 };

    return {
      lat: fallback.lat,
      lng: fallback.lng,
      isApprox: true,
      accuracy: "approx",
      source: city ? "city" : "fallback",
      label,
      hasRealCoords: false,
    };
  }

  const accuracy = point.accuracy === "exact" ? "exact" : "approx";

  return {
    lat: point.lat,
    lng: point.lng,
    isApprox: accuracy !== "exact",
    accuracy,
    source: point.source || (accuracy === "exact" ? "user" : "district"),
    label,
    hasRealCoords: accuracy === "exact",
  };
}
