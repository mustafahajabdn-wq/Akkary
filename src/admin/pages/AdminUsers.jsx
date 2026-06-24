import { BackButton } from "../../shared/components/common/BackButton.jsx";
import { Navigate } from "react-router-dom";
import React, { useState, useEffect, useMemo } from "react";
import { C } from "../../shared/constants/colors.js";
import { IslamicPattern, Wave } from "../../shared/components/icons.jsx";
import UserCard from "../components/UserCard.jsx";
import {
  fetchAdminUsers,
  patchAdminUser,
  fetchPendingAccountUpgradeRequests,
  updateAccountUpgradeRequestsForUser
} from "../services/adminService.js";
import { S } from "../../shared/styles/primitives.js";

export default function AdminUsers({
  setPage,
  DC,
  user,
  setTargetUser
}) {
  const sx = {
    s1: {
      display: "flex",
      gap: 16,
      marginTop: 6
    },
    s2: {
      fontSize: 12,
      color: "#4ADE80",
      fontWeight: 700
    },
    s3: DC => ({
      width: "100%",
      padding: "11px 14px",
      borderRadius: 10,
      border: "1.5px solid " + (DC?.border || "#DDE8E1"),
      fontSize: 13,
      fontFamily: "inherit",
      background: DC?.white || "#fff",
      color: DC?.text || "#1A2E20",
      marginBottom: 10,
      boxSizing: "border-box",
      outline: "none"
    }),
    s4: {
      display: "flex",
      gap: 6,
      marginBottom: 12,
      flexWrap: "wrap"
    },
    s5: DC => ({
      textAlign: "center",
      padding: 40,
      color: DC?.text3
    }),
    s6: DC => ({
      marginBottom: 8,
      padding: "8px 10px",
      borderRadius: 10,
      background: "#FFFBEB",
      border: "1px solid #FCD34D",
      color: "#92400E",
      fontSize: 12,
      fontWeight: 800,
      lineHeight: 1.7
    }),
    s7: {
      fontSize: 11,
      color: "#B45309",
      fontWeight: 600,
      marginTop: 2
    },
    s8: {
      background: "#FEF2F2",
      border: "1px solid #FCA5A5",
      color: "#991B1B",
      borderRadius: 10,
      padding: "9px 12px",
      fontSize: 12,
      fontWeight: 700,
      marginBottom: 10
    }
  };

  const [users, setUsers] = useState([]);
  const [upgradeRequests, setUpgradeRequests] = useState([]);
  const [upgradeError, setUpgradeError] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setUpgradeError("");

    try {
      const list = await fetchAdminUsers();
      const userList = (Array.isArray(list) ? list : []).filter(Boolean);

      setUsers(userList);

      try {
        const pendingRequests = await fetchPendingAccountUpgradeRequests();

        const cleanedRequests = (Array.isArray(pendingRequests) ? pendingRequests : []).filter(req => {
          const reqUser = userList.find(u => u?.id === req?.user_id);

          // لا تعرض طلبًا pending لمستخدم صار مكتبًا فعلًا.
          return reqUser?.account_type !== "office";
        });

        setUpgradeRequests(cleanedRequests);
      } catch (upgradeError) {
        console.error("load upgrade requests error:", upgradeError);
        setUpgradeRequests([]);
        setUpgradeError("تعذر جلب طلبات التحويل فقط.");
      }
    } catch (error) {
      console.error("load admin users error:", error);
      setUsers([]);
      setUpgradeRequests([]);
      setUpgradeError("تعذر جلب المستخدمين.");
    } finally {
      setLoading(false);
    }
  }

  async function patch(id, obj) {
    if (!id) return;

    try {
      await patchAdminUser(id, obj);

      setUsers(prev =>
        prev.map(u =>
          u?.id === id
            ? {
                ...u,
                ...obj
              }
            : u
        )
      );

      // تحديث طلب التحويل لا يجب أن يمنع حفظ تعديل المستخدم.
      // إذا فشل بسبب RLS أو صلاحيات، يبقى تعديل الحساب محفوظًا.
      if (obj?.account_type === "office") {
        setUpgradeRequests(prev =>
          prev.filter(r => r?.user_id !== id)
        );

        updateAccountUpgradeRequestsForUser(id, "approved", [
          "pending",
          "rejected",
          "revoked"
        ]).catch(error => {
          console.error("update upgrade request to approved failed:", error);
        });
      }

      if (obj?.account_type === "individual") {
        setUpgradeRequests(prev =>
          prev.filter(r => r?.user_id !== id)
        );

        updateAccountUpgradeRequestsForUser(id, "revoked", [
          "pending",
          "approved"
        ]).catch(error => {
          console.error("update upgrade request to revoked failed:", error);
        });
      }
    } catch (error) {
      console.error("patch admin user error:", error);
      alert("تعذر حفظ تعديل المستخدم. تحقق من صلاحيات الإدارة أو الاتصال.");
    }
  }

  const upgradeMap = useMemo(() => {
    const m = new Map();

    upgradeRequests.forEach(r => {
      if (r?.user_id) m.set(r.user_id, r);
    });

    return m;
  }, [upgradeRequests]);

  const upgradeUserIds = useMemo(() => {
    return new Set(upgradeRequests.map(r => r?.user_id).filter(Boolean));
  }, [upgradeRequests]);

  const onlineCount = users.filter(u => {
    if (!u?.last_seen_at) return false;
    return Date.now() - new Date(u.last_seen_at) < 120000;
  }).length;

  const filtered = users
    .filter(Boolean)
    .filter(u => {
      const q = search.trim();
      if (!q) return true;

      return (
        String(u?.name || "").includes(q) ||
        String(u?.phone || "").includes(q) ||
        String(u?.email || "").includes(q)
      );
    })
    .filter(u => {
      if (statusFilter === "all") return true;
      if (statusFilter === "active") return !u?.is_suspended;
      if (statusFilter === "suspended") return !!u?.is_suspended;
      if (statusFilter === "officeRequests") return upgradeUserIds.has(u?.id);
      return true;
    });

  if (user?.role !== "admin" && !(user?.allowedPages || []).includes("adminUsers")) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <div style={S.pageShell(DC)}>
      <div style={S.primaryHero(C.primary)}>
        <IslamicPattern opacity={0.1} color="#FFFFFF" width={430} height={200} />

        <div style={S.absTopRight14}>
          <BackButton onPress={() => setPage("adminDashboard")} />
        </div>

        <div style={S.relZ1}>
          <div style={S.title20White}>👥 المستخدمون</div>

          <div style={sx.s1}>
            <span style={S.whiteStrong12}>👥 {users.length} مستخدم</span>
            {onlineCount > 0 && (
              <span style={sx.s2}>🟢 {onlineCount} متصل الآن</span>
            )}
          </div>
        </div>

        <Wave />
      </div>

      <div style={S.pad14Bottom80}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="ابحث بالاسم أو الهاتف..."
          style={sx.s3(DC)}
        />

        {upgradeError && <div style={sx.s8}>{upgradeError}</div>}

        <div style={sx.s4}>
          {[
            {
              key: "all",
              label: "الكل",
              count: users.length
            },
            {
              key: "active",
              label: "✅ نشط",
              count: users.filter(u => !u?.is_suspended).length
            },
            {
              key: "suspended",
              label: "🚫 موقوف",
              count: users.filter(u => u?.is_suspended).length
            },
            {
              key: "officeRequests",
              label: "🏢 للمكتب",
              count: upgradeUserIds.size
            }
          ].map(f => {
            const btnSx = {
              s1: (statusFilter, f, C, DC) => ({
                flex: "1 1 calc(50% - 6px)",
                padding: "7px 4px",
                borderRadius: 9,
                border:
                  "1.5px solid " +
                  (statusFilter === f.key ? C.primary : DC?.border || "#DDE8E1"),
                background: statusFilter === f.key ? "#E8F4F0" : DC?.white || "#fff",
                color: statusFilter === f.key ? C.primary : DC?.text || "#1A2E20",
                fontSize: 11,
                fontWeight: 800,
                cursor: "pointer",
                fontFamily: "inherit"
              })
            };

            return (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                style={btnSx.s1(statusFilter, f, C, DC)}
              >
                {f.label}
                {f.count > 0 ? ` (${f.count})` : ""}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div style={sx.s5(DC)}>⏳</div>
        ) : filtered.length === 0 ? (
          <div style={sx.s5(DC)}>لا توجد نتائج</div>
        ) : (
          filtered.map(u => {
            const upgradeReq = upgradeMap.get(u?.id);

            return (
              <div key={u?.id}>
                {upgradeReq && (
                  <div style={sx.s6(DC)}>
                    🏢 طلب حساب مهني قيد المراجعة
                    {upgradeReq.note && (
                      <div style={sx.s7}>
                        ملاحظة المستخدم: {upgradeReq.note}
                      </div>
                    )}
                  </div>
                )}

                <UserCard
                  u={{
                    ...u,
                    _upgradeRequest: upgradeReq || null,
                    _hasUpgradeRequest: !!upgradeReq
                  }}
                  DC={DC}
                  onPatch={patch}
                  setTargetUser={setTargetUser}
                  setPage={setPage}
                  user={user}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
