import React, { useState, useEffect } from "react";
import { C } from "../../shared/constants/colors.js";
import { IslamicPattern, Wave } from "../../shared/components/icons.jsx";
import { ListingCard } from "../../shared/components/common/ListingCard.jsx";
import { BackButton } from "../../shared/components/common/BackButton.jsx";
import { LoadMoreButton } from "../../shared/components/common/LoadMoreButton.jsx";
import { fetchPendingListings, approveListing, rejectListing, suspendUserById, deletePendingListing } from "../services/adminListingService.js";
import { S } from "../../shared/styles/primitives.js";
function timeAgo(date) {
  const d = Math.floor((Date.now() - new Date(date)) / 60000);
  if (d < 60) return `${d} دقيقة`;
  if (d < 1440) return `${Math.floor(d / 60)} ساعة`;
  return `${Math.floor(d / 1440)} يوم`;
}
export default function PendingPage({
  setPage,
  DC,
  user,
  setDetail,
  setDetailPrevPage,
  onApprove
}) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [suspendUser, setSuspendUser] = useState(false);
  const [visibleCount, setVisibleCount] = useState(20);
  const sx = {
    s1: DC => ({
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      background: DC?.bg || "#F2F5F3",
      fontFamily: "Tajawal,sans-serif",
      direction: "rtl"
    }),
    s2: {
      textAlign: "center",
      padding: "0 24px"
    },
    s3: {
      fontSize: 48,
      marginBottom: 12
    },
    s4: DC => ({
      fontSize: 16,
      fontWeight: 800,
      color: DC?.text || "#1A2E20",
      marginBottom: 8
    }),
    s5: C => ({
      padding: "10px 24px",
      background: C.primary,
      color: "white",
      border: "none",
      borderRadius: 12,
      fontSize: 13,
      fontWeight: 700,
      cursor: "pointer",
      fontFamily: "inherit"
    }),
    s6: DC => ({
      maxWidth: 430,
      margin: "0 auto",
      minHeight: "100vh",
      background: DC?.bg || "#F2F5F3",
      fontFamily: "Tajawal,sans-serif",
      direction: "rtl"
    }),
    s7: {
      position: "absolute",
      top: 14,
      right: 16,
      zIndex: 2
    },
    s8: {
      fontSize: 20,
      fontWeight: 900,
      color: "white"
    },
    s9: {
      fontSize: 12,
      color: "rgba(255,255,255,0.6)",
      marginTop: 4
    },
    s10: {
      padding: "14px",
      paddingBottom: 80
    },
    s11: {
      display: "flex",
      gap: 8,
      marginBottom: 14
    },
    s12: DC => ({
      padding: "9px 12px",
      borderRadius: 10,
      border: "1.5px solid " + (DC?.border || "#DDE8E1"),
      background: DC?.white || "#fff",
      color: DC?.text || "#1A2E20",
      fontSize: 14,
      cursor: "pointer"
    }),
    s13: DC => ({
      textAlign: "center",
      padding: "40px",
      color: DC?.text3 || "#8A9E90"
    }),
    s14: {
      textAlign: "center",
      padding: "40px"
    },
    s15: {
      fontSize: 40,
      marginBottom: 12
    },
    s16: DC => ({
      fontSize: 14,
      fontWeight: 800,
      color: DC?.text || "#1A2E20"
    })
  };
  const canUsePending = user?.role === "admin" || (user?.allowedPages || []).includes("pending");
  useEffect(() => {
    if (!canUsePending) {
      setLoading(false);
      return;
    }
    loadPending();
  }, [canUsePending]);
  if (!canUsePending) {
    return <div style={sx.s1(DC)}>
        <div style={sx.s2}>
          <div style={sx.s3}>🔒</div>
          <div style={sx.s4(DC)}>
            غير مصرّح
          </div>
          <button onClick={() => setPage("home")} style={sx.s5(C)}>
            العودة
          </button>
        </div>
      </div>;
  }
  async function loadPending() {
    setLoading(true);
    const data = await fetchPendingListings();
    setListings(data);
    setLoading(false);
  }
  async function deleteListing(id) {
    if (!window.confirm("حذف هذا الإعلان نهائياً؟")) return;
    await deletePendingListing(id);
    setListings(p => p.filter(l => l.id !== id));
  }
  async function approve(id) {
    await approveListing(id);
    setListings(p => p.filter(l => l.id !== id));
    if (onApprove) onApprove();
  }
  async function reject(id, reason, userId) {
    await rejectListing(id, reason);
    if (suspendUser && userId) {
      await suspendUserById(userId);
    }
    setListings(p => p.filter(l => l.id !== id));
    setRejectId(null);
    setRejectReason("");
    setSuspendUser(false);
  }
  const filtered = listings.filter(l => {
    if (filter === "sale") return l.type !== "want_buy" && l.type !== "want_rent";
    if (filter === "want") return l.type === "want_buy" || l.type === "want_rent";
    return true;
  });
  const salesCount = listings.filter(l => l.type !== "want_buy" && l.type !== "want_rent").length;
  const wantCount = listings.filter(l => l.type === "want_buy" || l.type === "want_rent").length;
  return <div style={sx.s6(DC)}>
      <div style={S.primaryHero(C.primary)}>
        <IslamicPattern opacity={0.1} color="#FFFFFF" width={430} height={200} />
        <div style={sx.s7}>
          <BackButton onPress={() => setPage("profile")} />
        </div>
        <div style={S.relZ1}>
          <div style={sx.s8}>⏳ قيد المراجعة</div>
          <div style={sx.s9}>
            {listings.length} إعلان — 🏠 {salesCount} عرض · 🔍 {wantCount} طلب
          </div>
        </div>
        <Wave />
      </div>

      <div style={sx.s10}>
        <div style={sx.s11}>
          {[["all", "الكل"], ["sale", "🏠 عرض"], ["want", "🔍 طلب"]].map(([v, l]) => {
          const sx = {
            s1: (filter, v, C, DC) => ({
              flex: 1,
              padding: "9px",
              borderRadius: 10,
              border: "1.5px solid " + (filter === v ? C.primary : DC?.border || "#DDE8E1"),
              background: filter === v ? "#E8F4F0" : DC?.white || "#fff",
              color: filter === v ? C.primary : DC?.text || "#1A2E20",
              fontSize: 12,
              fontWeight: 800,
              cursor: "pointer",
              fontFamily: "inherit"
            })
          };
          return <button key={v} onClick={() => setFilter(v)} style={sx.s1(filter, v, C, DC)}>
              {l}
            </button>;
        })}
          <button onClick={loadPending} style={sx.s12(DC)}>
            ↺
          </button>
        </div>

        {loading ? <div style={sx.s13(DC)}>
            ⏳ جارٍ التحميل...
          </div> : filtered.length === 0 ? <div style={sx.s14}>
            <div style={sx.s15}>✅</div>
            <div style={sx.s16(DC)}>
              لا توجد إعلانات قيد المراجعة
            </div>
          </div> : filtered.slice(0, visibleCount).map(l => {
        const isWant = l.type === "want_buy" || l.type === "want_rent";
        const mainImg = l.listing_images?.find(i => i.is_main)?.url || l.listing_images?.[0]?.url || null;
        const sx = {
          s1: {
            padding: "12px 16px",
            background: "#FEF2F2",
            borderRadius: "0 0 14px 14px",
            marginTop: -10,
            marginBottom: 12
          },
          s2: {
            width: "100%",
            padding: "9px 12px",
            borderRadius: 9,
            border: "1.5px solid #FECACA",
            fontSize: 13,
            fontFamily: "Tajawal,sans-serif",
            marginBottom: 10,
            boxSizing: "border-box",
            outline: "none",
            background: "white",
            direction: "rtl"
          },
          s3: {
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 12,
            cursor: "pointer"
          },
          s4: suspendUser => ({
            width: 20,
            height: 20,
            borderRadius: 5,
            border: "2px solid " + (suspendUser ? "#EF4444" : "#FECACA"),
            background: suspendUser ? "#EF4444" : "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0
          }),
          s5: {
            color: "white",
            fontSize: 12,
            fontWeight: 900
          },
          s6: {
            fontSize: 12,
            fontWeight: 700,
            color: "#EF4444"
          },
          s7: {
            flex: 1,
            padding: "10px",
            borderRadius: 9,
            border: "none",
            background: "#EF4444",
            color: "white",
            fontSize: 13,
            fontWeight: 800,
            cursor: "pointer",
            fontFamily: "inherit"
          },
          s8: DC => ({
            flex: 1,
            padding: "10px",
            borderRadius: 9,
            border: "1.5px solid " + (DC?.border || "#DDE8E1"),
            background: DC?.white || "#fff",
            color: DC?.text || "#1A2E20",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit"
          })
        };
        return <React.Fragment key={l.id}>
                <ListingCard item={{
            ...l,
            id: l.id,
            title: l.title || l.category || "—",
            photo: mainImg,
            images: (l.listing_images || []).map(i => i.url),
            video_url: l.video_url || null,
            hasVideo: !!l.video_url,
            city: l.city,
            district: l.district,
            category: l.category,
            price: l.price,
            currency: l.currency,
            seller: l.profiles?.name || "—",
            sellerInit: (l.profiles?.name || "م")[0],
            accountType: "individual",
            daysOld: Math.floor((Date.now() - new Date(l.created_at)) / 86400000),
            time: new Date(l.created_at).toLocaleDateString("ar"),
            timeAgo: `منذ ${timeAgo(l.created_at)}`
          }} mode="pending" DC={DC} onPress={() => {
            if (setDetail) {
              setDetail({
                ...l,
                photo: mainImg,
                images: (l.listing_images || []).sort((a, b) => (b.is_main ? 1 : 0) - (a.is_main ? 1 : 0)).map(i => i.url),
                video_url: l.video_url || null,
                hasVideo: !!l.video_url,
                desc: l.description || "",
                seller: l.profiles?.name || "—",
                sellerInit: (l.profiles?.name || "م")[0],
                sellerId: l.user_id,
                sellerName: l.profiles?.name || "—",
                accountType: l.profiles?.account_type || "individual",
                phone: l.phone || l.profiles?.phone || "",
                _skipFetch: true
              });
            }
            if (setDetailPrevPage) setDetailPrevPage("pending");
            setPage("detail");
          }} onApprovePending={() => approve(l.id)} onRejectPending={() => setRejectId(l.id)} onDeletePending={() => deleteListing(l.id)} />

                {rejectId === l.id && <div style={sx.s1}>
                    <input value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="سبب الرفض (اختياري)" style={sx.s2} />

                    <div onClick={() => setSuspendUser(p => !p)} style={sx.s3}>
                      <div style={sx.s4(suspendUser)}>
                        {suspendUser && <span style={sx.s5}>✓</span>}
                      </div>
                      <span style={sx.s6}>
                        🚫 تعليق حساب المستخدم أيضاً
                      </span>
                    </div>

                    <div style={S.gap8}>
                      <button onClick={() => reject(l.id, rejectReason, l.user_id)} style={sx.s7}>
                        ❌ تأكيد الرفض
                      </button>
                      <button onClick={() => {
                setRejectId(null);
                setRejectReason("");
                setSuspendUser(false);
              }} style={sx.s8(DC)}>
                        إلغاء
                      </button>
                    </div>
                  </div>}
              </React.Fragment>;
      })}

        <LoadMoreButton hasMore={filtered.length > visibleCount} loading={false} onPress={() => setVisibleCount(p => p + 20)} />
      </div>
    </div>;
            }
