// واجهة توافقية لصفحات التطبيق العام.
// التنفيذ المشترك موجود في shared/services/propertyMetadataService.js حتى تستطيع الإدارة والتطبيق استخدامه بلا خلط.
export {
  fetchPropertyTypes,
  fetchPropertyTypeByName,
  fetchPropertyFields,
  fetchPropertyFieldsForTypeName,
  fetchPropertyFieldOptions,
  fetchAppSettings,
  fetchAppSetting,
  fetchListingsSampleColumns,
} from "../../shared/services/propertyMetadataService.js";
