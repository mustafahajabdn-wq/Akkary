import React, { useState, useEffect } from "react";
import { C } from "../../shared/constants/colors.js";
import { IslamicPattern, Wave } from "../../shared/components/icons.jsx";
import { fetchProfile } from "../services/profileService.js";
function LoginHistoryPage({
  setPage,
  DC,
  user
}) {
  const sx = {
    s1: DC => ({
      background: DC.bg,
      minHeight: "100vh",
      paddingBottom: 40
    }),
    s2: C => ({
      background: C.primary,
      padding: "48px 16px 56px",
      position: "relative",
      overflow: "hidden"
    }),
    s3: {
      position: "relative",
      zIndex: 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    },
    s4: {
      width: 36,
      height: 36,
      borderRadius: "50%",
      background: "rgba(255,255,255,0.18)",
      border: "none",
      color: "white",
      fontSize: 18,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    },
    s5: {
      fontSize: 17,
      fontWeight: 900,
      color: "white"
    },
    s6: {
      width: 36
    },
    s7: {
      position: "relative",
      zIndex: 1,
      marginTop: 20,
      display: "flex",
      alignItems: "center",
      gap: 14
    },
    s8: {
      width: 56,
      height: 56,
      borderRadius: "50%",
      background: "rgba(255,255,255,0.2)",
      border: "2.5px solid rgba(255,255,255,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 22,
      fontWeight: 900,
      color: "white",
      flexShrink: 0
    },
    s9: {
      fontSize: 16,
      fontWeight: 900,
      color: "white"
    },
    s10: {
      fontSize: 12,
      color: "rgba(255,255,255,0.7)",
      marginTop: 2
    },
    s11: {
      padding: "16px 14px",
      marginTop: -6
    },
    s12: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 10,
      marginBottom: 16
    },
    s13: DC => ({
      fontSize: 13,
      fontWeight: 800,
      color: DC.text2,
      marginBottom: 10,
      paddingRight: 2
    }),
    s14: DC => ({
      textAlign: "center",
      padding: "40px 0",
      color: DC.text3,
      fontSize: 13
    }),
    s15: {
      background: "#FFFBEB",
      border: "1px solid #FDE68A",
      borderRadius: 14,
      padding: "14px 16px",
      marginTop: 6
    },
    s16: {
      fontSize: 13,
      fontWeight: 800,
      color: "#92400E",
      marginBottom: 6
    }
  };
  if (!DC) DC = C;
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const now = new Date();

      // جلب بيانات الملف الشخصي
      if (user?.id) {
        const p = await fetchProfile(user.id);
        if (p) setProfile(p);
      }

      // بناء قائمة الجلسات من المعلومات المتاحة
      const list = [];

      // الجلسة الحالية
      list.push({
        id: "current",
        icon: "🟢",
        title: "الجلسة الحالية",
        device: getDeviceName(),
        time: formatTime(now),
        badge: {
          label: "نشط",
          color: C.primary,
          bg: "#E8F4F0"
        }
      });

      // آخر نشاط من created_at الملف الشخصي
      if (profile?.created_at) {
        list.push({
          id: "joined",
          icon: "🎉",
          title: "تاريخ إنشاء الحساب",
          device: "طابو أخضر",
          time: formatDate(new Date(profile.created_at)),
          badge: {
            label: "مسجّل",
            color: "#6B7280",
            bg: "#F3F4F6"
          }
        });
      }
      setSessions(list);
      setLoading(false);
    };
    load();
  }, [user?.id, profile?.created_at]);
  function getDeviceName() {
    const ua = navigator.userAgent;
    if (/iPhone/i.test(ua)) return "iPhone";
    if (/iPad/i.test(ua)) return "iPad";
    if (/Android/i.test(ua)) return "Android";
    if (/Mac/i.test(ua)) return "Mac";
    if (/Windows/i.test(ua)) return "Windows";
    return "متصفح ويب";
  }
  function formatTime(d) {
    return d.toLocaleString("ar", {
      hour: "numeric",
      minute: "2-digit",
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  }
  function formatDate(d) {
    return d.toLocaleDateString("ar", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  }
  const accountAge = profile?.created_at ? Math.floor((Date.now() - new Date(profile.created_at)) / (1000 * 60 * 60 * 24)) : null;
  return <div style={sx.s1(DC)}>

      {/* Header */}
      <div style={sx.s2(C)}>
        <IslamicPattern opacity={0.1} color="#FFFFFF" />
        <div style={sx.s3}>
          <button onClick={() => setPage("profile")} style={sx.s4}>
            →
          </button>
          <span style={sx.s5}>أمان الحساب</span>
          <div style={sx.s6} />
        </div>

        {/* بطاقة المستخدم */}
        <div style={sx.s7}>
          <div style={sx.s8}>
            {(profile?.name || user?.name || "م")[0]}
          </div>
          <div>
            <div style={sx.s9}>{profile?.name || user?.name || "المستخدم"}</div>
            <div style={sx.s10}>{user?.email || user?.phone || ""}</div>
          </div>
        </div>
        <Wave />
      </div>

      <div style={sx.s11}>

        {/* إحصائيات سريعة */}
        {accountAge !== null && <div style={sx.s12}>
            {[{
          icon: "📅",
          label: "عمر الحساب",
          value: accountAge > 365 ? Math.floor(accountAge / 365) + " سنة" : accountAge + " يوم"
        }, {
          icon: "🔐",
          label: "حالة الحساب",
          value: "محمي ✓"
        }].map((s, i) => {
          const sx = {
            s1: DC => ({
              background: DC.white,
              borderRadius: 14,
              padding: "14px 16px",
              border: "1px solid " + DC.border,
              textAlign: "center"
            }),
            s2: {
              fontSize: 24,
              marginBottom: 4
            },
            s3: DC => ({
              fontSize: 18,
              fontWeight: 900,
              color: DC.text
            }),
            s4: DC => ({
              fontSize: 11,
              color: DC.text3,
              marginTop: 2
            })
          };
          return <div key={i} style={sx.s1(DC)}>
                <div style={sx.s2}>{s.icon}</div>
                <div style={sx.s3(DC)}>{s.value}</div>
                <div style={sx.s4(DC)}>{s.label}</div>
              </div>;
        })}
          </div>}

        {/* عنوان القسم */}
        <div style={sx.s13(DC)}>🛡️ الجلسات والنشاط</div>

        {loading ? <div style={sx.s14(DC)}>⏳ جارٍ التحميل...</div> : sessions.map((s, i) => {
        const sx = {
          s1: DC => ({
            background: DC.white,
            borderRadius: 16,
            border: "1px solid " + DC.border,
            padding: "16px",
            marginBottom: 10,
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)"
          }),
          s2: {
            display: "flex",
            alignItems: "flex-start",
            gap: 12
          },
          s3: DC => ({
            width: 42,
            height: 42,
            borderRadius: 12,
            background: DC.bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            flexShrink: 0
          }),
          s4: {
            flex: 1,
            minWidth: 0
          },
          s5: {
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            marginBottom: 5
          },
          s6: DC => ({
            fontSize: 14,
            fontWeight: 800,
            color: DC.text
          }),
          s7: s => ({
            fontSize: 10,
            fontWeight: 800,
            color: s.badge.color,
            background: s.badge.bg,
            borderRadius: 20,
            padding: "3px 10px",
            whiteSpace: "nowrap",
            flexShrink: 0
          }),
          s8: {
            display: "flex",
            gap: 12,
            flexWrap: "wrap"
          },
          s9: DC => ({
            fontSize: 11,
            color: DC.text3,
            display: "flex",
            alignItems: "center",
            gap: 4
          }),
          s10: DC => ({
            fontSize: 11,
            color: DC.text3,
            display: "flex",
            alignItems: "center",
            gap: 4
          }),
          s11: C => ({
            marginTop: 8,
            fontSize: 11,
            color: C.primary,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: 4
          }),
          s12: C => ({
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: C.primary,
            display: "inline-block",
            animation: "pulse 1.5s infinite"
          })
        };
        return <div key={s.id} style={sx.s1(DC)}>
              <div style={sx.s2}>
                {/* أيقونة */}
                <div style={sx.s3(DC)}>
                  {s.icon}
                </div>
                {/* معلومات */}
                <div style={sx.s4}>
                  <div style={sx.s5}>
                    <div style={sx.s6(DC)}>{s.title}</div>
                    <span style={sx.s7(s)}>
                      {s.badge.label}
                    </span>
                  </div>
                  <div style={sx.s8}>
                    <span style={sx.s9(DC)}>
                      📱 {s.device}
                    </span>
                    <span style={sx.s10(DC)}>
                      🕓 {s.time}
                    </span>
                  </div>
                  {s.id === "current" && <div style={sx.s11(C)}>
                      <span style={sx.s12(C)} />
                      متصل الآن
                    </div>}
                </div>
              </div>
            </div>;
      })}

        {/* نصيحة أمان */}
        <div style={sx.s15}>
          <div style={sx.s16}>💡 نصائح لحماية حسابك</div>
          {["لا تشارك رمز OTP مع أحد", "استخدم كلمة مرور قوية وفريدة", "سجّل الخروج من الأجهزة غير المستخدمة"].map((tip, i) => {
          const sx = {
            s1: {
              fontSize: 12,
              color: "#78350F",
              marginTop: 5,
              display: "flex",
              alignItems: "flex-start",
              gap: 6
            },
            s2: C => ({
              color: C.gold,
              flexShrink: 0
            })
          };
          return <div key={i} style={sx.s1}>
              <span style={sx.s2(C)}>•</span> {tip}
            </div>;
        })}
        </div>

      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>;
}
export default LoginHistoryPage;