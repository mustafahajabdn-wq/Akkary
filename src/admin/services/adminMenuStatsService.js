import { adminCount } from "./adminApi.js";

export async function fetchAdminDashboardCounts() {
  const twoMinsAgo = new Date(Date.now() - 120000).toISOString();

  const [
    pendingListings,
    reports,
    activeListings,
    onlineProfiles,
    pendingAds,
    pendingUpgradeRequests
  ] = await Promise.all([
    adminCount("/rest/v1/listings?admin_status=eq.pending&select=id"),
    adminCount("/rest/v1/reports?status=eq.pending&select=id"),
    adminCount("/rest/v1/listings?status=eq.active&admin_status=eq.approved&select=id"),
    adminCount(`/rest/v1/profiles?last_seen_at=gte.${twoMinsAgo}&select=id`),
    adminCount("/rest/v1/ads?status=eq.pending&select=id"),
    adminCount("/rest/v1/account_upgrade_requests?status=eq.pending&select=id")
  ]);

  return {
    pendingCount: pendingListings || 0,
    reportsCount: reports || 0,
    activeListingsCount: activeListings || 0,
    onlineCount: onlineProfiles || 0,
    pendingAdsCount: pendingAds || 0,
    pendingUpgradeRequestsCount: pendingUpgradeRequests || 0
  };
}
