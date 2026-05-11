import { BackButton } from "../../shared/components/common/BackButton.jsx";
import React, { useState, useEffect } from "react";
import { C } from "../../shared/constants/colors.js";
import { fetchBlockedUsers, unblockUser } from "../services/blockService.js";
import { S, mergeStyles } from "../../shared/styles/primitives.js";
export default function BlockedPage({
  setPage,
  DC,
  user
}) {
  const [blocked, setBlocked] = useState([]);
  const [loading, setLoading] = useState(true);
  const sx = {
    s1: C => ({
      background: C.primary,
      padding: "52px 16px 24px",
      position: "relative"
    }),
    s2: {
      textAlign: "center",
      padding: "60px 0"
    },
    s3: DC => ({
      fontSize: 15,
      fontWeight: 800,
      color: DC?.text
    }),
    s4: DC => ({
      fontSize: 13,
      color: DC?.text3,
      marginTop: 6
    })
  };
  useEffect(() => {
    if (user?.id) load();
  }, [user?.id]);
  async function load() {
    setLoading(true);
    try {
      const data = await fetchBlockedUsers(user.id);
      setBlocked(data);
    } catch (e) {
      console.error("load blocked error", e);
    } finally {
      setLoading(false);
    }
  }
  async function unblock(blockedId) {
    if (!user?.id) return;
    try {
      await unblockUser(user.id, blockedId);
      setBlocked(p => p.filter(b => b.blocked_id !== blockedId));
    } catch (e) {
      console.error("unblock error", e);
    }
  }
  return <div style={S.pageShell(DC)}>
      {/* Header */}
      <div style={sx.s1(C)}>
        <BackButton onPress={() => setPage("profile")} />
        <div style={S.title20White}>🚫 المحظورون</div>
        <div style={S.whiteMeta12}>{blocked.length} مستخدم محظور</div>
      </div>

      <div style={S.pad14Bottom80}>
        {loading ? <div style={S.emptyStateCentered}>⏳</div> : blocked.length === 0 ? <div style={sx.s2}>
            <div style={S.font48Mb12}>🚫</div>
            <div style={sx.s3(DC)}>لا توجد حسابات محظورة</div>
            <div style={sx.s4(DC)}>يمكنك حظر مستخدم من صفحة ملفه الشخصي</div>
          </div> : blocked.map(b => {
        const profile = b.profile;
        const sx = {
          s1: DC => ({
            background: DC?.white || "#fff",
            borderRadius: 12,
            border: "1px solid " + (DC?.border || "#DDE8E1"),
            marginBottom: 10,
            padding: "12px 14px",
            display: "flex",
            alignItems: "center",
            gap: 12
          }),
          s2: {
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: "#FEF2F2",
            color: "#EF4444",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            fontWeight: 900,
            flexShrink: 0
          },
          s3: DC => ({
            fontSize: 14,
            fontWeight: 800,
            color: DC?.text
          }),
          s4: DC => ({
            fontSize: 11,
            color: DC?.text3
          }),
          s5: C => ({
            padding: "7px 14px",
            borderRadius: 20,
            border: "1.5px solid " + C.primary,
            background: "#E8F4F0",
            color: C.primary,
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit"
          })
        };
        return <div key={b.blocked_id} style={sx.s1(DC)}>
              <div style={sx.s2}>
                {(profile?.name || "م")[0]}
              </div>
              <div style={S.flex1}>
                <div style={sx.s3(DC)}>{profile?.name || "مستخدم"}</div>
                <div style={sx.s4(DC)}>{profile?.account_type === "office" ? "🏢 مكتب عقاري" : "👤 حساب فردي"}</div>
              </div>
              <button onClick={() => unblock(b.blocked_id)} style={sx.s5(C)}>
                فك الحظر
              </button>
            </div>;
      })}
      </div>
    </div>;
}