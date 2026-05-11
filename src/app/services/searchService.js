/**
 * searchService.js
 * طبقة البيانات للبحث الذكي عن الإعلانات
 */

import { getSupabase } from "../../shared/services/supabaseClient.js";
import { getAllDistrictNames as getAllCachedDistrictNames } from "./geoCache.js";

/**
 * بناء استعلام Supabase بالفلاتر التي يمكن تطبيقها على مستوى الخادم
 * (الفلاتر النصية المعقدة تُطبَّق لاحقاً على مستوى العميل في الصفحة)
 */
function applyServerFilters(qb, pq) {
  let q = qb;
  // OR للفئات — Supabase يدعم in()
  if (pq.categories?.length === 1) q = q.eq("category", pq.categories[0]);
  else if (pq.categories?.length > 1) q = q.in("category", pq.categories);
  if (pq.listingType) q = q.eq("type", pq.listingType);
  if (pq.city)     q = q.ilike("city", `%${pq.city}%`);
  if (pq.district) q = q.ilike("district", `%${pq.district}%`);
  if (pq.area.min != null)  q = q.gte("total_area", pq.area.min);
  if (pq.area.max != null)  q = q.lte("total_area", pq.area.max);
  if (pq.rooms.min != null) q = q.gte("rooms", pq.rooms.min);
  if (pq.rooms.max != null) q = q.lte("rooms", pq.rooms.max);
  if (pq.price.min != null) q = q.gte("price", pq.price.min);
  if (pq.price.max != null) q = q.lte("price", pq.price.max);
  for (const f of ["elevator", "parking", "pool", "solar"]) {
    if (pq.features?.[f]) q = q.eq(f, true);
    if (pq.excludedFeatures?.[f]) q = q.eq(f, false);
  }
  if (pq.phoneQuery) q = q.ilike("phone", `%${pq.phoneQuery}%`);
  return q;
}

/**
 * بحث الإعلانات النشطة مع تطبيق الفلاتر القابلة للتنفيذ على الخادم
 * يُرجع نتائج خام على دفعات صغيرة؛ التصنيف والتصفية النصية تتم في الواجهة
 */
export async function searchListings(parsedQuery, options = {}) {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase not ready");

  const limit = Math.min(Number(options.limit) || 60, 100);
  const offset = Math.max(Number(options.offset) || 0, 0);

  let query = sb
    .from("listings")
    .select("*, profiles(id,name,verified,account_type,phone), listing_images(url,is_main)")
    .eq("status", "active")
    .eq("admin_status", "approved")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  query = applyServerFilters(query, parsedQuery);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/**
 * جلب أسماء كل الأحياء (موحَّدة بدون تكرار) لاستخدامها في كشف الحي من نص البحث
 */
export async function getAllDistrictNames() {
  try {
    return await getAllCachedDistrictNames();
  } catch {
    return [];
  }
}
