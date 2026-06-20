import { adminGet, adminPatch, adminPost } from "./adminApi.js";

function text(value) {
  return String(value || "").trim();
}

function nullableText(value) {
  return text(value) || null;
}

function coordinate(value) {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function integer(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.trunc(number) : 0;
}

export async function fetchLocationsAdminData() {
  const [cities, districts, villages] = await Promise.all([
    adminGet(
      "/rest/v1/cities?select=id,name,sort_order&order=sort_order.asc,name.asc",
      []
    ),
    adminGet(
      "/rest/v1/districts?select=id,name,city_id,lat,lng,sort_order,is_restricted,restriction_reason&order=sort_order.asc,name.asc",
      []
    ),
    adminGet(
      "/rest/v1/villages?select=id,name,district_id,lat,lng,sort_order,is_restricted,restriction_reason&order=sort_order.asc,name.asc",
      []
    ),
  ]);

  return {
    cities: Array.isArray(cities) ? cities : [],
    districts: Array.isArray(districts) ? districts : [],
    villages: Array.isArray(villages) ? villages : [],
  };
}

export async function saveCity({ id = null, name, sortOrder = 0 }) {
  const payload = {
    name: text(name),
    sort_order: integer(sortOrder),
  };

  if (id) {
    await adminPatch(`/rest/v1/cities?id=eq.${encodeURIComponent(id)}`, payload);
    return id;
  }

  await adminPost("/rest/v1/cities", payload);
  return null;
}

export async function saveDistrict({
  id = null,
  name,
  cityId,
  lat = null,
  lng = null,
  sortOrder = 0,
  isRestricted = false,
  reason = "",
}) {
  const payload = {
    name: text(name),
    city_id: cityId,
    lat: coordinate(lat),
    lng: coordinate(lng),
    sort_order: integer(sortOrder),
    is_restricted: Boolean(isRestricted),
    restriction_reason: isRestricted ? nullableText(reason) : null,
  };

  if (id) {
    await adminPatch(`/rest/v1/districts?id=eq.${encodeURIComponent(id)}`, payload);
    return id;
  }

  await adminPost("/rest/v1/districts", payload);
  return null;
}

export async function saveVillage({
  id = null,
  name,
  districtId,
  lat = null,
  lng = null,
  sortOrder = 0,
  isRestricted = false,
  reason = "",
}) {
  const payload = {
    name: text(name),
    district_id: districtId,
    lat: coordinate(lat),
    lng: coordinate(lng),
    sort_order: integer(sortOrder),
    is_restricted: Boolean(isRestricted),
    restriction_reason: isRestricted ? nullableText(reason) : null,
  };

  if (id) {
    await adminPatch(`/rest/v1/villages?id=eq.${encodeURIComponent(id)}`, payload);
    return id;
  }

  await adminPost("/rest/v1/villages", payload);
  return null;
}

export function updateDistrictRestriction(id, isRestricted, reason = "") {
  return adminPatch(`/rest/v1/districts?id=eq.${encodeURIComponent(id)}`, {
    is_restricted: Boolean(isRestricted),
    restriction_reason: isRestricted ? nullableText(reason) : null,
  });
}

export function updateVillageRestriction(id, isRestricted, reason = "") {
  return adminPatch(`/rest/v1/villages?id=eq.${encodeURIComponent(id)}`, {
    is_restricted: Boolean(isRestricted),
    restriction_reason: isRestricted ? nullableText(reason) : null,
  });
}
