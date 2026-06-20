const MIGRATION_KEY = "aqari_geo_cache_schema";
const MIGRATION_VERSION = "v9";
const GEO_PREFIXES = ["geo_locations_", "geo_villages_", "geo_all_coords_"];

export function installGeoCacheMigrationV9() {
  if (typeof window === "undefined") return false;

  try {
    if (localStorage.getItem(MIGRATION_KEY) === MIGRATION_VERSION) return false;

    const keys = [];
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key && GEO_PREFIXES.some(prefix => key.startsWith(prefix))) {
        keys.push(key);
      }
    }

    keys.forEach(key => localStorage.removeItem(key));
    localStorage.setItem(MIGRATION_KEY, MIGRATION_VERSION);
    return true;
  } catch (error) {
    console.warn("Geographic cache v9 migration failed:", error);
    return false;
  }
}
