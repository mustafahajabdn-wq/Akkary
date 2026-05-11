import { Navigate } from "react-router-dom";
import { BackButton } from "../../shared/components/common/BackButton.jsx";
import React, { useState, useEffect } from "react";
import { fetchRolePermissions, saveRolePermissions } from "../services/adminService.js";
import { IslamicPattern, Wave } from "../../shared/components/icons.jsx";
import { S } from "../../shared/styles/primitives.js";

// كل الصفحات القابلة للتحكم
const PAGES = [{
  key: "adminDashboard",
  label: "📊 الإحصائيات"
}, {
  key: "pending",
  label: "⏳ قيد المراجعة"
}, {
  key: "adminListings",
  label: "🏠 كل الإعلانات"
}, {
  key: "adminReports",
  label: "🚩 البلاغات"
}, {
  key: "adminUsers",
  label: "👥 المستخدمون"
}, {
  key: "adminBroadcast",
  label: "📣 إشعارات جماعية"
}, {
  key: "adminAds",
  label: "📢 الإعلانات المدفوعة"
}, {
  key: "adminPush",
  label: "📲 اشتراكات Push"
}, {
  key: "importer",
  label: "📥 استيراد إعلانات"
}, {
  key: "adminSettings",
  label: "⚙️ إعدادات التطبيق"
}];
const ROLES = [{
  key: "support",
  label: "🟢 Level 1 — دعم",
  color: "#16A34A",
  bg: "#F0FDF4"
}, {
  key: "moderator",
  label: "🟡 Level 2 — مشرف",
  color: "#C8952A",
  bg: "#FEF3C7"
}];
const DEFAULT_PERMS = {
  support: ["adminDashboard", "adminUsers"],
  moderator: ["adminDashboard", "adminUsers", "pending", "adminReports", "adminListings"]
};
export default function AdminRolesPage({
  setPage,
  DC,
  user
}) {
  const sx = {
    s1: {
      background: "#4B0082",
      padding: "48px 16px 50px",
      position: "relative",
      overflow: "hidden"
    },
    s2: {
      background: "#FEF2F2",
      border: "1px solid #FECACA",
      borderRadius: 10,
      padding: "10px 14px",
      marginBottom: 14,
      fontSize: 12,
      color: "#991B1B",
      fontWeight: 700
    },
    s3: saved => ({
      width: "100%",
      padding: "13px",
      borderRadius: 12,
      border: "none",
      background: saved ? "#16A34A" : "#4B0082",
      color: "white",
      fontSize: 14,
      fontWeight: 800,
      cursor: "pointer",
      fontFamily: "inherit",
      transition: "background 0.3s"
    })
  };
  if (user?.role !== "admin") return <Navigate to="/admin/dashboard" replace />;
  const [perms, setPerms] = useState(DEFAULT_PERMS);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    load();
  }, []);
  async function load() {
    setLoading(true);
    const raw = await fetchRolePermissions();
    if (raw) {
      try {
        setPerms(typeof raw === "string" ? JSON.parse(raw) : raw);
      } catch {
        setPerms(DEFAULT_PERMS);
      }
    }
    setLoading(false);
  }
  async function save() {
    const val = JSON.stringify(perms);
    await saveRolePermissions(val);
    try {
      localStorage.setItem("aqari_role_permissions_updated_at", String(Date.now()));
    } catch {}
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }
  function toggle(role, pageKey) {
    setPerms(p => {
      const current = p[role] || [];
      const has = current.includes(pageKey);
      return {
        ...p,
        [role]: has ? current.filter(k => k !== pageKey) : [...current, pageKey]
      };
    });
  }
  function hasAll(role) {
    return PAGES.every(p => (perms[role] || []).includes(p.key));
  }
  function toggleAll(role) {
    if (hasAll(role)) {
      setPerms(p => ({
        ...p,
        [role]: []
      }));
    } else {
      setPerms(p => ({
        ...p,
        [role]: PAGES.map(p => p.key)
      }));
    }
  }
  return <div style={S.pageShell(DC)}>
      <div style={sx.s1}>
        <IslamicPattern opacity={0.1} color="#FFFFFF" width={430} height={200} />
        <div style={S.absTopRight14}>
          <BackButton onPress={() => setPage("adminDashboard")} />
        </div>
        <div style={S.relZ1}>
          <div style={S.title20White}>🔐 صلاحيات الأدوار</div>
          <div style={S.whiteMeta12}>تحكم بما يراه كل مستوى</div>
        </div>
        <Wave />
      </div>

      <div style={S.pad14Bottom80}>
        {loading ? <div style={S.emptyStateCentered}>⏳</div> : <>

          {/* ملاحظة Level 3 */}
          <div style={sx.s2}>
            🔴 Level 3 (أدمن رئيسي) — لديه صلاحية كل شيء دائماً ولا يمكن تغييرها
          </div>

          {ROLES.map(role => {
          const sx = {
            s1: (DC, role) => ({
              background: DC?.white || "#fff",
              borderRadius: 14,
              border: `2px solid ${role.color}33`,
              marginBottom: 16,
              overflow: "hidden"
            }),
            s2: role => ({
              background: role.bg,
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }),
            s3: role => ({
              fontSize: 15,
              fontWeight: 900,
              color: role.color
            }),
            s4: role => ({
              fontSize: 11,
              fontWeight: 700,
              color: role.color,
              background: "white",
              border: `1.5px solid ${role.color}`,
              borderRadius: 20,
              padding: "4px 12px",
              cursor: "pointer",
              fontFamily: "inherit"
            }),
            s5: {
              padding: "8px 0"
            }
          };
          return <div key={role.key} style={sx.s1(DC, role)}>
              {/* Header */}
              <div style={sx.s2(role)}>
                <div style={sx.s3(role)}>{role.label}</div>
                <button onClick={() => toggleAll(role.key)} style={sx.s4(role)}>
                  {hasAll(role.key) ? "إلغاء الكل" : "تحديد الكل"}
                </button>
              </div>

              {/* الصفحات */}
              <div style={sx.s5}>
                {PAGES.map((page, i) => {
                const enabled = (perms[role.key] || []).includes(page.key);
                const sx = {
                  s1: (i, PAGES, DC, enabled) => ({
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "11px 16px",
                    borderBottom: i < PAGES.length - 1 ? "1px solid " + (DC?.border || "#DDE8E1") : "none",
                    cursor: "pointer",
                    background: enabled ? "transparent" : "#FAFAFA"
                  }),
                  s2: (enabled, DC) => ({
                    fontSize: 13,
                    fontWeight: 600,
                    color: enabled ? DC?.text || "#1A2E20" : "#9CA3AF"
                  }),
                  s3: (enabled, role) => ({
                    width: 40,
                    height: 22,
                    borderRadius: 11,
                    background: enabled ? role.color : "#D1D5DB",
                    position: "relative",
                    transition: "background 0.2s",
                    flexShrink: 0
                  }),
                  s4: enabled => ({
                    position: "absolute",
                    top: 2,
                    left: enabled ? 20 : 2,
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: "white",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                    transition: "left 0.2s"
                  })
                };
                return <div key={page.key} onClick={() => toggle(role.key, page.key)} style={sx.s1(i, PAGES, DC, enabled)}>
                      <span style={sx.s2(enabled, DC)}>
                        {page.label}
                      </span>
                      {/* Toggle */}
                      <div style={sx.s3(enabled, role)}>
                        <div style={sx.s4(enabled)} />
                      </div>
                    </div>;
              })}
              </div>
            </div>;
        })}

          {/* زر الحفظ */}
          <button onClick={save} style={sx.s3(saved)}>
            {saved ? "✅ تم الحفظ!" : "💾 حفظ الصلاحيات"}
          </button>
        </>}
      </div>
    </div>;
}
