import React, { useState, useEffect } from "react";
import { C } from "../../shared/constants/colors.js";
import { BackButton } from "../../shared/components/common/BackButton.jsx";
import { fetchFollowingWithProfiles } from "../services/userService.js";
import { getCurrentUserId } from "../services/authService.js";
import { S, mergeStyles } from "../../shared/styles/primitives.js";
function FollowingPage({
  setPage,
  DC,
  user = [],
  toggleFollow
}) {
  const sx = {
    s1: DC => ({
      background: DC.bg,
      minHeight: "100vh",
      fontFamily: "Tajawal,sans-serif",
      direction: "rtl"
    }),
    s2: C => ({
      background: C.primary,
      padding: "48px 16px 16px",
      color: "white",
      display: "flex",
      alignItems: "center",
      gap: 12
    }),
    s3: {
      fontSize: 18,
      fontWeight: 900
    },
    s4: {
      padding: 16
    },
    s5: DC => ({
      textAlign: "center",
      padding: 40,
      color: DC.text3
    }),
    s6: DC => ({
      textAlign: "center",
      padding: 60,
      color: DC.text3
    }),
    s7: {
      fontWeight: 700
    },
    s8: {
      fontSize: 13,
      marginTop: 6
    }
  };
  if (!DC) DC = C;
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const loadFollowing = async () => {
    const myId = await getCurrentUserId();
    if (!myId) {
      setLoading(false);
      return;
    }
    const profiles = await fetchFollowingWithProfiles(myId);
    setUsers(profiles);
    setLoading(false);
  };
  useEffect(() => {
    loadFollowing();
  }, [user?.id]);
  return <div style={sx.s1(DC)}>
      <div style={sx.s2(C)}>
        <BackButton onPress={() => setPage("profile")} />
        <div style={sx.s3}>{`👥 من أتابع (${loading ? "..." : users.length})`}</div>
      </div>
      <div style={sx.s4}>
        {loading && <div style={sx.s5(DC)}>⏳ جاري التحميل...</div>}
        {!loading && users.length === 0 && <div style={sx.s6(DC)}>
            <div style={S.font48Mb12}>{"👥"}</div>
            <div style={sx.s7}>لا تتابع أحداً بعد</div>
            <div style={sx.s8}>تابع بائعين من صفحة الإعلان</div>
          </div>}
        {users.map(u => {
        const sx = {
          s1: DC => ({
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "14px 16px",
            background: DC.white,
            borderRadius: 12,
            marginBottom: 10,
            border: `1px solid ${DC.border}`
          }),
          s2: C => ({
            width: 46,
            height: 46,
            borderRadius: "50%",
            background: C.primary,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            fontWeight: 800,
            color: "white",
            flexShrink: 0
          }),
          s3: DC => ({
            fontSize: 14,
            fontWeight: 700,
            color: DC.text
          }),
          s4: DC => ({
            fontSize: 12,
            color: DC.text3
          }),
          s5: {
            padding: "6px 14px",
            borderRadius: 20,
            border: "1.5px solid #EF4444",
            background: "#FEF2F2",
            color: "#EF4444",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit"
          }
        };
        return <div key={u.id} style={sx.s1(DC)}>
            <div style={sx.s2(C)}>
              {(u.name || "م")[0]}
            </div>
            <div style={S.flex1}>
              <div style={sx.s3(DC)}>{u.name || "مستخدم"}</div>
              <div style={sx.s4(DC)}>{u.account_type === "office" ? "🏢 مكتب عقاري" : "👤 فرد"}</div>
            </div>
            <button onClick={() => {
            toggleFollow && toggleFollow(u.id);
            setUsers(p => p.filter(x => x.id !== u.id));
          }} style={sx.s5}>
              إلغاء المتابعة
            </button>
          </div>;
      })}
      </div>
    </div>;
}
export default FollowingPage;