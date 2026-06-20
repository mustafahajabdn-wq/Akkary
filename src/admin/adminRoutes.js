// مسارات صفحات لوحة الإدارة — تستخدم داخل AdminApp فقط
// مسارات الـ URL معزولة في shared/constants/adminRoutes.js
export const adminPageRoutes = [
  { path: "dashboard", pageName: "adminDashboard", component: "AdminDashboard" },
  { path: "users", pageName: "adminUsers", component: "AdminUsers" },
  { path: "listings", pageName: "adminListings", component: "AdminListings" },
  { path: "restricted-areas", pageName: "adminListings", component: "RestrictedAreasPage" },
  { path: "reports", pageName: "adminReports", component: "AdminReports" },
  { path: "broadcast", pageName: "adminBroadcast", component: "AdminBroadcast" },
  { path: "settings", pageName: "adminSettings", component: "AdminSettings" },
  { path: "links", pageName: "adminLinks", component: "AdminLinksPage" },
  { path: "ads", pageName: "adminAds", component: "AdminAds" },
  { path: "user/:userId", pageName: "adminUserDetail", component: "AdminUserDetailDynamic" },
  { path: "user-detail", pageName: "adminUserDetail", component: "AdminUserDetail" },
  { path: "push", pageName: "adminPush", component: "AdminPushPage" },
  { path: "roles", pageName: "adminRoles", component: "AdminRolesPage" },
  { path: "property-fields", pageName: "adminPropertyFields", component: "AdminPropertyFields" },
  { path: "sql", pageName: "adminSQL", component: "AdminSQLPage" },
  { path: "importer", pageName: "importer", component: "ImporterPage" },
  { path: "pending", pageName: "pending", component: "PendingPage" },
];
