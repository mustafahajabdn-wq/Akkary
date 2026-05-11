import { Navigate } from "react-router-dom";
import { BackButton } from "../../shared/components/common/BackButton.jsx";
import React, { useState, useEffect } from "react";
import { getPushSubscriptionsCount, sendAdminBroadcast } from "../services/adminService.js";
import { C } from "../../shared/constants/colors.js";
import { IslamicPattern, Wave } from "../../shared/components/icons.jsx";
import { S, mergeStyles } from "../../shared/styles/primitives.js";
export default function AdminBroadcast({
  setPage,
  DC,
  user
}) {
  const sx = {
    s1: {
      background: "#7C3AED",
      padding: "48px 16px 50px",
      position: "relative",
      overflow: "hidden"
    },
    s2: {
      fontSize: 12,
      color: "rgba(255,255,255,0.7)",
      marginTop: 4
    },
    s3: DC => ({
      background: DC?.white || "#fff",
      borderRadius: 12,
      border: "1.5px solid " + (DC?.border || "#DDE8E1"),
      padding: "16px",
      marginBottom: 14
    }),
    s4: inp => ({
      ...inp,
      height: 90,
      resize: "none",
      paddingTop: 11
    }),
    s5: (withPush, DC) => ({
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "12px 14px",
      borderRadius: 10,
      border: "1.5px solid " + (withPush ? "#7C3AED" : DC?.border || "#DDE8E1"),
      background: withPush ? "#F5F3FF" : "#FAFAFA",
      cursor: "pointer",
      marginBottom: 12
    }),
    s6: (withPush, DC) => ({
      fontSize: 13,
      fontWeight: 800,
      color: withPush ? "#7C3AED" : DC?.text || "#1A2E20"
    }),
    s7: {
      fontSize: 11,
      color: "#9CA3AF",
      marginTop: 2
    },
    s8: withPush => ({
      width: 40,
      height: 22,
      borderRadius: 11,
      background: withPush ? "#7C3AED" : "#D1D5DB",
      position: "relative",
      transition: "background 0.2s",
      flexShrink: 0
    }),
    s9: withPush => ({
      position: "absolute",
      top: 2,
      left: withPush ? 20 : 2,
      width: 18,
      height: 18,
      borderRadius: "50%",
      background: "white",
      boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      transition: "left 0.2s"
    }),
    s10: {
      background: "#F3F4F6",
      borderRadius: 10,
      padding: "12px 14px",
      marginBottom: 12,
      border: "1px solid #E5E7EB"
    },
    s11: {
      fontSize: 10,
      fontWeight: 800,
      color: "#6B7280",
      marginBottom: 6
    },
    s12: {
      display: "flex",
      gap: 10,
      alignItems: "flex-start"
    },
    s13: C => ({
      width: 36,
      height: 36,
      borderRadius: 8,
      background: C.primary,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 18,
      flexShrink: 0
    }),
    s14: {
      fontSize: 13,
      fontWeight: 800,
      color: "#111",
      marginBottom: 2
    },
    s15: {
      fontSize: 12,
      color: "#6B7280"
    },
    s16: (loading, title, body) => ({
      width: "100%",
      padding: "13px",
      borderRadius: 10,
      border: "none",
      background: loading || !title.trim() || !body.trim() ? "#D1D5DB" : "#7C3AED",
      color: "white",
      fontSize: 14,
      fontWeight: 800,
      cursor: loading ? "not-allowed" : "pointer",
      fontFamily: "inherit"
    }),
    s17: result => ({
      padding: "12px 14px",
      borderRadius: 10,
      background: result.ok ? "#F0FDF4" : "#FEF2F2",
      border: "1px solid " + (result.ok ? "#BBF7D0" : "#FECACA"),
      fontSize: 13,
      color: result.ok ? "#14532D" : "#991B1B",
      fontWeight: 700,
      whiteSpace: "pre-line",
      lineHeight: 1.8
    })
  };
  if (user?.role !== "admin" && !(user?.allowedPages || []).includes("adminBroadcast")) return <Navigate to="/admin/dashboard" replace />;
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("/notifications");
  const [withPush, setWithPush] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [subsCount, setSubsCount] = useState(null);
  useEffect(() => {
    getPushSubscriptionsCount().then(setSubsCount).catch(() => {});
  }, []);
  async function send() {
    if (!title.trim() || !body.trim()) {
      setResult({
        ok: false,
        msg: "يجب إدخال العنوان والنص"
      });
      return;
    }
    setLoading(true);
    setResult(null);
    const {
      totalUsers,
      pushResult
    } = await sendAdminBroadcast({
      title,
      body,
      url,
      withPush
    });
    if (!totalUsers) {
      setResult({
        ok: false,
        msg: "لا يوجد مستخدمون"
      });
      setLoading(false);
      return;
    }
    const pushLine = withPush ? `
📲 Push: ${pushResult.sent || 0} وصل · ${pushResult.failed || 0} فشل` : "";
    setResult({
      ok: true,
      msg: `✅ أُرسل لـ ${totalUsers} مستخدم${pushLine}`
    });
    setTitle("");
    setBody("");
    setUrl("/notifications");
    setLoading(false);
  }
  const inp = {
    width: "100%",
    padding: "11px 13px",
    borderRadius: 10,
    border: "1.5px solid " + (DC?.border || "#DDE8E1"),
    fontSize: 13,
    fontFamily: "Tajawal,sans-serif",
    background: DC?.white || "#fff",
    color: DC?.text || "#1A2E20",
    boxSizing: "border-box",
    outline: "none",
    direction: "rtl",
    marginBottom: 12
  };
  return <div style={S.pageShell(DC)}>
      <div style={sx.s1}>
        <IslamicPattern opacity={0.1} color="#FFFFFF" width={430} height={200} />
        <div style={S.absTopRight14}>
          <BackButton onPress={() => setPage("adminDashboard")} />
        </div>
        <div style={S.relZ1}>
          <div style={S.title20White}>📣 إشعار جماعي</div>
          <div style={sx.s2}>إشعار داخلي + Push اختياري</div>
        </div>
        <Wave />
      </div>

      <div style={S.pad14Bottom80}>
        <div style={sx.s3(DC)}>

          <label style={S.labelMutedBlock6(DC)}>عنوان الإشعار *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="مثال: تحديث جديد 🎉" style={inp} />

          <label style={S.labelMutedBlock6(DC)}>نص الإشعار *</label>
          <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="اكتب نص الإشعار..." style={sx.s4(inp)} />

          <label style={S.labelMutedBlock6(DC)}>رابط الانتقال عند الضغط</label>
          <input value={url} onChange={e => setUrl(e.target.value)} placeholder="/notifications" style={mergeStyles(inp, S.ltrLeft)} />

          {/* خيار Push */}
          <div onClick={() => setWithPush(p => !p)} style={sx.s5(withPush, DC)}>
            <div>
              <div style={sx.s6(withPush, DC)}>
                📲 إرسال Push للأجهزة أيضاً
              </div>
              <div style={sx.s7}>
                {subsCount !== null ? `${subsCount} جهاز مشترك` : "جارٍ التحقق..."}
              </div>
            </div>
            <div style={sx.s8(withPush)}>
              <div style={sx.s9(withPush)} />
            </div>
          </div>

          {/* معاينة */}
          {(title || body) && <div style={sx.s10}>
              <div style={sx.s11}>📱 معاينة</div>
              <div style={sx.s12}>
                <div style={sx.s13(C)}>🏠</div>
                <div>
                  <div style={sx.s14}>{title || "العنوان"}</div>
                  <div style={sx.s15}>{body || "النص"}</div>
                </div>
              </div>
            </div>}

          <button onClick={send} disabled={loading || !title.trim() || !body.trim()} style={sx.s16(loading, title, body)}>
            {loading ? "⏳ جارٍ الإرسال..." : `📣 إرسال${withPush ? " + Push" : ""}`}
          </button>
        </div>

        {result && <div style={sx.s17(result)}>
            {result.msg}
          </div>}
      </div>
    </div>;
}