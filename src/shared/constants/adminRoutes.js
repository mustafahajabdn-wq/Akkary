// تعريف مسارات الإدارة في shared حتى لا يعتمد التطبيق العام على وجود مجلد src/admin.
// هذا الملف لا يحتوي أي import من لوحة الإدارة، لذلك يبقى آمنًا حتى عند حذف src/admin كاملًا.

export const adminRoutePaths = {
  importer: "/admin/importer",
  pending: "/admin/pending",
  adminDashboard: "/admin/dashboard",
  adminUsers: "/admin/users",
  adminListings: "/admin/listings",
  adminReports: "/admin/reports",
  adminBroadcast: "/admin/broadcast",
  adminSettings: "/admin/settings",
  adminLinks: "/admin/links",
  adminAds: "/admin/ads",
  adminUserDetail: "/admin/user-detail",
  adminUserDetailDynamic: "/admin/user",
  adminPush: "/admin/push",
  adminRoles: "/admin/roles",
  adminPropertyFields: "/admin/property-fields",
  adminSQL: "/admin/sql",
};

export const adminDynamicRoutes = [
  { pattern: "/admin/user/:id", page: "adminUserDetail" },
];

export const legacyAdminRedirects = [
  { from: "/importer", to: adminRoutePaths.importer },
  { from: "/pending", to: adminRoutePaths.pending },
];

export function isAdminRoute(pathname = "") {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}
