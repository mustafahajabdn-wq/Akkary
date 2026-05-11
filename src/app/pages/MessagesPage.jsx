import React from "react";
import { C } from "../../shared/constants/colors.js";
import { SwipeableConvItem } from "../components/common/SwipeableConvItem.jsx";
import { useConversations } from "../hooks/useMessaging.js";
function MessagesPage({
  setPage,
  setChat,
  setSeller,
  DC = C,
  user
}) {
  const {
    conversations: convs,
    loading,
    openConversation,
    deleteConversationById
  } = useConversations(user?.id);
  const openSellerProfile = conversation => {
    setSeller?.({
      sellerId: conversation.sellerId,
      sellerName: conversation.name,
      seller: conversation.name,
      user_id: conversation.sellerId,
      prevPage: "messages"
    });
    setPage("sellerProfile");
  };
  const sx = {
    s1: DC => ({
      background: DC.bg,
      minHeight: "100vh",
      paddingBottom: 80,
      fontFamily: "Tajawal, sans-serif",
      direction: "rtl"
    }),
    s2: C => ({
      background: C.primary,
      padding: "48px 16px 16px",
      color: "white"
    }),
    s3: {
      fontSize: 20,
      fontWeight: 900
    },
    s4: DC => ({
      textAlign: "center",
      padding: 40,
      color: DC.text3
    }),
    s5: DC => ({
      textAlign: "center",
      padding: 60,
      color: DC.text3
    }),
    s6: {
      fontSize: 40,
      marginBottom: 12
    },
    s7: {
      fontWeight: 700
    },
    s8: {
      fontSize: 13,
      marginTop: 6
    }
  };
  return <div style={sx.s1(DC)}>
      <div style={sx.s2(C)}>
        <div style={sx.s3}>{"الرسائل 💬"}</div>
      </div>
      {loading && <div style={sx.s4(DC)}>جاري التحميل...</div>}
      {!loading && convs.length === 0 && <div style={sx.s5(DC)}>
          <div style={sx.s6}>{"💬"}</div>
          <div style={sx.s7}>لا توجد رسائل بعد</div>
          <div style={sx.s8}>تواصل مع البائعين من صفحة الإعلان</div>
        </div>}
      {convs.map(c => {
      const sx = {
        s1: {
          position: "relative"
        },
        s2: C => ({
          width: 46,
          height: 46,
          borderRadius: "50%",
          background: C.primary,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontSize: 16,
          fontWeight: 700
        }),
        s3: {
          position: "absolute",
          bottom: 1,
          right: 1,
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: "#22C55E",
          border: "2px solid white"
        }
      };
      return <SwipeableConvItem key={c.id} c={c} DC={DC} setChat={setChat} setPage={setPage} onOpen={conversation => openConversation(conversation, setChat, setPage)} onDelete={deleteConversationById} onAvatarClick={openSellerProfile}>
          {/* الصورة — الضغط عليها يفتح البروفايل */}
          <div style={sx.s1}>
            <div style={sx.s2(C)}>{c.init}</div>
            {c.online && <div style={sx.s3} />}
          </div>
        </SwipeableConvItem>;
    })}
      {/* ملاحظة: الاسم والرسالة والتاريخ ضُمِّنت داخل SwipeableConvItem مباشرة */}
    </div>;
}
export default MessagesPage;