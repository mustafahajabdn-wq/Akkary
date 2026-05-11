import { getSupabase } from "../../shared/services/supabaseClient.js";
import { updateProfile } from "./profileService.js";

const LISTING_IMAGES_BUCKET = "listing-images";
const SAFE_STORAGE_PATH = /^[\w./-]+$/;

export function extractListingStoragePath(value) {
  if (!value) return null;

  const raw = String(value).trim();
  if (!raw) return null;

  try {
    const parsed = new URL(raw);
    const path = parsed.pathname;

    const publicMarker = `/storage/v1/object/public/${LISTING_IMAGES_BUCKET}/`;
    const signedMarker = `/storage/v1/object/sign/${LISTING_IMAGES_BUCKET}/`;

    let bucketPath = null;

    if (path.includes(publicMarker)) {
      bucketPath = path.slice(path.indexOf(publicMarker) + publicMarker.length);
    } else if (path.includes(signedMarker)) {
      bucketPath = path.slice(path.indexOf(signedMarker) + signedMarker.length);
    }

    if (!bucketPath) return null;

    const clean = decodeURIComponent(bucketPath)
      .split("?")[0]
      .split("#")[0]
      .replace(/^\/+/, "");

    if (
      !clean ||
      clean.includes("..") ||
      clean.includes("\\") ||
      !SAFE_STORAGE_PATH.test(clean)
    ) {
      return null;
    }

    return clean;
  } catch {
    const clean = raw
      .split("?")[0]
      .split("#")[0]
      .replace(/^\/+/, "");

    if (
      !clean ||
      clean.includes("..") ||
      clean.includes("\\") ||
      !SAFE_STORAGE_PATH.test(clean)
    ) {
      return null;
    }

    return clean;
  }
}

export const extractListingImagePath = extractListingStoragePath;

function uniqueCleanPaths(paths = []) {
  return [
    ...new Set(
      (Array.isArray(paths) ? paths : [])
        .map(path => String(path || "").trim().replace(/^\/+/, ""))
        .filter(
          path =>
            path &&
            !path.includes("..") &&
            !path.includes("\\") &&
            SAFE_STORAGE_PATH.test(path)
        )
    )
  ];
}

function chunk(arr, size) {
  const out = [];

  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }

  return out;
}

export function extractListingImagePaths(values = []) {
  return uniqueCleanPaths(
    (Array.isArray(values) ? values : [])
      .map(extractListingStoragePath)
      .filter(Boolean)
  );
}

export async function uploadToListingImages(path, file, options = {}) {
  const sb = getSupabase();

  if (!sb || !path || !file) return null;

  const { error } = await sb
    .storage
    .from(LISTING_IMAGES_BUCKET)
    .upload(path, file, {
      upsert: true,
      ...options
    });

  if (error) throw error;

  const { data } = sb
    .storage
    .from(LISTING_IMAGES_BUCKET)
    .getPublicUrl(path);

  return data?.publicUrl || null;
}

function getListingImagePublicUrl(path) {
  const sb = getSupabase();

  if (!sb || !path) return null;

  const { data } = sb
    .storage
    .from(LISTING_IMAGES_BUCKET)
    .getPublicUrl(path);

  return data?.publicUrl || null;
}

export async function removeListingImagePaths(paths = []) {
  const clean = uniqueCleanPaths(paths);

  if (!clean.length) {
    return {
      removed: 0,
      paths: []
    };
  }

  const sb = getSupabase();
  if (!sb) throw new Error("Supabase client unavailable");

  let removed = 0;
  const removedData = [];

  for (const batch of chunk(clean, 50)) {
    const { data, error } = await sb
      .storage
      .from(LISTING_IMAGES_BUCKET)
      .remove(batch);

    if (error) {
      console.error("Storage delete failed:", error, batch);
      throw error;
    }

    removed += data?.length || batch.length;
    removedData.push(...(Array.isArray(data) ? data : []));
  }

  return {
    removed,
    paths: clean,
    data: removedData
  };
}

export async function removeListingImageUrls(urls = []) {
  const paths = extractListingImagePaths(urls);
  return removeListingImagePaths(paths);
}

export async function removeListingMediaUrls(urls = []) {
  return removeListingImageUrls(urls);
}

export async function uploadProfileImage(
  userId,
  file,
  type = "avatar",
  contentType = "image/jpeg"
) {
  if (!userId || !file) return null;

  const sb = getSupabase();
  if (!sb) return null;

  const field = type === "avatar" ? "avatar_url" : "cover_url";

  const { data: oldProfile } = await sb
    .from("profiles")
    .select(field)
    .eq("id", userId)
    .maybeSingle();

  const oldUrl = oldProfile?.[field] || null;
  const path = `profiles/${userId}/${type}_${Date.now()}.jpg`;

  const publicUrl = await uploadToListingImages(path, file, {
    contentType
  });

  const { error } = await updateProfile(userId, {
    [field]: publicUrl
  });

  if (error) {
    await removeListingImageUrls([publicUrl]).catch(() => {});
    throw error;
  }

  if (oldUrl && oldUrl !== publicUrl) {
    await removeListingImageUrls([oldUrl]).catch(error => {
      console.warn("failed to remove old profile image", error);
    });
  }

  return publicUrl;
}

export async function deleteProfileImage(userId, type = "avatar") {
  if (!userId) throw new Error("معرّف المستخدم غير موجود");

  const sb = getSupabase();
  if (!sb) throw new Error("Supabase client unavailable");

  const field = type === "avatar" ? "avatar_url" : "cover_url";

  const { data: oldProfile, error: fetchError } = await sb
    .from("profiles")
    .select(field)
    .eq("id", userId)
    .maybeSingle();

  if (fetchError) throw fetchError;

  const oldUrl = oldProfile?.[field] || null;

  if (!oldUrl) {
    return {
      ok: true,
      deleted: false,
      reason: "no_old_image"
    };
  }

  const { error: updateError } = await updateProfile(userId, {
    [field]: null
  });

  if (updateError) throw updateError;

  await removeListingImageUrls([oldUrl]).catch(error => {
    console.warn("failed to remove deleted profile image", error);
  });

  return {
    ok: true,
    deleted: true,
    field,
    oldUrl
  };
}

async function uploadListingFileViaRest(
  path,
  file,
  accessToken,
  contentType = "application/octet-stream"
) {
  if (!path || !file || !accessToken) {
    throw new Error("Missing upload parameters");
  }

  const sb = getSupabase();
  const supabaseUrl =
    sb?.supabaseUrl ||
    (typeof window !== "undefined" ? window?.__SUPABASE_URL__ : null);

  const baseUrl = supabaseUrl || "https://tskjbzlnbldoxatpcaxi.supabase.co";

  const res = await fetch(
    `${baseUrl}/storage/v1/object/${LISTING_IMAGES_BUCKET}/${path}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": contentType,
        "x-upsert": "true"
      },
      body: file
    }
  );

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || `HTTP ${res.status}`);
  }

  return getListingImagePublicUrl(path);
}

export async function uploadListingFileWithFallback(
  path,
  file,
  {
    contentType = "application/octet-stream",
    cacheControl,
    accessToken
  } = {}
) {
  try {
    return await uploadToListingImages(path, file, {
      contentType,
      cacheControl,
      upsert: true
    });
  } catch (error) {
    if (!accessToken) throw error;
    return uploadListingFileViaRest(path, file, accessToken, contentType);
  }
}
