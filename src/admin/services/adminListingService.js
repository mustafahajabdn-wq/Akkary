import {
  approveListing,
  fetchPendingListings,
  rejectListing,
  suspendUserById,
  deleteAdminListingCascade,
} from "./adminService.js";

export {
  approveListing,
  fetchPendingListings,
  rejectListing,
  suspendUserById,
};

export const deletePendingListing = deleteAdminListingCascade;
