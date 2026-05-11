import React, { useState, useRef } from "react";
import { C } from "../../../shared/constants/colors.js";
import { markMessagesRead } from "../../services/messaging.js";
function SwipeableConvItem({
  c,
  DC,
  setChat,
  setPage,
  onDelete,
  onOpen,
  onAvatarClick,
  children
}) {
  const [offset, setOffset] = useState(0);
  const [pressed, setPressed] = useState(false);
  const startXRef = useRef(null);
  const dragged = useRef(false);
  const BTN_W = 80;
  const sx = {
    s1: DC => ({
      position: "relative",
      borderBottom: `1px solid ${DC.border}`,
      overflow: "hidden"
    }),
    s2: BTN_W => ({
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: BTN_W,
      zIndex: 10,
      background: "#EF4444",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 2,
      cursor: "pointer"
    }),
    s3: {
      color: "white",
      fontSize: 11,
      fontWeight: 700
    },
    s4: (pressed, c, DC, offset, startXRef) => ({
      position: "relative",
      zIndex: 2,
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "14px 16px",
      background: pressed ? "#D1E8DA" : c.unread > 0 ? "#E8F4F0" : DC.white,
      transform: `translateX(${offset}px)`,
      transition: startXRef.current ? "none" : "transform 0.2s ease, background 0.15s ease",
      cursor: "pointer",
      WebkitTapHighlightColor: "transparent"
    }),
    s5: {
      position: "relative",
      flexShrink: 0,
      cursor: "pointer"
    },
    s6: {
      flex: 1,
      minWidth: 0
    },
    s7: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: 3
    },
    s8: (c, DC) => ({
      fontWeight: c.unread > 0 ? 900 : 700,
      fontSize: 14,
      color: DC.text
    }),
    s9: DC => ({
      fontSize: 11,
      color: DC.text3
    }),
    s10: (c, DC) => ({
      fontSize: 12,
      color: c.unread > 0 ? DC.text : DC.text2,
      fontWeight: c.unread > 0 ? 700 : 400,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      display: "flex",
      gap: 4,
      alignItems: "center"
    }),
    s11: DC => ({
      fontSize: 11,
      background: "rgba(26,74,46,0.1)",
      color: DC.text,
      borderRadius: 4,
      padding: "1px 5px"
    }),
    s12: {
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    },
    s13: {
      fontSize: 11,
      color: "#1A4A2E",
      marginTop: 2
    },
    s14: {
      background: "#1A4A2E",
      color: "white",
      borderRadius: "50%",
      minWidth: 20,
      height: 20,
      padding: "0 5px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 11,
      fontWeight: 700,
      flexShrink: 0
    }
  };
  return <div style={sx.s1(DC)}>
      {offset > 0 && <div onClick={() => onDelete(c.id)} style={sx.s2(BTN_W)}>
          <span>🗑️</span>
          <span style={sx.s3}>حذف</span>
        </div>}

      <div onTouchStart={e => {
      startXRef.current = e.touches[0].clientX;
      dragged.current = false;
      setPressed(true);
    }} onTouchMove={e => {
      if (startXRef.current === null) return;
      const dx = e.touches[0].clientX - startXRef.current;
      if (Math.abs(dx) > 8) {
        dragged.current = true;
        setPressed(false);
      }
      if (dx > 0) setOffset(Math.min(dx, BTN_W));else setOffset(o => Math.max(0, o + dx));
    }} onTouchEnd={() => {
      startXRef.current = null;
      setPressed(false);
      setOffset(o => o > BTN_W / 2 ? BTN_W : 0);
    }} onClick={async () => {
      if (!dragged.current) {
        if (onOpen) onOpen(c);else {
          setChat(c);
          setPage("chat");
        }
        await markMessagesRead(c.id);
        setTimeout(() => window._reloadConvs?.(), 300);
      } else {
        setOffset(0);
      }
    }} style={sx.s4(pressed, c, DC, offset, startXRef)}>
        {/* الصورة — تفتح البروفايل عند الضغط عليها فقط */}
        <div onClick={e => {
        e.stopPropagation();
        onAvatarClick?.(c);
      }} style={sx.s5}>
          {children}
        </div>
        {/* محتوى الصف — كله يفتح المحادثة */}
        <div style={sx.s6}>
          <div style={sx.s7}>
            <div style={sx.s8(c, DC)}>{c.name}</div>
            <div style={sx.s9(DC)}>{c.time}</div>
          </div>
          <div style={sx.s10(c, DC)}>
            {c.lastMsg?.startsWith("↩️ رد على حالتك:") && <span style={sx.s11(DC)}>رد حالة</span>}
            <span style={sx.s12}>{c.lastMsg?.startsWith("↩️ رد على حالتك:") ? c.lastMsg.replace(/[↩️]+ [^—]+ — /, "") : c.lastMsg}</span>
          </div>
          {c.property && <div style={sx.s13}>{"🏠"}{c.property}</div>}
        </div>
        {c.unread > 0 && <div style={sx.s14}>{c.unread}</div>}
      </div>
    </div>;
}
export { SwipeableConvItem };
