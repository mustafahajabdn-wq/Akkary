import {
  attachImportedImages,
  importListingRow as importListingRowBase,
  uploadImportedImage,
} from "./adminService.js";
import { reportImportedListingSuccess } from "../../shared/utils/restrictedAreas.js";
import { assertListingAreaAllowedAsync } from "../../shared/services/restrictedAreaRulesService.js";

export { attachImportedImages, uploadImportedImage };

export async function importListingRow(listing) {
  // الفحص يسبق استدعاء الإدخال الفعلي، لذلك لا يصل الإعلان المحظور إلى Supabase.
  await assertListingAreaAllowedAsync(listing, "import");

  const result = await importListingRowBase(listing);
  reportImportedListingSuccess(listing);
  return result;
}
