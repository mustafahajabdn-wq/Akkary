import React, { Suspense, lazy } from "react";
import { ADMIN_ROLES } from "../../shared/constants/access.js";

// لا تستخدم import ثابتًا من src/admin هنا.
// import.meta.glob يجعل لوحة الإدارة اختيارية: إن وُجدت تُحمّل lazy، وإن حُذفت يبقى التطبيق العام يعمل.
const adminAppModules = import.meta.glob("../../admin/AdminApp.jsx");
const adminProfileMenuModules = import.meta.glob("../../admin/components/AdminProfileMenu.jsx");

const loadAdminApp = adminAppModules["../../admin/AdminApp.jsx"];
const loadAdminProfileMenu = adminProfileMenuModules["../../admin/components/AdminProfileMenu.jsx"];

export const isAdminModuleAvailable = typeof loadAdminApp === "function";
export const isAdminProfileMenuAvailable = typeof loadAdminProfileMenu === "function";

const LazyAdminApp = isAdminModuleAvailable ? lazy(loadAdminApp) : null;
const LazyAdminProfileMenu = isAdminProfileMenuAvailable ? lazy(loadAdminProfileMenu) : null;

function AdminUnavailablePage({ common }) {
  const DC = common?.DC || {};
  return (
    <div
      style={{
        minHeight: "60vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        textAlign: "center",
        color: DC.text || "#111827",
      }}
    >
      <div
        style={{
          maxWidth: 420,
          border: `1px solid ${DC.border || "#E5E7EB"}`,
          borderRadius: 18,
          padding: 22,
          background: DC.white || "#fff",
        }}
      >
        <div style={{ fontSize: 34, marginBottom: 10 }}>🛡️</div>
        <h2 style={{ margin: "0 0 8px", fontSize: 20 }}>لوحة الإدارة غير مفعّلة</h2>
        <p style={{ margin: 0, lineHeight: 1.8, color: DC.text2 || "#4B5563" }}>
          هذه النسخة من التطبيق لا تحتوي وحدة الإدارة، وباقي التطبيق يعمل بصورة مستقلة.
        </p>
      </div>
    </div>
  );
}

export function hasAdminBoundaryAccess(user) {
  return ADMIN_ROLES.includes(user?.role) || !!user?.isAdmin;
}

export function AdminAppBoundary(props) {
  if (!LazyAdminApp) return <AdminUnavailablePage {...props} />;
  return <LazyAdminApp {...props} />;
}

export function ProfileAdminMenuBoundary({ user, ...props }) {
  if (!hasAdminBoundaryAccess(user) || !LazyAdminProfileMenu) return null;

  return (
    <Suspense fallback={null}>
      <LazyAdminProfileMenu user={user} {...props} />
    </Suspense>
  );
}

// اسم قديم للتوافق مع AppShell: لا يشير لاستيراد ثابت من src/admin.
export const AdminApp = AdminAppBoundary;
