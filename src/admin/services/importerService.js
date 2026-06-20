import {
  attachImportedImages,
  importListingRow as importListingRowBase,
  uploadImportedImage,
} from "./adminService.js";
import {
  assertListingAreaAllowed,
  reportImportedListingSuccess,
} from "../../shared/utils/restrictedAreas.js";

export { attachImportedImages, uploadImportedImage };

export async function importListingRow(listing) {
  // هذا الفحص يسبق استدعاء الإدخال الفعلي، لذلك لا يصل الإعلان المحظور إلى Supabase.
  assertListingAreaAllowed(listing, "import");

  const result = await importListingRowBase(listing);
  reportImportedListingSuccess(listing);
  return result;
}
