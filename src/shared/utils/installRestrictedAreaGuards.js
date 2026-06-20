import { listingService } from "../../app/services/listingService.js";
import { assertListingAreaAllowedAsync } from "../services/restrictedAreaRulesService.js";

let installed = false;

export function installRestrictedAreaGuards() {
  if (installed) return;
  installed = true;

  const originalCreateListing = listingService.createListing.bind(listingService);

  listingService.createListing = async function guardedCreateListing(
    payload,
    options
  ) {
    await assertListingAreaAllowedAsync(payload, "add");
    return originalCreateListing(payload, options);
  };
}
