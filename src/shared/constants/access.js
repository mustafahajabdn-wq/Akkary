// أدوار الإدارة المعروفة في التطبيق
// - admin: صلاحية كاملة
// - moderator/support/level1/level2: أدوار محدودة، صلاحياتها تُحدَّد عبر allowedPages من DB
export const ADMIN_ROLES = ["admin", "moderator", "support", "level1", "level2"];

// الأدوار غير الكاملة — تحتاج جلب allowedPages من app_settings.role_permissions
export const LIMITED_ADMIN_ROLES = ["moderator", "support", "level1", "level2"];

export function getUserRole(user) {
  return user?.role || "user";
}

export function isAdminRole(role) {
  return ADMIN_ROLES.includes(role);
}

export function hasAdminShellAccess(user) {
  return !!user && (isAdminRole(getUserRole(user)) || !!user?.isAdmin);
}

export function getAllowedAdminPages(user) {
  return Array.isArray(user?.allowedPages) ? user.allowedPages : [];
}

export function shouldRefreshAdminAccess(user, pageName) {
  const role = getUserRole(user);
  const allowedPages = getAllowedAdminPages(user);
  return !!user?.id && role !== "admin" && hasAdminShellAccess(user) && !!pageName && !allowedPages.includes(pageName);
}

export function canAccessAdminPage(user, pageName) {
  if (!hasAdminShellAccess(user)) return false;
  const role = getUserRole(user);
  if (role === "admin") return true;
  return getAllowedAdminPages(user).includes(pageName);
}
