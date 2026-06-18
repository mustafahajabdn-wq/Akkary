import React from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import AdminGuard from "./AdminGuard.jsx";
import { adminPageRoutes } from "./adminRoutes.js";

import AdminDashboard from "./pages/AdminDashboard.jsx";
import AdminUsers from "./pages/AdminUsers.jsx";
import AdminListings from "./pages/AdminListings.jsx";
import AdminReports from "./pages/AdminReports.jsx";
import AdminBroadcast from "./pages/AdminBroadcast.jsx";
import AdminSettings from "./pages/AdminSettings.jsx";
import AdminLinksPage from "./pages/AdminLinksPage.jsx";
import AdminAds from "./pages/AdminAds.jsx";
import AdminUserDetail from "./pages/AdminUserDetail.jsx";
import AdminPushPage from "./pages/AdminPushPage.jsx";
import AdminRolesPage from "./pages/AdminRolesPage.jsx";
import AdminPropertyFields from "./pages/AdminPropertyFields.jsx";
import AdminUserDetailDynamic from "./components/AdminUserDetailDynamic.jsx";
import AdminSQLPage from "./pages/AdminSQLPage.jsx";
import ImporterPage from "./pages/ImporterPage.jsx";
import PendingPage from "./pages/PendingPage.jsx";

const ADMIN_COMPONENTS = {
  AdminDashboard,
  AdminUsers,
  AdminListings,
  AdminReports,
  AdminBroadcast,
  AdminSettings,
  AdminLinksPage,
  AdminAds,
  AdminUserDetail,
  AdminPushPage,
  AdminRolesPage,
  AdminPropertyFields,
  AdminUserDetailDynamic,
  AdminSQLPage,
  ImporterPage,
  PendingPage,
};

function buildAdminElement(route, props) {
  const Component = ADMIN_COMPONENTS[route.component];
  if (!Component) return <Navigate to="dashboard" replace />;

  const {
    common,
    targetUser,
    setDetail,
    setDetailPrevPage,
    openDetail,
    reloadListingsRef,
  } = props;

  const pageProps = { ...common };

  if (route.component === "AdminListings") {
    Object.assign(pageProps, { setDetail, setDetailPrevPage, openDetail });
  }

  if (route.component === "AdminUserDetail") {
    Object.assign(pageProps, { targetUser });
  }

  if (route.component === "ImporterPage") {
    Object.assign(pageProps, { reloadListings: () => reloadListingsRef.current() });
  }

  if (route.component === "PendingPage") {
    Object.assign(pageProps, {
      setDetail,
      setDetailPrevPage,
      onApprove: () => reloadListingsRef.current(),
    });
  }

  return <Component {...pageProps} />;
}

export default function AdminApp(props) {
  const { common } = props;
  const location = useLocation();
  const navigate = useNavigate();

  const isFullAdmin = common.user?.role === "admin" || common.user?.isAdmin === true;
  const isInsideAdmin = location.pathname === "/admin" || location.pathname.startsWith("/admin/");
  const isLinksPage = location.pathname === "/admin/links" || location.pathname === "/admin/links/";
  const showLinksShortcut = isFullAdmin && isInsideAdmin && !isLinksPage;

  return (
    <>
      <Routes>
        <Route index element={<Navigate to="dashboard" replace />} />
        {adminPageRoutes.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={
              <AdminGuard
                user={common.user}
                refreshUserRoleAccess={common.refreshUserRoleAccess}
                accessSyncing={common.accessSyncing}
                authReady={common.authReady}
                pageName={route.pageName}
                element={buildAdminElement(route, props)}
              />
            }
          />
        ))}
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>

      {showLinksShortcut && (
        <button
          type="button"
          onClick={() => navigate("/admin/links")}
          aria-label="فتح الروابط المهمة"
          style={{
            position: "fixed",
            left: 14,
            bottom: "calc(78px + env(safe-area-inset-bottom, 0px))",
            zIndex: 9999,
            border: "none",
            borderRadius: 999,
            padding: "12px 16px",
            background: "#334155",
            color: "#fff",
            fontFamily: "inherit",
            fontSize: 12,
            fontWeight: 900,
            boxShadow: "0 10px 26px rgba(15,23,42,.32)",
            cursor: "pointer",
          }}
        >
          🔗 الروابط المهمة
        </button>
      )}
    </>
  );
}
