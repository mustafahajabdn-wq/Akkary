import { Navigate } from "react-router-dom";
import { BackButton } from "../../shared/components/common/BackButton.jsx";
import { LoadMoreButton } from "../../shared/components/common/LoadMoreButton.jsx";
import { ListingCard } from "../../shared/components/common/ListingCard.jsx";
import React, { useState, useEffect } from "react";
import { fetchAdminUserDetail, patchAdminUserProfile } from "../services/adminService.js";
import { C } from "../../shared/constants/colors.js";
import { IslamicPattern, Wave } from "../../shared/components/icons.jsx";
import { S } from "../../shared/styles/primitives.js";
import { fDate } from "../../shared/utils/formatters.js";
const ROLE_OPTIONS = [
  { value: "user", label: "👤 مستخدم عادي — Level 0" },
  { value: "support", label: "🟢 دعم — Level 1" },
  { value: "moderator", label: "🟡 مشرف — Level 2" }
];

function getRoleLabel(role) {
  return ROLE_OPTIONS.find(option => option.value === (role || "user"))?.label || "👤 مستخدم عادي — Level 0";
}

export default function AdminUserDetail({
  setPage,
  DC,
  user,
  targetUser
}) {
  const [profile, setProfile] = useState(null);
  const [listings, setListings] = useState([]);
  const [stats, setStats] = useState(null);
  const [visibleCount, setVisibleCount] = React.useState(20);
  const [loading, setLoading] = useState(true);
  const sx = {
    s1: DC => ({
      background: DC?.white || "#fff",
      borderRadius: 12,
      border: "1.5px solid " + (DC?.border || "#DDE8E1"),
      padding: "14px 16px",
      marginBottom: 12
    }),
    s2: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      marginBottom: 12
    },
    s3: C => ({
      width: 50,
      height: 50,
      borderRadius: "50%",
      background: C.primary,
      color: "white",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 22,
      fontWeight: 900
    }),
    s4: DC => ({
      fontSize: 15,
      fontWeight: 900,
      color: DC?.text || "#1A2E20"
    }),
    s5: {
      fontSize: 12,
      color: "#6B7280",
      direction: "ltr"
    },
    s6: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap",
      marginBottom: 12
    },
    s7: C => ({
      fontSize: 11,
      fontWeight: 700,
      color: C.primary,
      background: "#E8F4F0",
      padding: "3px 10px",
      borderRadius: 20
    }),
    s8: {
      fontSize: 11,
      fontWeight: 700,
      color: "#EF4444",
      background: "#FEF2F2",
      padding: "3px 10px",
      borderRadius: 20
    },
    s9: {
      fontSize: 11,
      fontWeight: 700,
      color: "#7C3AED",
      background: "#EDE9FE",
      padding: "3px 10px",
      borderRadius: 20
    },
    s10: {
      fontSize: 11,
      fontWeight: 700,
      color: "#6B7280",
      background: "#F3F4F6",
      padding: "3px 10px",
      borderRadius: 20
    },
    s11: {
      display: "flex",
      gap: 6,
      flexWrap: "wrap"
    },
    s12: profile => ({
      flex: 1,
      padding: "8px",
      borderRadius: 8,
      border: "1.5px solid " + (profile?.verified ? "#FECACA" : "#BBF7D0"),
      background: profile?.verified ? "#FEF2F2" : "#F0FDF4",
      color: profile?.verified ? "#EF4444" : "#16A34A",
      fontSize: 11,
      fontWeight: 700,
      cursor: "pointer",
      fontFamily: "inherit"
    }),
    s13: profile => ({
      flex: 1,
      padding: "8px",
      borderRadius: 8,
      border: "1.5px solid " + (profile?.is_suspended ? "#BBF7D0" : "#FECACA"),
      background: profile?.is_suspended ? "#F0FDF4" : "#FEF2F2",
      color: profile?.is_suspended ? "#16A34A" : "#EF4444",
      fontSize: 11,
      fontWeight: 700,
      cursor: "pointer",
      fontFamily: "inherit"
    }),
    s14: profile => ({
      flex: 1,
      padding: "8px",
      borderRadius: 8,
      border: "1.5px solid " + (profile?.video_allowed ? "#BBF7D0" : "#DDE8E1"),
      background: profile?.video_allowed ? "#F0FDF4" : "#F9FAFB",
      color: profile?.video_allowed ? "#16A34A" : "#6B7280",
      fontSize: 11,
      fontWeight: 700,
      cursor: "pointer",
      fontFamily: "inherit"
    }),
    s14a: {
      marginTop: 10,
      display: "grid",
      gap: 6,
      padding: "10px 12px",
      background: "#F5F3FF",
      border: "1px solid #DDD6FE",
      borderRadius: 10
    },
    s14b: {
      fontSize: 11,
      fontWeight: 800,
      color: "#4C1D95"
    },
    s14c: {
      fontSize: 10,
      color: "#6D28D9"
    },
    s14d: {
      width: "100%",
      padding: "10px 12px",
      borderRadius: 10,
      border: "1.5px solid #C4B5FD",
      background: "#fff",
      color: "#1F2937",
      fontSize: 12,
      fontWeight: 700,
      fontFamily: "inherit",
      outline: "none",
      cursor: "pointer"
    },
    s15: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr 1fr",
      gap: 8,
      marginBottom: 12
    },
    s16: DC => ({
      fontSize: 12,
      fontWeight: 800,
      color: DC?.text3 || "#8A9E90",
      marginBottom: 8
    }),
    s17: DC => ({
      textAlign: "center",
      padding: 24,
      color: DC?.text3
    })
  };
  useEffect(() => {
    load();
  }, [targetUser?.id]);
  if (!["admin", "support"].includes(user?.role) || !targetUser?.id) return <Navigate to="/admin/dashboard" replace />;
  async function load() {
    setLoading(true);
    const {
      profile,
      listings,
      stats
    } = await fetchAdminUserDetail(targetUser.id);
    setProfile(profile);
    setListings(listings);
    setStats(stats);
    setLoading(false);
  }
  async function patch(obj) {
    await patchAdminUserProfile(targetUser.id, obj);
    setProfile(p => ({
      ...p,
      ...obj
    }));
  }
  return <div style={S.pageShell(DC)}>
      <div style={S.primaryHero(C.primary)}>
        <IslamicPattern opacity={0.1} color="#FFFFFF" width={430} height={200} />
        <div style={S.absTopRight14}>
          <BackButton onPress={() => setPage("adminUsers")} />
        </div>
        <div style={S.relZ1}>
          <div style={S.title20White}>👤 {targetUser?.name || "المستخدم"}</div>
          <div style={S.whiteMeta12}>انضم {fDate(targetUser?.created_at)}</div>
        </div>
        <Wave />
      </div>

      <div style={S.pad14Bottom80}>
        {loading ? <div style={S.emptyStateCentered}>⏳</div> : <>

          {/* معلومات المستخدم */}
          <div style={sx.s1(DC)}>
            <div style={sx.s2}>
              <div style={sx.s3(C)}>
                {(profile?.name || "م")[0]}
              </div>
              <div>
                <div style={sx.s4(DC)}>{profile?.name || "—"}</div>
                <div style={sx.s5}>{profile?.phone || "—"}</div>
              </div>
            </div>

            <div style={sx.s6}>
              {profile?.verified && <span style={sx.s7(C)}>✓ موثّق</span>}
              {profile?.is_suspended && <span style={sx.s8}>🚫 موقوف</span>}
              {profile?.video_allowed && <span style={sx.s9}>🎥 فيديو</span>}
              <span style={sx.s10}>
                {profile?.account_type === "office" ? "🏢 مكتب" : "👤 فردي"}
              </span>
            </div>

            {/* أزرار التحكم */}
            <div style={sx.s11}>
              <button onClick={() => patch({
              verified: !profile?.verified
            })} style={sx.s12(profile)}>
                {profile?.verified ? "❌ إلغاء التوثيق" : "✓ توثيق"}
              </button>
              <button onClick={() => patch({
              is_suspended: !profile?.is_suspended
            })} style={sx.s13(profile)}>
                {profile?.is_suspended ? "✓ رفع التعليق" : "🚫 تعليق"}
              </button>
              <button onClick={() => patch({
              video_allowed: !profile?.video_allowed
            })} style={sx.s14(profile)}>
                {profile?.video_allowed ? "🎥 إيقاف الفيديو" : "🎥 تفعيل الفيديو"}
              </button>
            </div>

            {user?.role === "admin" && profile?.role !== "admin" && <div style={sx.s14a}>
                <div style={sx.s14b}>الدور الإداري</div>
                <div style={sx.s14c}>اختر الدور مع المستوى مباشرة.</div>
                <select value={profile?.role || "user"} onChange={e => {
              const next = e.target.value;
              if (next === (profile?.role || "user")) return;
              if (window.confirm(`تغيير الدور إلى ${getRoleLabel(next)}؟`)) patch({
                role: next
              });
            }} style={sx.s14d}>
                  {ROLE_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>}
          </div>

          {/* إحصائيات */}
          <div style={sx.s15}>
            {[{
            icon: "🏠",
            label: "إعلانات",
            value: stats?.total,
            color: C.primary
          }, {
            icon: "🟢",
            label: "نشطة",
            value: stats?.active,
            color: "#16A34A"
          }, {
            icon: "👁",
            label: "مشاهدات",
            value: stats?.totalViews,
            color: "#3B82F6"
          }, {
            icon: "💬",
            label: "واتساب",
            value: stats?.totalWA,
            color: "#25D366"
          }].map((s, i) => {
            const sx = {
              s1: DC => ({
                background: DC?.white || "#fff",
                borderRadius: 10,
                padding: "10px 8px",
                textAlign: "center",
                border: "1.5px solid " + (DC?.border || "#DDE8E1")
              }),
              s2: {
                fontSize: 16,
                marginBottom: 2
              },
              s3: s => ({
                fontSize: 18,
                fontWeight: 900,
                color: s.color
              }),
              s4: {
                fontSize: 10,
                color: "#6B7280",
                fontWeight: 700
              }
            };
            return <div key={i} style={sx.s1(DC)}>
                <div style={sx.s2}>{s.icon}</div>
                <div style={sx.s3(s)}>{s.value || 0}</div>
                <div style={sx.s4}>{s.label}</div>
              </div>;
          })}
          </div>

          {/* إعلانات المستخدم */}
          <div style={sx.s16(DC)}>إعلانات المستخدم</div>
          {listings.length === 0 ? <div style={sx.s17(DC)}>لا توجد إعلانات</div> : <>
            {listings.slice(0, visibleCount).map(l => <ListingCard key={l.id} DC={DC} mode="admin" item={{
            ...l,
            title: l.title || l.category || "—",
            photo: (l.listing_images || []).sort((a, b) => (b.is_main ? 1 : 0) - (a.is_main ? 1 : 0))[0]?.url || null,
            images: (l.listing_images || []).map(i => i.url),
            seller: targetUser?.name || "—",
            sellerInit: (targetUser?.name || "م")[0],
            accountType: "individual",
            daysOld: Math.floor((Date.now() - new Date(l.created_at)) / 86400000),
            time: new Date(l.created_at).toLocaleDateString("ar")
          }} />)}
            <LoadMoreButton hasMore={listings.length > visibleCount} loading={false} onPress={() => setVisibleCount(p => p + 20)} />
          </>}
        </>}
      </div>
    </div>;
}
