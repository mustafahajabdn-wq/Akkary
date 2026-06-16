import { Navigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { C } from "../../shared/constants/colors.js";
import { IslamicPattern, Wave } from "../../shared/components/icons.jsx";
import { ListingCard } from "../../shared/components/common/ListingCard.jsx";
import { LISTING_MAX_DAYS } from "../../shared/utils/listing.js";
import { BackButton } from "../../shared/components/common/BackButton.jsx";
import { approveAdminListing, deleteAdminListingCascade, extendAdminListing, fetchAdminListings, rejectAdminListing, toggleAdminListingFlag, toggleAdminListingHidden } from "../services/adminService.js";
import { S } from "../../shared/styles/primitives.js";

// LISTING_MAX_DAYS — يُحدد حسب نوع الإعلان

function timeAgo(date) {
  const d = Math.floor((Date.now() - new Date(date)) / 60000);
  if (d < 60) return `${d} د`;
  if (d < 1440) return `${Math.floor(d / 60)} س`;
  return `${Math.floor(d / 1440)} يوم`;
}
function daysLeft(createdAt) {
  if (!createdAt) return null;
  const d = Math.ceil((new Date(createdAt).getTime() + LISTING_MAX_DAYS * 86400000 - Date.now()) / 86400000);
  return d;
}
function cleanListingSearch(value) {
  return String(value || "").trim();
}

function extractListingIdSearch(value) {
  const digits = String(value || "").replace(/\D/g, "").replace(/^0+/, "");
  return digits || null;
}

function ExpiryBar({
  createdAt,
  expiresAt,
  maxDays = 90
}) {
  let left, pct, color;
  const sx = {
    s1: {
      marginTop: 8
    },
    s2: {
      display: "flex",
      justifyContent: "space-between",
      fontSize: 10,
      color: "#6B7280",
      marginBottom: 3,
      fontWeight: 700
    },
    s3: color => ({
      color
    }),
    s4: {
      height: 4,
      borderRadius: 2,
      background: "#E5E7EB",
      overflow: "hidden"
    },
    s5: (pct, color) => ({
      height: "100%",
      width: `${pct}%`,
      background: color,
      borderRadius: 2
    })
  };
  if (expiresAt) {
    left = Math.ceil((new Date(expiresAt) - Date.now()) / 86400000);
    pct = Math.max(0, Math.min(100, Math.round(left / maxDays * 100)));
  } else if (createdAt) {
    left = daysLeft(createdAt);
    pct = Math.max(0, Math.min(100, Math.round((left || 0) / maxDays * 100)));
  } else return null;
  color = left <= 3 ? "#EF4444" : left <= 7 ? "#C8952A" : C.primary;
  return <div style={sx.s1}>
      <div style={sx.s2}>
        <span>انتهاء الإعلان</span>
        <span style={sx.s3(color)}>{left <= 0 ? "⚠️ انتهى" : `${left} يوم متبقي`}</span>
      </div>
      <div style={sx.s4}>
        <div style={sx.s5(pct, color)} />
      </div>
    </div>;
}
export default function AdminListings({
  setPage,
  DC,
  user,
  setDetail,
  setDetailPrevPage,
  openDetail
}) {
  const sx = {
    s1: DC => ({
      position: "sticky",
      top: 0,
      zIndex: 10,
      background: DC?.white || "#fff",
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
    }),
    s2: DC => ({
      display: "flex",
      borderBottom: `2px solid ${DC?.border || "#E5E7EB"}`
    }),
    s3: {
      padding: "8px 10px",
      display: "flex",
      gap: 6,
      alignItems: "center"
    },
    s4: DC => ({
      flex: 1,
      minWidth: 0,
      padding: "5px 10px",
      borderRadius: 20,
      border: `1.5px solid ${DC?.border || "#DDE8E1"}`,
      fontSize: 12,
      fontFamily: "inherit",
      background: DC?.bg || "#F2F5F3",
      color: DC?.text || "#1A2E20",
      outline: "none"
    }),
    s5: {
      padding: "10px 14px",
      paddingBottom: 80
    },
    s6: {
      fontSize: 40,
      marginBottom: 12
    },
    s7: DC => ({
      fontSize: 14,
      fontWeight: 800,
      color: DC?.text
    })
  };
  if (user?.role !== "admin" && !(user?.allowedPages || []).includes("adminListings")) return <Navigate to="/admin/dashboard" replace />;
  const [durations, setDurations] = React.useState({
    sell: 90,
    rent: 60,
    want_buy: 30,
    want_rent: 30
  });
  const [listings, setListings] = useState([]);
  const [visibleCount, setVisibleCount] = React.useState(20);
  const [loading, setLoading] = useState(true);
  const initialSearch = cleanListingSearch(new URLSearchParams(window.location.search).get("q") || "");
  const [statusFilter, setStatusFilter] = useState(initialSearch ? "all" : "active");
  const [timeFilter, setTimeFilter] = useState("all");
  const [search, setSearch] = useState(initialSearch);
  const listingIdSearch = extractListingIdSearch(search);

  useEffect(() => {
    load();
  }, [statusFilter, timeFilter, listingIdSearch]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (search) params.set("q", search);
    else params.delete("q");

    const next = window.location.pathname + (params.toString() ? `?${params.toString()}` : "");
    window.history.replaceState(null, "", next);
  }, [search]);

  async function load() {
    setLoading(true);

    try {
      const data = await fetchAdminListings({
        statusFilter,
        timeFilter,
        listingId: listingIdSearch
      });
      setListings(data);
    } catch (err) {
      console.error("Failed to load admin listings:", err);
      setListings([]);
    } finally {
      setLoading(false);
    }
  }
  async function toggleHide(l) {
    const status = await toggleAdminListingHidden(l);
    setListings(p => p.map(x => x.id === l.id ? {
      ...x,
      status
    } : x));
  }
  async function deleteListing(id) {
    if (!window.confirm("حذف هذا الإعلان نهائياً؟ سيتم حذف الصور والرسائل والإشعارات.")) return;
    await deleteAdminListingCascade(id);
    setListings(p => p.filter(l => l.id !== id));
  }
  async function approveListing(id) {
    await approveAdminListing(id);
    setListings(p => p.filter(l => l.id !== id));
  }
  async function unflagListing(l) {
    const admin_status = await toggleAdminListingFlag(l);
    setListings(p => p.map(x => x.id === l.id ? {
      ...x,
      admin_status
    } : x));
  }
  async function rejectListing(id) {
    const reason = window.prompt("سبب الرفض (اختياري):") ?? "";
    await rejectAdminListing(id, reason);
    setListings(p => p.filter(l => l.id !== id));
  }
  async function extendListing(id, days) {
    const listing = listings.find(l => l.id === id);
    const expires_at = await extendAdminListing(id, listing, days);
    setListings(p => p.map(l => l.id === id ? {
      ...l,
      expires_at
    } : l));
  }
  function openListing(l) {
    if (openDetail) {
      openDetail(l);
      setDetailPrevPage && setDetailPrevPage("adminListings");
    } else {
      setDetail && setDetail(l);
      setPage("detail");
    }
  }
  const cleanSearch = search.trim().replace(/^#/, "").replace(/^0+(?=\d)/, "");
  const filtered = listings.filter(l => {
    if (!cleanSearch) return true;

    const haystack = [
      l.id,
      String(l.id || "").padStart(10, "0"),
      l.title,
      l.city,
      l.district,
      l.category,
      l.profiles?.name
    ]
      .filter(Boolean)
      .map(v => String(v).toLowerCase());

    const needle = cleanSearch.toLowerCase();
    return haystack.some(v => v.includes(needle));
  });
  return <div style={S.pageShell(DC)}>
      <div style={S.primaryHero(C.primary)}>
        <IslamicPattern opacity={0.1} color="#FFFFFF" width={430} height={200} />
        <div style={S.absTopRight14}>
          <BackButton onPress={() => setPage("adminDashboard")} />
        </div>
        <div style={S.relZ1}>
          <div style={S.title20White}>🏠 كل الإعلانات</div>
          <div style={S.whiteMeta12}>{filtered.length} إعلان</div>
        </div>
        <Wave />
      </div>

      {/* شريط الفلاتر الثابت */}
      <div style={sx.s1(DC)}>

        {/* تبويبات الحالة */}
        <div style={sx.s2(DC)}>
          {[["all", "📋", "الكل", "#334155", "#F1F5F9"], ["active", "🟢", "نشط", C.primary, "#E8F4F0"], ["pending", "⏳", "معلق", "#D97706", "#FEF3C7"], ["hidden", "🙈", "مخفي", "#6B7280", "#F3F4F6"], ["flagged", "🛠️", "مخفي إداري", "#DC2626", "#FEF2F2"], ["hidden_by_reports", "🚩", "بلاغات", "#B45309", "#FFF7ED"], ["rejected", "❌", "مرفوض", "#DC2626", "#FEE2E2"]].map(([v, icon, label, color, bg]) => {
          const sx = {
            s1: (statusFilter, v, color, bg) => ({
              flex: 1,
              padding: "10px 4px",
              border: "none",
              borderBottom: statusFilter === v ? `3px solid ${color}` : "3px solid transparent",
              background: statusFilter === v ? bg : "transparent",
              cursor: "pointer",
              fontFamily: "inherit",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              transition: "all 0.15s",
              marginBottom: -2
            }),
            s2: {
              fontSize: 15
            },
            s3: (statusFilter, v, color) => ({
              fontSize: 10,
              fontWeight: 800,
              color: statusFilter === v ? color : "#9CA3AF"
            })
          };
          return <button key={v} onClick={() => setStatusFilter(v)} style={sx.s1(statusFilter, v, color, bg)}>
              <span style={sx.s2}>{icon}</span>
              <span style={sx.s3(statusFilter, v, color)}>{label}</span>
            </button>;
        })}
        </div>

        {/* شريط الوقت + البحث */}
        <div style={sx.s3}>
          {[["all", "الكل"], ["today", "اليوم"], ["week", "أسبوع"], ["month", "شهر"]].map(([v, label]) => {
          const sx = {
            s1: (timeFilter, v, DC) => ({
              padding: "5px 10px",
              borderRadius: 20,
              border: timeFilter === v ? "1.5px solid #7C3AED" : `1.5px solid ${DC?.border || "#DDE8E1"}`,
              background: timeFilter === v ? "#7C3AED" : "transparent",
              color: timeFilter === v ? "#fff" : DC?.text3 || "#6B7280",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
              whiteSpace: "nowrap",
              flexShrink: 0
            })
          };
          return <button key={v} onClick={() => setTimeFilter(v)} style={sx.s1(timeFilter, v, DC)}>{label}</button>;
        })}
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="بحث بالعنوان، المدينة، صاحب الإعلان أو رقم الإعلان..."
            style={sx.s4(DC)}
          />
        </div>
      </div>

      <div style={sx.s5}>
        {loading ? <div style={S.emptyStateCentered}>⏳</div> : filtered.length === 0 ? <div style={S.emptyStateCentered}>
              <div style={sx.s6}>🏠</div>
              <div style={sx.s7(DC)}>لا توجد إعلانات</div>
            </div> : filtered.slice(0, visibleCount).map(l => <ListingCard key={l.id} DC={DC} mode="admin" item={{
        ...l,
        title: l.title || l.category || "—",
        photo: l.listing_images?.find(i => i.is_main)?.url || l.listing_images?.[0]?.url || null,
        images: (l.listing_images || []).map(i => i.url),
        seller: l.profiles?.name || "—",
        sellerInit: (l.profiles?.name || "م")[0],
        accountType: "individual",
        daysOld: Math.floor((Date.now() - new Date(l.created_at)) / 86400000),
        time: "منذ " + timeAgo(l.created_at)
      }} onPress={() => openDetail(l)} onHide={() => toggleHide(l)} onUnflag={() => unflagListing(l)} onDelete={() => deleteListing(l.id)} onApprove={() => approveListing(l.id)} onReject={() => rejectListing(l.id)} onEdit={() => window.open(`/admin/edit-listing/${l.id}`, "_blank")} />)}
      </div>
    </div>;
}
