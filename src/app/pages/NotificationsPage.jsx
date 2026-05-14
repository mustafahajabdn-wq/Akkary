import { BackButton } from "../../shared/components/common/BackButton.jsx";
import React, { useState, useEffect, useCallback } from "react";
import { C } from "../../shared/constants/colors.js";
import { getCurrentUserId } from "../services/authService.js";
import { fetchUnreadNotificationsCount, listNotificationsWithContext, subscribeToNotificationChanges, deleteNotification, deleteAllNotifications, markNotificationRead } from "../services/notificationService.js";
import { fetchListingDetail } from "../services/listingService.js";
function NotificationsPage({
  setPage,
  DC = C,
  user,
  setChat,
  setUnreadNotifs,
  openDetail
}) {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const syncUnreadCount = useCallback(async uid => {
    const targetUid = uid || user?.id;
    if (!targetUid || !setUnreadNotifs) return;
    const count = await fetchUnreadNotificationsCount(targetUid);
    setUnreadNotifs(count || 0);
  }, [setUnreadNotifs, user?.id]);
  const sx = {
    s1: DC => ({
      background: DC.bg,
      minHeight: "100vh",
      fontFamily: "Tajawal,sans-serif",
      direction: "rtl"
    }),
    s2: C => ({
      background: C.primary,
      padding: "48px 16px 14px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    }),
    s3: {
      color: "white",
      fontSize: 18,
      fontWeight: 800
    },
    s4: {
      background: "#EF4444",
      borderRadius: 20,
      fontSize: 11,
      padding: "1px 8px",
      marginRight: 4
    },
    s5: {
      background: "none",
      border: "none",
      color: "rgba(255,255,255,0.7)",
      fontSize: 12,
      cursor: "pointer"
    },
    s6: {
      width: 50
    },
    s7: {
      display: "flex",
      gap: 6,
      padding: "10px 14px",
      overflowX: "auto"
    },
    s8: {
      paddingBottom: 90
    },
    s9: DC => ({
      textAlign: "center",
      padding: 60,
      color: DC.text3,
      fontSize: 13
    }),
    s10: DC => ({
      textAlign: "center",
      padding: 80,
      color: DC.text3
    }),
    s11: {
      fontSize: 48,
      marginBottom: 10
    },
    s12: {
      fontSize: 15,
      fontWeight: 700
    }
  };
  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      const uid = user?.id || (await getCurrentUserId());
      if (!uid) {
        if (!active) return;
        setNotifs([]);
        setLoading(false);
        if (setUnreadNotifs) setUnreadNotifs(0);
        return;
      }
      const mapped = await listNotificationsWithContext(uid, 50);
      if (!active) return;
      setNotifs(mapped);
      setLoading(false);
      await syncUnreadCount(uid);
    };
    load();
    const uidPromise = user?.id ? Promise.resolve(user.id) : getCurrentUserId();
    let unsubscribe = () => {};
    uidPromise.then(uid => {
      if (!uid || !active) return;
      unsubscribe = subscribeToNotificationChanges(uid, load);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [user?.id, setUnreadNotifs, syncUnreadCount]);
  const unreadCount = notifs.filter(n => !n.read).length;
  const filtered = filter === "unread" ? notifs.filter(n => !n.read) : filter === "messages" ? notifs.filter(n => n.type === "message") : filter === "question" ? notifs.filter(n => n.type === "question" || n.type === "answer") : filter === "announcement" ? notifs.filter(n => n.type === "announcement") : notifs;
  const deleteNotif = async id => {
    const prev = notifs;
    const next = prev.filter(n => n.id !== id);
    setNotifs(next);
    const uid = user?.id || (await getCurrentUserId());
    const {
      error
    } = await deleteNotification(id);
    if (error) {
      setNotifs(prev);
      return;
    }
    await syncUnreadCount(uid);
  };
  const deleteAll = async () => {
    const prev = notifs;
    const uid = user?.id || (await getCurrentUserId());
    if (uid) {
      const {
        error
      } = await deleteAllNotifications(uid);
      if (error) {
        setNotifs(prev);
        return;
      }
      setNotifs([]);
      await syncUnreadCount(uid);
      return;
    }
    setNotifs([]);
    if (setUnreadNotifs) setUnreadNotifs(0);
  };
  const notifIcon = type => {
    if (type === "question") return "❓";
    if (type === "answer") return "✅";
    if (type === "announcement") return "📣";
    if (type === "message") return "💬";
    if (type === "listing_match" || type === "saved_search") return "🏠";
    if (type === "ad_approved") return "✅";
    if (type === "ad_rejected") return "❌";
    return "🔔";
  };
  const markRead = async id => {
    const target = notifs.find(n => n.id === id);
    if (!target || target.read) return;
    const prev = notifs;
    setNotifs(p => p.map(n => n.id === id ? {
      ...n,
      read: true
    } : n));
    const uid = user?.id || (await getCurrentUserId());
    const {
      error
    } = await markNotificationRead(id);
    if (error) {
      setNotifs(prev);
      return;
    }
    await syncUnreadCount(uid);
  };
  return <div style={sx.s1(DC)}>
      <div style={sx.s2(C)}>
        <BackButton onPress={() => setPage("home")} />
        <div style={sx.s3}>
          الإشعارات {unreadCount > 0 && <span style={sx.s4}>{unreadCount}</span>}
        </div>
        {notifs.length > 0 ? <button onClick={deleteAll} style={sx.s5}>حذف الكل</button> : <div style={sx.s6} />}
      </div>

      <div style={sx.s7}>
        {[["all", "الكل"], ["unread", "غير مقروء"], ["messages", "رسائل"], ["question", "أسئلة"], ["announcement", "إعلانات"]].map(([k, l]) => {
        const sx = {
          s1: (filter, k, C, DC) => ({
            flexShrink: 0,
            padding: "6px 14px",
            borderRadius: 20,
            border: "1.5px solid " + (filter === k ? C.primary : DC.border),
            background: filter === k ? "#E8F4F0" : DC.white,
            color: filter === k ? C.primary : DC.text3,
            fontSize: 12,
            fontWeight: filter === k ? 700 : 400,
            cursor: "pointer",
            fontFamily: "inherit"
          })
        };
        return <button key={k} onClick={() => setFilter(k)} style={sx.s1(filter, k, C, DC)}>
            {l}
          </button>;
      })}
      </div>

      <div style={sx.s8}>
        {loading && <div style={sx.s9(DC)}>جاري التحميل...</div>}
        {!loading && filtered.length === 0 && <div style={sx.s10(DC)}>
            <div style={sx.s11}>🔔</div>
            <div style={sx.s12}>لا توجد إشعارات</div>
          </div>}
        {filtered.map(n => {
        const sx = {
          s1: (DC, n) => ({
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "14px 16px",
            borderBottom: `1px solid ${DC.border}`,
            background: n.read ? DC.white : DC.isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
            cursor: "pointer"
          }),
          s2: {
            fontSize: 24,
            width: 36,
            textAlign: "center",
            flexShrink: 0
          },
          s3: {
            flex: 1,
            minWidth: 0
          },
          s4: (DC, n) => ({
            fontSize: 13,
            color: DC.text,
            fontWeight: n.read ? 400 : 700,
            lineHeight: 1.6
          }),
          s5: DC => ({
            fontSize: 11,
            color: DC.text3,
            marginTop: 3
          }),
          s6: DC => ({
            background: "none",
            border: "none",
            color: DC.text3,
            fontSize: 16,
            cursor: "pointer",
            padding: "2px 4px",
            flexShrink: 0
          })
        };
        return <div key={n.id} onClick={async () => {
          await markRead(n.id);
          if (n.type === "message" && n.conv && setChat) {
            setChat({
              ...n.conv
            });
            setPage("chat");
            return;
          }
          if (n.listing_id && openDetail) {
            fetchListingDetail(n.listing_id).then(data => {
              if (data) openDetail({
                ...data,
                _scrollToQA: n.type === "question" || n.type === "answer"
              }, "notifications");
            });
          }
        }} style={sx.s1(DC, n)}>
            <div style={sx.s2}>{notifIcon(n.type)}</div>
            <div style={sx.s3}>
              <div style={sx.s4(DC, n)}>{n.text}</div>
              <div style={sx.s5(DC)}>{n.time}</div>
            </div>
            <button onClick={async e => {
            e.stopPropagation();
            await deleteNotif(n.id);
          }} style={sx.s6(DC)}>🗑️</button>
          </div>;
      })}
      </div>
    </div>;
}
export default NotificationsPage;
