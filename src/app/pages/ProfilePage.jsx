import React, { useState, useEffect, useRef } from "react";
import QRCodeStyling from "qr-code-styling";
import { C } from "../../shared/constants/colors.js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../../shared/utils/env.js";
import { T } from "../../shared/utils/i18n.js";
import { IslamicPattern, Wave } from "../../shared/components/icons.jsx";
import { StoriesBar, StoryViewer } from "../components/common/Stories.jsx";
import { AddStoryModal } from "../components/modals.jsx";
import {
  subscribeToPush,
  unsubscribeFromPush,
  getPushStatus
} from "../services/pushNotifications.js";
import { fetchProfile, updateProfile } from "../services/profileService.js";
import { fetchProfileMenuCounts } from "../services/dashboardService.js";
import { fetchFollowingWithProfiles } from "../services/userService.js";
import {
  uploadProfileImage as uploadProfileImageService,
  deleteProfileImage as deleteProfileImageService
} from "../services/mediaService.js";
import { deletePushSubscriptionByEndpoint } from "../services/pushService.js";
import { signOut } from "../services/authService.js";
import { S, mergeStyles } from "../../shared/styles/primitives.js";

export const PS = {
  qrWrap: { display: "flex", justifyContent: "center", marginBottom: 10 },
  qrCard: {
    background: "white",
    padding: 12,
    borderRadius: 16,
    boxShadow: "0 2px 16px rgba(62,79,121,0.15)"
  },
  qrBox: { width: 220, height: 220 },
  qrLabel: DC => ({ fontSize: 13, color: DC.text2, marginBottom: 4 }),
  qrCodeValue: DC => ({ fontSize: 15, fontWeight: 900, color: DC.text, direction: "ltr", marginBottom: 12 }),
  centerRow8: { display: "flex", gap: 8, justifyContent: "center" },
  qrCopyButton: {
    padding: "8px 18px",
    borderRadius: 10,
    border: "none",
    background: C.primary,
    color: "white",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit"
  },
  qrStateChip: (bg, color) => ({
    padding: "8px 12px",
    borderRadius: 10,
    background: bg,
    fontSize: 11,
    color,
    fontWeight: 700,
    display: "flex",
    alignItems: "center"
  }),
  pageShell: DC => ({
    background: DC.bg,
    minHeight: "100vh",
    paddingBottom: "calc(80px + env(safe-area-inset-bottom, 0px))"
  }),
  heroShell: { background: C.primary, position: "relative", overflow: "hidden" },
  coverLayer: { position: "absolute", inset: 0, zIndex: 0, overflow: "hidden" },
  coverImg: { width: "100%", height: "100%", objectFit: "cover" },
  coverOverlay: {
    position: "absolute",
    inset: 0,
    background: "rgba(0,0,0,0.35)",
    pointerEvents: "none"
  },
  menuAnchor: { position: "absolute", top: 14, left: 14, zIndex: 20 },
  menuButton: {
    width: 34,
    height: 34,
    borderRadius: "50%",
    background: "rgba(0,0,0,0.45)",
    border: "none",
    color: "white",
    fontSize: 18,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backdropFilter: "blur(4px)"
  },
  popupMenu: {
    position: "absolute",
    top: 40,
    left: 0,
    background: "white",
    borderRadius: 12,
    boxShadow: "0 8px 28px rgba(0,0,0,0.18)",
    minWidth: 190,
    overflow: "hidden",
    zIndex: 30
  },
  popupMenuItem: (withBorder = true) => ({
    width: "100%",
    padding: "13px 16px",
    background: "none",
    border: "none",
    borderBottom: withBorder ? "1px solid #F3F4F6" : "none",
    cursor: "pointer",
    fontFamily: "Tajawal,sans-serif",
    fontSize: 13,
    fontWeight: 700,
    color: "#1A2E20",
    display: "flex",
    alignItems: "center",
    gap: 10,
    textAlign: "right"
  }),
  popupMenuLabel: (withBorder = true) => ({
    width: "100%",
    padding: "13px 16px",
    background: "none",
    borderBottom: withBorder ? "1px solid #F3F4F6" : "none",
    cursor: "pointer",
    fontFamily: "Tajawal,sans-serif",
    fontSize: 13,
    fontWeight: 700,
    color: "#1A2E20",
    display: "flex",
    alignItems: "center",
    gap: 10
  }),
  fixedBackdrop: {
    position: "fixed",
    inset: 0,
    zIndex: 200,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20
  },
  modalCard: { background: "white", borderRadius: 16, padding: 22, width: "100%", maxWidth: 320 },
  modalTitle: { fontSize: 16, fontWeight: 900, marginBottom: 14, textAlign: "center" },
  modalInput: {
    width: "100%",
    padding: "11px 13px",
    borderRadius: 10,
    border: "1.5px solid #DDE8E1",
    fontSize: 14,
    fontFamily: "Tajawal,sans-serif",
    outline: "none",
    marginBottom: 14,
    textAlign: "right"
  },
  modalButton: (primary = false) => ({
    flex: 1,
    padding: "10px",
    borderRadius: 10,
    border: primary ? "none" : "1.5px solid #DDE8E1",
    background: primary ? "#1A4A2E" : "none",
    color: primary ? "white" : undefined,
    cursor: "pointer",
    fontFamily: "Tajawal,sans-serif",
    fontSize: 13,
    fontWeight: primary ? 800 : 700
  }),
  heroContent: { position: "relative", zIndex: 1, textAlign: "center", padding: "0 20px 50px" },
  avatarWrap: { position: "relative", display: "inline-block", marginBottom: 10 },
  avatarCircle: {
    width: 76,
    height: 76,
    borderRadius: "50%",
    background: C.gold,
    color: "white",
    fontSize: 30,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "3px solid white",
    overflow: "hidden",
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
  },
  heroName: { fontSize: 20, fontWeight: 900, color: C.white },
  heroPhone: { fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 3 },
  heroStats: { display: "flex", justifyContent: "center", gap: 28, marginTop: 16 },
  heroStatNum: { fontSize: 17, fontWeight: 900, color: C.gold2 },
  heroStatLabel: { fontSize: 10, color: "rgba(255,255,255,0.5)" },
  contentPadTop: { padding: "14px 14px 0" },
  sectionCard: (DC, radius = 12) => ({
    background: DC.white,
    borderRadius: radius,
    border: "1px solid " + DC.border,
    overflow: "hidden"
  }),
  shamcashToggle: {
    width: "100%",
    padding: "14px 16px",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontFamily: "Tajawal,sans-serif",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  },
  rowCenterGap10: { display: "flex", alignItems: "center", gap: 10 },
  shamcashTitle: DC => ({ fontSize: 14, fontWeight: 700, color: DC.text }),
  shamcashChevron: DC => ({ color: DC.text3, fontSize: 12 }),
  shamcashBody: DC => ({ borderTop: "1px solid " + DC.border, padding: "16px", textAlign: "center" }),
  shamcashEmpty: DC => ({ background: DC.bg, borderRadius: 12, padding: "30px 20px", marginBottom: 10 }),
  shamcashEmptyIcon: { fontSize: 36, marginBottom: 8 },
  shamcashEmptyText: DC => ({ fontSize: 13, color: DC.text3, lineHeight: 1.6 }),
  primaryCta: {
    padding: "10px 24px",
    borderRadius: 10,
    border: "none",
    background: C.primary,
    color: "white",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit"
  },
  helperText10: DC => ({ marginTop: 10, fontSize: 10, color: DC.text3 }),
  divider: { height: 1, background: C.border, margin: "4px 0" },
  menuRow: border => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 16px",
    borderBottom: border,
    cursor: "pointer"
  }),
  menuLeft: color => ({ display: "flex", alignItems: "center", gap: 12, fontSize: 14, fontWeight: 600, color }),
  menuRight: { display: "flex", alignItems: "center", gap: 5 },
  notifBadge: granted => ({
    fontSize: 10,
    fontWeight: 700,
    padding: "2px 7px",
    borderRadius: 20,
    background: granted ? "#F0FDF4" : "#FEF2F2",
    color: granted ? "#16A34A" : "#EF4444"
  }),
  togglePill: (active, dimmed = false) => ({
    width: 40,
    height: 22,
    borderRadius: 11,
    background: active ? C.primary : "#D1D5DB",
    position: "relative",
    opacity: dimmed ? 0.6 : 1,
    transition: "background 0.2s",
    flexShrink: 0
  }),
  toggleKnob: active => ({
    position: "absolute",
    top: 2,
    right: active ? 2 : 20,
    width: 18,
    height: 18,
    borderRadius: "50%",
    background: "white",
    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
    transition: "right 0.2s"
  }),
  deniedHelp: {
    fontSize: 10,
    color: "#EF4444",
    fontWeight: 700,
    cursor: "pointer",
    padding: "3px 8px",
    borderRadius: 20,
    background: "#FEF2F2",
    border: "1px solid #FECACA"
  },
  countBubble: color => ({
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
    justifyContent: "center"
  }),
  chevron: color => ({ color }),
  followingWrap: DC => ({ background: DC.white, borderTop: "2px solid " + DC.border, padding: "16px", marginTop: 8 }),
  sectionTitle14: DC => ({ fontSize: 14, fontWeight: 800, color: DC.text, marginBottom: 12 }),
  emptyFollowing: DC => ({ textAlign: "center", padding: "24px 0", color: DC.text3 }),
  emptyEmoji36: { fontSize: 36, marginBottom: 8 },
  emptyText13Strong: { fontSize: 13, fontWeight: 600 },
  emptyText11Mt4: { fontSize: 11, marginTop: 4 },
  columnGap8: { display: "flex", flexDirection: "column", gap: 8 },
  loadingFollowed: DC => ({ textAlign: "center", padding: 16, color: DC.text3, fontSize: 13 }),
  followedRow: DC => ({
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 12px",
    background: DC.bg,
    borderRadius: 12,
    border: "1px solid " + DC.border
  }),
  followedAvatar: {
    width: 38,
    height: 38,
    borderRadius: "50%",
    background: C.primary,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    fontWeight: 800,
    color: "white",
    flexShrink: 0
  },
  followedName: DC => ({ fontSize: 13, fontWeight: 700, color: DC.text }),
  followedMeta: DC => ({ fontSize: 10, color: DC.text3 }),
  dangerPillButton: {
    padding: "5px 10px",
    borderRadius: 16,
    border: "1.5px solid #EF4444",
    background: "#FEF2F2",
    color: "#EF4444",
    fontSize: 11,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit"
  }
};

function ShamcashQR({ code, show, DC }) {
  const qrRef = useRef(null);

  useEffect(() => {
    if (!code || !qrRef.current) return;
    qrRef.current.innerHTML = "";

    const qr = new QRCodeStyling({
      width: 220,
      height: 220,
      type: "svg",
      data: code,
      margin: 8,
      qrOptions: { typeNumber: 2, mode: "Byte", errorCorrectionLevel: "L" },
      dotsOptions: { color: "#3E4F79", type: "square" },
      cornersSquareOptions: { color: "#3E4F79", type: "square" },
      cornersDotOptions: { color: "#3E4F79", type: "square" },
      backgroundOptions: { color: "#FFFFFF" },
      imageOptions: { crossOrigin: "anonymous", margin: 6, imageSize: 0.18 }
    });

    qr.append(qrRef.current);
  }, [code]);

  return (
    <div>
      <div style={PS.qrWrap}>
        <div style={PS.qrCard}>
          <div ref={qrRef} style={PS.qrBox} />
        </div>
      </div>

      <div style={PS.qrLabel(DC)}>كود شام كاش الخاص بك</div>
      <div style={PS.qrCodeValue(DC)}>{code}</div>

      <div style={PS.centerRow8}>
        <button onClick={() => navigator.clipboard?.writeText(code)} style={PS.qrCopyButton}>
          📋 نسخ الرقم
        </button>

        {show ? (
          <div style={PS.qrStateChip("#E8F4F0", C.primary)}>👁 ظاهر في ملفك</div>
        ) : (
          <div style={PS.qrStateChip(DC.bg, DC.text3)}>🙈 مخفي — فعّله من الإعدادات</div>
        )}
      </div>
    </div>
  );
}

function compressImage(file, maxPx = 1200, quality = 0.85) {
  return new Promise(resolve => {
    const reader = new FileReader();

    reader.onload = ev => {
      const img = new Image();

      img.onload = () => {
        let w = img.naturalWidth;
        let h = img.naturalHeight;

        if (w > maxPx) {
          h = Math.round((h * maxPx) / w);
          w = maxPx;
        }

        if (h > maxPx) {
          w = Math.round((w * maxPx) / h);
          h = maxPx;
        }

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        canvas.toBlob(blob => resolve(blob || file), "image/jpeg", quality);
      };

      img.src = ev.target.result;
    };

    reader.readAsDataURL(file);
  });
}

function ProfilePage({
  setPage,
  DC,
  lang,
  dark,
  setDark,
  follows = [],
  toggleFollow,
  isFollowing = () => false,
  shamcash = { code: "", show: false },
  user = null,
  setUser,
  myListings = [],
  favs = [],
  onSignOut,
  onShowDeniedNotif,
  renderAdminMenu = null
}) {
  if (!DC) DC = C;

  const [showBarcode, setShowBarcode] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [followedUsers, setFollowedUsers] = useState([]);
  const [savedSearchCount, setSavedSearchCount] = useState(null);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [activeAdsCount, setActiveAdsCount] = useState(null);

  const [notifPerm, setNotifPerm] = useState(() =>
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );

  const [pushSubbed, setPushSubbed] = useState(false);
  const [pushStatus, setPushStatus] = useState(() =>
    typeof Notification !== "undefined" && Notification.permission === "denied" ? "denied" : "loading"
  );
  const [pushLoading, setPushLoading] = useState(false);

  const [csModal, setCsModal] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [deletingAvatar, setDeletingAvatar] = useState(false);
  const [deletingCover, setDeletingCover] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    if (typeof Notification === "undefined") return;

    const check = () => {
      setNotifPerm(Notification.permission);
      getPushStatus().then(s => {
        setPushStatus(s);
        setPushSubbed(s === "subscribed");
      });
    };

    check();
    document.addEventListener("visibilitychange", check);
    window.addEventListener("focus", check);

    return () => {
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("focus", check);
    };
  }, []);

  async function handlePushToggle() {
    if (pushLoading) return;

    setPushLoading(true);

    const willSubscribe = pushStatus !== "subscribed";
    setPushStatus(willSubscribe ? "subscribed" : "unsubscribed");
    setPushSubbed(willSubscribe);

    if (willSubscribe) {
      const res = await subscribeToPush(user?.id);

      if (!res.success) {
        setPushStatus("unsubscribed");
        setPushSubbed(false);
        setNotifPerm(Notification.permission);
      } else {
        setNotifPerm("granted");
      }
    } else {
      const res = await unsubscribeFromPush(user?.id);

      if (res.error) {
        setPushStatus("subscribed");
        setPushSubbed(true);
      }
    }

    setPushLoading(false);
  }

  useEffect(() => {
    if (!user?.id) return;

    let alive = true;

    fetchProfileMenuCounts(user.id).then(counts => {
      if (!alive || !counts) return;

      setSavedSearchCount(counts.savedSearchCount || 0);
      setBlockedUsers(counts.blockedUsers || []);
      setActiveAdsCount(counts.activeAdsCount || 0);
    });

    return () => {
      alive = false;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!showFollowing || !user?.id) return;

    let alive = true;

    fetchFollowingWithProfiles(user.id).then(data => {
      if (alive) setFollowedUsers(data || []);
    });

    return () => {
      alive = false;
    };
  }, [showFollowing, user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    let alive = true;

    fetchProfile(user.id).then(data => {
      if (alive && data) setProfileData(data);
    });

    return () => {
      alive = false;
    };
  }, [user?.id]);

  const uploadProfileImage = async (file, type) => {
    if (!user?.id) return;

    if (type === "avatar") setUploadingAvatar(true);
    else setUploadingCover(true);

    try {
      const maxPx = type === "avatar" ? 300 : 700;
      const compressed = await compressImage(file, maxPx, 0.72);
      const publicUrl = await uploadProfileImageService(user.id, compressed, type, "image/jpeg");
      const field = type === "avatar" ? "avatar_url" : "cover_url";

      setProfileData(prev => ({ ...prev, [field]: publicUrl }));
    } catch (e) {
      console.error("uploadProfileImage error:", e);
      alert("تعذر رفع الصورة، حاول مرة أخرى");
    } finally {
      if (type === "avatar") setUploadingAvatar(false);
      else setUploadingCover(false);
    }
  };

  const deleteProfileImage = async type => {
    if (!user?.id) return;

    const field = type === "avatar" ? "avatar_url" : "cover_url";
    const label = type === "avatar" ? "الصورة الشخصية" : "صورة الغلاف";

    if (!profileData?.[field]) return;

    const ok = window.confirm(`هل تريد حذف ${label} نهائيًا؟`);
    if (!ok) return;

    if (type === "avatar") setDeletingAvatar(true);
    else setDeletingCover(true);

    try {
      await deleteProfileImageService(user.id, type);
      setProfileData(prev => ({ ...prev, [field]: null }));
    } catch (e) {
      console.error("deleteProfileImage error:", e);
      alert("تعذر حذف الصورة، حاول مرة أخرى");
    } finally {
      if (type === "avatar") setDeletingAvatar(false);
      else setDeletingCover(false);
    }
  };

  const menu = [
    {
      icon: "📋",
      label: "إعلاناتي",
      count: myListings.length > 0 ? String(myListings.length) : null,
      action: "myListings"
    },
    {
      icon: "📢",
      label: "إعلاناتي المدفوعة",
      action: "featuredAd",
      count: activeAdsCount > 0 ? String(activeAdsCount) : null
    },
    {
      icon: "❤️",
      label: "المفضلة",
      count: favs.length > 0 ? String(favs.length) : null,
      action: "favs"
    },
    {
      icon: "⭐",
      label: "أبحاثي المحفوظة",
      count: savedSearchCount ? String(savedSearchCount) : null,
      action: "savedSearches"
    },
    {
      icon: "👥",
      label: "من أتابع",
      count: String(follows?.length || 0),
      action: "following"
    },
    {
      icon: "🔔",
      label: "الإشعارات",
      action: null,
      notif: true,
      notifPerm,
      pushSubbed,
      pushStatus,
      pushLoading
    },
    {
      divider: true
    },
    {
      icon: "⚙️",
      label: "الإعدادات",
      action: "settings"
    },
    {
      icon: "🔒",
      label: "سياسة الخصوصية",
      action: "privacy"
    },
    {
      icon: "📋",
      label: "شروط الاستخدام",
      action: "terms"
    },
    {
      icon: "❓",
      label: "المساعدة",
      action: "help"
    },
    {
      icon: "ℹ️",
      label: "حول طابو أخضر",
      action: "about"
    },
    {
      icon: "🔐",
      label: "سجل تسجيلات الدخول",
      action: "loginHistory"
    },
    {
      icon: "🚫",
      label: "المحظورون",
      count: blockedUsers.length > 0 ? String(blockedUsers.length) : null,
      countColor: "#EF4444",
      action: "blocked"
    },
    {
      icon: "🚪",
      label: "تسجيل الخروج",
      danger: true
    }
  ];

  return (
    <div style={PS.pageShell(DC)}>
      <div style={PS.heroShell}>
        {profileData?.cover_url && (
          <div style={PS.coverLayer}>
            <img src={profileData.cover_url} alt="" style={PS.coverImg} />
            <div style={PS.coverOverlay} />
          </div>
        )}

        <IslamicPattern opacity={0.06} color="#FFFFFF" />

        <div style={PS.menuAnchor}>
          <button onClick={() => setShowMenu(v => !v)} style={PS.menuButton}>
            ⋮
          </button>

          {showMenu && (
            <div style={PS.popupMenu} onClick={e => e.stopPropagation()}>
              <button
                onClick={() => {
                  setNewName(user?.name || "");
                  setEditingName(true);
                  setShowMenu(false);
                }}
                style={PS.popupMenuItem(true)}
              >
                ✏️ تعديل الاسم
              </button>

              {user?.accountType === "office" && (
                <label style={PS.popupMenuLabel(true)}>
                  {uploadingCover ? "⏳ جارٍ الرفع..." : "🖼️ تغيير صورة الغلاف"}
                  <input
                    type="file"
                    accept="image/*"
                    style={S.hidden}
                    onChange={e => {
                      setShowMenu(false);
                      e.target.files[0] && uploadProfileImage(e.target.files[0], "cover");
                    }}
                  />
                </label>
              )}

              {user?.accountType === "office" && profileData?.cover_url && (
                <button
                  onClick={() => {
                    setShowMenu(false);
                    deleteProfileImage("cover");
                  }}
                  style={PS.popupMenuItem(true)}
                >
                  {deletingCover ? "⏳ جارٍ الحذف..." : "🗑️ حذف صورة الغلاف"}
                </button>
              )}

              {user?.accountType === "office" && (
                <label style={PS.popupMenuLabel(Boolean(profileData?.avatar_url))}>
                  {uploadingAvatar ? "⏳ جارٍ الرفع..." : "📷 تغيير الصورة الشخصية"}
                  <input
                    type="file"
                    accept="image/*"
                    style={S.hidden}
                    onChange={e => {
                      setShowMenu(false);
                      e.target.files[0] && uploadProfileImage(e.target.files[0], "avatar");
                    }}
                  />
                </label>
              )}

              {user?.accountType === "office" && profileData?.avatar_url && (
                <button
                  onClick={() => {
                    setShowMenu(false);
                    deleteProfileImage("avatar");
                  }}
                  style={PS.popupMenuItem(false)}
                >
                  {deletingAvatar ? "⏳ جارٍ الحذف..." : "🗑️ حذف الصورة الشخصية"}
                </button>
              )}
            </div>
          )}
        </div>

        {editingName && (
          <div style={PS.fixedBackdrop} onClick={() => setEditingName(false)}>
            <div style={PS.modalCard} onClick={e => e.stopPropagation()}>
              <div style={PS.modalTitle}>✏️ تعديل الاسم</div>

              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                style={PS.modalInput}
                placeholder="أدخل اسمك..."
                autoFocus
              />

              <div style={S.gap8}>
                <button onClick={() => setEditingName(false)} style={PS.modalButton(false)}>
                  إلغاء
                </button>

                <button
                  onClick={async () => {
                    if (!newName.trim()) return;

                    if (user?.id) {
                      await updateProfile(user.id, { name: newName.trim() });
                      setUser(prev => ({ ...prev, name: newName.trim() }));
                    }

                    setEditingName(false);
                  }}
                  style={PS.modalButton(true)}
                >
                  حفظ ←
                </button>
              </div>
            </div>
          </div>
        )}

        <div style={PS.heroContent} onClick={() => showMenu && setShowMenu(false)}>
          <div style={PS.avatarWrap}>
            <div style={PS.avatarCircle}>
              {profileData?.avatar_url ? (
                <img src={profileData.avatar_url} alt="" style={PS.coverImg} />
              ) : user?.name ? (
                user.name[0]
              ) : (
                "م"
              )}
            </div>
          </div>

          <div style={PS.heroName}>{user?.name || "مستخدم عقاري"}</div>
          <div style={PS.heroPhone}>{user?.phone ? "+963 " + user.phone : "رقم الهاتف"}</div>

          <div style={PS.heroStats}>
            {[
              [String(myListings?.length || 0), "إعلاناتي"],
              [String((myListings || []).reduce((acc, item) => acc + (item.views || 0), 0)), "مشاهدة"],
              ["★ 4.8", "تقييم"]
            ].map(([n, l]) => (
              <div key={l}>
                <div style={PS.heroStatNum}>{n}</div>
                <div style={PS.heroStatLabel}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        <Wave />
      </div>

      <div style={PS.contentPadTop}>
        {(shamcash?.code || true) && (
          <div style={mergeStyles(PS.sectionCard(DC, 14), { marginBottom: 12 })}>
            <button onClick={() => setShowBarcode(!showBarcode)} style={PS.shamcashToggle}>
              <div style={PS.rowCenterGap10}>
                <span style={S.font22}>💳</span>

                <div style={S.textRight}>
                  <div style={PS.shamcashTitle(DC)}>شام كاش</div>
                  <div style={S.textMuted11(DC)}>
                    {shamcash && shamcash.code ? shamcash.code : "باركود استقبال التقدير"}
                  </div>
                </div>
              </div>

              <span style={PS.shamcashChevron(DC)}>{showBarcode ? "▲" : "▼"}</span>
            </button>

            {showBarcode && (
              <div style={PS.shamcashBody(DC)}>
                {shamcash && shamcash.code ? (
                  <ShamcashQR code={shamcash.code} show={shamcash.show} DC={DC} />
                ) : (
                  <div>
                    <div style={PS.shamcashEmpty(DC)}>
                      <div style={PS.shamcashEmptyIcon}>💳</div>
                      <div style={PS.shamcashEmptyText(DC)}>
                        أضف رقم شام كاش من الإعدادات
                        <br />
                        ليظهر باركود QR هنا تلقائياً
                      </div>
                    </div>

                    <button onClick={() => setPage("settings")} style={PS.primaryCta}>
                      ⚙️ الإعدادات
                    </button>
                  </div>
                )}

                <div style={PS.helperText10(DC)}>يظهر في ملفك الشخصي فقط</div>
              </div>
            )}
          </div>
        )}

        <div style={PS.sectionCard(DC)}>
          {menu.map((item, i) =>
            item.divider ? (
              <div key={i} style={PS.divider} />
            ) : (
              <div
                key={i}
                onClick={async () => {
                  if (item.danger) {
                    if (user?.id) {
                      try {
                        const sw = await navigator.serviceWorker?.ready;
                        const sub = sw ? await sw.pushManager?.getSubscription() : null;
                        if (sub?.endpoint) await deletePushSubscriptionByEndpoint(user.id, sub.endpoint);
                      } catch {}
                    }

                    await signOut();

                    try {
                      localStorage.removeItem("viewedStories");
                    } catch {}

                    setUser && setUser(null);
                    onSignOut && onSignOut();
                    setPage("home");
                  } else if (item.notif) {
                    if (
                      pushStatus === "denied" ||
                      (typeof Notification !== "undefined" && Notification.permission === "denied")
                    ) {
                      onShowDeniedNotif && onShowDeniedNotif();
                    } else {
                      handlePushToggle();
                    }
                  } else if (item.action === "blocked") {
                    setPage("blocked");
                  } else if (item.coming) {
                    setCsModal(item.coming);
                  } else if (item.action) {
                    setPage(item.action);
                  }
                }}
                style={PS.menuRow(i < menu.length - 1 ? "1px solid " + DC.border : "none")}
              >
                <div style={PS.menuLeft(item.danger ? DC.danger : DC.text)}>
                  <span style={S.font18}>{item.icon}</span>
                  {item.label}
                </div>

                <div style={PS.menuRight}>
                  {item.notif && (
                    <>
                      <span style={PS.notifBadge(item.notifPerm === "granted")}>
                        {item.notifPerm === "granted" ? "✅" : item.notifPerm === "denied" ? "❌" : "⏳"}
                      </span>

                      {item.pushStatus !== "unsupported" && item.pushStatus !== "denied" && (
                        <div style={PS.togglePill(item.pushStatus === "subscribed", item.pushLoading)}>
                          <div style={PS.toggleKnob(item.pushStatus === "subscribed")} />
                        </div>
                      )}

                      {item.pushStatus === "denied" && (
                        <span
                          onClick={e => {
                            e.stopPropagation();
                            onShowDeniedNotif && onShowDeniedNotif();
                          }}
                          style={PS.deniedHelp}
                        >
                          محظور — اضغط للمساعدة
                        </span>
                      )}
                    </>
                  )}

                  {item.count && <div style={PS.countBubble(item.countColor || DC.primary)}>{item.count}</div>}

                  {item.value && (
                    <span style={{ fontSize: 12, color: DC.text3, fontWeight: 700 }}>
                      {item.value}
                    </span>
                  )}

                  {!item.danger && !item.notif && !item.value && (item.action || item.coming) && (
                    <span style={PS.chevron(DC.text3)}>‹</span>
                  )}
                </div>
              </div>
            )
          )}
        </div>

        {typeof renderAdminMenu === "function" && renderAdminMenu({ user, DC, setPage })}

        {showFollowing && (
          <div style={PS.followingWrap(DC)}>
            <div style={PS.sectionTitle14(DC)}>{`👥 من أتابع (${(follows || []).length})`}</div>

            {(follows || []).length === 0 ? (
              <div style={PS.emptyFollowing(DC)}>
                <div style={PS.emptyEmoji36}>👥</div>
                <div style={PS.emptyText13Strong}>لا تتابع أحداً بعد</div>
                <div style={PS.emptyText11Mt4}>تابع بائعين من صفحة الإعلان</div>
              </div>
            ) : (
              <div style={PS.columnGap8}>
                {followedUsers.length === 0 && (
                  <div style={PS.loadingFollowed(DC)}>⏳ جاري التحميل...</div>
                )}

                {followedUsers.map(u => (
                  <div key={u.id} style={PS.followedRow(DC)}>
                    <div style={PS.followedAvatar}>{(u.name || "م")[0]}</div>

                    <div style={S.flex1}>
                      <div style={PS.followedName(DC)}>{u.name || "مستخدم"}</div>
                      <div style={PS.followedMeta(DC)}>
                        {u.account_type === "office" ? "🏢 مكتب عقاري" : "👤 فرد"}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        toggleFollow && toggleFollow(u.id);
                        setFollowedUsers(p => p.filter(x => x.id !== u.id));
                      }}
                      style={PS.dangerPillButton}
                    >
                      إلغاء
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfilePage;
