import React, { useState, useRef } from "react";
import { C } from "../../shared/constants/colors.js";
import { fetchAdminUserStats } from "../services/adminService.js";
import { fDate } from "../../shared/utils/formatters.js";

export function lastSeen(dateStr) {
  if (!dateStr) return null;

  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);

  if (diff < 60) {
    return {
      text: "الآن",
      online: true
    };
  }

  if (diff < 120) {
    return {
      text: "قبل دقيقة",
      online: true
    };
  }

  const mins = Math.floor(diff / 60);

  if (diff < 3600) {
    return {
      text: `قبل ${mins} دقيقة`,
      online: false
    };
  }

  if (diff < 86400) {
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);

    return {
      text: m === 0 ? `قبل ${h} ساعة` : `قبل ${h} ساعة و${m} دقيقة`,
      online: false
    };
  }

  const d = new Date(dateStr);

  return {
    text: `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`,
    online: false
  };
}

export { fDate };

export const ROLE_OPTIONS = [
  {
    value: "user",
    label: "👤 مستخدم عادي — Level 0"
  },
  {
    value: "support",
    label: "🟢 دعم — Level 1"
  },
  {
    value: "moderator",
    label: "🟡 مشرف — Level 2"
  }
];

function getRoleLabel(role) {
  return ROLE_OPTIONS.find(option => option.value === (role || "user"))?.label || "👤 مستخدم عادي — Level 0";
}

function StatSkeleton() {
  const sx = {
    s1: {
      display: "grid",
      gridTemplateColumns: "repeat(3,1fr)",
      borderBottom: "1px solid #F3F4F6"
    }
  };

  return (
    <div style={sx.s1}>
      {[1, 2, 3, 4, 5, 6].map(i => {
        const itemSx = {
          s1: idx => ({
            padding: "10px 8px",
            textAlign: "center",
            borderLeft: "1px solid #F3F4F6",
            borderTop: idx > 3 ? "1px solid #F3F4F6" : "none"
          }),
          s2: {
            width: 32,
            height: 18,
            borderRadius: 6,
            background: "#F3F4F6",
            margin: "0 auto 4px"
          },
          s3: {
            width: 40,
            height: 10,
            borderRadius: 4,
            background: "#F3F4F6",
            margin: "0 auto"
          }
        };

        return (
          <div key={i} style={itemSx.s1(i)}>
            <div style={itemSx.s2} />
            <div style={itemSx.s3} />
          </div>
        );
      })}
    </div>
  );
}

function StatCell({
  value,
  label,
  color = "#374151",
  onClick,
  border = true,
  topBorder = false
}) {
  const sx = {
    s1: (borderValue, topBorderValue, hasClick) => ({
      padding: "10px 8px",
      textAlign: "center",
      borderLeft: borderValue ? "1px solid #F3F4F6" : "none",
      borderTop: topBorderValue ? "1px solid #F3F4F6" : "none",
      cursor: hasClick ? "pointer" : "default"
    }),
    s2: cellColor => ({
      fontSize: 16,
      fontWeight: 900,
      color: cellColor
    }),
    s3: {
      fontSize: 9,
      color: "#9CA3AF",
      marginTop: 2
    }
  };

  return (
    <div onClick={onClick} style={sx.s1(border, topBorder, onClick)}>
      <div style={sx.s2(color)}>{value ?? "—"}</div>
      <div style={sx.s3}>{label}</div>
    </div>
  );
}

export default function UserCard({
  u,
  DC,
  onPatch,
  setTargetUser,
  setPage,
  user
}) {
  const [expanded, setExpanded] = useState(false);
  const [editingMax, setEditingMax] = useState(false);
  const [maxVal, setMaxVal] = useState(u.max_listings ?? "");
  const [note, setNote] = useState(u.admin_note || "");
  const [noteSaved, setNoteSaved] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [stats, setStats] = useState({
    listing_count: u.listing_count ?? null,
    phone_count: u.phone_count ?? null,
    report_count: u.report_count ?? null,
    reporter_count: u.reporter_count ?? null,
    block_count: u.block_count ?? null
  });

  const hasLoaded = useRef(u.listing_count != null || u.phone_count != null || u.report_count != null);
  const seen = lastSeen(u.last_seen_at);
  const isSuspended = u.is_suspended === true;
  const canEdit = typeof onPatch === "function";

  async function loadStats() {
    if (hasLoaded.current) return;

    hasLoaded.current = true;
    setStatsLoading(true);

    try {
      const nextStats = await fetchAdminUserStats(u.id);
      setStats(nextStats);
    } catch {
      hasLoaded.current = false;
    } finally {
      setStatsLoading(false);
    }
  }

  function handleToggle() {
    const opening = !expanded;
    setExpanded(opening);
    if (opening) loadStats();
  }

  const confirmPatch = (id, obj, msg) => {
    if (window.confirm(msg)) onPatch(id, obj);
  };

  const suspendWithDuration = id => {
    const input = window.prompt("مدة التعليق بالأيام (اتركه فارغاً للتعليق الدائم):");
    if (input === null) return;

    const trimmed = input.trim();

    if (trimmed) {
      const days = parseInt(trimmed, 10);

      if (Number.isNaN(days) || days <= 0) {
        alert("أدخل عدداً صحيحاً أكبر من صفر");
        return;
      }

      onPatch(id, {
        is_suspended: true,
        suspended_until: new Date(Date.now() + days * 86400000).toISOString()
      });
    } else {
      onPatch(id, {
        is_suspended: true,
        suspended_until: null
      });
    }
  };

  const saveNote = () => {
    onPatch(u.id, {
      admin_note: note
    });

    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2000);
  };

  const handleVerifiedChange = e => {
    e.stopPropagation();

    const next = e.target.value === "true";
    if (next === !!u.verified) return;

    if (window.confirm(next ? "توثيق المستخدم؟" : "إلغاء التوثيق؟")) {
      onPatch(u.id, {
        verified: next
      });
    }
  };

  const handleAccountTypeChange = e => {
    e.stopPropagation();

    const next = e.target.value;
    if (next === (u.account_type || "individual")) return;

    const labels = {
      individual: "فردي",
      office: "مكتب"
    };

    if (window.confirm(`تغيير نوع الحساب إلى ${labels[next] || next}؟`)) {
      onPatch(u.id, {
        account_type: next
      });
    }
  };

  const handleVideoAllowedChange = e => {
    e.stopPropagation();

    const next = e.target.value === "true";
    if (next === !!u.video_allowed) return;

    if (window.confirm(next ? "منح صلاحية الفيديو؟" : "إيقاف صلاحية الفيديو؟")) {
      onPatch(u.id, {
        video_allowed: next
      });
    }
  };

  const borderColor = isSuspended ? "#FECACA" : seen?.online ? C.primary : DC?.border || "#DDE8E1";

  const sx = {
    s1: (theme, border) => ({
      background: theme?.white || "#fff",
      borderRadius: 12,
      border: `1px solid ${border}`,
      marginBottom: 8,
      overflow: "hidden"
    }),
    s2: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "10px 12px",
      cursor: "pointer"
    },
    s3: {
      position: "relative",
      flexShrink: 0
    },
    s4: suspended => ({
      width: 38,
      height: 38,
      borderRadius: "50%",
      background: suspended ? "#FEE2E2" : C.primary,
      color: suspended ? "#EF4444" : "white",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 16,
      fontWeight: 900
    }),
    s5: {
      position: "absolute",
      bottom: 0,
      left: 0,
      width: 10,
      height: 10,
      borderRadius: "50%",
      background: "#22C55E",
      border: "2px solid white"
    },
    s6: {
      flex: 1,
      minWidth: 0
    },
    s7: {
      display: "flex",
      alignItems: "center",
      gap: 4,
      flexWrap: "wrap"
    },
    s8: theme => ({
      fontSize: 13,
      fontWeight: 800,
      color: theme?.text || "#1A2E20"
    }),
    s9: {
      fontSize: 9,
      background: "#E8F4F0",
      color: C.primary,
      padding: "1px 6px",
      borderRadius: 20,
      fontWeight: 700
    },
    s10: {
      fontSize: 9,
      background: "#FEF3C7",
      color: "#C8952A",
      padding: "1px 6px",
      borderRadius: 20,
      fontWeight: 700
    },
    s11: {
      fontSize: 9,
      background: "#F0FDF4",
      color: "#16A34A",
      padding: "1px 6px",
      borderRadius: 20,
      fontWeight: 700
    },
    s12: {
      fontSize: 9,
      background: "#FEF2F2",
      color: "#EF4444",
      padding: "1px 6px",
      borderRadius: 20,
      fontWeight: 700
    },
    s13: {
      fontSize: 9,
      background: "#FEF2F2",
      color: "#EF4444",
      padding: "1px 6px",
      borderRadius: 20,
      fontWeight: 700
    },
    s14: {
      fontSize: 11,
      color: "#9CA3AF",
      marginTop: 1
    },
    s15: {
      color: "#C8952A",
      fontWeight: 700
    },
    s16: seenValue => ({
      fontSize: 10,
      color: seenValue?.online ? "#22C55E" : "#9CA3AF",
      marginTop: 1
    }),
    s17: {
      color: "#EF4444"
    },
    s18: {
      color: "#EF4444"
    },
    s19: {
      fontSize: 11,
      color: "#9CA3AF",
      flexShrink: 0
    },
    s20: theme => ({
      borderTop: `1px solid ${theme?.border || "#F3F4F6"}`
    }),
    s21: {
      display: "grid",
      gridTemplateColumns: "repeat(3,1fr)",
      borderBottom: "1px solid #F3F4F6"
    },
    s22: editable => ({
      padding: "10px 8px",
      textAlign: "center",
      borderLeft: "1px solid #F3F4F6",
      cursor: editable ? "pointer" : "default"
    }),
    s23: {
      display: "flex",
      gap: 3,
      justifyContent: "center"
    },
    s24: {
      width: 44,
      padding: "2px 4px",
      borderRadius: 6,
      border: `1.5px solid ${C.primary}`,
      fontSize: 12,
      textAlign: "center",
      fontFamily: "inherit",
      outline: "none"
    },
    s25: {
      background: C.primary,
      color: "white",
      border: "none",
      borderRadius: 6,
      padding: "2px 7px",
      fontSize: 11,
      cursor: "pointer"
    },
    s26: {
      fontSize: 16,
      fontWeight: 900,
      color: "#374151"
    },
    s27: {
      fontSize: 9,
      color: "#9CA3AF",
      marginTop: 2
    },
    s28: {
      display: "grid",
      gridTemplateColumns: "1fr",
      gap: 1,
      background: "#F3F4F6",
      borderBottom: "1px solid #F3F4F6"
    },
    s29: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: 1,
      background: "#F3F4F6"
    },
    s30: suspended => ({
      padding: "10px",
      border: "none",
      background: suspended ? "#F0FDF4" : "#FEF2F2",
      color: suspended ? "#16A34A" : "#EF4444",
      fontSize: 12,
      fontWeight: 700,
      cursor: "pointer",
      fontFamily: "inherit"
    }),
    s31: {
      background: "#FFFFFF",
      padding: "8px 8px",
      display: "grid",
      gap: 5,
      alignContent: "start"
    },
    s32: {
      fontSize: 9,
      color: "#6B7280",
      fontWeight: 800,
      lineHeight: 1.2
    },
    s32a: (active, tone = "green") => ({
      width: "100%",
      minWidth: 0,
      padding: "8px 7px",
      borderRadius: 9,
      border: "1.5px solid " + (
        active
          ? tone === "blue"
            ? "#93C5FD"
            : "#86EFAC"
          : "#E5E7EB"
      ),
      background: active
        ? tone === "blue"
          ? "#EFF6FF"
          : "#F0FDF4"
        : "#F9FAFB",
      color: active
        ? tone === "blue"
          ? "#1D4ED8"
          : "#166534"
        : "#374151",
      fontSize: 11,
      fontWeight: 800,
      fontFamily: "inherit",
      outline: "none",
      cursor: "pointer"
    }),
    s33: {
      background: "#F0F0FF",
      borderTop: "1px solid #E9D5FF",
      padding: "10px 12px",
      display: "grid",
      gap: 6
    },
    s33a: {
      fontSize: 11,
      fontWeight: 800,
      color: "#4B0082"
    },
    s33b: {
      fontSize: 10,
      color: "#6D28D9"
    },
    s33c: {
      width: "100%",
      padding: "10px 12px",
      borderRadius: 10,
      border: "1.5px solid #C4B5FD",
      background: "#FFFFFF",
      color: "#1F2937",
      fontSize: 12,
      fontWeight: 700,
      fontFamily: "inherit",
      outline: "none",
      cursor: "pointer"
    },
    s34: theme => ({
      padding: "10px 12px",
      background: theme?.bg || "#F8FAFC"
    }),
    s35: {
      fontSize: 10,
      fontWeight: 700,
      color: "#9CA3AF",
      marginBottom: 5
    },
    s36: {
      display: "flex",
      gap: 6
    },
    s37: theme => ({
      flex: 1,
      padding: "8px 12px",
      borderRadius: 9,
      border: `1.5px solid ${theme?.border || "#DDE8E1"}`,
      fontSize: 12,
      fontFamily: "Tajawal,sans-serif",
      direction: "rtl",
      outline: "none",
      background: "white",
      color: theme?.text || "#1A2E20"
    }),
    s38: saved => ({
      padding: "8px 14px",
      borderRadius: 9,
      border: "none",
      background: saved ? "#16A34A" : C.primary,
      color: "white",
      fontSize: 12,
      fontWeight: 700,
      cursor: "pointer",
      fontFamily: "inherit",
      transition: "background 0.2s",
      flexShrink: 0
    })
  };

  return (
    <div style={sx.s1(DC, borderColor)}>
      <div onClick={handleToggle} style={sx.s2}>
        <div style={sx.s3}>
          <div style={sx.s4(isSuspended)}>
            {(u.name || "م")[0]}
          </div>
          {seen?.online && <div style={sx.s5} />}
        </div>

        <div style={sx.s6}>
          <div style={sx.s7}>
            <span style={sx.s8(DC)}>{u.name || "—"}</span>
            {u.verified && <span style={sx.s9}>✓</span>}
            {u.role === "moderator" && <span style={sx.s10}>🟡</span>}
            {u.role === "support" && <span style={sx.s11}>🟢</span>}
            {u.role === "admin" && <span style={sx.s12}>🔴</span>}
            {isSuspended && <span style={sx.s13}>🚫</span>}
          </div>

          <div style={sx.s14}>
            {u.phone || "—"}
            {u.admin_note && <span style={sx.s15}> · 📝 {u.admin_note}</span>}
          </div>

          <div style={sx.s16(seen)}>
            {seen?.online ? "🟢 متصل الآن" : seen?.text ? `آخر ظهور: ${seen.text}` : "لم يسجل دخول"}
            {isSuspended && u.suspended_until && (
              <span style={sx.s17}> · 🚫 حتى {new Date(u.suspended_until).toLocaleDateString("ar")}</span>
            )}
            {isSuspended && !u.suspended_until && <span style={sx.s18}> · 🚫 دائماً</span>}
          </div>
        </div>

        <span style={sx.s19}>{expanded ? "▲" : "▼"}</span>
      </div>

      {expanded && (
        <div style={sx.s20(DC)}>
          {statsLoading ? (
            <StatSkeleton />
          ) : (
            <div style={sx.s21}>
              <StatCell
                value={stats.listing_count ?? "—"}
                label="📋 إعلانات"
                color={C.primary}
                onClick={() => {
                  setTargetUser && setTargetUser(u);
                  setPage && setPage("adminUserDetail");
                }}
              />

              <div style={sx.s22(canEdit)} onClick={() => canEdit && setEditingMax(true)}>
                {editingMax ? (
                  <div style={sx.s23}>
                    <input
                      type="number"
                      value={maxVal}
                      onChange={e => setMaxVal(e.target.value)}
                      style={sx.s24}
                      autoFocus
                    />
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onPatch(u.id, {
                          max_listings: maxVal === "" ? null : parseInt(maxVal, 10)
                        });
                        setEditingMax(false);
                      }}
                      style={sx.s25}
                    >
                      ✓
                    </button>
                  </div>
                ) : (
                  <>
                    <div style={sx.s26}>{isSuspended ? "🚫" : stats.listing_count != null ? u.max_listings ?? "∞" : "—"}</div>
                    <div style={sx.s27}>{canEdit ? "✏️ الحد" : "الحد"}</div>
                  </>
                )}
              </div>

              <StatCell value={fDate(u.created_at)} label="📅 انضم" border={false} />
              <StatCell value={stats.phone_count || 0} label="📞 أرقام" color="#6B7280" topBorder />
              <StatCell value={stats.report_count || 0} label="🚩 بلاغات" color={stats.report_count > 0 ? "#EF4444" : "#6B7280"} topBorder />
              <StatCell value={stats.reporter_count || 0} label="🔔 بلّغ" color="#9CA3AF" border={false} topBorder />
              {(stats.block_count || 0) > 0 && <StatCell value={stats.block_count} label="🛑 حظره آخرون" color="#6B7280" topBorder />}
            </div>
          )}

          {canEdit && (
            <div style={sx.s28}>
              <button
                onClick={() =>
                  isSuspended
                    ? confirmPatch(
                        u.id,
                        {
                          is_suspended: false,
                          suspended_until: null
                        },
                        "رفع التعليق؟"
                      )
                    : suspendWithDuration(u.id)
                }
                style={sx.s30(isSuspended)}
              >
                {isSuspended ? "✅ رفع التعليق" : "🚫 تعليق"}
              </button>

              <div style={sx.s29}>
                <label style={sx.s31} onClick={e => e.stopPropagation()}>
                  <span style={sx.s32}>التوثيق</span>
                  <select
                    value={u.verified ? "true" : "false"}
                    onClick={e => e.stopPropagation()}
                    onChange={handleVerifiedChange}
                    style={sx.s32a(!!u.verified, "green")}
                  >
                    <option value="true">✅ موثق</option>
                    <option value="false">غير موثق</option>
                  </select>
                </label>

                <label style={sx.s31} onClick={e => e.stopPropagation()}>
                  <span style={sx.s32}>نوع الحساب</span>
                  <select
                    value={u.account_type || "individual"}
                    onClick={e => e.stopPropagation()}
                    onChange={handleAccountTypeChange}
                    style={sx.s32a((u.account_type || "individual") !== "individual", "blue")}
                  >
                    <option value="individual">👤 فردي</option>
                    <option value="office">🏢 مكتب</option>
                  </select>
                </label>

                <label style={sx.s31} onClick={e => e.stopPropagation()}>
                  <span style={sx.s32}>الفيديو</span>
                  <select
                    value={u.video_allowed ? "true" : "false"}
                    onClick={e => e.stopPropagation()}
                    onChange={handleVideoAllowedChange}
                    style={sx.s32a(!!u.video_allowed, "green")}
                  >
                    <option value="true">🎥 مفعّل</option>
                    <option value="false">موقوف</option>
                  </select>
                </label>
              </div>

              {user?.role === "admin" && u.role !== "admin" && (
                <div style={sx.s33}>
                  <div style={sx.s33a}>الدور الإداري</div>
                  <div style={sx.s33b}>اختر الدور مع المستوى مباشرة بدل التبديل الدائري.</div>
                  <select
                    value={u.role || "user"}
                    onClick={e => e.stopPropagation()}
                    onChange={e => {
                      const next = e.target.value;
                      if (next === (u.role || "user")) return;

                      if (window.confirm(`تغيير الدور إلى ${getRoleLabel(next)}؟`)) {
                        onPatch(u.id, {
                          role: next
                        });
                      }
                    }}
                    style={sx.s33c}
                  >
                    {ROLE_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {canEdit && (
            <div style={sx.s34(DC)}>
              <div style={sx.s35}>📝 ملاحظة خاصة</div>
              <div style={sx.s36}>
                <input
                  value={note}
                  onChange={e => {
                    setNote(e.target.value);
                    setNoteSaved(false);
                  }}
                  placeholder="اكتب ملاحظة عن هذا المستخدم..."
                  style={sx.s37(DC)}
                />
                <button onClick={saveNote} style={sx.s38(noteSaved)}>
                  {noteSaved ? "✓" : "حفظ"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
            }
