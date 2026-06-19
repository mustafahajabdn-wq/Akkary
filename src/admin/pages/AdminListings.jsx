import { Navigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { C } from "../../shared/constants/colors.js";
import { IslamicPattern, Wave } from "../../shared/components/icons.jsx";
import { ListingCard } from "../../shared/components/common/ListingCard.jsx";
import { BackButton } from "../../shared/components/common/BackButton.jsx";
import {
  approveAdminListing,
  deleteAdminListingCascade,
  fetchAdminListings,
  rejectAdminListing,
  toggleAdminListingFlag,
  toggleAdminListingHidden,
} from "../services/adminService.js";
import { enrichAdminListingsEngagement } from "../services/engagementStatsService.js";
import { S } from "../../shared/styles/primitives.js";

function timeAgo(date) {
  const d = Math.floor((Date.now() - new Date(date)) / 60000);
  if (d < 60) return `${d} د`;
  if (d < 1440) return `${Math.floor(d / 60)} س`;
  return `${Math.floor(d / 1440)} يوم`;
}

function cleanListingSearch(value) {
  return String(value || "").trim();
}

function extractListingIdSearch(value) {
  const digits = String(value || "").replace(/\D/g, "").replace(/^0+/, "");
  return digits || null;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("ar-SY");
}

function ListingEngagementStrip({ item, DC }) {
  const metrics = [
    { key: "views", icon: "👁", label: "مشاهدة", color: "#0F766E" },
    { key: "phone_clicks", icon: "📞", label: "هاتف", color: "#1D4ED8" },
    { key: "whatsapp_clicks", icon: "💬", label: "واتساب", color: "#15803D" },
    { key: "favorites_count", icon: "❤️", label: "مفضلة", color: "#BE123C" },
    { key: "conversations_count", icon: "✉️", label: "محادثة", color: "#7C3AED" },
  ];

  return (
    <div
      onClick={event => event.stopPropagation()}
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
        gap: 4,
        background: DC?.white || "#fff",
        border: `1px solid ${DC?.border || "#DDE8E1"}`,
        borderTop: "none",
        borderRadius: "0 0 14px 14px",
        padding: "8px 6px",
        marginTop: -10,
      }}
    >
      {metrics.map(metric => (
        <div
          key={metric.key}
          title={metric.label}
          style={{
            minWidth: 0,
            textAlign: "center",
            borderLeft: metric.key === "conversations_count" ? "none" : `1px solid ${DC?.border || "#E5E7EB"}`,
          }}
        >
          <div style={{ fontSize: 11, lineHeight: 1 }}>{metric.icon}</div>
          <div
            style={{
              fontSize: 13,
              lineHeight: 1.2,
              fontWeight: 900,
              color: metric.color,
              marginTop: 3,
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {formatNumber(item?.[metric.key])}
          </div>
          <div
            style={{
              fontSize: 8,
              fontWeight: 800,
              color: DC?.text3 || "#64748B",
              marginTop: 2,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {metric.label}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminListings({
  setPage,
  DC,
  user,
  setDetail,
  setDetailPrevPage,
  openDetail,
}) {
  const sx = {
    s1: DC => ({
      position: "sticky",
      top: 0,
      zIndex: 10,
      background: DC?.white || "#fff",
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    }),
    s2: DC => ({
      display: "flex",
      borderBottom: `2px solid ${DC?.border || "#E5E7EB"}`,
    }),
    s3: {
      padding: "8px 10px",
      display: "flex",
      gap: 6,
      alignItems: "center",
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
      outline: "none",
    }),
    s5: {
      padding: "10px 14px",
      paddingBottom: 80,
    },
    s6: {
      fontSize: 40,
      marginBottom: 12,
    },
    s7: DC => ({
      fontSize: 14,
      fontWeight: 800,
      color: DC?.text,
    }),
  };

  if (
    user?.role !== "admin" &&
    !(user?.allowedPages || []).includes("adminListings")
  ) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const [listings, setListings] = useState([]);
  const [visibleCount] = useState(20);
  const [loading, setLoading] = useState(true);
  const initialSearch = cleanListingSearch(
    new URLSearchParams(window.location.search).get("q") || ""
  );
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

    const next =
      window.location.pathname +
      (params.toString() ? `?${params.toString()}` : "");

    window.history.replaceState(null, "", next);
  }, [search]);

  async function load() {
    setLoading(true);

    try {
      const data = await fetchAdminListings({
        statusFilter,
        timeFilter,
        listingId: listingIdSearch,
      });

      setListings(await enrichAdminListingsEngagement(data));
    } catch (err) {
      console.error("Failed to load admin listings:", err);
      setListings([]);
    } finally {
      setLoading(false);
    }
  }

  async function toggleHide(listing) {
    const status = await toggleAdminListingHidden(listing);
    setListings(current =>
      current.map(item =>
        item.id === listing.id ? { ...item, status } : item
      )
    );
  }

  async function deleteListing(id) {
    if (
      !window.confirm(
        "حذف هذا الإعلان نهائياً؟ سيتم حذف الصور والرسائل والإشعارات."
      )
    ) {
      return;
    }

    await deleteAdminListingCascade(id);
    setListings(current => current.filter(listing => listing.id !== id));
  }

  async function approveListing(id) {
    await approveAdminListing(id);
    setListings(current => current.filter(listing => listing.id !== id));
  }

  async function unflagListing(listing) {
    const admin_status = await toggleAdminListingFlag(listing);
    setListings(current =>
      current.map(item =>
        item.id === listing.id ? { ...item, admin_status } : item
      )
    );
  }

  async function rejectListing(id) {
    const reason = window.prompt("سبب الرفض (اختياري):") ?? "";
    await rejectAdminListing(id, reason);
    setListings(current => current.filter(listing => listing.id !== id));
  }

  function openListing(listing) {
    if (openDetail) {
      openDetail(listing);
      setDetailPrevPage && setDetailPrevPage("adminListings");
    } else {
      setDetail && setDetail(listing);
      setPage("detail");
    }
  }

  const cleanSearch = search
    .trim()
    .replace(/^#/, "")
    .replace(/^0+(?=\d)/, "");

  const filtered = listings.filter(listing => {
    if (!cleanSearch) return true;

    const haystack = [
      listing.id,
      String(listing.id || "").padStart(10, "0"),
      listing.title,
      listing.city,
      listing.district,
      listing.category,
      listing.profiles?.name,
    ]
      .filter(Boolean)
      .map(value => String(value).toLowerCase());

    const needle = cleanSearch.toLowerCase();
    return haystack.some(value => value.includes(needle));
  });

  return (
    <div style={S.pageShell(DC)}>
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

      <div style={sx.s1(DC)}>
        <div style={sx.s2(DC)}>
          {[
            ["all", "📋", "الكل", "#334155", "#F1F5F9"],
            ["active", "🟢", "نشط", C.primary, "#E8F4F0"],
            ["pending", "⏳", "معلق", "#D97706", "#FEF3C7"],
            ["hidden", "🙈", "مخفي", "#6B7280", "#F3F4F6"],
            ["flagged", "🛠️", "مخفي إداري", "#DC2626", "#FEF2F2"],
            ["hidden_by_reports", "🚩", "بلاغات", "#B45309", "#FFF7ED"],
            ["rejected", "❌", "مرفوض", "#DC2626", "#FEE2E2"],
          ].map(([value, icon, label, color, background]) => {
            const active = statusFilter === value;

            return (
              <button
                key={value}
                onClick={() => setStatusFilter(value)}
                style={{
                  flex: 1,
                  padding: "10px 4px",
                  border: "none",
                  borderBottom: active
                    ? `3px solid ${color}`
                    : "3px solid transparent",
                  background: active ? background : "transparent",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 2,
                  transition: "all 0.15s",
                  marginBottom: -2,
                }}
              >
                <span style={{ fontSize: 15 }}>{icon}</span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: active ? color : "#9CA3AF",
                  }}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>

        <div style={sx.s3}>
          {[
            ["all", "الكل"],
            ["today", "اليوم"],
            ["week", "أسبوع"],
            ["month", "شهر"],
          ].map(([value, label]) => {
            const active = timeFilter === value;

            return (
              <button
                key={value}
                onClick={() => setTimeFilter(value)}
                style={{
                  padding: "5px 10px",
                  borderRadius: 20,
                  border: active
                    ? "1.5px solid #7C3AED"
                    : `1.5px solid ${DC?.border || "#DDE8E1"}`,
                  background: active ? "#7C3AED" : "transparent",
                  color: active ? "#fff" : DC?.text3 || "#6B7280",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {label}
              </button>
            );
          })}

          <input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="بحث بالعنوان، المدينة، صاحب الإعلان أو رقم الإعلان..."
            style={sx.s4(DC)}
          />
        </div>
      </div>

      <div style={sx.s5}>
        {loading ? (
          <div style={S.emptyStateCentered}>⏳</div>
        ) : filtered.length === 0 ? (
          <div style={S.emptyStateCentered}>
            <div style={sx.s6}>🏠</div>
            <div style={sx.s7(DC)}>لا توجد إعلانات</div>
          </div>
        ) : (
          filtered.slice(0, visibleCount).map(listing => {
            const cardItem = {
              ...listing,
              title: listing.title || listing.category || "—",
              photo:
                listing.listing_images?.find(image => image.is_main)?.url ||
                listing.listing_images?.[0]?.url ||
                null,
              images: (listing.listing_images || []).map(image => image.url),
              seller: listing.profiles?.name || "—",
              sellerInit: (listing.profiles?.name || "م")[0],
              accountType: "individual",
              daysOld: Math.floor(
                (Date.now() - new Date(listing.created_at)) / 86400000
              ),
              time: "منذ " + timeAgo(listing.created_at),
            };

            return (
              <div key={listing.id} style={{ marginBottom: 14 }}>
                <ListingCard
                  DC={DC}
                  mode="admin"
                  item={cardItem}
                  onPress={() => openListing(listing)}
                  onHide={() => toggleHide(listing)}
                  onUnflag={() => unflagListing(listing)}
                  onDelete={() => deleteListing(listing.id)}
                  onApprove={() => approveListing(listing.id)}
                  onReject={() => rejectListing(listing.id)}
                  onEdit={() =>
                    window.open(`/admin/edit-listing/${listing.id}`, "_blank")
                  }
                />
                <ListingEngagementStrip item={listing} DC={DC} />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
