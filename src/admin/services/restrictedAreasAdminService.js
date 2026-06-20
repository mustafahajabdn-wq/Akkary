import {
  adminGet,
  adminPatch,
  adminPost,
} from "./adminApi.js";

export async function fetchRestrictedAreasAdminData() {
  const [cities, districts, villages] = await Promise.all([
    adminGet(
      "/rest/v1/cities?select=id,name,sort_order&order=sort_order.asc,name.asc",
      []
    ),
    adminGet(
      "/rest/v1/districts?select=id,name,city_id,sort_order,is_restricted,restriction_reason&order=sort_order.asc,name.asc",
      []
    ),
    adminGet(
      "/rest/v1/villages?select=id,name,district_id,sort_order,is_restricted,restriction_reason&order=sort_order.asc,name.asc",
      []
    ),
  ]);

  return {
    cities: Array.isArray(cities) ? cities : [],
    districts: Array.isArray(districts) ? districts : [],
    villages: Array.isArray(villages) ? villages : [],
  };
}

export async function saveRestrictedDistrict({
  id = null,
  name,
  cityId,
  reason = "",
  isRestricted = true,
  sortOrder = 0,
}) {
  const payload = {
    name: String(name || "").trim(),
    city_id: cityId,
    is_restricted: Boolean(isRestricted),
    restriction_reason: String(reason || "").trim() || null,
  };

  if (id) {
    await adminPatch(
      `/rest/v1/districts?id=eq.${encodeURIComponent(id)}`,
      payload
    );
    return id;
  }

  await adminPost("/rest/v1/districts", {
    ...payload,
    sort_order: Number(sortOrder || 0),
  });

  return null;
}

export async function saveRestrictedVillage({
  id = null,
  name,
  districtId,
  reason = "",
  isRestricted = true,
  sortOrder = 0,
}) {
  const payload = {
    name: String(name || "").trim(),
    district_id: districtId,
    is_restricted: Boolean(isRestricted),
    restriction_reason: String(reason || "").trim() || null,
  };

  if (id) {
    await adminPatch(
      `/rest/v1/villages?id=eq.${encodeURIComponent(id)}`,
      payload
    );
    return id;
  }

  await adminPost("/rest/v1/villages", {
    ...payload,
    sort_order: Number(sortOrder || 0),
  });

  return null;
}

export function setDistrictRestriction(id, isRestricted) {
  return adminPatch(
    `/rest/v1/districts?id=eq.${encodeURIComponent(id)}`,
    {
      is_restricted: Boolean(isRestricted),
    }
  );
}

export function setVillageRestriction(id, isRestricted) {
  return adminPatch(
    `/rest/v1/villages?id=eq.${encodeURIComponent(id)}`,
    {
      is_restricted: Boolean(isRestricted),
    }
  );
}
