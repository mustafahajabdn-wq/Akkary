import { getSupabase } from "./supabaseClient.js";
import { fetchCachedPropertyTypes, fetchCachedPropertyTypeByName } from "./appConfigService.js";
export { fetchAppSettings, fetchAppSetting } from "./appConfigService.js";

export async function fetchPropertyTypes(select = "*", options = {}) {
  return fetchCachedPropertyTypes(select, options);
}

export async function fetchPropertyTypeByName(name, options = {}) {
  return fetchCachedPropertyTypeByName(name, options);
}

export async function fetchPropertyFields(select = "*") {
  const sb = getSupabase();
  const { data } = await sb.from("property_fields").select(select).order("sort_order");
  return data || [];
}

export async function fetchPropertyFieldsForTypeName(typeName, select = "field_key,label,field_type,section") {
  const typeRow = await fetchPropertyTypeByName(typeName);
  if (!typeRow?.id) return [];
  const sb = getSupabase();
  const { data } = await sb
    .from("property_fields")
    .select(select)
    .eq("type_id", typeRow.id)
    .order("sort_order");
  return data || [];
}

export async function fetchPropertyFieldOptions(keys = []) {
  if (!keys?.length) return [];
  const sb = getSupabase();
  const { data } = await sb.from("property_fields").select("field_key,options").in("field_key", keys);
  return data || [];
}

const FALLBACK_LISTING_COLUMNS = [
  "title", "description", "price", "currency", "type", "category", "city", "district", "village",
  "status", "admin_status", "views", "phone", "phone2", "whatsapp", "whatsapp2", "rooms",
  "beds", "floor", "lat", "lng", "location_detail", "extra_fields", "rejection_reason", "sort_order",
  "expires_at", "external_url", "total_area", "net_area", "land_area", "build_area", "baths",
  "total_floors", "ownership", "furnished", "finishing", "condition", "heating", "kitchen",
  "elevator", "parking", "compound", "balconies", "pool", "solar", "facing_dir", "video_url",
  "total_units", "facade", "ceil_height", "truck_access", "light_score", "salle"
];

export async function fetchListingsSampleColumns() {
  const sb = getSupabase();

  try {
    const { data, error } = await sb.rpc("get_listings_columns");
    if (!error && Array.isArray(data) && data.length > 0) {
      const cols = data
        .map((item) => (typeof item === "string" ? item : item?.key))
        .filter(Boolean);
      if (cols.length > 0) return [...new Set(cols)];
    }
  } catch {}

  try {
    const { data, error } = await sb.from("listings").select("*").limit(1);
    if (!error && data?.[0]) return Object.keys(data[0]);
  } catch {}

  return FALLBACK_LISTING_COLUMNS;
}
