import React, { useEffect, useMemo, useState } from "react";
import { blockUsersMutually, createUserBlock, deleteReportsByIds, deleteUserBlock, getMutualBlockStatus, loadAdminReportsBundle, loadReportChatMessages, patchReportedProfile, setAdminListingVisibility, updateReportsByIds } from "../services/adminService.js";
import { C } from "../../shared/constants/colors.js";
import { IslamicPattern, Wave } from "../../shared/components/icons.jsx";
import { Navigate } from "react-router-dom";
import { BackButton } from "../../shared/components/common/BackButton.jsx";
import { ListingCard } from "../../shared/components/common/ListingCard.jsx";
import UserCard from "../components/UserCard.jsx";
import { S, mergeStyles } from "../../shared/styles/primitives.js";

// ── دوال مساعدة خاصة بهذه الصفحة ──────────────────────────────────────────

function fmtDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("ar", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}
function isSuspendedActive(u) {
  if (!u?.is_suspended) return false;
  if (!u?.suspended_until) return true;
  return new Date(u.suspended_until) > new Date();
}
function timeLeft(suspendedUntil) {
  if (!suspendedUntil) return null;
  const diff = new Date(suspendedUntil).getTime() - Date.now();
  if (diff <= 0) return null;
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor(diff / 60000);
  if (days >= 1) return `ينتهي خلال ${days} يوم`;
  if (hours >= 1) return `ينتهي خلال ${hours} ساعة`;
  return `ينتهي خلال ${Math.max(mins, 1)} دقيقة`;
}
function groupKey(rep) {
  return `${rep.source || "listing"}:${rep.listing_id || rep.reported_user_id || rep.id}`;
}
function countByStatus(items, status) {
  return items.filter(r => (r.status || "pending") === status).length;
}
function initials(name) {
  return (name || "م").trim().charAt(0) || "م";
}
const reportUi = {
  pad10: {
    padding: 10
  },
  badge: (bg, color, border) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "4px 9px",
    borderRadius: 999,
    background: bg,
    color,
    border: `1px solid ${border}`,
    fontSize: 11,
    fontWeight: 800,
    whiteSpace: "nowrap"
  }),
  tabButton: (active, bg, activeColor = "#fff") => ({
    flex: 1,
    border: "none",
    borderRadius: 12,
    padding: "11px 10px",
    background: active ? bg : "#F3F4F6",
    color: active ? activeColor : "#6B7280",
    fontSize: 12,
    fontWeight: 900,
    cursor: "pointer",
    fontFamily: "inherit"
  }),
  filterButton: active => ({
    padding: "8px 12px",
    borderRadius: 10,
    border: `1px solid ${active ? C.primary : "#E5E7EB"}`,
    background: active ? "#E8F4F0" : "#fff",
    color: active ? C.primary : "#6B7280",
    fontSize: 12,
    fontWeight: 800,
    cursor: "pointer",
    fontFamily: "inherit"
  }),
  topStat: DC => ({
    background: DC?.white || "#fff",
    border: `1px solid ${DC?.border || "#DDE8E1"}`,
    borderRadius: 12,
    padding: "10px 8px",
    textAlign: "center"
  }),
  page: DC => mergeStyles(S.pageShell(DC), {
    background: DC?.bg || "#F8FAFC",
    color: DC?.text || "#1A2E20"
  })
};

// ── مكوّنات UI صغيرة ────────────────────────────────────────────────────────

function Badge({
  children,
  bg = "#F8FAFC",
  color = "#334155",
  border = "#E2E8F0"
}) {
  return <span style={reportUi.badge(bg, color, border)}>
      {children}
    </span>;
}
function TabButton({
  active,
  onClick,
  children,
  bg,
  activeColor = "#fff"
}) {
  return <button type="button" onClick={onClick} style={reportUi.tabButton(active, bg, activeColor)}>
      {children}
    </button>;
}
function FilterButton({
  active,
  onClick,
  children
}) {
  return <button type="button" onClick={onClick} style={reportUi.filterButton(active)}>
      {children}
    </button>;
}
function TopStat({
  label,
  value,
  DC
}) {
  const sx = {
    s1: {
      fontSize: 11,
      color: "#9CA3AF",
      fontWeight: 700
    },
    s2: DC => ({
      fontSize: 20,
      fontWeight: 900,
      color: DC?.text || "#1A2E20",
      marginTop: 3
    })
  };
  return <div style={reportUi.topStat(DC)}>
      <div style={sx.s1}>{label}</div>
      <div style={sx.s2(DC)}>{value}</div>
    </div>;
}

// ── الصفحة الرئيسية ──────────────────────────────────────────────────────────

export default function AdminReports({
  setPage,
  DC,
  user,
  openDetail
}) {
  const sx = {
    s1: {
      position: "fixed",
      top: 16,
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 9999,
      background: "#1A2E20",
      color: "#fff",
      padding: "10px 18px",
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 800,
      whiteSpace: "nowrap"
    },
    s2: {
      position: "absolute",
      top: 14,
      right: 16,
      zIndex: 2
    },
    s3: {
      fontSize: 20,
      fontWeight: 900,
      color: "white"
    },
    s4: {
      display: "flex",
      gap: 16,
      marginTop: 6
    },
    s5: {
      fontSize: 12,
      color: "rgba(255,255,255,0.8)",
      fontWeight: 700
    },
    s6: DC => ({
      background: DC?.white || "#fff",
      borderBottom: `1px solid ${DC?.border || "#DDE8E1"}`,
      padding: "12px 14px",
      position: "sticky",
      top: 0,
      zIndex: 10
    }),
    s7: {
      display: "flex",
      gap: 6,
      marginBottom: 8
    },
    s8: DC => ({
      width: "100%",
      padding: "10px 12px",
      borderRadius: 10,
      border: `1px solid ${DC?.border || "#DDE8E1"}`,
      background: DC?.bg || "#F8FAFC",
      fontSize: 12,
      fontFamily: "inherit",
      outline: "none",
      color: DC?.text || "#1A2E20",
      marginBottom: 8
    }),
    s9: {
      display: "flex",
      gap: 6,
      flexWrap: "wrap"
    },
    s10: {
      padding: "12px 12px 88px"
    },
    s11: DC => ({
      background: DC?.white || "#fff",
      border: `1px solid ${DC?.border || "#DDE8E1"}`,
      borderRadius: 12,
      padding: 32,
      textAlign: "center",
      fontSize: 14,
      fontWeight: 800,
      color: "#9CA3AF"
    }),
    s12: DC => ({
      background: DC?.white || "#fff",
      border: `1px solid ${DC?.border || "#DDE8E1"}`,
      borderRadius: 12,
      padding: 32,
      textAlign: "center"
    }),
    s13: DC => ({
      fontSize: 16,
      fontWeight: 900,
      color: DC?.text || "#1A2E20"
    }),
    s14: {
      fontSize: 12,
      color: "#9CA3AF",
      marginTop: 6
    }
  };
  if (user?.role !== "admin" && !user?.allowedPages?.includes("adminReports")) return <Navigate to="/admin/dashboard" replace />;
  const [reports, setReports] = useState([]);
  const [listingMap, setListingMap] = useState({});
  const [imgMap, setImgMap] = useState({});
  const [profileMap, setProfileMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("new");
  const [sourceFilter, setSourceFilter] = useState("");
  const [search, setSearch] = useState("");
  const [groupNotes, setGroupNotes] = useState({});
  const [chatMsgs, setChatMsgs] = useState({});
  const [chatLoading, setChatLoading] = useState({});
  const [blocking, setBlocking] = useState({});
  const [blockStatus, setBlockStatus] = useState({}); // { groupKey: { reporter: bool, reported: bool } }
  const [tabMap, setTabMap] = useState({});
  const [toast, setToast] = useState("");
  function showToast(msg) {
    setToast(msg);
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(""), 2200);
  }
  useEffect(() => {
    load();
  }, []);
  async function load() {
    setLoading(true);
    try {
      const bundle = await loadAdminReportsBundle();
      setReports(bundle.reports);
      setListingMap(bundle.listingMap);
      setImgMap(bundle.imgMap);
      setProfileMap(bundle.profileMap);
    } catch {
      showToast("حدث خطأ أثناء التحميل");
    } finally {
      setLoading(false);
    }
  }
  async function fetchChatMessages(conversationId, reportedAt) {
    if (!conversationId || chatMsgs[conversationId]) return;
    setChatLoading(p => ({
      ...p,
      [conversationId]: true
    }));
    try {
      const msgs = await loadReportChatMessages(conversationId, reportedAt);
      setChatMsgs(p => ({
        ...p,
        [conversationId]: msgs
      }));
    } catch {} finally {
      setChatLoading(p => ({
        ...p,
        [conversationId]: false
      }));
    }
  }
  async function checkBlockStatus(groupKey, reporterId, reportedId) {
    if (!reporterId || !reportedId || blockStatus[groupKey] !== undefined) return;
    setBlockStatus(p => ({
      ...p,
      [groupKey]: p[groupKey] || {}
    }));
    try {
      const status = await getMutualBlockStatus(reporterId, reportedId);
      setBlockStatus(p => ({
        ...p,
        [groupKey]: status
      }));
    } catch {}
  }
  async function blockBothUsers(reporterId, reportedId, groupKey) {
    if (!reporterId || !reportedId) return;
    if (!window.confirm("حظر متبادل بين الطرفين؟ لا يمكن التراجع بسهولة.")) return;
    setBlocking(p => ({
      ...p,
      [groupKey]: true
    }));
    try {
      await blockUsersMutually(reporterId, reportedId);
      showToast("✅ تم الحظر المتبادل");
    } catch {
      showToast("حدث خطأ أثناء الحظر");
    } finally {
      setBlocking(p => ({
        ...p,
        [groupKey]: false
      }));
    }
  }
  async function patchProfile(id, obj) {
    try {
      await patchReportedProfile(id, obj);
    } catch {
      showToast("فشل تحديث المستخدم");
      return;
    }
    setProfileMap(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        ...obj
      }
    }));
    showToast("تم تحديث المستخدم ✓");
  }
  async function toggleListingVisibility(listingId) {
    const listing = listingMap[listingId];
    if (!listing) return;
    const isHidden = listing.admin_status === "flagged" || listing.admin_status === "hidden_by_reports";
    const nextStatus = isHidden ? "approved" : "flagged";
    try {
      await setAdminListingVisibility(listingId, nextStatus);
    } catch {
      showToast("فشل تعديل حالة الإعلان");
      return;
    }
    setListingMap(p => ({
      ...p,
      [listingId]: {
        ...p[listingId],
        admin_status: nextStatus
      }
    }));
    showToast(isHidden ? "تم إظهار الإعلان ✓" : "تم إخفاء الإعلان ✓");
  }
  async function deleteGroupReports(group) {
    const ids = group.reps.map(x => x.id).filter(Boolean);
    if (!ids.length) return;
    const reason = group.reps[0]?.reason || "بلاغ عام";
    const reporter = group.reporter?.name || "مستخدم";
    if (!window.confirm(`حذف نهائي لـ ${ids.length} بلاغ؟\nالمبلغ: ${reporter}\nالسبب: ${reason}\n\nلا يمكن التراجع عن هذا الإجراء.`)) return;
    try {
      await deleteReportsByIds(ids);
    } catch {
      showToast("فشل حذف البلاغات");
      return;
    }
    setReports(prev => prev.filter(x => !ids.includes(x.id)));
    showToast("🗑 تم حذف البلاغات نهائياً");
  }
  async function updateGroupReports(group, status) {
    const ids = group.reps.map(x => x.id).filter(Boolean);
    if (!ids.length) return;
    const payload = {
      status,
      admin_note: (groupNotes[group.key] || "").trim() || null,
      resolved_at: new Date().toISOString(),
      resolved_by: user?.id || null
    };
    try {
      await updateReportsByIds(ids, payload);
    } catch {
      showToast("فشل تحديث البلاغات");
      return;
    }
    setReports(prev => prev.map(x => ids.includes(x.id) ? {
      ...x,
      ...payload
    } : x));
    showToast(status === "resolved" ? "تم إنهاء البلاغات ✓" : "تم تجاهل البلاغات ✓");
  }

  // ── فلترة وتجميع ──────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reports.filter(r => {
      const s = r.status || "pending";
      return statusFilter === "new" ? !["resolved", "dismissed"].includes(s) : ["resolved", "dismissed"].includes(s);
    }).filter(r => !sourceFilter || (r.source || "listing") === sourceFilter).filter(r => {
      if (!q) return true;
      const listing = r.listing_id ? listingMap[r.listing_id] : null;
      const reporter = r.reporter_id ? profileMap[r.reporter_id] : null;
      const reported = r.reported_user_id ? profileMap[r.reported_user_id] : null;
      return [r.reason, r.details, r.source, listing?.title, listing?.city, listing?.district, reporter?.name, reporter?.phone, reported?.name, reported?.phone, String(r.id || ""), String(r.listing_id || "")].filter(Boolean).join(" ").toLowerCase().includes(q);
    });
  }, [reports, statusFilter, sourceFilter, search, listingMap, profileMap]);
  const groups = useMemo(() => {
    const grouped = filtered.reduce((acc, rep) => {
      const key = groupKey(rep);
      if (!acc[key]) acc[key] = [];
      acc[key].push(rep);
      return acc;
    }, {});
    return Object.entries(grouped).map(([key, reps]) => {
      const first = reps[0] || {};
      const listing = first.listing_id ? listingMap[first.listing_id] : null;
      const reporter = first.reporter_id ? profileMap[first.reporter_id] : null;
      const reported = first.source === "listing" ? profileMap[listing?.user_id] || profileMap[first.reported_user_id] : profileMap[first.reported_user_id];
      const reasonsMap = {};
      reps.forEach(rep => {
        const reason = rep.reason || "بلاغ عام";
        reasonsMap[reason] = (reasonsMap[reason] || 0) + 1;
      });
      return {
        key,
        reps,
        source: first.source || "listing",
        listing,
        reporter,
        reported,
        imgs: first.listing_id ? imgMap[first.listing_id] || [] : [],
        topReasons: Object.entries(reasonsMap).sort((a, b) => b[1] - a[1]).slice(0, 3)
      };
    }).sort((a, b) => new Date(b.reps[0]?.created_at || 0) - new Date(a.reps[0]?.created_at || 0));
  }, [filtered, listingMap, profileMap, imgMap]);
  const newCount = countByStatus(reports, "pending") + countByStatus(reports, "reviewed");
  const finishedCount = countByStatus(reports, "resolved") + countByStatus(reports, "dismissed");

  // ── واجهة المستخدم ─────────────────────────────────────────────────────────

  return <div style={reportUi.page(DC)}>

      {/* Toast */}
      {toast && <div style={sx.s1}>
          {toast}
        </div>}

      {/* رأس الصفحة — متناسق مع بقية الأدمن */}
      <div style={S.primaryHero(C.primary)}>
        <IslamicPattern opacity={0.1} color="#FFFFFF" width={430} height={200} />
        <div style={sx.s2}>
          <BackButton onPress={() => setPage("adminDashboard")} />
        </div>
        <div style={S.relZ1}>
          <div style={sx.s3}>🚩 البلاغات</div>
          <div style={sx.s4}>
            <span style={sx.s5}>🚩 {newCount} جديدة</span>
            <span style={S.heroStatWhite12}>✅ {finishedCount} منتهية</span>
            <span style={S.heroStatWhite12}>📂 {groups.length} ملف</span>
          </div>
        </div>
        <Wave />
      </div>

      {/* فلاتر وبحث */}
      <div style={sx.s6(DC)}>
        <div style={sx.s7}>
          <FilterButton active={statusFilter === "new"} onClick={() => setStatusFilter("new")}>جديدة</FilterButton>
          <FilterButton active={statusFilter === "finished"} onClick={() => setStatusFilter("finished")}>منتهية</FilterButton>
        </div>

        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث بالاسم أو الهاتف أو عنوان الإعلان..." style={sx.s8(DC)} />

        <div style={sx.s9}>
          {[["", "الكل"], ["listing", "إعلانات"], ["profile", "مستخدمون"], ["chat", "محادثات"]].map(([val, label]) => <FilterButton key={val} active={sourceFilter === val} onClick={() => setSourceFilter(val)}>{label}</FilterButton>)}
        </div>
      </div>

      {/* المحتوى */}
      <div style={sx.s10}>
        {loading ? <div style={sx.s11(DC)}>
            جاري التحميل...
          </div> : groups.length === 0 ? <div style={sx.s12(DC)}>
            <div style={sx.s13(DC)}>لا توجد نتائج</div>
            <div style={sx.s14}>جرّب تغيير الفلاتر أو البحث</div>
          </div> : groups.map((group, index) => {
        const hasListing = group.source === "listing" && !!group.listing;
        const hasChat = group.source === "chat" && !!group.reps[0]?.conversation_id;
        const defaultTab = hasListing ? "listing" : hasChat ? "chat" : group.reported ? "reported" : "reporter";
        const activeTab = tabMap[group.key] || defaultTab;
        const listingHidden = group.listing?.admin_status === "flagged" || group.listing?.admin_status === "hidden_by_reports";
        const noteValue = groupNotes[group.key] ?? group.reps.find(r => r.admin_note)?.admin_note ?? "";
        const sx = {
          s1: (index, DC) => ({
            background: index % 2 === 0 ? "#E8E8E8" : "#FECDD3",
            border: `1px solid ${DC?.border || "#DDE8E1"}`,
            borderRadius: 12,
            overflow: "hidden",
            marginBottom: 32,
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
          }),
          s2: index => ({
            padding: "12px 12px 10px",
            borderBottom: "1px solid rgba(0,0,0,0.08)",
            background: index % 2 === 0 ? "#D0D0D0" : "#FCA5A5"
          }),
          s3: {
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
            alignItems: "center"
          },
          s4: {
            display: "flex",
            gap: 5,
            flexWrap: "wrap",
            marginTop: 8
          },
          s5: DC => ({
            marginTop: 10,
            background: DC?.bg || "#F3F4F6",
            borderRadius: 12,
            padding: 5,
            display: "flex",
            gap: 5
          }),
          s6: DC => ({
            borderBottom: `1px solid ${DC?.border || "#F3F4F6"}`
          }),
          s7: DC => ({
            padding: "10px 12px 12px",
            borderTop: `1px solid ${DC?.border || "#F3F4F6"}`
          }),
          s8: DC => ({
            fontSize: 11,
            fontWeight: 800,
            color: DC?.text || "#1A2E20",
            marginBottom: 6
          }),
          s9: {
            display: "flex",
            flexDirection: "column",
            gap: 6,
            marginBottom: 10
          },
          s10: DC => ({
            width: "100%",
            padding: "9px 12px",
            borderRadius: 10,
            border: `1px solid ${DC?.border || "#DDE8E1"}`,
            background: DC?.white || "#fff",
            fontSize: 12,
            fontFamily: "inherit",
            outline: "none",
            marginBottom: 8
          }),
          s11: {
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 6
          },
          s12: {
            padding: "10px",
            borderRadius: 10,
            border: "1px solid #BBF7D0",
            background: "#F0FDF4",
            color: "#15803D",
            fontSize: 12,
            fontWeight: 900,
            cursor: "pointer",
            fontFamily: "inherit"
          },
          s13: DC => ({
            padding: "10px",
            borderRadius: 10,
            border: `1px solid ${DC?.border || "#E2E8F0"}`,
            background: DC?.bg || "#F8FAFC",
            color: "#6B7280",
            fontSize: 12,
            fontWeight: 900,
            cursor: "pointer",
            fontFamily: "inherit"
          }),
          s14: {
            padding: "10px",
            borderRadius: 10,
            border: "1px solid #FECACA",
            background: "#FEF2F2",
            color: "#DC2626",
            fontSize: 12,
            fontWeight: 900,
            cursor: "pointer",
            fontFamily: "inherit"
          },
          s15: listingHidden => ({
            gridColumn: "1/-1",
            padding: "10px",
            borderRadius: 10,
            border: `1px solid ${listingHidden ? "#BBF7D0" : "#FED7AA"}`,
            background: listingHidden ? "#F0FDF4" : "#FFF7ED",
            color: listingHidden ? "#15803D" : "#C2410C",
            fontSize: 12,
            fontWeight: 900,
            cursor: "pointer",
            fontFamily: "inherit"
          }),
          s16: {
            marginTop: 6,
            fontSize: 11,
            color: "#9CA3AF"
          }
        };
        return <div key={group.key} style={sx.s1(index, DC)}>

              {/* رأس المجموعة */}
              <div style={sx.s2(index)}>
                <div style={sx.s3}>
                  <Badge bg="#FEF2F2" color="#B91C1C" border="#FECACA">🚩 {group.reps.length} بلاغ</Badge>
                  <Badge>{group.source === "listing" ? "📋 إعلان" : group.source === "profile" ? "👤 ملف" : "💬 محادثة"}</Badge>
                  <Badge>{fmtDate(group.reps[0]?.created_at)}</Badge>
                </div>

                {group.topReasons.length > 0 && <div style={sx.s4}>
                    {group.topReasons.map(([reason, count]) => <Badge key={reason} bg="#FFF7ED" color="#9A3412" border="#FED7AA">
                        {reason}{count > 1 ? ` ×${count}` : ""}
                      </Badge>)}
                  </div>}

                {/* تبويبات */}
                <div style={sx.s5(DC)}>
                  {group.reporter && <TabButton active={activeTab === "reporter"} onClick={() => setTabMap(p => ({
                ...p,
                [group.key]: "reporter"
              }))} bg={C.primary}>
                      👤 المبلغ
                    </TabButton>}
                  {group.reporter && group.reported && (() => {
                const bs = blockStatus[group.key];
                const sx = {
                  s1: {
                    display: "flex",
                    gap: 0,
                    flexShrink: 0,
                    alignItems: "center"
                  },
                  s2: rBlocked => ({
                    width: 18,
                    height: 36,
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    borderRadius: "0 999px 999px 0",
                    background: rBlocked ? "#EF4444" : "linear-gradient(to right,#FEE2E2,#FCA5A5)",
                    transition: "background 0.3s",
                    flexShrink: 0
                  }),
                  s3: edBlocked => ({
                    width: 18,
                    height: 36,
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    borderRadius: "999px 0 0 999px",
                    background: edBlocked ? "#D97706" : "linear-gradient(to left,#FEF9C3,#FCD34D)",
                    transition: "background 0.3s",
                    flexShrink: 0
                  })
                };
                if (bs === undefined) checkBlockStatus(group.key, group.reporter.id, group.reported.id);
                const rBlocked = bs?.reporter === true;
                const edBlocked = bs?.reported === true;
                return <div style={sx.s1}>
                        {/* النصف الأيمن — المبلغ يحظر المبلغ عليه */}
                        <button type="button" onClick={() => {
                    if (rBlocked) {
                      if (!window.confirm(`فك حظر ${group.reporter.name} عن ${group.reported.name}؟`)) return;
                      deleteUserBlock(group.reporter.id, group.reported.id).then(() => {
                        showToast("✅ تم فك الحظر");
                        setBlockStatus(p => ({
                          ...p,
                          [group.key]: {
                            ...(p[group.key] || {}),
                            reporter: false
                          }
                        }));
                      }).catch(() => showToast("حدث خطأ"));
                    } else {
                      if (!window.confirm(`سيتم وضع "${group.reporter.name}" في قائمة حظر "${group.reported.name}".
هل تريد المتابعة؟`)) return;
                      createUserBlock(group.reporter.id, group.reported.id).then(() => {
                        showToast(`✅ ${group.reporter.name} حظر ${group.reported.name}`);
                        setBlockStatus(p => ({
                          ...p,
                          [group.key]: {
                            ...(p[group.key] || {}),
                            reporter: true
                          }
                        }));
                      }).catch(() => showToast("حدث خطأ"));
                    }
                  }} title={rBlocked ? `فك حظر ${group.reporter.name} عن ${group.reported.name}` : `${group.reporter.name} سيحظر ${group.reported.name}`} style={sx.s2(rBlocked)} />
                        {/* النصف الأيسر — المبلغ عليه يحظر المبلغ */}
                        <button type="button" onClick={() => {
                    if (edBlocked) {
                      if (!window.confirm(`فك حظر ${group.reported.name} عن ${group.reporter.name}؟`)) return;
                      deleteUserBlock(group.reported.id, group.reporter.id).then(() => {
                        showToast("✅ تم فك الحظر");
                        setBlockStatus(p => ({
                          ...p,
                          [group.key]: {
                            ...(p[group.key] || {}),
                            reported: false
                          }
                        }));
                      }).catch(() => showToast("حدث خطأ"));
                    } else {
                      if (!window.confirm(`سيتم وضع "${group.reported.name}" في قائمة حظر "${group.reporter.name}".
هل تريد المتابعة؟`)) return;
                      createUserBlock(group.reported.id, group.reporter.id).then(() => {
                        showToast(`✅ ${group.reported.name} حظر ${group.reporter.name}`);
                        setBlockStatus(p => ({
                          ...p,
                          [group.key]: {
                            ...(p[group.key] || {}),
                            reported: true
                          }
                        }));
                      }).catch(() => showToast("حدث خطأ"));
                    }
                  }} title={edBlocked ? `فك حظر ${group.reported.name} عن ${group.reporter.name}` : `${group.reported.name} سيحظر ${group.reporter.name}`} style={sx.s3(edBlocked)} />
                      </div>;
              })()}
                  {group.reported && <TabButton active={activeTab === "reported"} onClick={() => setTabMap(p => ({
                ...p,
                [group.key]: "reported"
              }))} bg="#C8952A">
                      🎯 المبلغ عليه
                    </TabButton>}
                  {hasListing && <TabButton active={activeTab === "listing"} onClick={() => setTabMap(p => ({
                ...p,
                [group.key]: "listing"
              }))} bg="#1A2E20">
                      📋 الإعلان
                    </TabButton>}
                  {hasChat && <TabButton active={activeTab === "chat"} onClick={() => setTabMap(p => ({
                ...p,
                [group.key]: "chat"
              }))} bg="#6366F1">
                      💬 المحادثة
                    </TabButton>}
                </div>
              </div>

              {/* كرت الإعلان */}
              {activeTab === "listing" && hasListing && <div style={sx.s6(DC)}>
                  <ListingCard item={{
              ...group.listing,
              photo: group.imgs[0] || null,
              images: group.imgs,
              seller: group.reported?.name || "—",
              sellerInit: initials(group.reported?.name),
              accountType: "individual",
              daysOld: 0,
              time: "",
              priceNum: parseFloat(group.listing.price || 0)
            }} DC={DC} mode="public" onPress={() => openDetail && openDetail(group.listing, "adminReports")} />
                </div>}

              {/* تبويب المحادثة */}
              {activeTab === "chat" && hasChat && (() => {
            const convId = group.reps[0].conversation_id;
            const reportedAt = group.reps[0]?.created_at;
            const sx = {
              s1: DC => ({
                padding: "12px",
                borderBottom: `1px solid ${DC?.border || "#F3F4F6"}`
              }),
              s2: DC => ({
                fontSize: 11,
                fontWeight: 800,
                color: DC?.text || "#1A2E20",
                marginBottom: 8
              }),
              s3: {
                display: "flex",
                flexDirection: "column",
                gap: 6
              }
            };
            if (!chatMsgs[convId] && !chatLoading[convId]) fetchChatMessages(convId, reportedAt);
            const msgs = chatMsgs[convId];
            const isLoading = chatLoading[convId];
            return <div style={sx.s1(DC)}>
                    <div style={sx.s2(DC)}>
                      💬 آخر 10 رسائل قبل البلاغ
                    </div>
                    {isLoading ? <div style={S.text12LightCentered16}>⏳ جاري التحميل...</div> : !msgs?.length ? <div style={S.text12LightCentered16}>لا توجد رسائل</div> : <div style={sx.s3}>
                        {msgs.map(msg => {
                  const isSender = msg.sender_id === group.reporter?.id;
                  const sx = {
                    s1: isSender => ({
                      display: "flex",
                      flexDirection: "column",
                      alignItems: isSender ? "flex-end" : "flex-start"
                    }),
                    s2: {
                      fontSize: 10,
                      color: "#9CA3AF",
                      marginBottom: 2,
                      paddingRight: 4,
                      paddingLeft: 4
                    },
                    s3: (isSender, DC) => ({
                      maxWidth: "80%",
                      padding: "8px 12px",
                      borderRadius: 12,
                      borderBottomRightRadius: isSender ? 2 : 12,
                      borderBottomLeftRadius: isSender ? 12 : 2,
                      background: isSender ? "#E8F4F0" : "#F3F4F6",
                      fontSize: 12,
                      color: DC?.text || "#1A2E20",
                      lineHeight: 1.7
                    }),
                    s4: {
                      fontSize: 10,
                      color: "#9CA3AF",
                      marginTop: 2,
                      paddingRight: 4,
                      paddingLeft: 4
                    }
                  };
                  return <div key={msg.id} style={sx.s1(isSender)}>
                              <div style={sx.s2}>
                                {msg.profiles?.name || "مستخدم"}
                              </div>
                              <div style={sx.s3(isSender, DC)}>
                                {msg.content}
                              </div>
                              <div style={sx.s4}>
                                {new Date(msg.created_at).toLocaleString("ar", {
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "numeric",
                        month: "short"
                      })}
                              </div>
                            </div>;
                })}
                      </div>}
                  </div>;
          })()}

              {/* رسائل المحادثة — عند source=chat */}
              {group.source === "chat" && activeTab === "listing" && (() => {
            const convId = group.reps[0]?.conversation_id;
            const sx = {
              s1: {
                padding: "12px 14px",
                fontSize: 12,
                color: "#9CA3AF",
                textAlign: "center"
              },
              s2: {
                padding: "10px 12px"
              },
              s3: {
                fontSize: 11,
                fontWeight: 800,
                color: "#9CA3AF",
                marginBottom: 8
              }
            };
            if (!convId) return <div style={sx.s1}>
                    لا يوجد معرف محادثة — يرجى تحديث التطبيق
                  </div>;
            if (!chatMsgs[convId] && !chatLoading[convId]) fetchChatMessages(convId);
            return <div style={sx.s2}>
                    <div style={sx.s3}>💬 آخر رسائل المحادثة</div>
                    {chatLoading[convId] ? <div style={S.text12LightCentered}>جارٍ التحميل...</div> : (chatMsgs[convId] || []).length === 0 ? <div style={S.text12LightCentered}>لا توجد رسائل</div> : (chatMsgs[convId] || []).map(msg => {
                const isReporter = msg.sender_id === group.reporter?.id;
                const sx = {
                  s1: isReporter => ({
                    display: "flex",
                    flexDirection: "column",
                    alignItems: isReporter ? "flex-end" : "flex-start",
                    marginBottom: 6
                  }),
                  s2: {
                    fontSize: 9,
                    color: "#9CA3AF",
                    marginBottom: 2
                  },
                  s3: isReporter => ({
                    maxWidth: "80%",
                    padding: "7px 10px",
                    borderRadius: 10,
                    background: isReporter ? "#E8F4F0" : "#F3F4F6",
                    color: "#1A2E20",
                    fontSize: 12,
                    lineHeight: 1.6,
                    borderBottomRightRadius: isReporter ? 2 : 10,
                    borderBottomLeftRadius: isReporter ? 10 : 2
                  })
                };
                return <div key={msg.id} style={sx.s1(isReporter)}>
                          <div style={sx.s2}>
                            {msg.profiles?.name || "مستخدم"} · {new Date(msg.created_at).toLocaleTimeString("ar", {
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                          </div>
                          <div style={sx.s3(isReporter)}>
                            {msg.content}
                          </div>
                        </div>;
              })}
                  </div>;
          })()}

              {/* كرت المبلغ */}
              {activeTab === "reporter" && group.reporter && <div style={reportUi.pad10}>
                  <div style={S.text10LightStrongMb6}>👤 المبلغ</div>
                  <UserCard u={group.reporter} DC={DC} user={user} onPatch={patchProfile} />
                </div>}

              {/* كرت المبلغ عليه */}
              {activeTab === "reported" && group.reported && <div style={reportUi.pad10}>
                  <div style={S.text10LightStrongMb6}>🎯 المبلغ عليه</div>
                  <UserCard u={group.reported} DC={DC} user={user} onPatch={patchProfile} />
                </div>}


              {/* تفاصيل البلاغات والإجراءات */}
              <div style={sx.s7(DC)}>
                <div style={sx.s8(DC)}>تفاصيل البلاغات</div>
                <div style={sx.s9}>
                  {group.reps.map(rep => {
                const reporter = rep.reporter_id ? profileMap[rep.reporter_id] : null;
                const sx = {
                  s1: DC => ({
                    background: DC?.bg || "#F8FAFC",
                    border: `1px solid ${DC?.border || "#E5E7EB"}`,
                    borderRadius: 10,
                    padding: "8px 10px"
                  }),
                  s2: {
                    fontSize: 12,
                    fontWeight: 900,
                    color: "#B91C1C"
                  },
                  s3: {
                    fontSize: 11,
                    color: "#9CA3AF",
                    marginTop: 3
                  },
                  s4: DC => ({
                    fontSize: 11,
                    color: DC?.text || "#374151",
                    marginTop: 5,
                    lineHeight: 1.7
                  })
                };
                return <div key={rep.id} style={sx.s1(DC)}>
                        <div style={sx.s2}>{rep.reason || "بلاغ عام"}</div>
                        <div style={sx.s3}>{reporter?.name || "مستخدم"} · {fmtDate(rep.created_at)}</div>
                        {rep.details && <div style={sx.s4(DC)}>{rep.details}</div>}
                      </div>;
              })}
                </div>

                <input value={noteValue} onChange={e => setGroupNotes(p => ({
              ...p,
              [group.key]: e.target.value
            }))} placeholder="ملاحظة إدارية على البلاغات..." style={sx.s10(DC)} />

                <div style={sx.s11}>
                  <button type="button" onClick={() => updateGroupReports(group, "resolved")} style={sx.s12}>
                    ✅ إنهاء
                  </button>
                  <button type="button" onClick={() => updateGroupReports(group, "dismissed")} style={sx.s13(DC)}>
                    🗑 تجاهل
                  </button>
                  <button type="button" onClick={() => deleteGroupReports(group)} style={sx.s14}>
                    ❌ حذف
                  </button>
                  {hasListing && <button type="button" onClick={() => toggleListingVisibility(group.listing.id)} style={sx.s15(listingHidden)}>
                      {listingHidden ? "👁 إظهار الإعلان" : "🚫 إخفاء الإعلان"}
                    </button>}
                </div>

                {(isSuspendedActive(group.reporter) && group.reporter?.suspended_until || isSuspendedActive(group.reported) && group.reported?.suspended_until) && <div style={sx.s16}>
                    {isSuspendedActive(group.reporter) && group.reporter?.suspended_until && `المبلغ: ${timeLeft(group.reporter.suspended_until)}`}
                    {isSuspendedActive(group.reporter) && group.reporter?.suspended_until && isSuspendedActive(group.reported) && group.reported?.suspended_until && " · "}
                    {isSuspendedActive(group.reported) && group.reported?.suspended_until && `المبلغ عليه: ${timeLeft(group.reported.suspended_until)}`}
                  </div>}
              </div>

            </div>;
      })}
      </div>
    </div>;
}