import { getAllowedAdminPages, hasAdminShellAccess, isAdminRole } from "./access.js";

function formatCount(value) {
  return Number(value) > 0 ? String(value) : null;
}

export function buildAdminProfileMenu(user, counts = {}) {
  if (!hasAdminShellAccess(user)) return [];

  const role = user?.role || "user";
  const isFullAdmin = role === "admin";
  const allowedPages = getAllowedAdminPages(user);
  const canAccess = page => isFullAdmin || allowedPages.includes(page);

  return [
    {
      icon: "📊",
      label: "الإحصائيات",
      action: "adminDashboard",
      show: canAccess("adminDashboard")
    },
    {
      icon: "⏳",
      label: "قيد المراجعة",
      action: "pending",
      show: canAccess("pending"),
      count: formatCount(counts.pendingCount),
      countColor: "#C8952A"
    },
    {
      icon: "📢",
      label: "قيد المراجعة — المدفوعة",
      action: "adminAds",
      show: canAccess("adminAds"),
      count: formatCount(counts.pendingAdsCount),
      countColor: "#C8952A"
    },
    {
      icon: "👥",
      label: "المستخدمون",
      action: "adminUsers",
      show: canAccess("adminUsers"),
      count: formatCount(counts.onlineCount),
      countColor: "#16A34A",
      badges: [
        {
          label: formatCount(counts.pendingUpgradeRequestsCount)
            ? `🏢 ${formatCount(counts.pendingUpgradeRequestsCount)}`
            : null,
          color: "#C8952A"
        }
      ]
    },
    {
      icon: "🏠",
      label: "كل الإعلانات",
      action: "adminListings",
      show: canAccess("adminListings"),
      count: formatCount(counts.activeListingsCount)
    },
    {
      icon: "🚩",
      label: "البلاغات",
      action: "adminReports",
      show: canAccess("adminReports"),
      count: formatCount(counts.reportsCount),
      countColor: "#EF4444"
    },
    {
      icon: "📣",
      label: "إشعارات جماعية",
      action: "adminBroadcast",
      show: canAccess("adminBroadcast")
    },
    {
      icon: "📲",
      label: "اشتراكات Push",
      action: "adminPush",
      show: canAccess("adminPush")
    },
    {
      icon: "📥",
      label: "استيراد إعلانات",
      action: "importer",
      show: canAccess("importer")
    },
    {
      icon: "🔐",
      label: "صلاحيات الأدوار",
      action: "adminRoles",
      show: isFullAdmin && isAdminRole(role)
    },
    {
      icon: "⚙️",
      label: "إعدادات التطبيق",
      action: "adminSettings",
      show: canAccess("adminSettings")
    }
  ].filter(item => item.show);
}
