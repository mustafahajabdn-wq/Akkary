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

function firstRow(value) {
  return Array.isArray(value) ? value[0] || null : null;
}

function hasChanged(previousValue, nextValue) {
  return text(previousValue) !== text(nextValue);
}

function buildEqQuery(filters = {}) {
  const parts = Object.entries(filters)
    .filter(([, value]) => text(value))
    .map(([key, value]) => `${encodeURIComponent(key)}=eq.${encodeURIComponent(text(value))}`);

  return parts.join("&");
}

async function patchMatchingListings(filters, payload) {
  const entries = Object.entries(filters).filter(([, value]) => text(value));
  if (entries.length !== Object.keys(filters).length || !entries.length) return;

  const query = buildEqQuery(filters);
  if (!query) return;

  await adminPatch(`/rest/v1/listings?${query}`, payload);
}

async function fetchCityById(id) {
  if (!id) return null;
  const rows = await adminGet(
    `/rest/v1/cities?id=eq.${encodeURIComponent(id)}&select=id,name`,
    []
  );
  return firstRow(rows);
}

async function fetchDistrictById(id) {
  if (!id) return null;
  const rows = await adminGet(
    `/rest/v1/districts?id=eq.${encodeURIComponent(id)}&select=id,name,city_id`,
    []
  );
  return firstRow(rows);
}

async function fetchVillageById(id) {
  if (!id) return null;
  const rows = await adminGet(
    `/rest/v1/villages?id=eq.${encodeURIComponent(id)}&select=id,name,district_id`,
    []
  );
  return firstRow(rows);
}

async function fetchDistrictContext(id) {
  const district = await fetchDistrictById(id);
  if (!district) return null;
  const city = await fetchCityById(district.city_id);
  return {
    district,
    city,
  };
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
    const previous = await fetchCityById(id);
    await adminPatch(`/rest/v1/cities?id=eq.${encodeURIComponent(id)}`, payload);

    if (previous?.name && hasChanged(previous.name, payload.name)) {
      await patchMatchingListings(
        { city: previous.name },
        { city: payload.name }
      );
    }

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
    const previousContext = await fetchDistrictContext(id);
    const nextCity = await fetchCityById(cityId);

    await adminPatch(`/rest/v1/districts?id=eq.${encodeURIComponent(id)}`, payload);

    const previousDistrict = previousContext?.district;
    const previousCity = previousContext?.city;
    const locationChanged =
      hasChanged(previousDistrict?.name, payload.name) ||
      String(previousDistrict?.city_id || "") !== String(cityId || "");

    if (locationChanged && previousCity?.name && previousDistrict?.name && nextCity?.name) {
      await patchMatchingListings(
        {
          city: previousCity.name,
          district: previousDistrict.name,
        },
        {
          city: nextCity.name,
          district: payload.name,
        }
      );
    }

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
    const previousVillage = await fetchVillageById(id);
    const previousContext = await fetchDistrictContext(previousVillage?.district_id);
    const nextContext = await fetchDistrictContext(districtId);

    await adminPatch(`/rest/v1/villages?id=eq.${encodeURIComponent(id)}`, payload);

    const parentChanged = String(previousVillage?.district_id || "") !== String(districtId || "");
    const locationChanged = hasChanged(previousVillage?.name, payload.name) || parentChanged;

    if (
      locationChanged &&
      previousVillage?.name &&
      previousContext?.city?.name &&
      previousContext?.district?.name &&
      nextContext?.city?.name &&
      nextContext?.district?.name
    ) {
      await patchMatchingListings(
        {
          city: previousContext.city.name,
          district: previousContext.district.name,
          village: previousVillage.name,
        },
        {
          city: nextContext.city.name,
          district: nextContext.district.name,
          village: payload.name,
        }
      );
    }

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
