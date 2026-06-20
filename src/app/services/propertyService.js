// واجهة توافقية لصفحات التطبيق العام.
// التنفيذ المشترك موجود في shared/services/propertyMetadataService.js حتى تستطيع الإدارة والتطبيق استخدامه بلا خلط.
import {
  fetchPropertyTypes,
  fetchPropertyTypeByName,
  fetchPropertyFields as fetchPropertyFieldsBase,
  fetchPropertyFieldsForTypeName as fetchPropertyFieldsForTypeNameBase,
  fetchPropertyFieldOptions,
  fetchAppSettings,
  fetchAppSetting,
  fetchListingsSampleColumns,
} from "../../shared/services/propertyMetadataService.js";

const LOCATION_LABELS = {
  city: "\u0627\u0644\u0645\u062f\u064a\u0646\u0629",
  district: "\u0627\u0644\u0645\u0646\u0637\u0642\u0629 / \u0627\u0644\u062d\u064a",
  village: "\u0627\u0644\u0642\u0631\u064a\u0629",
};

const LOCATION_PLACEHOLDERS = {
  city: "\u2014 \u0627\u062e\u062a\u0631 \u0627\u0644\u0645\u062f\u064a\u0646\u0629 \u2014",
  district: "\u2014 \u0627\u062e\u062a\u0631 \u0627\u0644\u0645\u0646\u0637\u0642\u0629 / \u0627\u0644\u062d\u064a \u2014",
  village: "\u2014 \u0627\u062e\u062a\u0631 \u0627\u0644\u0642\u0631\u064a\u0629 \u2014",
};

function normalizeLocationFields(rows = []) {
  return (Array.isArray(rows) ? rows : []).map((field) => {
    const key = String(field?.field_key || "");
    const label = LOCATION_LABELS[key];
    if (!label) return field;

    return {
      ...field,
      label,
      ui: {
        ...(field?.ui || {}),
        placeholder: LOCATION_PLACEHOLDERS[key],
      },
    };
  });
}

export async function fetchPropertyFields(select = "*") {
  return normalizeLocationFields(await fetchPropertyFieldsBase(select));
}

export async function fetchPropertyFieldsForTypeName(
  typeName,
  select = "field_key,label,field_type,section"
) {
  return normalizeLocationFields(
    await fetchPropertyFieldsForTypeNameBase(typeName, select)
  );
}

export {
  fetchPropertyTypes,
  fetchPropertyTypeByName,
  fetchPropertyFieldOptions,
  fetchAppSettings,
  fetchAppSetting,
  fetchListingsSampleColumns,
};
