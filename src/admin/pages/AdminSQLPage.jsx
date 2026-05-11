import { BackButton } from "../../shared/components/common/BackButton.jsx";
import { Navigate } from "react-router-dom";
import React, { useState, useEffect, useRef } from "react";
import {
  deleteAdminQuery,
  deleteTableRow,
  executeAdminSql,
  executeAdminSqlViaRpc,
  fetchSavedAdminQueries,
  saveAdminQuery
} from "../services/adminService.js";
import { C } from "../../shared/constants/colors.js";
import { IslamicPattern, Wave } from "../../shared/components/icons.jsx";
import { S } from "../../shared/styles/primitives.js";

const BUILT_IN = [
  {
    id: "builtin-1",
    name: "🧹 صور يتيمة",
    description: "عرض الصور غير المرتبطة بإعلانات",
    sql: `SELECT o.name, o.created_at FROM storage.objects o WHERE o.bucket_id = 'listing-images' AND o.name NOT IN (SELECT REPLACE(url, (SELECT CONCAT('https://tskjbzlnbldoxatpcaxi.supabase.co/storage/v1/object/public/listing-images/'), '') FROM listing_images WHERE url IS NOT NULL UNION SELECT REPLACE(video_url, (SELECT CONCAT('https://tskjbzlnbldoxatpcaxi.supabase.co/storage/v1/object/public/listing-images/')), '') FROM listings WHERE video_url IS NOT NULL) LIMIT 100;`
  },
  {
    id: "builtin-2",
    name: "📊 إحصائيات الإعلانات",
    description: "عدد الإعلانات حسب الحالة",
    sql: `SELECT status, admin_status, COUNT(*) as count FROM listings GROUP BY status, admin_status ORDER BY count DESC;`
  },
  {
    id: "builtin-3",
    name: "👥 أكثر المستخدمين نشاطاً",
    description: "المستخدمون الذين نشروا أكثر إعلانات",
    sql: `SELECT p.name, p.role, COUNT(l.id) as listings FROM profiles p LEFT JOIN listings l ON l.user_id = p.id GROUP BY p.id, p.name, p.role ORDER BY listings DESC LIMIT 20;`
  },
  {
    id: "builtin-4",
    name: "🗑️ إعلانات منتهية الصلاحية",
    description: "إعلانات انتهت صلاحيتها",
    sql: `SELECT id, title, city, status, expires_at FROM listings WHERE expires_at < NOW() AND status = 'active' ORDER BY expires_at ASC LIMIT 50;`
  },
  {
    id: "builtin-5",
    name: "📈 إعلانات الأسبوع",
    description: "الإعلانات المضافة خلال آخر 7 أيام",
    sql: `SELECT DATE(created_at) as day, COUNT(*) as count FROM listings WHERE created_at >= NOW() - INTERVAL '7 days' GROUP BY DATE(created_at) ORDER BY day DESC;`
  }
];

function extractTableNameFromSql(sql) {
  const tableMatch = String(sql || "").match(/\bFROM\s+((?:"?\w+"?\.)?"?\w+"?)/i);
  const rawTableName = tableMatch?.[1]?.replace(/"/g, "") || null;
  return rawTableName ? rawTableName.split(".").pop() : null;
}

export default function AdminSQLPage({
  setPage,
  DC,
  user
}) {
  const sx = {
    s1: DC => ({
      maxWidth: 430,
      margin: "0 auto",
      minHeight: "100vh",
      background: DC.bg,
      fontFamily: "Tajawal,sans-serif",
      direction: "rtl"
    }),
    s2: {
      background: "linear-gradient(135deg,#1A1A2E,#16213E)",
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
      fontSize: 20,
      fontWeight: 900,
      color: "white"
    },
    s5: {
      fontSize: 12,
      color: "rgba(255,255,255,0.5)",
      marginTop: 4
    },
    s6: DC => ({
      display: "flex",
      background: DC.white,
      borderBottom: `1px solid ${DC.border}`
    }),
    s7: {
      padding: "14px",
      paddingBottom: 80
    },
    s8: {
      position: "relative",
      marginBottom: 10
    },
    s9: inp => ({
      ...inp,
      height: 180,
      resize: "vertical",
      fontFamily: "monospace",
      fontSize: 13,
      lineHeight: 1.6,
      direction: "ltr",
      textAlign: "left",
      paddingTop: 12
    }),
    s10: DC => ({
      position: "absolute",
      top: 8,
      left: 8,
      background: "none",
      border: "none",
      cursor: "pointer",
      fontSize: 16,
      color: DC.text3
    }),
    s11: {
      display: "flex",
      gap: 8,
      marginBottom: 12
    },
    s12: loading => ({
      flex: 2,
      padding: "11px",
      borderRadius: 10,
      border: "none",
      background: loading ? "#9CA3AF" : "#6366F1",
      color: "white",
      fontSize: 13,
      fontWeight: 800,
      cursor: loading ? "default" : "pointer",
      fontFamily: "inherit",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 6
    }),
    s13: {
      width: 14,
      height: 14,
      borderRadius: "50%",
      border: "2px solid rgba(255,255,255,0.3)",
      borderTopColor: "white",
      display: "inline-block",
      animation: "spin 0.7s linear infinite"
    },
    s14: DC => ({
      flex: 1,
      padding: "11px",
      borderRadius: 10,
      border: `1.5px solid ${DC.border}`,
      background: DC.white,
      color: DC.text,
      fontSize: 13,
      fontWeight: 700,
      cursor: "pointer",
      fontFamily: "inherit"
    }),
    s15: DC => ({
      background: DC.white,
      borderRadius: 12,
      padding: 14,
      marginBottom: 12,
      border: `1px solid ${DC.border}`
    }),
    s16: DC => ({
      fontSize: 12,
      fontWeight: 800,
      color: DC.text2,
      marginBottom: 8
    }),
    s17: inp => ({
      ...inp,
      marginBottom: 8
    }),
    s18: inp => ({
      ...inp,
      marginBottom: 10
    }),
    s19: {
      flex: 1,
      padding: "9px",
      borderRadius: 8,
      border: "none",
      background: "#6366F1",
      color: "white",
      fontSize: 12,
      fontWeight: 800,
      cursor: "pointer",
      fontFamily: "inherit"
    },
    s20: DC => ({
      flex: 1,
      padding: "9px",
      borderRadius: 8,
      border: `1px solid ${DC.border}`,
      background: "transparent",
      color: DC.text,
      fontSize: 12,
      fontWeight: 700,
      cursor: "pointer",
      fontFamily: "inherit"
    }),
    s21: {
      background: "#FEF2F2",
      border: "1px solid #FECACA",
      borderRadius: 10,
      padding: "10px 14px",
      marginBottom: 12,
      fontSize: 12,
      color: "#B91C1C",
      fontFamily: "monospace",
      direction: "ltr",
      textAlign: "left",
      lineHeight: 1.6
    },
    s22: {
      textAlign: "center",
      padding: 40
    },
    s23: {
      fontSize: 40,
      marginBottom: 12
    },
    s24: DC => ({
      fontSize: 14,
      fontWeight: 800,
      color: DC.text
    }),
    s25: DC => ({
      fontSize: 12,
      color: DC.text3,
      marginTop: 6
    })
  };

  if (user?.role !== "admin" && !(user?.allowedPages || []).includes("adminSQL")) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (!DC) DC = C;

  const [queries, setQueries] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [sql, setSql] = useState("");
  const [queryName, setQueryName] = useState("");
  const [queryDesc, setQueryDesc] = useState("");
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [tab, setTab] = useState("editor");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    loadQueries();
  }, []);

  async function loadQueries() {
    const data = await fetchSavedAdminQueries();
    setQueries(Array.isArray(data) ? data : []);
  }

  async function runSQL() {
    if (!sql.trim()) return;

    setLoading(true);
    setError("");
    setResults(null);

    try {
      const data = await executeAdminSql(sql);
      setResults(Array.isArray(data) ? data : [data]);
    } catch (e) {
      setError("❌ " + e.message);
    }

    setLoading(false);
  }

  async function runViaRpc() {
    if (!sql.trim()) return;

    setLoading(true);
    setError("");
    setResults(null);

    try {
      const data = await executeAdminSqlViaRpc(sql);
      setResults(Array.isArray(data) ? data : data ? [data] : []);
    } catch (e) {
      setError("❌ " + e.message);
    }

    setLoading(false);
  }

  async function saveQuery() {
    if (!queryName.trim() || !sql.trim()) return;

    setSaving(true);

    await saveAdminQuery({
      name: queryName,
      description: queryDesc,
      sql
    });

    await loadQueries();

    setShowSaveForm(false);
    setQueryName("");
    setQueryDesc("");
    setSaving(false);
    setTab("saved");
  }

  async function deleteQuery(id) {
    await deleteAdminQuery(id);

    setQueries(p => p.filter(q => q.id !== id));

    if (selectedId === id) {
      setSelectedId(null);
    }

    setConfirmDelete(null);
  }

  function selectQuery(q) {
    setSelectedId(q.id);
    setSql(q.sql);
    setTab("editor");
    setResults(null);
    setError("");
  }

  const columns = results?.length > 0 ? Object.keys(results[0]) : [];

  const inp = {
    width: "100%",
    padding: "10px 12px",
    border: `1.5px solid ${DC.border}`,
    borderRadius: 10,
    fontSize: 13,
    fontFamily: "Tajawal,sans-serif",
    color: DC.text,
    outline: "none",
    background: DC.white,
    boxSizing: "border-box"
  };

  return (
    <div style={sx.s1(DC)}>
      <div style={sx.s2}>
        <IslamicPattern opacity={0.08} color="#FFFFFF" width={430} height={200} />

        <div style={sx.s3}>
          <BackButton onPress={() => setPage("adminDashboard")} />
        </div>

        <div style={S.relZ1}>
          <div style={sx.s4}>🖥️ محرر SQL</div>
          <div style={sx.s5}>تنفيذ استعلامات على قاعدة البيانات</div>
        </div>

        <Wave />
      </div>

      <div style={sx.s6(DC)}>
        {[
          ["editor", "✏️ المحرر"],
          ["saved", "💾 المحفوظة"],
          ["builtin", "⚡ جاهزة"]
        ].map(([v, l]) => {
          const sx = {
            s1: (tab, v, DC) => ({
              flex: 1,
              padding: "12px 4px",
              border: "none",
              fontFamily: "inherit",
              borderBottom: tab === v ? `3px solid #6366F1` : "3px solid transparent",
              background: "transparent",
              fontSize: 12,
              fontWeight: 800,
              color: tab === v ? "#6366F1" : DC.text3,
              cursor: "pointer"
            })
          };

          return (
            <button key={v} onClick={() => setTab(v)} style={sx.s1(tab, v, DC)}>
              {l}
            </button>
          );
        })}
      </div>

      <div style={sx.s7}>
        {tab === "editor" && (
          <>
            <div style={sx.s8}>
              <textarea
                ref={textareaRef}
                value={sql}
                onChange={e => setSql(e.target.value)}
                placeholder="اكتب استعلام SQL هنا..."
                style={sx.s9(inp)}
              />

              {sql && (
                <button
                  onClick={() => {
                    setSql("");
                    setResults(null);
                    setError("");
                  }}
                  style={sx.s10(DC)}
                >
                  ✕
                </button>
              )}
            </div>

            <div style={sx.s11}>
              <button onClick={runViaRpc} disabled={loading || !sql.trim()} style={sx.s12(loading)}>
                {loading ? (
                  <>
                    <span style={sx.s13} /> جارٍ التنفيذ...
                  </>
                ) : (
                  "▶ تنفيذ"
                )}
              </button>

              <button onClick={() => setShowSaveForm(p => !p)} disabled={!sql.trim()} style={sx.s14(DC)}>
                💾 حفظ
              </button>
            </div>

            {showSaveForm && (
              <div style={sx.s15(DC)}>
                <div style={sx.s16(DC)}>حفظ الاستعلام</div>

                <input
                  value={queryName}
                  onChange={e => setQueryName(e.target.value)}
                  placeholder="اسم الاستعلام *"
                  style={sx.s17(inp)}
                />

                <input
                  value={queryDesc}
                  onChange={e => setQueryDesc(e.target.value)}
                  placeholder="وصف مختصر (اختياري)"
                  style={sx.s18(inp)}
                />

                <div style={S.gap8}>
                  <button onClick={saveQuery} disabled={saving || !queryName.trim()} style={sx.s19}>
                    {saving ? "جارٍ الحفظ..." : "✓ حفظ"}
                  </button>

                  <button onClick={() => setShowSaveForm(false)} style={sx.s20(DC)}>
                    إلغاء
                  </button>
                </div>
              </div>
            )}

            {error && <div style={sx.s21}>{error}</div>}

            {results !== null &&
              (() => {
                const hasId = columns.includes("id");
                const tableName = extractTableNameFromSql(sql);

                const deleteRow = async id => {
                  if (!tableName) return alert("تعذّر تحديد الجدول");

                  if (!confirm(`حذف السجل رقم ${id} من جدول ${tableName}؟`)) return;

                  try {
                    await deleteTableRow(tableName, id);
                    setResults(p => p.filter(row => String(row.id) !== String(id)));
                  } catch (error) {
                    alert("❌ فشل الحذف: " + (error?.message || "خطأ غير معروف"));
                  }
                };

                const sx = {
                  s1: DC => ({
                    background: DC.white,
                    borderRadius: 12,
                    border: `1px solid ${DC.border}`,
                    overflow: "hidden"
                  }),
                  s2: DC => ({
                    padding: "10px 14px",
                    borderBottom: `1px solid ${DC.border}`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }),
                  s3: DC => ({
                    fontSize: 12,
                    fontWeight: 800,
                    color: DC.text2
                  }),
                  s4: {
                    fontSize: 11,
                    color: "#6366F1",
                    fontWeight: 700,
                    background: "#EEF2FF",
                    padding: "3px 10px",
                    borderRadius: 20
                  },
                  s5: DC => ({
                    padding: 24,
                    textAlign: "center",
                    color: DC.text3,
                    fontSize: 13
                  }),
                  s6: {
                    overflowX: "auto"
                  },
                  s7: {
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: 11,
                    direction: "ltr"
                  },
                  s8: {
                    background: "#F8FAFC"
                  },
                  s9: DC => ({
                    padding: "8px 6px",
                    textAlign: "center",
                    fontWeight: 800,
                    color: "#EF4444",
                    borderBottom: `1px solid ${DC.border}`,
                    whiteSpace: "nowrap"
                  }),
                  s10: DC => ({
                    padding: "8px 14px",
                    fontSize: 11,
                    color: DC.text3,
                    textAlign: "center"
                  })
                };

                return (
                  <div style={sx.s1(DC)}>
                    <div style={sx.s2(DC)}>
                      <span style={sx.s3(DC)}>النتائج</span>
                      <span style={sx.s4}>{results.length} صف</span>
                    </div>

                    {results.length === 0 ? (
                      <div style={sx.s5(DC)}>لا توجد نتائج</div>
                    ) : (
                      <div style={sx.s6}>
                        <table style={sx.s7}>
                          <thead>
                            <tr style={sx.s8}>
                              {hasId && tableName && <th style={sx.s9(DC)}>🗑</th>}

                              {columns.map(c => {
                                const sx = {
                                  s1: DC => ({
                                    padding: "8px 10px",
                                    textAlign: "left",
                                    fontWeight: 800,
                                    color: "#374151",
                                    borderBottom: `1px solid ${DC.border}`,
                                    whiteSpace: "nowrap"
                                  })
                                };

                                return (
                                  <th key={c} style={sx.s1(DC)}>
                                    {c}
                                  </th>
                                );
                              })}
                            </tr>
                          </thead>

                          <tbody>
                            {results.slice(0, 100).map((row, i) => {
                              const sx = {
                                s1: (DC, i) => ({
                                  borderBottom: `1px solid ${DC.border}`,
                                  background: i % 2 === 0 ? "white" : "#FAFAFA"
                                }),
                                s2: {
                                  padding: "6px",
                                  textAlign: "center"
                                },
                                s3: {
                                  background: "#FEF2F2",
                                  border: "1px solid #FECACA",
                                  borderRadius: 6,
                                  padding: "3px 7px",
                                  cursor: "pointer",
                                  fontSize: 12,
                                  color: "#EF4444",
                                  fontWeight: 800
                                }
                              };

                              return (
                                <tr key={i} style={sx.s1(DC, i)}>
                                  {hasId && tableName && (
                                    <td style={sx.s2}>
                                      <button onClick={() => deleteRow(row.id)} style={sx.s3}>
                                        🗑
                                      </button>
                                    </td>
                                  )}

                                  {columns.map(c => {
                                    const sx = {
                                      s1: DC => ({
                                        padding: "7px 10px",
                                        color: DC.text,
                                        maxWidth: 160,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap"
                                      }),
                                      s2: {
                                        color: "#9CA3AF",
                                        fontStyle: "italic"
                                      }
                                    };

                                    return (
                                      <td key={c} style={sx.s1(DC)}>
                                        {row[c] === null ? <span style={sx.s2}>null</span> : String(row[c])}
                                      </td>
                                    );
                                  })}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>

                        {results.length > 100 && (
                          <div style={sx.s10(DC)}>
                            يعرض أول 100 صف من {results.length}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
          </>
        )}

        {tab === "saved" && (
          <>
            {queries.length === 0 ? (
              <div style={sx.s22}>
                <div style={sx.s23}>💾</div>
                <div style={sx.s24(DC)}>لا توجد استعلامات محفوظة</div>
                <div style={sx.s25(DC)}>اكتب استعلاماً في المحرر ثم احفظه</div>
              </div>
            ) : (
              queries.map(q => {
                const sx = {
                  s1: DC => ({
                    background: DC.white,
                    borderRadius: 12,
                    padding: "14px",
                    marginBottom: 10,
                    border: `1px solid ${DC.border}`
                  }),
                  s2: {
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 6
                  },
                  s3: {
                    flex: 1
                  },
                  s4: DC => ({
                    fontSize: 14,
                    fontWeight: 800,
                    color: DC.text
                  }),
                  s5: DC => ({
                    fontSize: 11,
                    color: DC.text3,
                    marginTop: 2
                  }),
                  s6: {
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#EF4444",
                    fontSize: 16,
                    padding: "0 0 0 8px"
                  },
                  s7: {
                    background: "#F8FAFC",
                    borderRadius: 8,
                    padding: "8px 10px",
                    marginBottom: 10,
                    fontSize: 11,
                    fontFamily: "monospace",
                    direction: "ltr",
                    textAlign: "left",
                    color: "#374151",
                    maxHeight: 60,
                    overflow: "hidden",
                    lineHeight: 1.5
                  },
                  s8: {
                    width: "100%",
                    padding: "8px",
                    borderRadius: 8,
                    border: "none",
                    background: "#EEF2FF",
                    color: "#6366F1",
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: "pointer",
                    fontFamily: "inherit"
                  },
                  s9: {
                    marginTop: 10,
                    padding: "10px",
                    background: "#FEF2F2",
                    borderRadius: 8,
                    border: "1px solid #FECACA"
                  },
                  s10: {
                    fontSize: 12,
                    color: "#B91C1C",
                    fontWeight: 700,
                    marginBottom: 8
                  },
                  s11: {
                    flex: 1,
                    padding: "7px",
                    borderRadius: 7,
                    border: "none",
                    background: "#EF4444",
                    color: "white",
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: "pointer",
                    fontFamily: "inherit"
                  },
                  s12: DC => ({
                    flex: 1,
                    padding: "7px",
                    borderRadius: 7,
                    border: `1px solid ${DC.border}`,
                    background: "transparent",
                    color: DC.text,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "inherit"
                  })
                };

                return (
                  <div key={q.id} style={sx.s1(DC)}>
                    <div style={sx.s2}>
                      <div style={sx.s3}>
                        <div style={sx.s4(DC)}>{q.name}</div>
                        {q.description && <div style={sx.s5(DC)}>{q.description}</div>}
                      </div>

                      <button onClick={() => setConfirmDelete(q.id)} style={sx.s6}>
                        🗑️
                      </button>
                    </div>

                    <div style={sx.s7}>
                      {q.sql.slice(0, 120)}
                      {q.sql.length > 120 ? "..." : ""}
                    </div>

                    <button onClick={() => selectQuery(q)} style={sx.s8}>
                      ▶ فتح في المحرر
                    </button>

                    {confirmDelete === q.id && (
                      <div style={sx.s9}>
                        <div style={sx.s10}>حذف "{q.name}" نهائياً؟</div>

                        <div style={S.gap8}>
                          <button onClick={() => deleteQuery(q.id)} style={sx.s11}>
                            حذف
                          </button>

                          <button onClick={() => setConfirmDelete(null)} style={sx.s12(DC)}>
                            إلغاء
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </>
        )}

        {tab === "builtin" &&
          BUILT_IN.map(q => {
            const sx = {
              s1: DC => ({
                background: DC.white,
                borderRadius: 12,
                padding: "14px",
                marginBottom: 10,
                border: `1px solid ${DC.border}`
              }),
              s2: DC => ({
                fontSize: 14,
                fontWeight: 800,
                color: DC.text,
                marginBottom: 4
              }),
              s3: DC => ({
                fontSize: 11,
                color: DC.text3,
                marginBottom: 10
              }),
              s4: {
                width: "100%",
                padding: "8px",
                borderRadius: 8,
                border: "none",
                background: "#EEF2FF",
                color: "#6366F1",
                fontSize: 12,
                fontWeight: 800,
                cursor: "pointer",
                fontFamily: "inherit"
              }
            };

            return (
              <div key={q.id} style={sx.s1(DC)}>
                <div style={sx.s2(DC)}>{q.name}</div>
                <div style={sx.s3(DC)}>{q.description}</div>

                <button onClick={() => selectQuery(q)} style={sx.s4}>
                  ▶ فتح في المحرر
                </button>
              </div>
            );
          })}
      </div>
    </div>
  );
        }
