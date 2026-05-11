import React, { useEffect, useState } from "react";
import { C } from "../../shared/constants/colors.js";
import { buildAdminProfileMenu } from "../../shared/constants/adminMenu.js";
import { fetchAdminDashboardCounts } from "../services/adminMenuStatsService.js";
import { S } from "../../shared/styles/primitives.js";
import { ADMIN_ROLES as ADMIN_ROLES_LIST } from "../../shared/constants/access.js";

const ADMIN_ROLES = new Set(ADMIN_ROLES_LIST);

const styles = {
  wrap: {
    marginTop: 16
  },

  dividerWrap: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
    padding: "0 4px"
  },

  line: DC => ({
    flex: 1,
    height: 1,
    background: DC.border
  }),

  eyebrow: {
    fontSize: 11,
    fontWeight: 800,
    color: C.primary,
    letterSpacing: 1
  },

  card: DC => ({
    background: DC.white,
    borderRadius: 12,
    border: "2px solid " + C.primary,
    overflow: "hidden"
  }),

  row: border => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 16px",
    borderBottom: border,
    cursor: "pointer"
  }),

  left: color => ({
    display: "flex",
    alignItems: "center",
    gap: 12,
    fontSize: 14,
    fontWeight: 600,
    color
  }),

  count: color => ({
    background: color || C.primary,
    color: "white",
    borderRadius: 20,
    minWidth: 22,
    height: 22,
    padding: "0 7px",
    fontSize: 11,
    fontWeight: 800,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    whiteSpace: "nowrap"
  }),

  rowEnd: {
    display: "flex",
    alignItems: "center",
    gap: 6
  },

  chevron: DC => ({
    color: DC.text3
  })
};

export default function AdminProfileMenu({ user, DC = C, setPage }) {
  const [counts, setCounts] = useState({});

  useEffect(() => {
    if (!ADMIN_ROLES.has(user?.role)) return;

    let alive = true;

    fetchAdminDashboardCounts()
      .then(nextCounts => {
        if (alive && nextCounts) {
          setCounts(nextCounts);
        }
      })
      .catch(error => {
        console.error("fetchAdminDashboardCounts error:", error);

        if (alive) {
          setCounts({});
        }
      });

    return () => {
      alive = false;
    };
  }, [user?.role]);

  const adminMenu = buildAdminProfileMenu(user, counts);

  if (!adminMenu.length) return null;

  return (
    <div style={styles.wrap}>
      <div style={styles.dividerWrap}>
        <div style={styles.line(DC)} />
        <span style={styles.eyebrow}>🛡️ لوحة الإدارة</span>
        <div style={styles.line(DC)} />
      </div>

      <div style={styles.card(DC)}>
        {adminMenu.map((item, index) => {
          const badges = Array.isArray(item.badges)
            ? item.badges.filter(badge => badge?.label)
            : [];

          return (
            <div
              key={item.action || index}
              onClick={() => setPage(item.action)}
              style={styles.row(
                index < adminMenu.length - 1
                  ? "1px solid " + DC.border
                  : "none"
              )}
            >
              <div style={styles.left(DC.text)}>
                <span style={S.font18}>{item.icon}</span>
                {item.label}
              </div>

              <div style={styles.rowEnd}>
                {item.count && (
                  <div style={styles.count(item.countColor || C.primary)}>
                    {item.count}
                  </div>
                )}

                {badges.map((badge, i) => (
                  <div
                    key={`${item.action}-badge-${i}`}
                    style={styles.count(badge.color || C.primary)}
                  >
                    {badge.label}
                  </div>
                ))}

                <span style={styles.chevron(DC)}>‹</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
