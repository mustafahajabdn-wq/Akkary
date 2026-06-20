import { listingService } from "../../app/services/listingService.js";
import { assertListingAreaAllowed } from "./restrictedAreas.js";

let installed = false;

export function installRestrictedAreaGuards() {
  if (installed) return;
  installed = true;

  const originalCreateListing = listingService.createListing.bind(listingService);

  listingService.createListing = async function guardedCreateListing(
    payload,
    options
  ) {
    assertListingAreaAllowed(payload, "add");
    return originalCreateListing(payload, options);
  };
}
