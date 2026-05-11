// المدن والأحياء والمحافظات — تُحمَّل من goCache عند الإقلاع
// القيم الافتراضية أدناه تُستخدم قبل اكتمال التحميل الأول

export let cities = [
  "دمشق", "ريف دمشق", "حلب", "حمص", "حماة", "اللاذقية", "طرطوس",
  "درعا", "السويداء", "القنيطرة", "دير الزور", "الرقة", "إدلب", "الحسكة",
];

export let SYRIA_DISTRICTS_DB = {};

export const getDistricts = (city) => SYRIA_DISTRICTS_DB[city] || [];

export async function loadAppData() {
  const { loadAppData: _load } = await import("../services/appConfigService.js");
  return _load();
}

export async function loadCitiesFromDB() {
  // المصدر الوحيد للمدن والأحياء هو geoCache، حتى لا نكرّر طلبات cities/districts.
  const {
    getCities,
    getDistrictsGroupedByCity,
  } = await import("../../app/services/geoCache.js");

  const [cityRows, districtsMap] = await Promise.all([
    getCities(),
    getDistrictsGroupedByCity(),
  ]);

  if (cityRows?.length) {
    cities = cityRows.map((city) => city.name).filter(Boolean);
  }

  if (districtsMap && Object.keys(districtsMap).length) {
    SYRIA_DISTRICTS_DB = districtsMap;
  }
}
