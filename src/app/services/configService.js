// واجهة توافقية لصفحات التطبيق العام.
// التنفيذ المشترك موجود في shared/services/appConfigService.js.
export {
  loadAppSettings,
  fetchAppSettings,
  loadPropertyTypes,
  loadCurrencies,
  loadAnnouncements,
  loadAppData,
  loadCitiesFromDB,
  loadRolePermissions,
} from "../../shared/services/appConfigService.js";
