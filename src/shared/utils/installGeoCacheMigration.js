const GEO_CACHE_MIGRATION_KEY = "aqari_geo_cache_schema";
const GEO_CACHE_SCHEMA_VERSION = "v8";

const GEO_CACHE_PREFIXES = [
  "geo_locations_",
  "geo_villages_",
  "geo_all_coords_",
];

/**
 * يمسح كاش المواقع القديم مرة واحدة قبل تشغيل React.
 * لا يمسح جلسة الدخول أو مسودة الإعلان أو أي بيانات شخصية.
 */
export function installGeoCacheMigration() {
  if (typeof window === "undefined") return false;

  try {
    const currentVersion = localStorage.getItem(GEO_CACHE_MIGRATION_KEY);
    if (currentVersion === GEO_CACHE_SCHEMA_VERSION) return false;

    const keysToDelete = [];

    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key) continue;

      if (GEO_CACHE_PREFIXES.some(prefix => key.startsWith(prefix))) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => localStorage.removeItem(key));
    localStorage.setItem(GEO_CACHE_MIGRATION_KEY, GEO_CACHE_SCHEMA_VERSION);
    return keysToDelete.length > 0;
  } catch (error) {
    console.warn("Geographic cache migration failed:", error);
    return false;
  }
}
