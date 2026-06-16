import { getSupabase } from "../../shared/services/supabaseClient.js";
import { updateProfile } from "./profileService.js";

const LISTING_IMAGES_BUCKET = "listing-images";
const SAFE_STORAGE_PATH = /^[\w./-]+$/;

// محفوظ للاستخدام لاحقاً عند الانتقال إلى Cloudflare R2.
// الرفع الحالي يتم إلى Supabase Storage عبر uploadToListingImages.
const R2_PUBLIC_BASE =
  "https://pub-587125c6eea7400b94f07873fcd1899b.r2.dev";

const SUPABASE_FUNCTIONS_URL =
  "https://tskjbzlnbldoxatpcaxi.supabase.co/functions/v1";

/**
 * رفع ملف إلى Cloudflare R2.
 *
 * هذه الدالة محفوظة للاستخدام لاحقاً، لكنها غير مستخدمة حالياً
 * من uploadToListingImages.
 */
export async function uploadToR2(
  file,
  contentType = "image/jpeg"
) {
  if (!file) return null;

  const sb = getSupabase();

  if (!sb) {
    throw new Error("Supabase client unavailable");
  }

  const { data, error } = await sb.functions.invoke(
    "generate-r2-url",
    {
      body: {
        fileName:
          file.name || `image_${Date.now()}.jpg`,
        contentType,
      },
    }
  );

  if (error) {
    console.error("generate-r2-url failed:", error);

    let details =
      error.message || String(error);

    try {
      if (error.context instanceof Response) {
        const responseBody =
          await error.context.clone().text();

        if (responseBody) {
          details += ` — ${responseBody}`;
        }
      }
    } catch {
      // تجاهل فشل قراءة جسم الاستجابة.
    }

    throw new Error(
      `R2 URL generation failed: ${details}`
    );
  }

  const {
    presignedUrl,
    publicUrl,
  } = data || {};

  if (!presignedUrl) {
    throw new Error(
      "R2 URL generation failed: no presignedUrl returned"
    );
  }

  const uploadRes = await fetch(
    presignedUrl,
    {
      method: "PUT",
      headers: {
        "Content-Type": contentType,
      },
      body: file,
    }
  );

  if (!uploadRes.ok) {
    const responseText =
      await uploadRes.text().catch(() => "");

    throw new Error(
      responseText
        ? `R2 upload failed: ${uploadRes.status} — ${responseText}`
        : `R2 upload failed: ${uploadRes.status}`
    );
  }

  if (publicUrl) {
    return publicUrl;
  }

  const objectKey = data?.objectKey;

  if (objectKey && R2_PUBLIC_BASE) {
    return `${R2_PUBLIC_BASE.replace(/\/+$/, "")}/${objectKey}`;
  }

  throw new Error(
    "R2 upload succeeded but no public URL was returned"
  );
}

/**
 * استخراج مسار الملف من رابط Supabase Storage أو من مسار مباشر.
 */
export function extractListingStoragePath(value) {
  if (!value) return null;

  const raw = String(value).trim();

  if (!raw) return null;

  try {
    const parsed = new URL(raw);
    const path = parsed.pathname;

    const publicMarker =
      `/storage/v1/object/public/${LISTING_IMAGES_BUCKET}/`;

    const signedMarker =
      `/storage/v1/object/sign/${LISTING_IMAGES_BUCKET}/`;

    let bucketPath = null;

    if (path.includes(publicMarker)) {
      bucketPath =
        path.slice(
          path.indexOf(publicMarker) +
          publicMarker.length
        );
    } else if (path.includes(signedMarker)) {
      bucketPath =
        path.slice(
          path.indexOf(signedMarker) +
          signedMarker.length
        );
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

export const extractListingImagePath =
  extractListingStoragePath;

function uniqueCleanPaths(paths = []) {
  return [
    ...new Set(
      (Array.isArray(paths) ? paths : [])
        .map(path =>
          String(path || "")
            .trim()
            .replace(/^\/+/, "")
        )
        .filter(
          path =>
            path &&
            !path.includes("..") &&
            !path.includes("\\") &&
            SAFE_STORAGE_PATH.test(path)
        )
    ),
  ];
}

function chunk(arr, size) {
  const out = [];

  for (
    let i = 0;
    i < arr.length;
    i += size
  ) {
    out.push(arr.slice(i, i + size));
  }

  return out;
}

export function extractListingImagePaths(
  values = []
) {
  return uniqueCleanPaths(
    (Array.isArray(values) ? values : [])
      .map(extractListingStoragePath)
      .filter(Boolean)
  );
}

/**
 * الرفع الحالي إلى Supabase Storage.
 *
 * Bucket:
 * listing-images
 *
 * عند الانتقال إلى R2 لاحقاً يمكن تغيير جسم هذه الدالة
 * لاستدعاء uploadToR2 بدلاً من Supabase Storage.
 */
export async function uploadToListingImages(
  path,
  file,
  options = {}
) {
  if (!path || !file) {
    throw new Error(
      "مسار الملف أو الملف غير موجود"
    );
  }

  const sb = getSupabase();

  if (!sb) {
    throw new Error(
      "Supabase client unavailable"
    );
  }

  const cleanPath = String(path)
    .trim()
    .replace(/^\/+/, "");

  if (
    !cleanPath ||
    cleanPath.includes("..") ||
    cleanPath.includes("\\") ||
    !SAFE_STORAGE_PATH.test(cleanPath)
  ) {
    throw new Error(
      "مسار رفع الصورة غير صالح"
    );
  }

  const contentType =
    options.contentType ||
    file.type ||
    "application/octet-stream";

  const cacheControl =
    String(
      options.cacheControl || "3600"
    );

  const upsert =
    options.upsert ?? true;

  const {
    data: uploadData,
    error: uploadError,
  } = await sb.storage
    .from(LISTING_IMAGES_BUCKET)
    .upload(
      cleanPath,
      file,
      {
        contentType,
        cacheControl,
        upsert,
      }
    );

  if (uploadError) {
    console.error(
      "Supabase Storage upload failed:",
      uploadError
    );

    throw new Error(
      `فشل رفع الملف إلى Supabase: ${
        uploadError.message ||
        "خطأ غير معروف"
      }`
    );
  }

  const finalPath =
    uploadData?.path || cleanPath;

  const { data: publicData } =
    sb.storage
      .from(LISTING_IMAGES_BUCKET)
      .getPublicUrl(finalPath);

  const publicUrl =
    publicData?.publicUrl || null;

  if (!publicUrl) {
    throw new Error(
      "تم رفع الملف ولكن تعذر إنشاء رابطه العام"
    );
  }

  return publicUrl;
}

function getListingImagePublicUrl(path) {
  const sb = getSupabase();

  if (!sb || !path) return null;

  const { data } = sb.storage
    .from(LISTING_IMAGES_BUCKET)
    .getPublicUrl(path);

  return data?.publicUrl || null;
}

export async function removeListingImagePaths(
  paths = []
) {
  const clean =
    uniqueCleanPaths(paths);

  if (!clean.length) {
    return {
      removed: 0,
      paths: [],
    };
  }

  const sb = getSupabase();

  if (!sb) {
    throw new Error(
      "Supabase client unavailable"
    );
  }

  let removed = 0;
  const removedData = [];

  for (
    const batch of chunk(clean, 50)
  ) {
    const {
      data,
      error,
    } = await sb.storage
      .from(LISTING_IMAGES_BUCKET)
      .remove(batch);

    if (error) {
      console.error(
        "Storage delete failed:",
        error,
        batch
      );

      throw error;
    }

    removed +=
      data?.length || batch.length;

    removedData.push(
      ...(Array.isArray(data)
        ? data
        : [])
    );
  }

  return {
    removed,
    paths: clean,
    data: removedData,
  };
}

export async function removeListingImageUrls(
  urls = []
) {
  const paths =
    extractListingImagePaths(urls);

  return removeListingImagePaths(
    paths
  );
}

export async function removeListingMediaUrls(
  urls = []
) {
  return removeListingImageUrls(
    urls
  );
}

export async function uploadProfileImage(
  userId,
  file,
  type = "avatar",
  contentType = "image/jpeg"
) {
  if (!userId || !file) {
    return null;
  }

  const sb = getSupabase();

  if (!sb) {
    return null;
  }

  const field =
    type === "avatar"
      ? "avatar_url"
      : "cover_url";

  const {
    data: oldProfile,
  } = await sb
    .from("profiles")
    .select(field)
    .eq("id", userId)
    .maybeSingle();

  const oldUrl =
    oldProfile?.[field] || null;

  const path =
    `profiles/${userId}/` +
    `${type}_${Date.now()}.jpg`;

  const publicUrl =
    await uploadToListingImages(
      path,
      file,
      {
        contentType,
        upsert: true,
      }
    );

  const {
    error,
  } = await updateProfile(
    userId,
    {
      [field]: publicUrl,
    }
  );

  if (error) {
    await removeListingImageUrls(
      [publicUrl]
    ).catch(() => {});

    throw error;
  }

  if (
    oldUrl &&
    oldUrl !== publicUrl
  ) {
    await removeListingImageUrls(
      [oldUrl]
    ).catch(error => {
      console.warn(
        "failed to remove old profile image",
        error
      );
    });
  }

  return publicUrl;
}

export async function deleteProfileImage(
  userId,
  type = "avatar"
) {
  if (!userId) {
    throw new Error(
      "معرّف المستخدم غير موجود"
    );
  }

  const sb = getSupabase();

  if (!sb) {
    throw new Error(
      "Supabase client unavailable"
    );
  }

  const field =
    type === "avatar"
      ? "avatar_url"
      : "cover_url";

  const {
    data: oldProfile,
    error: fetchError,
  } = await sb
    .from("profiles")
    .select(field)
    .eq("id", userId)
    .maybeSingle();

  if (fetchError) {
    throw fetchError;
  }

  const oldUrl =
    oldProfile?.[field] || null;

  if (!oldUrl) {
    return {
      ok: true,
      deleted: false,
      reason: "no_old_image",
    };
  }

  const {
    error: updateError,
  } = await updateProfile(
    userId,
    {
      [field]: null,
    }
  );

  if (updateError) {
    throw updateError;
  }

  await removeListingImageUrls(
    [oldUrl]
  ).catch(error => {
    console.warn(
      "failed to remove deleted profile image",
      error
    );
  });

  return {
    ok: true,
    deleted: true,
    field,
    oldUrl,
  };
}

async function uploadListingFileViaRest(
  path,
  file,
  accessToken,
  contentType =
    "application/octet-stream"
) {
  if (
    !path ||
    !file ||
    !accessToken
  ) {
    throw new Error(
      "Missing upload parameters"
    );
  }

  const sb = getSupabase();

  const supabaseUrl =
    sb?.supabaseUrl ||
    (
      typeof window !== "undefined"
        ? window?.__SUPABASE_URL__
        : null
    );

  const baseUrl =
    supabaseUrl ||
    "https://tskjbzlnbldoxatpcaxi.supabase.co";

  const cleanPath = String(path)
    .trim()
    .replace(/^\/+/, "");

  if (
    !cleanPath ||
    cleanPath.includes("..") ||
    cleanPath.includes("\\") ||
    !SAFE_STORAGE_PATH.test(cleanPath)
  ) {
    throw new Error(
      "مسار رفع الملف غير صالح"
    );
  }

  const res = await fetch(
    `${baseUrl}/storage/v1/object/` +
    `${LISTING_IMAGES_BUCKET}/` +
    `${cleanPath}`,
    {
      method: "POST",
      headers: {
        Authorization:
          `Bearer ${accessToken}`,
        "Content-Type":
          contentType,
        "x-upsert": "true",
      },
      body: file,
    }
  );

  if (!res.ok) {
    const txt =
      await res
        .text()
        .catch(() => "");

    throw new Error(
      txt ||
      `HTTP ${res.status}`
    );
  }

  return getListingImagePublicUrl(
    cleanPath
  );
}

export async function uploadListingFileWithFallback(
  path,
  file,
  {
    contentType =
      "application/octet-stream",
    cacheControl,
    accessToken,
  } = {}
) {
  try {
    return await uploadToListingImages(
      path,
      file,
      {
        contentType,
        cacheControl,
        upsert: true,
      }
    );
  } catch (error) {
    if (!accessToken) {
      throw error;
    }

    console.warn(
      "Supabase SDK upload failed, trying REST fallback:",
      error
    );

    return uploadListingFileViaRest(
      path,
      file,
      accessToken,
      contentType
    );
  }
}

// تصدير الثوابت لأغراض الفحص أو الانتقال إلى R2 لاحقاً.
export {
  LISTING_IMAGES_BUCKET,
  R2_PUBLIC_BASE,
  SUPABASE_FUNCTIONS_URL,
};
