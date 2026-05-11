import React, { useState, useEffect } from "react";
import { C } from "../../shared/constants/colors.js";
import { IslamicPattern, Wave } from "../../shared/components/icons.jsx";
import { LISTING_MAX_DAYS, getStale, freshBar } from "../../shared/utils/listing.js";
import { OwnershipTag } from "../../shared/components/common/Badges.jsx";
import { WeeklyReport } from "../components/common/WeeklyReport.jsx";
import { ListingCard } from "../../shared/components/common/ListingCard.jsx";
import { BackButton } from "../../shared/components/common/BackButton.jsx";
import { LoadMoreButton } from "../../shared/components/common/LoadMoreButton.jsx";
import { EditListingModal, DeleteConfirmModal } from "../components/modals.jsx";
import { fetchMyListings } from "../services/userService.js";
import {
  fetchListingDetail,
  updateListingStatus,
  deleteListingCompletely,
  bumpListingById
} from "../services/listingService.js";
import { S, mergeStyles } from "../../shared/styles/primitives.js";

function MyListingsPage({
  setPage,
  DC,
  lang,
  user,
  myListings,
  setMyListings,
  setDetail,
  openDetail,
  setDetailPrevPage
}) {
  const sx = {
    s1: DC => ({
      background: DC.bg,
      minHeight: "100vh",
      paddingBottom: 30
    }),
    s2: C => ({
      background: C.primary,
      padding: "48px 16px 50px",
      position: "relative",
      overflow: "hidden"
    }),
    s3: {
      position: "relative",
      zIndex: 1,
      textAlign: "center"
    },
    s4: C => ({
      fontSize: 20,
      fontWeight: 900,
      color: C.white,
      marginBottom: 8
    }),
    s5: {
      background: "rgba(255,255,255,0.2)",
      border: "none",
      borderRadius: 20,
      padding: "5px 14px",
      color: "white",
      fontSize: 12,
      fontWeight: 700,
      cursor: "pointer",
      fontFamily: "inherit",
      marginBottom: 12
    },
    s6: {
      display: "flex",
      justifyContent: "center",
      gap: 0
    },
    s7: {
      padding: "11px 14px",
      background: "#FFFBEB",
      border: "1px solid #FCD34D",
      borderRadius: 12,
      display: "flex",
      gap: 10,
      alignItems: "flex-start",
      marginBottom: 12
    },
    s8: {
      fontSize: 18,
      flexShrink: 0
    },
    s9: {
      fontSize: 13,
      fontWeight: 800,
      color: "#92400E"
    },
    s10: {
      display: "block",
      color: "#DC2626"
    },
    s11: {
      display: "block",
      color: "#B45309"
    },
    s12: {
      display: "block",
      color: "#DC2626"
    },
    s13: {
      fontSize: 11,
      color: "#78350F",
      marginTop: 2,
      lineHeight: 1.6
    },
    s14: C => ({
      textAlign: "center",
      padding: "50px 0",
      color: C.text3
    }),
    s15: C => ({
      fontSize: 15,
      fontWeight: 700,
      color: C.text,
      marginTop: 12
    }),
    s16: C => ({
      marginTop: 16,
      padding: "11px 26px",
      background: C.primary,
      color: "white",
      border: "none",
      borderRadius: 10,
      fontSize: 13,
      fontWeight: 700,
      fontFamily: "Tajawal, sans-serif",
      cursor: "pointer"
    }),
    s17: C => ({
      width: "100%",
      padding: "13px",
      background: C.primary,
      color: "white",
      border: "none",
      borderRadius: 11,
      fontSize: 14,
      fontWeight: 700,
      fontFamily: "Tajawal, sans-serif",
      cursor: "pointer",
      marginTop: 4
    })
  };

  if (!DC) DC = C;

  const [visibleCount, setVisibleCount] = React.useState(20);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [showRpt, setShowRpt] = useState(false);

  const isMissingListingError = err => {
    const msg = String(err?.message || err || "");
    return (
      msg.includes("الإعلان غير موجود") ||
      msg.includes("رقم الإعلان غير موجود") ||
      msg.toLowerCase().includes("not found")
    );
  };

  const removeListingLocally = id => {
    setMyListings(prev => prev.filter(l => String(l.id) !== String(id)));
  };

  const loadMyListings = () => {
    if (!user?.id) {
      setMyListings([]);
      return;
    }

    fetchMyListings(user.id)
      .then(data => setMyListings(data || []))
      .catch(err => {
        console.error("Failed to load my listings:", err);
        setMyListings([]);
      });
  };

  const openListing = async item => {
    if (!openDetail || !item?.id) return;

    try {
      const detailItem = await fetchListingDetail(item.id, {
        publicOnly: false
      });

      if (!detailItem) {
        removeListingLocally(item.id);
        return;
      }

      openDetail(detailItem, "myListings");
    } catch (err) {
      if (isMissingListingError(err)) {
        removeListingLocally(item.id);
        return;
      }

      console.error("Failed to open listing:", err);
      alert("تعذر فتح الإعلان حالياً. حاول مرة أخرى.");
    }
  };

  useEffect(() => {
    loadMyListings();
  }, [user?.id]);

  const toggleStatus = async id => {
    const item = myListings.find(l => l.id === id);

    if (
      !item ||
      item.admin_status === "pending" ||
      item.admin_status === "rejected" ||
      item.admin_status === "flagged" ||
      item.admin_status === "hidden_by_reports"
    ) {
      return;
    }

    const newStatus = item.status === "active" ? "hidden" : "active";

    try {
      await updateListingStatus(id, newStatus);

      setMyListings(prev =>
        prev.map(l =>
          l.id === id
            ? {
                ...l,
                status: newStatus
              }
            : l
        )
      );
    } catch (err) {
      if (isMissingListingError(err)) {
        removeListingLocally(id);
        return;
      }

      console.error("Failed to update listing status:", err);
      alert("تعذر تحديث حالة الإعلان حالياً. حاول مرة أخرى.");
    }
  };

  const getItemStatus = item => {
    if (item.admin_status === "pending") {
      return {
        label: "⏳ قيد المراجعة",
        color: "#C8952A",
        bg: "#FEF3C7",
        reason: null
      };
    }

    if (item.admin_status === "rejected") {
      return {
        label: "❌ مرفوض",
        color: "#DC2626",
        bg: "#FEF2F2",
        reason: item.rejection_reason
      };
    }

    if (item.admin_status === "flagged") {
      return {
        label: "🚫 مخفي إداريًا",
        color: "#DC2626",
        bg: "#FEF2F2",
        reason: item.rejection_reason
      };
    }

    if (item.admin_status === "hidden_by_reports") {
      return {
        label: "🚩 مخفي بسبب البلاغات",
        color: "#B45309",
        bg: "#FFF7ED",
        reason: item.rejection_reason
      };
    }

    if (item.status === "hidden") {
      return {
        label: "○ مخفي",
        color: C.text3,
        bg: C.bg,
        reason: null
      };
    }

    if (item.status === "active" && item.admin_status === "approved") {
      return {
        label: "● نشط",
        color: C.primary,
        bg: "#E8F4F0",
        reason: null
      };
    }

    return {
      label: "⏳ قيد المراجعة",
      color: "#C8952A",
      bg: "#FEF3C7",
      reason: null
    };
  };

  const deleteItem = async id => {
    try {
      await deleteListingCompletely(id);
      removeListingLocally(id);
    } catch (err) {
      if (isMissingListingError(err)) {
        removeListingLocally(id);
      } else {
        console.error("Failed to delete listing:", err);
        alert("تعذر حذف الإعلان حالياً. حاول مرة أخرى.");
      }
    } finally {
      setDeleting(null);
    }
  };

  const activeCount = myListings.filter(
    l => l.status === "active" && l.admin_status === "approved"
  ).length;

  const hiddenCount = myListings.filter(l => l.status === "hidden").length;

  const pendingCount = myListings.filter(
    l => l.admin_status === "pending"
  ).length;

  return (
    <div style={sx.s1(DC)}>
      {editing && (
        <EditListingModal
          listing={editing}
          onClose={() => setEditing(null)}
          onSave={updated => {
            setMyListings(prev =>
              prev.map(l =>
                l.id === updated.id
                  ? {
                      ...l,
                      ...updated
                    }
                  : l
              )
            );
          }}
        />
      )}

      {deleting && (
        <DeleteConfirmModal
          listing={deleting}
          onClose={() => setDeleting(null)}
          onConfirm={deleteItem}
        />
      )}

      <div style={sx.s2(C)}>
        <IslamicPattern opacity={0.1} color="#FFFFFF" />

        <div style={S.absTopRight14}>
          <BackButton onPress={() => setPage("profile")} />
        </div>

        <div style={sx.s3}>
          <div style={sx.s4(C)}>إعلاناتي</div>

          <button onClick={() => setShowRpt(r => !r)} style={sx.s5}>
            {showRpt ? "▲ إخفاء التقرير" : "📊 التقرير الإجمالي"}
          </button>

          <div style={sx.s6}>
            {[
              [String(myListings.length), "إجمالي"],
              [String(activeCount), "نشط"],
              [String(hiddenCount), "مخفي"],
              [String(pendingCount), "مراجعة"]
            ].map(([n, l], i) => {
              const sx = {
                s1: i => ({
                  flex: 1,
                  textAlign: "center",
                  borderRight:
                    i < 2 ? "1px solid rgba(255,255,255,0.15)" : "none"
                }),
                s2: C => ({
                  fontSize: 22,
                  fontWeight: 900,
                  color: C.gold2
                }),
                s3: {
                  fontSize: 11,
                  color: "rgba(255,255,255,0.5)"
                }
              };

              return (
                <div key={i} style={sx.s1(i)}>
                  <div style={sx.s2(C)}>{n}</div>
                  <div style={sx.s3}>{l}</div>
                </div>
              );
            })}
          </div>
        </div>

        <Wave />
      </div>

      <div style={S.pad14}>
        {myListings.some(
          l =>
            l.admin_status === "pending" ||
            l.admin_status === "rejected" ||
            l.admin_status === "flagged" ||
            l.admin_status === "hidden_by_reports"
        ) && (
          <div style={sx.s7}>
            <span style={sx.s8}>⏳</span>

            <div>
              <div style={sx.s9}>
                {myListings.some(l => l.admin_status === "pending") &&
                  "⏳ بعض إعلاناتك قيد المراجعة"}

                {myListings.some(l => l.admin_status === "flagged") && (
                  <span style={sx.s10}>🚫 بعض إعلاناتك مخفية إداريًا</span>
                )}

                {myListings.some(
                  l => l.admin_status === "hidden_by_reports"
                ) && (
                  <span style={sx.s11}>
                    🚩 بعض إعلاناتك مخفية بسبب البلاغات وتحتاج مراجعة
                  </span>
                )}

                {myListings.some(l => l.admin_status === "rejected") && (
                  <span style={sx.s12}>❌ بعض إعلاناتك مرفوضة</span>
                )}
              </div>

              <div style={sx.s13}>تواصل مع الدعم لمزيد من المعلومات.</div>
            </div>
          </div>
        )}

        {myListings.length === 0 && (
          <div style={sx.s14(C)}>
            <div style={S.font48}>{"📋"}</div>
            <div style={sx.s15(C)}>لا توجد إعلانات</div>

            <button onClick={() => setPage("add")} style={sx.s16(C)}>
              + أضف إعلانك الأول
            </button>
          </div>
        )}

        {showRpt && <WeeklyReport items={myListings} DC={DC} />}

        {myListings.slice(0, visibleCount).map(item => {
          return (
            <ListingCard
              key={item.id}
              item={{
                ...item,
                seller: item.seller || user?.name || "أنا",
                sellerInit: (user?.name || "أ")[0],
                accountType:
                  item.accountType || user?.accountType || "individual",
                verified: user?.verified,
                daysOld: item.daysOld,
                expires_at: item.expires_at,
                created_at: item.created_at,
                time: item.time || ""
              }}
              mode="owner"
              DC={DC}
              onPress={() => openListing(item)}
              onBump={() => {
                const now = new Date().toISOString();

                setMyListings(p =>
                  p.map(i =>
                    i.id === item.id
                      ? {
                          ...i,
                          daysOld: 0,
                          created_at: now,
                          time: "منذ 0 د"
                        }
                      : i
                  )
                );

                bumpListingById(item.id).catch(err => {
                  console.error("Failed to bump listing:", err);
                });
              }}
              onEdit={() => setEditing(item)}
              onToggleStatus={() => toggleStatus(item.id)}
              onDelete={() => setDeleting(item)}
            />
          );
        })}

        <LoadMoreButton
          hasMore={myListings.length > visibleCount}
          loading={false}
          onPress={() => setVisibleCount(p => p + 20)}
        />

        <button onClick={() => setPage("add")} style={sx.s17(C)}>
          + إضافة إعلان جديد
        </button>
      </div>
    </div>
  );
}

export default MyListingsPage;
