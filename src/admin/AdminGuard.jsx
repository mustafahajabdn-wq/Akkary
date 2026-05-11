import React from "react";
import { Navigate } from "react-router-dom";
import PageLoader from "../shared/components/ui/PageLoader.jsx";
import { canAccessAdminPage, getAllowedAdminPages, shouldRefreshAdminAccess } from "../shared/constants/access.js";
import { adminRoutePaths } from "../shared/constants/adminRoutes.js";
import { adminPageRoutes } from "./adminRoutes.js";

const ADMIN_DEFAULT_ROUTE_EXCLUDED_PAGES = new Set([
  "adminUserDetail",
]);

function getFirstAllowedAdminRoute(user) {
  const allowedPages = getAllowedAdminPages(user);
  const firstAllowedRoute = adminPageRoutes.find(route => {
    if (!allowedPages.includes(route.pageName)) return false;
    if (route.path.includes(":")) return false;
    if (ADMIN_DEFAULT_ROUTE_EXCLUDED_PAGES.has(route.pageName)) return false;
    return Boolean(adminRoutePaths[route.pageName]);
  });

  return firstAllowedRoute ? adminRoutePaths[firstAllowedRoute.pageName] : "/profile";
}

export default function AdminGuard({ element, user, pageName, refreshUserRoleAccess, accessSyncing, authReady }) {
  const needsAccessRefresh = shouldRefreshAdminAccess(user, pageName);
  const [guardChecked, setGuardChecked] = React.useState(() => !needsAccessRefresh);

  React.useEffect(() => {
    let active = true;

    if (!needsAccessRefresh || typeof refreshUserRoleAccess !== "function") {
      setGuardChecked(true);
      return () => {
        active = false;
      };
    }

    setGuardChecked(false);
    Promise.resolve(refreshUserRoleAccess({ reason: `guard:${pageName}` })).finally(() => {
      if (active) setGuardChecked(true);
    });

    return () => {
      active = false;
    };
  }, [pageName, refreshUserRoleAccess, needsAccessRefresh]);

  if (!authReady) return <PageLoader />;
  if (!user) return <Navigate to="/home" replace />;
  if (needsAccessRefresh && (!guardChecked || accessSyncing)) return <PageLoader />;
  if (!canAccessAdminPage(user, pageName)) return <Navigate to={getFirstAllowedAdminRoute(user)} replace />;

  return element;
}
