/**
 * adService.js
 * طبقة البيانات للإعلانات المدفوعة
 */

import { getSupabase } from "../../shared/services/supabaseClient.js";
import { removeListingImageUrls, uploadToListingImages } from "./mediaService.js";

export async function incrementAdViews(adId, currentViews = 0) {
  if (!adId) return;

  const sb = getSupabase();
  if (!sb) return;

  return sb
    .from("ads")
    .update({ views: (currentViews || 0) + 1 })
    .eq("id", adId);
}

export async function fetchAdUniqueClicksCount(adId) {
  if (!adId) return 0;

  const sb = getSupabase();
  if (!sb) return 0;

  const { count } = await sb
    .from("ad_clicks")
    .select("*", { count: "exact", head: true })
    .eq("ad_id", adId);

  return count || 0;
}

export async function recordAdClick(adId, userId) {
  if (!adId || !userId) return;

  const sb = getSupabase();
  if (!sb) return;

  return sb
    .from("ad_clicks")
    .upsert(
      { ad_id: adId, user_id: userId },
      { onConflict: "ad_id,user_id", ignoreDuplicates: true }
    );
}

export async function fetchMyAds(userId) {
  if (!userId) return [];

  const sb = getSupabase();

  const { data } = await sb
    .from("ads")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return data || [];
}

export async function checkAdCode(code) {
  if (!code) return null;

  const sb = getSupabase();

  const { data } = await sb
    .from("ad_codes")
    .select("*")
    .eq("code", code.trim().toUpperCase())
    .eq("used", false)
    .single();

  return data || null;
}

export async function uploadAdImage(userId, file) {
  if (!userId || !file) return null;

  const ext = file.name.split(".").pop();
  const path = `ads/${userId}/${Date.now()}_${Math.random()
    .toString(36)
    .slice(2)}.${ext}`;

  return uploadToListingImages(path, file);
}

export async function uploadAdImages(userId, files = []) {
  const urls = [];

  for (const file of files) {
    const publicUrl = await uploadAdImage(userId, file);
    if (publicUrl) urls.push(publicUrl);
  }

  return urls;
}

export async function createFeaturedAdRequest(userId, form, previewImgs = [], codeData = null) {
  const sb = getSupabase();

  const adUrls = [form.image, ...previewImgs].filter(Boolean);

  const { data, error } = await sb
    .from("ads")
    .insert({
      user_id: userId,
      title: form.title,
      description: form.description,
      category: form.category,
      city: form.city,
      phone: form.phone,
      image_url: form.image,
      images: previewImgs.filter(u => u !== form.image),
      duration_days: codeData?.duration_days ?? form.duration_days,
      card_size: codeData?.card_size ?? form.card_size,
      status: "pending",
      active: false,
      views: 0
    })
    .select("id")
    .single();

  if (error) {
    await removeListingImageUrls(adUrls).catch(() => {});
    throw error;
  }

  return data;
}

export async function markAdCodeUsed(codeId, userId) {
  if (!codeId) return;

  const sb = getSupabase();

  await sb
    .from("ad_codes")
    .update({
      used: true,
      used_by: userId,
      used_at: new Date().toISOString()
    })
    .eq("id", codeId);
}

export async function fetchActiveAds() {
  const sb = getSupabase();

  const today = new Date().toISOString().split("T")[0];

  const { data } = await sb
    .from("ads")
    .select("*")
    .eq("active", true)
    .or(`ends_at.is.null,ends_at.gte.${today}`)
    .order("created_at", { ascending: false });

  return data || [];
}
