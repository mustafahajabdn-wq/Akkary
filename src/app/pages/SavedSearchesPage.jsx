import React, { useState, useEffect } from "react";
import { C } from "../../shared/constants/colors.js";
import { IslamicPattern, Wave } from "../../shared/components/icons.jsx";
import { BackButton } from "../../shared/components/common/BackButton.jsx";
import { fetchUserSavedSearches, updateSavedSearchNotif, deleteSavedSearch } from "../services/savedSearchService.js";
import { S, mergeStyles } from "../../shared/styles/primitives.js";

function savedSearchTypeLabel(value) {
  if (value === "sell" || value === "للبيع") return "🏷️ للبيع";
  if (value === "rent" || value === "lease" || value === "تأجير" || value === "للإيجار") return "🔑 للإيجار";
  if (value === "want_buy" || value === "مطلوب شراء") return "🟦 مطلوب شراء";
  if (value === "want_rent" || value === "مطلوب للإيجار" || value === "مطلوب إيجار") return "🟩 مطلوب للإيجار";
  return null;
}
function SavedSearchesPage({
  setPage,
  DC,
  user
}) {
  const sx = {
    s1: {
      position: "absolute",
      top: 16,
      right: 16,
      zIndex: 2
    },
    s2: {
      fontSize: 11,
      color: "rgba(255,255,255,0.5)",
      marginBottom: 4,
      letterSpacing: 1
    },
    s3: {
      fontSize: 20,
      fontWeight: 900,
      color: "white",
      marginBottom: 4
    },
    s4: {
      fontSize: 12,
      color: "rgba(255,255,255,0.7)",
      fontWeight: 700
    },
    s5: {
      flex: 1,
      overflowY: "auto",
      padding: 16,
      paddingBottom: 30
    },
    s6: DC => ({
      textAlign: "center",
      padding: 60,
      color: DC.text3,
      fontSize: 14
    }),
    s7: {
      textAlign: "center",
      padding: 60
    },
    s8: DC => ({
      fontSize: 15,
      fontWeight: 800,
      color: DC.text,
      marginBottom: 8
    }),
    s9: C => ({
      padding: "11px 28px",
      borderRadius: 12,
      border: "none",
      background: C.primary,
      color: "white",
      fontSize: 14,
      fontWeight: 800,
      cursor: "pointer",
      fontFamily: "inherit"
    }),
    s10: {
      textAlign: "center",
      padding: 60
    },
    s11: {
      fontSize: 52,
      marginBottom: 12
    },
    s12: DC => ({
      fontSize: 16,
      fontWeight: 900,
      color: DC.text,
      marginBottom: 8
    }),
    s13: DC => ({
      fontSize: 13,
      color: DC.text3,
      lineHeight: 1.6,
      marginBottom: 20
    }),
    s14: C => ({
      padding: "11px 28px",
      borderRadius: 12,
      border: "none",
      background: C.primary,
      color: "white",
      fontSize: 14,
      fontWeight: 800,
      cursor: "pointer",
      fontFamily: "inherit"
    }),
    s15: {
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  };
  if (!DC) DC = C;
  const [searches, setSearches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState({});
  const loadSearches = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    const data = await fetchUserSavedSearches(user.id);
    setSearches(data);
    setLoading(false);
  };
  useEffect(() => {
    loadSearches();
  }, [user]);
  const deleteSearch = async id => {
    await deleteSavedSearch(id);
    setSearches(p => p.filter(s => s.id !== id));
  };
  const toggleNotif = async s => {
    setToggling(p => ({
      ...p,
      [s.id]: true
    }));
    const newVal = !s.notif;
    await updateSavedSearchNotif(s.id, newVal);
    setSearches(p => p.map(x => x.id === s.id ? {
      ...x,
      notif: newVal
    } : x));
    setToggling(p => ({
      ...p,
      [s.id]: false
    }));
  };
  const runSearch = s => {
    setPage("search");
  };
  const filterTags = s => {
    const tags = [];
    if (s.city) tags.push("📍 " + s.city);
    const typeLabel = savedSearchTypeLabel(s.type);
    if (typeLabel) tags.push(typeLabel);
    if (s.category) tags.push("🏠 " + s.category);
    if (s.max_price) tags.push("حتى " + Number(s.max_price).toLocaleString());
    return tags;
  };
  return <div style={S.pageShell(DC)}>
      {/* Header */}
      <div style={S.primaryHero(C.primary)}>
        <IslamicPattern opacity={0.1} color="#FFFFFF" />
        <div style={sx.s1}>
          <BackButton onPress={() => setPage("profile")} />
        </div>
        <div style={S.relZ1}>
          <div style={sx.s2}>حسابي</div>
          <div style={sx.s3}>⭐ أبحاثي المحفوظة</div>
          {searches.length > 0 && <div style={sx.s4}>{searches.length} بحث محفوظ</div>}
        </div>
        <Wave />
      </div>

      <div style={sx.s5}>
        {loading ? <div style={sx.s6(DC)}>جاري التحميل...</div> : !user ? <div style={sx.s7}>
            <div style={S.font48Mb12}>{"🔒"}</div>
            <div style={sx.s8(DC)}>سجّل دخولك أولاً</div>
            <button onClick={() => setPage("login")} style={sx.s9(C)}>تسجيل الدخول</button>
          </div> : searches.length === 0 ? <div style={sx.s10}>
            <div style={sx.s11}>{"🔍"}</div>
            <div style={sx.s12(DC)}>لا توجد أبحاث محفوظة</div>
            <div style={sx.s13(DC)}>ابحث عن عقار واضغط "حفظ البحث"<br />لتصلك إشعارات عند ظهور إعلانات مطابقة</div>
            <button onClick={() => setPage("search")} style={sx.s14(C)}>{"🔍 ابدأ البحث"}</button>
          </div> : <div style={sx.s15}>
            {searches.map(s => {
          const tags = filterTags(s);
          const hasNewMatch = s.new_count > 0;
          const sx = {
            s1: (DC, hasNewMatch, C) => ({
              background: DC.white,
              borderRadius: 16,
              border: "1.5px solid " + (hasNewMatch ? C.primary : DC.border),
              overflow: "hidden",
              boxShadow: hasNewMatch ? "0 2px 12px rgba(26,74,46,0.08)" : "none"
            }),
            s2: C => ({
              background: C.primary,
              padding: "5px 14px",
              display: "flex",
              alignItems: "center",
              gap: 6
            }),
            s3: {
              fontSize: 11,
              color: "white",
              fontWeight: 800
            },
            s4: {
              padding: "14px 14px 12px"
            },
            s5: {
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              marginBottom: 8
            },
            s6: {
              flex: 1,
              minWidth: 0
            },
            s7: DC => ({
              fontSize: 14,
              fontWeight: 800,
              color: DC.text,
              marginBottom: 6,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            }),
            s8: {
              display: "flex",
              flexWrap: "wrap",
              gap: 4
            },
            s9: DC => ({
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 10,
              paddingTop: 10,
              borderTop: "1px solid " + DC.border
            }),
            s10: DC => ({
              fontSize: 10,
              color: DC.text3,
              flex: 1
            }),
            s11: (toggling, s) => ({
              display: "flex",
              alignItems: "center",
              gap: 5,
              cursor: "pointer",
              opacity: toggling[s.id] ? 0.5 : 1
            }),
            s12: (s, C, DC) => ({
              fontSize: 10,
              color: s.notif ? C.primary : DC.text3,
              fontWeight: 700
            }),
            s13: (s, C) => ({
              width: 36,
              height: 20,
              borderRadius: 10,
              background: s.notif ? C.primary : "#D1D5DB",
              position: "relative",
              transition: "background 0.2s"
            }),
            s14: s => ({
              position: "absolute",
              top: 2,
              right: s.notif ? 2 : 18,
              width: 16,
              height: 16,
              borderRadius: "50%",
              background: "white",
              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              transition: "right 0.2s"
            }),
            s15: C => ({
              padding: "6px 14px",
              borderRadius: 9,
              border: "none",
              background: C.primary,
              color: "white",
              fontSize: 11,
              fontWeight: 800,
              cursor: "pointer",
              fontFamily: "inherit"
            }),
            s16: {
              padding: "6px 10px",
              borderRadius: 9,
              border: "1.5px solid #FCA5A5",
              background: "none",
              color: "#EF4444",
              fontSize: 12,
              cursor: "pointer"
            }
          };
          return <div key={s.id} style={sx.s1(DC, hasNewMatch, C)}>
                  {/* شريط أعلى إذا فيه مطابقات جديدة */}
                  {hasNewMatch && <div style={sx.s2(C)}>
                      <span style={sx.s3}>{"🔔"} {s.new_count} إعلان جديد يطابق بحثك</span>
                    </div>}
                  <div style={sx.s4}>
                    {/* العنوان والإجراءات */}
                    <div style={sx.s5}>
                      <div style={sx.s6}>
                        <div style={sx.s7(DC)}>
                          {"🔍"} {s.query || "بحث بفلاتر"}
                        </div>
                        {tags.length > 0 && <div style={sx.s8}>
                            {tags.map((tag, i) => {
                      const sx = {
                        s1: DC => ({
                          fontSize: 10,
                          background: DC.bg,
                          borderRadius: 8,
                          padding: "2px 8px",
                          color: DC.text2,
                          fontWeight: 700
                        })
                      };
                      return <span key={i} style={sx.s1(DC)}>{tag}</span>;
                    })}
                          </div>}
                      </div>
                    </div>

                    {/* Footer */}
                    <div style={sx.s9(DC)}>
                      {/* تاريخ */}
                      <span style={sx.s10(DC)}>{new Date(s.created_at).toLocaleDateString("ar-SY")}</span>

                      {/* زر الإشعارات */}
                      <div onClick={() => toggleNotif(s)} style={sx.s11(toggling, s)}>
                        <span style={sx.s12(s, C, DC)}>{s.notif ? "إشعارات مفعّلة" : "إشعارات"}</span>
                        <div style={sx.s13(s, C)}>
                          <div style={sx.s14(s)} />
                        </div>
                      </div>

                      {/* زر بحث */}
                      <button onClick={() => runSearch(s)} style={sx.s15(C)}>بحث</button>

                      {/* زر حذف */}
                      <button onClick={() => deleteSearch(s.id)} style={sx.s16}>{"🗑"}</button>
                    </div>
                  </div>
                </div>;
        })}
          </div>}
      </div>
    </div>;
}
export default SavedSearchesPage;
