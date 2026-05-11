import React, { useEffect, useRef, useState } from "react";
import { C } from "../../shared/constants/colors.js";
import { useChatMessages } from "../hooks/useMessaging.js";
import { ReportModal } from "../components/modals.jsx";
import { blockUser, unblockUser, isUserBlocked } from "../services/blockService.js";
import { fetchBannedWords } from "../services/messaging.js";
const reportStorageKey = (userId, itemType, itemId) => userId && itemId ? `report_sent:${userId}:${itemType}:${itemId}` : "";
function ChatPage({
  conv,
  setPage,
  setSeller,
  DC = C,
  user
}) {
  const [text, setText] = useState("");
  const [bannedWords, setBannedWords] = useState([]);
  const [showMenu, setShowMenu] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [hasReported, setHasReported] = useState(false);
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [toast, setToast] = useState("");
  const showToast = msg => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };
  const bottomRef = useRef(null);
  const longPressTimerRef = useRef(null);
  const {
    messages,
    loading,
    warnMsg,
    sendMessage,
    deleteMessageById,
    deleteConversationAndLeave
  } = useChatMessages({
    conversation: conv,
    user,
    bannedWords
  });
  const otherUserId = conv?.seller_id === user?.id ? conv?.buyer_id : conv?.seller_id;
  const sx = {
    s1: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      color: "#999",
      fontFamily: "Tajawal"
    },
    s2: DC => ({
      display: "flex",
      flexDirection: "column",
      height: "100dvh",
      background: DC.bg,
      fontFamily: "Tajawal,sans-serif",
      direction: "rtl",
      overflowY: "hidden",
      position: "relative",
      maxWidth: 430,
      margin: "0 auto",
      width: "100%"
    }),
    s3: {
      position: "fixed",
      top: 20,
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 9999,
      background: "#1A2E20",
      color: "white",
      padding: "10px 20px",
      borderRadius: 20,
      fontSize: 13,
      fontWeight: 700,
      whiteSpace: "nowrap",
      boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
    },
    s4: C => ({
      background: C.primary,
      padding: "44px 16px 14px",
      display: "flex",
      alignItems: "center",
      gap: 12,
      flexShrink: 0
    }),
    s5: {
      background: "none",
      border: "none",
      color: "white",
      fontSize: 22,
      cursor: "pointer"
    },
    s6: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      cursor: "pointer",
      flex: 1
    },
    s7: {
      width: 38,
      height: 38,
      borderRadius: "50%",
      background: "rgba(255,255,255,0.2)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "white",
      fontSize: 14,
      fontWeight: 700
    },
    s8: {
      color: "white",
      fontWeight: 800,
      fontSize: 15
    },
    s9: {
      color: "rgba(255,255,255,0.7)",
      fontSize: 11
    },
    s10: {
      marginRight: "auto",
      position: "relative"
    },
    s11: {
      background: "none",
      border: "none",
      color: "white",
      fontSize: 22,
      cursor: "pointer",
      padding: "4px 8px"
    },
    s12: DC => ({
      position: "absolute",
      top: 36,
      left: 0,
      background: DC.white,
      borderRadius: 12,
      boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
      minWidth: 180,
      zIndex: 200,
      overflow: "hidden"
    }),
    s13: DC => ({
      width: "100%",
      padding: "14px 16px",
      border: "none",
      background: "none",
      textAlign: "right",
      fontSize: 14,
      fontWeight: 700,
      cursor: "pointer",
      color: "#EF4444",
      fontFamily: "Tajawal,sans-serif",
      borderBottom: "1px solid " + DC.border
    }),
    s14: (hasReported, DC) => ({
      width: "100%",
      padding: "14px 16px",
      border: "none",
      background: hasReported ? "#F8FAFC" : "none",
      textAlign: "right",
      fontSize: 14,
      fontWeight: 700,
      cursor: hasReported ? "default" : "pointer",
      color: hasReported ? "#64748B" : DC.text,
      fontFamily: "Tajawal,sans-serif",
      borderBottom: "1px solid " + DC.border
    }),
    s15: {
      width: "100%",
      padding: "14px 16px",
      border: "none",
      background: "none",
      textAlign: "right",
      fontSize: 14,
      fontWeight: 700,
      cursor: "pointer",
      color: "#22C55E",
      fontFamily: "Tajawal,sans-serif"
    },
    s16: DC => ({
      width: "100%",
      padding: "14px 16px",
      border: "none",
      background: "none",
      textAlign: "right",
      fontSize: 14,
      fontWeight: 700,
      cursor: "pointer",
      color: DC.text,
      fontFamily: "Tajawal,sans-serif"
    }),
    s17: {
      position: "fixed",
      inset: 0,
      zIndex: 199
    },
    s18: {
      flex: 1,
      overflowY: "auto",
      padding: "16px",
      display: "flex",
      flexDirection: "column",
      gap: 10
    },
    s19: DC => ({
      textAlign: "center",
      color: DC.text3
    }),
    s20: DC => ({
      padding: "12px 16px",
      background: DC.white,
      borderTop: `1px solid ${DC.border}`,
      display: "flex",
      gap: 8,
      flexShrink: 0,
      position: "relative"
    }),
    s21: {
      flex: 1,
      textAlign: "center",
      color: "#EF4444",
      fontWeight: 700,
      fontSize: 13
    },
    s22: C => ({
      background: "none",
      border: "none",
      color: C.primary,
      fontWeight: 700,
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 13
    }),
    s23: {
      position: "absolute",
      bottom: 70,
      right: 16,
      left: 16,
      background: "#FEF2F2",
      border: "1px solid #FECACA",
      borderRadius: 10,
      padding: "8px 14px",
      fontSize: 12,
      fontWeight: 700,
      color: "#EF4444",
      textAlign: "center"
    },
    s24: DC => ({
      flex: 1,
      padding: "11px 14px",
      borderRadius: 22,
      border: `1.5px solid ${DC.border}`,
      fontSize: 14,
      fontFamily: "inherit",
      background: DC.bg,
      color: DC.text,
      outline: "none"
    }),
    s25: (text, C) => ({
      width: 44,
      height: 44,
      borderRadius: "50%",
      border: "none",
      background: text.trim() ? C.primary : "#ccc",
      color: "white",
      fontSize: 20,
      cursor: text.trim() ? "pointer" : "default"
    }),
    s26: {
      position: "fixed",
      inset: 0,
      zIndex: 9999,
      display: "flex",
      alignItems: "flex-end",
      background: "rgba(0,0,0,0.4)"
    },
    s27: {
      width: "100%",
      maxWidth: 430,
      margin: "0 auto",
      background: "white",
      borderRadius: "16px 16px 0 0",
      padding: "20px 16px 32px",
      direction: "rtl"
    },
    s28: {
      fontWeight: 700,
      fontSize: 15,
      marginBottom: 16,
      color: "#1a1a1a",
      textAlign: "center"
    },
    s29: {
      width: "100%",
      padding: "14px",
      background: "#FEE2E2",
      border: "none",
      borderRadius: 12,
      color: "#EF4444",
      fontSize: 15,
      fontWeight: 700,
      cursor: "pointer",
      fontFamily: "inherit",
      marginBottom: 10
    },
    s30: {
      width: "100%",
      padding: "14px",
      background: "#f5f5f5",
      border: "none",
      borderRadius: 12,
      fontSize: 15,
      fontWeight: 700,
      cursor: "pointer",
      fontFamily: "inherit",
      color: "#666"
    }
  };
  useEffect(() => {
    if (!user?.id || !otherUserId) {
      setHasReported(false);
      return;
    }
    try {
      setHasReported(localStorage.getItem(reportStorageKey(user.id, "chat", conv?.id || otherUserId)) === "1");
    } catch {
      setHasReported(false);
    }
  }, [user?.id, otherUserId]);
  const closeMenu = () => setShowMenu(false);
  const deleteConv = async () => {
    closeMenu();
    const ok = await deleteConversationAndLeave();
    if (ok) setPage("messages");
  };
  const blockUserHandler = async () => {
    if (user?.id && otherUserId) {
      await blockUser(user.id, otherUserId);
    }
    setBlocked(true);
    closeMenu();
    showToast("✅ تم حظر المستخدم");
  };
  const unblockUserHandler = async () => {
    if (user?.id && otherUserId) {
      await unblockUser(user.id, otherUserId);
    }
    setBlocked(false);
    closeMenu();
  };
  const reportUser = () => {
    if (user?.isSuspended) {
      showToast("🚫 حسابك موقوف");
      return;
    }
    if (hasReported) {
      showToast("🛡️ أرسلت بلاغًا مسبقًا");
      closeMenu();
      return;
    }
    closeMenu();
    setShowReport(true);
  };
  const handleSend = async () => {
    const content = text.trim();
    if (!content) return;
    setText("");
    const result = await sendMessage(content);
    if (!result?.ok) {
      setText(current => current || content);
    }
  };
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  }, [messages]);
  useEffect(() => {
    fetchBannedWords().then(setBannedWords);
  }, []);
  useEffect(() => {
    if (!user?.id || !otherUserId) {
      setBlocked(false);
      return;
    }
    let active = true;
    isUserBlocked(user.id, otherUserId).then(b => {
      if (active) setBlocked(b);
    });
    return () => {
      active = false;
    };
  }, [otherUserId, user?.id]);
  if (!conv) return <div style={sx.s1}>اختر محادثة</div>;
  return <div style={sx.s2(DC)}>
      {toast && <div style={sx.s3}>
          {toast}
        </div>}
      <div style={sx.s4(C)}>
        <button onClick={() => setPage("messages")} style={sx.s5}>→</button>
        <div onClick={() => {
        if (setSeller && otherUserId) {
          setSeller({
            user_id: otherUserId,
            sellerId: otherUserId,
            name: conv?.name,
            sellerName: conv?.name,
            init: (conv?.name || "م")[0],
            prevPage: "chat"
          });
          setPage("sellerProfile");
        }
      }} style={sx.s6}>
          <div style={sx.s7}>{(conv?.name || "م")[0]}</div>
          <div style={sx.s8}>{conv?.name || "محادثة"}</div>
          {conv?.property && <div style={sx.s9}>{"🏠"}{conv.property}</div>}
        </div>
        <div style={sx.s10}>
          <button onClick={() => setShowMenu(value => !value)} style={sx.s11}>⋮</button>
          {showMenu && <div style={sx.s12(DC)}>
              <button onClick={deleteConv} style={sx.s13(DC)}>{"🗑️ حذف المحادثة"}</button>
              <button onClick={reportUser} style={sx.s14(hasReported, DC)}>{hasReported ? "🛡️ تم الإبلاغ على المحادثة مسبقًا" : "🚩 إبلاغ عن المحادثة"}</button>
              {blocked ? <button onClick={unblockUserHandler} style={sx.s15}>{"✅ فك حظر المستخدم"}</button> : <button onClick={blockUserHandler} style={sx.s16(DC)}>{"🚫 حظر المستخدم"}</button>}
            </div>}
        </div>
      </div>
      {showMenu && <div onClick={closeMenu} style={sx.s17} />}
      <div style={sx.s18}>
        {loading && <div style={sx.s19(DC)}>جاري التحميل...</div>}
        {messages.map(m => {
        const sx = {
          s1: m => ({
            display: "flex",
            justifyContent: m.from === "me" ? "flex-start" : "flex-end"
          }),
          s2: (m, DC, C) => ({
            maxWidth: "75%",
            padding: "10px 14px",
            borderRadius: m.from === "me" ? "18px 18px 18px 4px" : "18px 18px 4px 18px",
            background: m.from === "me" ? DC.white : C.primary,
            color: m.from === "me" ? DC.text : "white",
            fontSize: 14,
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
            userSelect: "none",
            opacity: m.pending ? 0.75 : 1,
            border: m.failed ? "1px solid #EF4444" : "none"
          }),
          s3: {
            fontSize: 10,
            background: "rgba(255,255,255,0.25)",
            borderRadius: 6,
            padding: "3px 7px",
            marginBottom: 5,
            display: "flex",
            alignItems: "center",
            gap: 4
          },
          s4: {
            opacity: 0.85
          },
          s5: m => ({
            fontSize: 10,
            opacity: 0.6,
            marginTop: 4,
            textAlign: m.from === "me" ? "left" : "right",
            display: "flex",
            alignItems: "center",
            gap: 6,
            justifyContent: m.from === "me" ? "flex-start" : "flex-end"
          }),
          s6: {
            color: "#EF4444",
            opacity: 1
          }
        };
        return <div key={m.id} style={sx.s1(m)}>
            <div onContextMenu={e => {
            e.preventDefault();
            if (m.from === "me" && !m.pending) setSelectedMsg(m.id);
          }} onTouchStart={() => {
            if (m.from !== "me" || m.pending) return;
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = setTimeout(() => setSelectedMsg(m.id), 500);
          }} onTouchEnd={() => clearTimeout(longPressTimerRef.current)} onTouchCancel={() => clearTimeout(longPressTimerRef.current)} style={sx.s2(m, DC, C)}>
              {m.text?.startsWith("↩️ رد على حالتك:") ? <div>
                  <div style={sx.s3}>
                    <span>{"📸"}</span>
                    <span style={sx.s4}>رد على حالة</span>
                  </div>
                  <div>{m.text.replace(/↩️ رد على حالتك: [^—]+ — /, "")}</div>
                </div> : <div>{m.text}</div>}
              <div style={sx.s5(m)}>
                {m.pending && <span>جارٍ الإرسال…</span>}
                {m.failed && <span style={sx.s6}>فشل الإرسال</span>}
                <span>{m.time}</span>
              </div>
            </div>
          </div>;
      })}
        <div ref={bottomRef} />
      </div>
      <div style={sx.s20(DC)}>
        {blocked ? <div style={sx.s21}>{"🚫 حظرت هذا المستخدم —"}{""}
              <button onClick={unblockUserHandler} style={sx.s22(C)}>فك الحظر</button>
            </div> : <>
              {warnMsg && <div style={sx.s23}>
                  {warnMsg}
                </div>}
              <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            handleSend();
          }
        }} placeholder="اكتب رسالة..." style={sx.s24(DC)} />
              <button onClick={handleSend} style={sx.s25(text, C)}>↑</button>
            </>}
      </div>
      {selectedMsg && <div style={sx.s26} onClick={() => setSelectedMsg(null)}>
          <div style={sx.s27} onClick={e => e.stopPropagation()}>
            <div style={sx.s28}>خيارات الرسالة</div>
            <button onClick={async () => {
          const ok = await deleteMessageById(selectedMsg);
          if (ok) setSelectedMsg(null);
        }} style={sx.s29}>{"🗑️ حذف الرسالة"}</button>
            <button onClick={() => setSelectedMsg(null)} style={sx.s30}>إلغاء</button>
          </div>
        </div>}
      {showReport && <ReportModal itemId={otherUserId} itemType="chat" itemTitle={conv?.otherName || ""} conversationId={conv?.id || null} onClose={() => setShowReport(false)} onReported={() => {
      setHasReported(true);
      try {
        localStorage.setItem(reportStorageKey(user?.id, "chat", conv?.id || otherUserId), "1");
      } catch {}
    }} />}
    </div>;
}
export default ChatPage;