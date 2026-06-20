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

const LOCATION_KEYS = ["city", "district", "village"];

const LOCATION_LABELS = {
  city: "المدينة",
  district: "المنطقة / الحي",
  village: "الموقع",
};

const LOCATION_PLACEHOLDERS = {
  city: "— اختر المدينة —",
  district: "— اختر المنطقة / الحي —",
  village: "— اختر الموقع —",
};

function normalizeLocationField(field) {
  const key = String(field?.field_key || "");
  const label = LOCATION_LABELS[key];
  if (!label) return field;

  return {
    ...field,
    label,
    field_type: field?.field_type || "select",
    ui: {
      ...(field?.ui || {}),
      placeholder: LOCATION_PLACEHOLDERS[key],
    },
  };
}

function createLocationField(key, typeId, template, sortOrder) {
  return normalizeLocationField({
    id: `virtual-location-${String(typeId ?? "default")}-${key}`,
    type_id: typeId ?? null,
    field_key: key,
    label: LOCATION_LABELS[key],
    field_type: "select",
    section: template?.section || "الموقع",
    section_icon: template?.section_icon || "📍",
    sort_order: sortOrder,
    ui: {
      ...(template?.ui || {}),
      defaultOpen: true,
      placeholder: LOCATION_PLACEHOLDERS[key],
    },
  });
}

function ensureLocationHierarchy(rows = []) {
  const normalized = (Array.isArray(rows) ? rows : []).map(normalizeLocationField);
  if (!normalized.length) return normalized;

  const typeIds = [...new Set(normalized.map(field => field?.type_id ?? null))];
  const additions = [];
  const adjusted = normalized.map(field => ({ ...field }));

  typeIds.forEach(typeId => {
    const sameType = adjusted.filter(field => (field?.type_id ?? null) === typeId);
    const existingLocation = sameType.filter(field => LOCATION_KEYS.includes(String(field?.field_key || "")));
    const template = existingLocation[0] || sameType.find(field => field?.section === "الموقع") || null;
    const numericOrders = existingLocation
      .map(field => Number(field?.sort_order))
      .filter(Number.isFinite);
    const anchor = numericOrders.length ? Math.min(...numericOrders) : 20;

    LOCATION_KEYS.forEach((key, index) => {
      const existing = adjusted.find(
        field => (field?.type_id ?? null) === typeId && String(field?.field_key || "") === key
      );
      const order = anchor + index * 0.01;

      if (existing) {
        existing.sort_order = order;
        existing.section = template?.section || existing.section || "الموقع";
        existing.section_icon = template?.section_icon || existing.section_icon || "📍";
        existing.ui = {
          ...(existing.ui || {}),
          defaultOpen: true,
          placeholder: LOCATION_PLACEHOLDERS[key],
        };
      } else {
        additions.push(createLocationField(key, typeId, template, order));
      }
    });
  });

  return [...adjusted, ...additions].sort((a, b) => {
    const orderA = Number(a?.sort_order);
    const orderB = Number(b?.sort_order);
    const safeA = Number.isFinite(orderA) ? orderA : Number.MAX_SAFE_INTEGER;
    const safeB = Number.isFinite(orderB) ? orderB : Number.MAX_SAFE_INTEGER;
    return safeA - safeB;
  });
}

export async function fetchPropertyFields(select = "*") {
  return ensureLocationHierarchy(await fetchPropertyFieldsBase(select));
}

export async function fetchPropertyFieldsForTypeName(
  typeName,
  select = "field_key,label,field_type,section"
) {
  return ensureLocationHierarchy(
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
