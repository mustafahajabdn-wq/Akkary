/**
 * locationService.js
 * واجهة توافقية قديمة فقط.
 * المصدر الحقيقي للمدن/الأحياء/القرى هو geoCache.js.
 */

import {
  getAllGeoCoords,
  getCities,
  getCityByName,
  getCityNames,
  getDistrictByName,
  getDistricts,
  getVillages,
  getVillageNamesByDistrictId,
} from "./geoCache.js";

export async function fetchCityNames() {
  return getCityNames();
}

export async function fetchCityByName(name) {
  return getCityByName(name);
}

export async function fetchDistrictsByCityId(cityId) {
  if (!cityId) return [];
  const cities = await getCities();
  const city = (cities || []).find((row) => String(row.id) === String(cityId));
  if (!city?.name) return [];
  return getDistricts(city.name);
}

export async function fetchVillagesByDistrictId(districtId) {
  return getVillages(districtId);
}

export async function fetchDistrictByName(name) {
  return getDistrictByName(name);
}

export async function fetchCities() {
  return getCities();
}

export async function fetchVillageNamesByDistrictId(districtId) {
  return getVillageNamesByDistrictId(districtId);
}

export async function fetchGeoCoordsBundle() {
  return getAllGeoCoords();
}
