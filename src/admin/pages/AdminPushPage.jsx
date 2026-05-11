import { deleteAllPushSubscriptions, deletePushSubscription, fetchPushSubscriptionsBundle, sendPushToAll, sendPushToUser } from "../services/adminService.js";
import { Navigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { IslamicPattern, Wave } from "../../shared/components/icons.jsx";
import { S } from "../../shared/styles/primitives.js";
import { fDateTime } from "../../shared/utils/formatters.js";
function parseDevice(ua) {
  if (!ua) return {
    browser: "—",
    os: "—",
    icon: "🌐"
  };
  let browser = "متصفح آخر",
    os = "—",
    icon = "🌐";
  if (ua.includes("Chrome") && !ua.includes("Edg")) {
    browser = "Chrome";
    icon = "🟢";
  } else if (ua.includes("Firefox")) {
    browser = "Firefox";
    icon = "🦊";
  } else if (ua.includes("Safari") && !ua.includes("Chrome")) {
    browser = "Safari";
    icon = "🧭";
  } else if (ua.includes("Edg")) {
    browser = "Edge";
    icon = "🔵";
  }
  if (ua.includes("Android")) os = "Android";else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";else if (ua.includes("Windows")) os = "Windows";else if (ua.includes("Mac")) os = "Mac";else if (ua.includes("Linux")) os = "Linux";

  // استخرج الإصدار
  const chromeVer = ua.match(/Chrome\/([\d]+)/)?.[1];
  if (chromeVer) browser += ` ${chromeVer}`;
  return {
    browser,
    os,
    icon
  };
}
export default function AdminPushPage({
  setPage,
  DC,
  user
}) {
  const sx = {
    s1: DC => ({
      maxWidth: 430,
      margin: "0 auto",
      minHeight: "100vh",
      background: DC?.bg || "#F2F5F3",
      fontFamily: "Tajawal,sans-serif",
      direction: "rtl"
    }),
    s2: {
      background: "#7C3AED",
      padding: "48px 16px 50px",
      position: "relative",
      overflow: "hidden"
    },
    s3: {
      position: "absolute",
      top: 14,
      right: 16,
      zIndex: 2
    },
    s4: {
      width: 34,
      height: 34,
      borderRadius: "50%",
      background: "rgba(255,255,255,0.15)",
      border: "none",
      fontSize: 16,
      cursor: "pointer",
      color: "white"
    },
    s5: {
      fontSize: 20,
      fontWeight: 900,
      color: "white"
    },
    s6: {
      fontSize: 12,
      color: "rgba(255,255,255,0.6)",
      marginTop: 4
    },
    s7: {
      padding: "14px",
      paddingBottom: 80
    },
    s8: DC => ({
      background: DC?.white || "#fff",
      borderRadius: 12,
      border: "1.5px solid " + (DC?.border || "#DDE8E1"),
      padding: "14px",
      marginBottom: 12
    }),
    s9: DC => ({
      fontSize: 12,
      fontWeight: 800,
      color: DC?.text3,
      marginBottom: 8
    }),
    s10: inp => ({
      ...inp,
      marginBottom: 0
    }),
    s11: {
      width: "100%",
      marginTop: 10,
      padding: "11px",
      borderRadius: 10,
      border: "none",
      background: "#7C3AED",
      color: "white",
      fontSize: 13,
      fontWeight: 800,
      cursor: "pointer",
      fontFamily: "inherit"
    },
    s12: result => ({
      padding: "10px 14px",
      borderRadius: 10,
      background: result.ok ? "#F0FDF4" : "#FEF2F2",
      border: "1px solid " + (result.ok ? "#BBF7D0" : "#FECACA"),
      fontSize: 13,
      color: result.ok ? "#14532D" : "#991B1B",
      fontWeight: 700,
      marginBottom: 12
    }),
    s13: {
      width: "100%",
      padding: "11px",
      borderRadius: 10,
      border: "1.5px solid #FECACA",
      background: "#FEF2F2",
      color: "#EF4444",
      fontSize: 13,
      fontWeight: 800,
      cursor: "pointer",
      fontFamily: "inherit",
      marginBottom: 12
    },
    s14: DC => ({
      fontSize: 11,
      fontWeight: 800,
      color: DC?.text3,
      marginBottom: 8
    }),
    s15: {
      textAlign: "center",
      padding: 40
    },
    s16: {
      textAlign: "center",
      padding: 40
    },
    s17: {
      fontSize: 36,
      marginBottom: 8
    },
    s18: DC => ({
      fontSize: 13,
      color: DC?.text3
    })
  };
  if (user?.role !== "admin" && !(user?.allowedPages || []).includes("adminPush")) return <Navigate to="/admin/dashboard" replace />;
  const [subs, setSubs] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [testTitle, setTestTitle] = useState("اختبار إشعار 🔔");
  const [testBody, setTestBody] = useState("هذا إشعار تجريبي من لوحة الإدارة");
  const [userMessages, setUserMessages] = useState({}); // رسالة مخصصة لكل مشترك
  const [busy, setBusy] = useState(false); // ✅ منع الضغطات المتكررة

  useEffect(() => {
    load();
  }, []);
  async function load() {
    setLoading(true);
    try {
      const {
        subs,
        profiles
      } = await fetchPushSubscriptionsBundle();
      setSubs(subs);
      setProfiles(profiles);
    } catch (e) {
      setResult({
        ok: false,
        msg: "❌ تعذّر تحميل الاشتراكات: " + (e?.message || "خطأ غير معروف")
      });
    } finally {
      setLoading(false);
    }
  }
  async function deleteOne(id) {
    try {
      await deletePushSubscription(id);
      setSubs(p => p.filter(s => s.id !== id));
      setResult({
        ok: true,
        msg: "✅ تم حذف الاشتراك"
      });
    } catch (e) {
      setResult({
        ok: false,
        msg: "❌ فشل الحذف: " + (e?.message || "خطأ غير معروف")
      });
    }
  }
  async function deleteAll() {
    if (busy) return;
    if (!window.confirm(`حذف كل الاشتراكات (${subs.length})؟`)) return;
    setBusy(true);
    setResult({
      ok: true,
      msg: "⏳ جارٍ الحذف..."
    });
    try {
      await deleteAllPushSubscriptions();
      setSubs([]);
      setResult({
        ok: true,
        msg: "✅ تم حذف كل الاشتراكات"
      });
    } catch (e) {
      setResult({
        ok: false,
        msg: "❌ فشل الحذف الجماعي: " + (e?.message || "خطأ غير معروف")
      });
      // ✅ احتياطي: إعادة تحميل حتى نبقى متزامنين مع الخادم في حالة نجاح جزئي
      load();
    } finally {
      setBusy(false);
    }
  }
  async function sendTest(userId) {
    setResult({
      ok: true,
      msg: "⏳ جارٍ الإرسال..."
    });
    const customBody = userMessages[userId]?.trim() || testBody;
    try {
      const data = await sendPushToUser({
        userId,
        title: testTitle,
        body: customBody,
        url: "/notifications"
      });
      setResult({
        ok: data.sent > 0,
        msg: data.sent > 0 ? `✅ وصل للجهاز` : `❌ فشل — sent:${data.sent} failed:${data.failed}`
      });
    } catch (e) {
      setResult({
        ok: false,
        msg: "❌ خطأ: " + (e?.message || "خطأ غير معروف")
      });
    }
  }
  async function sendAll() {
    if (busy) return;
    setBusy(true);
    setResult({
      ok: true,
      msg: "⏳ جارٍ الإرسال للكل..."
    });
    try {
      const data = await sendPushToAll({
        title: testTitle,
        body: testBody,
        url: "/notifications"
      });
      setResult({
        ok: data.sent > 0,
        msg: `📲 ${data.sent} وصل · ${data.failed} فشل · ${data.total} إجمالي`
      });
    } catch (e) {
      setResult({
        ok: false,
        msg: "❌ فشل الإرسال: " + (e?.message || "خطأ غير معروف")
      });
    } finally {
      setBusy(false);
    }
  }
  const inp = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1.5px solid " + (DC?.border || "#DDE8E1"),
    fontSize: 13,
    fontFamily: "Tajawal,sans-serif",
    background: DC?.white || "#fff",
    color: DC?.text || "#1A2E20",
    boxSizing: "border-box",
    outline: "none",
    marginBottom: 10,
    direction: "rtl"
  };
  return <div style={sx.s1(DC)}>
      <div style={sx.s2}>
        <IslamicPattern opacity={0.1} color="#FFFFFF" width={430} height={200} />
        <div style={sx.s3}>
          <button onClick={() => setPage("adminDashboard")} style={sx.s4}>→</button>
        </div>
        <div style={S.relZ1}>
          <div style={sx.s5}>📲 اشتراكات Push</div>
          <div style={sx.s6}>{subs.length} جهاز مشترك</div>
        </div>
        <Wave />
      </div>

      <div style={sx.s7}>

        {/* إشعار تجريبي */}
        <div style={sx.s8(DC)}>
          <div style={sx.s9(DC)}>📣 إشعار تجريبي</div>
          <input value={testTitle} onChange={e => setTestTitle(e.target.value)} placeholder="العنوان" style={inp} />
          <input value={testBody} onChange={e => setTestBody(e.target.value)} placeholder="النص" style={sx.s10(inp)} />
          <button onClick={sendAll} disabled={busy} style={{ ...sx.s11, opacity: busy ? 0.6 : 1, cursor: busy ? "not-allowed" : "pointer" }}>
            📣 إرسال للكل
          </button>
        </div>

        {result && <div style={sx.s12(result)}>
            {result.msg}
          </div>}

        {/* زر مسح الكل */}
        {subs.length > 0 && <button onClick={deleteAll} disabled={busy} style={{ ...sx.s13, opacity: busy ? 0.6 : 1, cursor: busy ? "not-allowed" : "pointer" }}>
            🗑 مسح كل الاشتراكات ({subs.length})
          </button>}

        {/* قائمة الاشتراكات */}
        <div style={sx.s14(DC)}>الأجهزة المشتركة</div>
        {loading ? <div style={sx.s15}>⏳</div> : subs.length === 0 ? <div style={sx.s16}>
              <div style={sx.s17}>📵</div>
              <div style={sx.s18(DC)}>لا توجد اشتراكات</div>
            </div> : subs.map(s => {
        const dev = parseDevice(s.device);
        const prof = profiles[s.user_id];
        const sx = {
          s1: DC => ({
            background: DC?.white || "#fff",
            borderRadius: 12,
            border: "1.5px solid " + (DC?.border || "#DDE8E1"),
            marginBottom: 10,
            overflow: "hidden"
          }),
          s2: {
            padding: "12px 14px"
          },
          s3: {
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 8
          },
          s4: DC => ({
            fontSize: 13,
            fontWeight: 800,
            color: DC?.text || "#1A2E20"
          }),
          s5: {
            fontSize: 11,
            color: "#6B7280"
          },
          s6: {
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
            marginBottom: 8
          },
          s7: {
            fontSize: 11,
            fontWeight: 700,
            background: "#EDE9FE",
            color: "#7C3AED",
            padding: "2px 8px",
            borderRadius: 20
          },
          s8: {
            fontSize: 11,
            fontWeight: 700,
            background: "#F3F4F6",
            color: "#374151",
            padding: "2px 8px",
            borderRadius: 20
          },
          s9: {
            fontSize: 11,
            color: "#9CA3AF"
          },
          s10: DC => ({
            padding: "8px 14px",
            borderTop: "1px solid " + (DC?.border || "#DDE8E1")
          }),
          s11: DC => ({
            width: "100%",
            padding: "7px 10px",
            borderRadius: 8,
            border: "1.5px solid " + (DC?.border || "#DDE8E1"),
            fontSize: 12,
            fontFamily: "Tajawal,sans-serif",
            direction: "rtl",
            outline: "none",
            background: DC?.bg || "#F2F5F3",
            color: DC?.text || "#1A2E20",
            boxSizing: "border-box"
          }),
          s12: {
            display: "flex"
          },
          s13: DC => ({
            flex: 1,
            padding: "9px",
            border: "none",
            background: "#F0FDF4",
            color: "#16A34A",
            fontSize: 11,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
            borderLeft: "1px solid " + (DC?.border || "#DDE8E1")
          }),
          s14: {
            flex: 1,
            padding: "9px",
            border: "none",
            background: "#FEF2F2",
            color: "#EF4444",
            fontSize: 11,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit"
          }
        };
        return <div key={s.id} style={sx.s1(DC)}>
                <div style={sx.s2}>
                  <div style={sx.s3}>
                    <div style={S.font24}>{dev.icon}</div>
                    <div style={S.flex1}>
                      <div style={sx.s4(DC)}>
                        {prof?.name || "مستخدم غير معروف"}
                      </div>
                      <div style={sx.s5}>{prof?.phone || s.user_id?.slice(0, 8) + "..."}</div>
                    </div>
                  </div>
                  <div style={sx.s6}>
                    <span style={sx.s7}>
                      {dev.browser}
                    </span>
                    <span style={sx.s8}>
                      {dev.os}
                    </span>
                    <span style={sx.s9}>📅 {fDateTime(s.created_at)}</span>
                  </div>
                </div>
                {/* حقل الرسالة المخصصة */}
                <div style={sx.s10(DC)}>
                  <input value={userMessages[s.user_id] || ""} onChange={e => setUserMessages(p => ({
              ...p,
              [s.user_id]: e.target.value
            }))} placeholder={testBody} style={sx.s11(DC)} />
                </div>
                <div style={sx.s12}>
                  <button onClick={() => sendTest(s.user_id)} style={sx.s13(DC)}>
                    📲 اختبار
                  </button>
                  <button onClick={() => deleteOne(s.id)} style={sx.s14}>
                    🗑 حذف
                  </button>
                </div>
              </div>;
      })}
      </div>
    </div>;
}
