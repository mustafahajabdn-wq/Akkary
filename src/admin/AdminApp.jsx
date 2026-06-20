import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
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
import AdminEngagementOverview from "./components/AdminEngagementOverview.jsx";
import AdminSQLPage from "./pages/AdminSQLPage.jsx";
import ImporterPage from "./pages/ImporterPage.jsx";
import PendingPage from "./pages/PendingPage.jsx";
import RestrictedAreasPageRoute from "./pages/RestrictedAreasPageRoute.jsx";

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
  RestrictedAreasPage: RestrictedAreasPageRoute,
};

function RestrictedAreasShortcut() {
  return (
    <a
      href="/admin/restricted-areas"
      aria-label="إدارة المناطق المحظورة"
      style={{
        position: "fixed",
        left: 16,
        bottom: 84,
        zIndex: 90,
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        padding: "10px 14px",
        borderRadius: 999,
        background: "#7C2D12",
        color: "#fff",
        textDecoration: "none",
        fontFamily: "Tajawal,Arial,sans-serif",
        fontSize: 12,
        fontWeight: 900,
        boxShadow: "0 10px 28px rgba(124,45,18,.28)",
      }}
    >
      🛡️ المناطق المحظورة
    </a>
  );
}

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

    return (
      <>
        <Component {...pageProps} />
        <RestrictedAreasShortcut />
      </>
    );
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

  if (route.component === "AdminDashboard") {
    return (
      <>
        <Component {...pageProps} />
        <AdminEngagementOverview DC={pageProps.DC} />
      </>
    );
  }

  return <Component {...pageProps} />;
}

export default function AdminApp(props) {
  const { common } = props;

  return (
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
  );
}
