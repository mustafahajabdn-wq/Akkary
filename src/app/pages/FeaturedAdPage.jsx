import { BackButton } from "../../shared/components/common/BackButton.jsx";
import React, { useState, useEffect } from "react";
import { C } from "../../shared/constants/colors.js";
import { IslamicPattern, Wave } from "../../shared/components/icons.jsx";
import { fetchAppSetting } from "../services/propertyService.js";
import { fetchMyAds, checkAdCode, uploadAdImages, createFeaturedAdRequest, markAdCodeUsed } from "../services/adService.js";
import { S, mergeStyles } from "../../shared/styles/primitives.js";
function FeaturedAdPage({
  setPage,
  DC,
  user
}) {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [previewImgs, setPreviewImgs] = useState([]);
  const [code, setCode] = useState("");
  const [codeValid, setCodeValid] = useState(false);
  const [codeData, setCodeData] = useState(null);
  const [checkingCode, setCheckingCode] = useState(false);
  const [supportWA, setSupportWA] = useState(""); // رقم واتساب الدعم

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    city: "",
    phone: "",
    image: "",
    duration_days: 30,
    card_size: "normal"
  });
  const sx = {
    s1: {
      maxWidth: 430,
      margin: "0 auto",
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "Tajawal,sans-serif"
    },
    s2: {
      fontSize: 40,
      marginBottom: 12
    },
    s3: {
      fontSize: 14,
      fontWeight: 700
    },
    s4: C => ({
      marginTop: 16,
      padding: "10px 24px",
      borderRadius: 10,
      border: "none",
      background: C.primary,
      color: "white",
      fontSize: 13,
      fontWeight: 700,
      cursor: "pointer",
      fontFamily: "inherit"
    }),
    s5: {
      fontSize: 12,
      color: "rgba(255,255,255,0.7)",
      marginTop: 4
    },
    s6: {
      padding: "14px",
      paddingBottom: 100
    },
    s7: DC => ({
      background: DC?.white || "#fff",
      borderRadius: 14,
      border: "1.5px solid " + (DC?.border || "#DDE8E1"),
      padding: "16px",
      marginBottom: 14
    }),
    s8: DC => ({
      fontSize: 15,
      fontWeight: 900,
      color: DC?.text,
      marginBottom: 14
    }),
    s9: {
      marginBottom: 12
    },
    s10: {
      display: "flex",
      gap: 6,
      flexWrap: "wrap",
      marginBottom: 8
    },
    s11: DC => ({
      display: "block",
      width: "100%",
      padding: "14px",
      borderRadius: 10,
      border: "2px dashed " + (DC?.border || "#DDE8E1"),
      textAlign: "center",
      cursor: "pointer",
      color: DC?.text3,
      fontSize: 13
    }),
    s12: DC => ({
      fontSize: 10,
      color: DC?.text3,
      marginTop: 4
    }),
    s13: inp => ({
      ...inp,
      height: 80,
      resize: "none",
      paddingTop: 11
    }),
    s14: inp => ({
      ...inp,
      marginBottom: 0
    }),
    s15: inp => ({
      ...inp,
      marginBottom: 0
    }),
    s16: DC => ({
      fontSize: 12,
      fontWeight: 700,
      color: DC?.text3,
      display: "block",
      marginBottom: 8
    }),
    s17: {
      display: "flex",
      gap: 6,
      flexWrap: "wrap",
      marginBottom: 12
    },
    s18: DC => ({
      fontSize: 12,
      fontWeight: 700,
      color: DC?.text3,
      display: "block",
      marginBottom: 8
    }),
    s19: {
      display: "flex",
      gap: 8,
      marginBottom: 12
    },
    s20: {
      background: "#FEF3C7",
      border: "1px solid #FDE68A",
      borderRadius: 10,
      padding: "10px 14px",
      marginBottom: 12,
      fontSize: 12,
      color: "#92400E"
    },
    s21: {
      display: "block",
      width: "100%",
      padding: "11px",
      borderRadius: 10,
      border: "none",
      background: "#25D366",
      color: "white",
      fontSize: 13,
      fontWeight: 800,
      cursor: "pointer",
      fontFamily: "inherit",
      textDecoration: "none",
      textAlign: "center",
      marginBottom: 12,
      boxSizing: "border-box"
    },
    s22: {
      display: "flex",
      gap: 8,
      marginBottom: 12
    },
    s23: (inp, codeValid, code, DC) => ({
      ...inp,
      direction: "ltr",
      textAlign: "center",
      letterSpacing: 3,
      fontSize: 16,
      fontWeight: 900,
      marginBottom: 0,
      flex: 1,
      borderColor: codeValid ? "#16A34A" : code ? "#E5E7EB" : DC?.border || "#DDE8E1",
      color: codeValid ? "#16A34A" : "inherit"
    }),
    s24: (codeValid, C) => ({
      padding: "0 16px",
      borderRadius: 10,
      border: "none",
      background: codeValid ? "#16A34A" : C.primary,
      color: "white",
      fontSize: 12,
      fontWeight: 700,
      cursor: "pointer",
      fontFamily: "inherit",
      flexShrink: 0
    }),
    s25: (codeValid, submitting, C) => ({
      flex: 1,
      padding: "12px",
      borderRadius: 10,
      border: "none",
      background: !codeValid || submitting ? "#D1D5DB" : C.primary,
      color: "white",
      fontSize: 13,
      fontWeight: 800,
      cursor: !codeValid || submitting ? "not-allowed" : "pointer",
      fontFamily: "inherit"
    }),
    s26: DC => ({
      padding: "12px 16px",
      borderRadius: 10,
      border: "1.5px solid " + (DC?.border || "#DDE8E1"),
      background: DC?.bg || "#F2F5F3",
      color: DC?.text3,
      fontSize: 13,
      cursor: "pointer",
      fontFamily: "inherit"
    }),
    s27: C => ({
      width: "100%",
      padding: "13px",
      borderRadius: 12,
      border: "none",
      background: C.primary,
      color: "white",
      fontSize: 14,
      fontWeight: 800,
      cursor: "pointer",
      fontFamily: "inherit",
      marginBottom: 14
    }),
    s28: result => ({
      padding: "10px 14px",
      borderRadius: 10,
      background: result.ok ? "#F0FDF4" : "#FEF2F2",
      border: "1px solid " + (result.ok ? "#BBF7D0" : "#FECACA"),
      fontSize: 13,
      color: result.ok ? "#14532D" : "#991B1B",
      fontWeight: 700,
      marginBottom: 12
    }),
    s29: DC => ({
      fontSize: 11,
      fontWeight: 800,
      color: DC?.text3,
      marginBottom: 8
    }),
    s30: {
      fontSize: 36,
      marginBottom: 8
    },
    s31: DC => ({
      fontSize: 13,
      color: DC?.text3
    })
  };
  useEffect(() => {
    if (user?.id) loadMyAds();
  }, [user?.id]);

  // جلب رقم واتساب الدعم
  useEffect(() => {
    fetchAppSetting("support_whatsapp").then(value => {
      if (value) setSupportWA(value);
    });
  }, []);
  async function checkCode() {
    if (!code.trim()) return;
    setCheckingCode(true);
    const data = await checkAdCode(code.trim());
    if (!data) {
      setCodeValid(false);
      setCodeData(null);
      setResult({
        ok: false,
        msg: "❌ الكود غير صحيح أو مستخدم مسبقاً"
      });
    } else {
      setCodeValid(true);
      setCodeData(data);
      setForm(p => ({
        ...p,
        duration_days: data.duration_days,
        card_size: data.card_size
      }));
      setResult({
        ok: true,
        msg: `✅ كود صحيح — ${data.duration_days} يوم · ${data.card_size === "normal" ? "عادي" : data.card_size === "large" ? "كبير" : "بانر"}`
      });
    }
    setCheckingCode(false);
  }
  async function loadMyAds() {
    setLoading(true);
    if (!user?.id) {
      setLoading(false);
      setResult({
        ok: false,
        msg: "❌ user.id غير موجود"
      });
      return;
    }
    const data = await fetchMyAds(user.id);
    setAds(data || []);
    setLoading(false);
  }
  async function handleFiles(files) {
    setUploadingImg(true);
    const urls = await uploadAdImages(user.id, files);
    setPreviewImgs(p => {
      const next = [...p, ...urls].slice(0, 7);
      if (!form.image && next[0]) setForm(pf => ({
        ...pf,
        image: next[0]
      }));
      return next;
    });
    setUploadingImg(false);
  }
  async function submit() {
    if (!form.title.trim() || !form.phone.trim()) {
      setResult({
        ok: false,
        msg: "العنوان والهاتف مطلوبان"
      });
      return;
    }
    if (!codeValid || !codeData) {
      setResult({
        ok: false,
        msg: "❌ أدخل كود الدفع أولاً"
      });
      return;
    }
    setSubmitting(true);
    try {
      await createFeaturedAdRequest(user.id, form, previewImgs, codeData);
      await markAdCodeUsed(codeData.id, user.id);
    } catch (error) {
      setResult({
        ok: false,
        msg: "❌ خطأ: " + error.message
      });
      setSubmitting(false);
      return;
    }
    setResult({
      ok: true,
      msg: "✅ تم إرسال طلبك — سيتم مراجعته قريباً"
    });
    setShowForm(false);
    setCode("");
    setCodeValid(false);
    setCodeData(null);
    setForm({
      title: "",
      description: "",
      category: "",
      city: "",
      phone: "",
      image: "",
      duration_days: 30,
      card_size: "normal"
    });
    loadMyAds();
    setSubmitting(false);
  }
  function statusBadge(ad) {
    const now = new Date();
    const ends = ad.ends_at ? new Date(ad.ends_at) : null;
    const expired = ends && ends < now;
    if (expired) return {
      label: "⚠️ انتهى",
      color: "#EF4444",
      bg: "#FEF2F2"
    };
    if (ad.status === "approved" && ad.active) return {
      label: "🟢 نشط",
      color: "#16A34A",
      bg: "#F0FDF4"
    };
    if (ad.status === "pending") return {
      label: "⏳ قيد المراجعة",
      color: "#C8952A",
      bg: "#FEF3C7"
    };
    if (ad.status === "rejected") return {
      label: "❌ مرفوض",
      color: "#EF4444",
      bg: "#FEF2F2"
    };
    return {
      label: "⏸ موقوف",
      color: "#6B7280",
      bg: "#F3F4F6"
    };
  }
  function LifeBar({
    ad
  }) {
    const sx = {
      s1: DC => ({
        padding: "8px 14px 10px",
        borderTop: "1px solid " + (DC?.border || "#DDE8E1")
      }),
      s2: {
        display: "flex",
        justifyContent: "space-between",
        fontSize: 10,
        color: "#9CA3AF",
        marginBottom: 4
      },
      s3: color => ({
        color,
        fontWeight: 700
      }),
      s4: {
        height: 5,
        borderRadius: 3,
        background: "#E5E7EB",
        overflow: "hidden"
      },
      s5: (pct, color) => ({
        height: "100%",
        width: `${pct}%`,
        background: color,
        borderRadius: 3,
        transition: "width 0.3s"
      })
    };
    if (!ad.starts_at || !ad.ends_at) return null;
    const start = new Date(ad.starts_at);
    const end = new Date(ad.ends_at);
    const now = new Date();
    const total = end - start;
    const left = end - now;
    const pct = Math.max(0, Math.min(100, Math.round(left / total * 100)));
    const daysLeft = Math.max(0, Math.ceil(left / 86400000));
    const color = daysLeft <= 3 ? "#EF4444" : daysLeft <= 7 ? "#C8952A" : C.primary;
    const startStr = `${String(start.getDate()).padStart(2, "0")}/${String(start.getMonth() + 1).padStart(2, "0")}`;
    const endStr = `${String(end.getDate()).padStart(2, "0")}/${String(end.getMonth() + 1).padStart(2, "0")}/${end.getFullYear()}`;
    return <div style={sx.s1(DC)}>
        <div style={sx.s2}>
          <span>📅 {startStr}</span>
          <span style={sx.s3(color)}>{daysLeft === 0 ? "ينتهي اليوم" : `${daysLeft} يوم متبقي`}</span>
          <span>🏁 {endStr}</span>
        </div>
        <div style={sx.s4}>
          <div style={sx.s5(pct, color)} />
        </div>
      </div>;
  }
  async function renewAd(ad) {
    setShowForm(true);
    setForm(p => ({
      ...p,
      title: ad.title,
      description: ad.description,
      category: ad.category,
      city: ad.city,
      phone: ad.phone,
      image: ad.image_url || ""
    }));
    setResult({
      ok: true,
      msg: "📋 تم نسخ بيانات الإعلان — اختر المدة وأرسل الطلب"
    });
  }
  const DURATIONS = [{
    days: 7,
    label: "أسبوع"
  }, {
    days: 14,
    label: "أسبوعان"
  }, {
    days: 30,
    label: "شهر"
  }, {
    days: 60,
    label: "شهران"
  }, {
    days: 90,
    label: "3 أشهر"
  }];
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
    marginBottom: 10,
    direction: "rtl"
  };
  if (!user?.id) return <div style={sx.s1}>
      <div style={S.textCenter}>
        <div style={sx.s2}>🔒</div>
        <div style={sx.s3}>يجب تسجيل الدخول أولاً</div>
        <button onClick={() => setPage("login")} style={sx.s4(C)}>تسجيل الدخول</button>
      </div>
    </div>;
  return <div style={S.pageShell(DC)}>
      <div style={S.primaryHero("#C8952A")}>
        <IslamicPattern opacity={0.1} color="#FFFFFF" width={430} height={200} />
        <div style={S.absTopRight14}>
          <BackButton onPress={() => setPage("profile")} />
        </div>
        <div style={S.relZ1}>
          <div style={S.title20White}>📢 الإعلانات المدفوعة</div>
          <div style={sx.s5}>أعلن لآلاف المستخدمين في سوريا</div>
        </div>
        <Wave />
      </div>

      <div style={sx.s6}>

        {/* نموذج الطلب */}
        {showForm ? <div style={sx.s7(DC)}>
            <div style={sx.s8(DC)}>📝 طلب إعلان مدفوع</div>

            {/* صور متعددة */}
            <div style={sx.s9}>
              <label style={S.labelMutedBlock6(DC)}>
                صور الإعلان ({previewImgs.length}/7)
              </label>
              {previewImgs.length > 0 && <div style={sx.s10}>
                  {previewImgs.map((img, i) => {
              const sx = {
                s1: {
                  position: "relative"
                },
                s2: (img, form, C) => ({
                  width: 72,
                  height: 64,
                  borderRadius: 8,
                  objectFit: "cover",
                  border: `2px solid ${img === form.image ? C.primary : "#E5E7EB"}`,
                  cursor: "pointer"
                }),
                s3: C => ({
                  position: "absolute",
                  top: 2,
                  right: 2,
                  background: C.primary,
                  borderRadius: "50%",
                  width: 14,
                  height: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 8,
                  color: "white"
                }),
                s4: {
                  position: "absolute",
                  top: 2,
                  left: 2,
                  background: "rgba(0,0,0,0.55)",
                  border: "none",
                  borderRadius: "50%",
                  width: 16,
                  height: 16,
                  color: "white",
                  fontSize: 10,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }
              };
              return <div key={i} style={sx.s1}>
                      <img src={img} alt="" style={sx.s2(img, form, C)} onClick={() => setForm(p => ({
                  ...p,
                  image: img
                }))} />
                      {img === form.image && <div style={sx.s3(C)}>★</div>}
                      <button onClick={() => {
                  setPreviewImgs(p => p.filter((_, j) => j !== i));
                  if (form.image === img) setForm(pf => ({
                    ...pf,
                    image: previewImgs.find(u => u !== img) || ""
                  }));
                }} style={sx.s4}>✕</button>
                    </div>;
            })}
                </div>}
              {previewImgs.length < 7 && <label style={sx.s11(DC)}>
                  {uploadingImg ? "⏳ جارٍ الرفع..." : `📷 رفع صور (${previewImgs.length}/7)`}
                  <input type="file" accept="image/*" multiple onChange={e => handleFiles(Array.from(e.target.files))} style={S.hidden} />
                </label>}
              {previewImgs.length > 0 && <div style={sx.s12(DC)}>اضغط على صورة لجعلها الرئيسية ★</div>}
            </div>

            <label style={S.labelMutedBlock4(DC)}>العنوان *</label>
            <input value={form.title} onChange={e => setForm(p => ({
          ...p,
          title: e.target.value
        }))} placeholder="مثال: مكتب هندسي للتصميم" style={inp} />

            <label style={S.labelMutedBlock4(DC)}>الوصف</label>
            <textarea value={form.description} onChange={e => setForm(p => ({
          ...p,
          description: e.target.value
        }))} placeholder="وصف مختصر لنشاطك..." style={sx.s13(inp)} />

            <div style={S.gap8}>
              <div style={S.flex1}>
                <label style={S.labelMutedBlock4(DC)}>المدينة</label>
                <input value={form.city} onChange={e => setForm(p => ({
              ...p,
              city: e.target.value
            }))} placeholder="دمشق" style={sx.s14(inp)} />
              </div>
              <div style={S.flex1}>
                <label style={S.labelMutedBlock4(DC)}>التصنيف</label>
                <input value={form.category} onChange={e => setForm(p => ({
              ...p,
              category: e.target.value
            }))} placeholder="عقارات، خدمات..." style={sx.s15(inp)} />
              </div>
            </div>
            <div style={S.mb10} />

            <label style={S.labelMutedBlock4(DC)}>رقم الهاتف *</label>
            <input value={form.phone} onChange={e => setForm(p => ({
          ...p,
          phone: e.target.value
        }))} placeholder="09xxxxxxxx" style={mergeStyles(inp, S.ltrLeft)} />

            {/* المدة */}
            <label style={sx.s16(DC)}>مدة الإعلان</label>
            <div style={sx.s17}>
              {DURATIONS.map(d => {
            const sx = {
              s1: (form, d, C, DC) => ({
                padding: "7px 14px",
                borderRadius: 20,
                border: "1.5px solid " + (form.duration_days === d.days ? C.primary : DC?.border || "#DDE8E1"),
                background: form.duration_days === d.days ? "#E8F4F0" : DC?.bg || "#F2F5F3",
                color: form.duration_days === d.days ? C.primary : DC?.text || "#1A2E20",
                fontSize: 12,
                fontWeight: form.duration_days === d.days ? 800 : 600,
                cursor: "pointer",
                fontFamily: "inherit"
              })
            };
            return <button key={d.days} onClick={() => setForm(p => ({
              ...p,
              duration_days: d.days
            }))} style={sx.s1(form, d, C, DC)}>
                  {d.label}
                </button>;
          })}
            </div>

            {/* حجم الكارت */}
            <label style={sx.s18(DC)}>حجم الكارت</label>
            <div style={sx.s19}>
              {[{
            key: "normal",
            label: "عادي",
            icon: "▭",
            desc: "صورة 130×130 مع النص جانباً"
          }, {
            key: "large",
            label: "كبير",
            icon: "▬",
            desc: "صورة عرض كامل ارتفاع 200px"
          }, {
            key: "card",
            label: "بانر",
            icon: "⬛",
            desc: "صورة بنسبة بطاقة الهوية مع عنوان فوقها"
          }].map(s => {
            const sx = {
              s1: (form, s, C, DC) => ({
                flex: 1,
                padding: "10px 6px",
                borderRadius: 12,
                border: "1.5px solid " + (form.card_size === s.key ? C.primary : DC?.border || "#DDE8E1"),
                background: form.card_size === s.key ? "#E8F4F0" : DC?.bg || "#F2F5F3",
                cursor: "pointer",
                fontFamily: "inherit",
                textAlign: "center"
              }),
              s2: {
                fontSize: 18,
                marginBottom: 4
              },
              s3: (form, s, C, DC) => ({
                fontSize: 12,
                fontWeight: 800,
                color: form.card_size === s.key ? C.primary : DC?.text || "#1A2E20"
              }),
              s4: {
                fontSize: 9,
                color: "#9CA3AF",
                marginTop: 2,
                lineHeight: 1.3
              }
            };
            return <button key={s.key} onClick={() => setForm(p => ({
              ...p,
              card_size: s.key
            }))} style={sx.s1(form, s, C, DC)}>
                  <div style={sx.s2}>{s.icon}</div>
                  <div style={sx.s3(form, s, C, DC)}>{s.label}</div>
                  <div style={sx.s4}>{s.desc}</div>
                </button>;
          })}
            </div>

            {/* ملاحظة السعر */}
            <div style={sx.s20}>
              💡 بعد تحديد الخيارات — اطلب كود الدفع عبر واتساب وأدخله أدناه لتفعيل الإرسال
            </div>

            {/* طلب الكود عبر واتساب */}
            {supportWA && <a href={`https://wa.me/${supportWA.replace(/\D/g, "")}?text=${encodeURIComponent(`أريد كود إعلان مدفوع\nالمدة: ${form.duration_days} يوم\nالحجم: ${form.card_size === "normal" ? "عادي" : form.card_size === "large" ? "كبير" : "بانر"}`)}`} target="_blank" rel="noopener noreferrer" style={sx.s21}>
                💬 طلب كود الدفع عبر واتساب
              </a>}

            {/* إدخال الكود */}
            <label style={S.labelMutedBlock6(DC)}>كود الدفع *</label>
            <div style={sx.s22}>
              <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="أدخل الكود هنا..." maxLength={12} style={sx.s23(inp, codeValid, code, DC)} />
              <button onClick={checkCode} disabled={checkingCode || !code.trim()} style={sx.s24(codeValid, C)}>
                {checkingCode ? "⏳" : codeValid ? "✓" : "تحقق"}
              </button>
            </div>

            <div style={S.gap8}>
              <button onClick={submit} disabled={submitting || !codeValid} style={sx.s25(codeValid, submitting, C)}>
                {submitting ? "⏳ جارٍ الإرسال..." : !codeValid ? "🔒 أدخل كود الدفع" : "📤 إرسال الطلب"}
              </button>
              <button onClick={() => setShowForm(false)} style={sx.s26(DC)}>
                إلغاء
              </button>
            </div>
          </div> : <button onClick={() => setShowForm(true)} style={sx.s27(C)}>
            ＋ طلب إعلان مدفوع جديد
          </button>}

        {result && <div style={sx.s28(result)}>
            {result.msg}
          </div>}

        {/* إعلاناتي المدفوعة */}
        <div style={sx.s29(DC)}>إعلاناتي المدفوعة</div>

        {loading ? <div style={S.emptyStateCentered}>⏳</div> : ads.length === 0 ? <div style={S.emptyStateCentered}>
              <div style={sx.s30}>📢</div>
              <div style={sx.s31(DC)}>لا توجد إعلانات مدفوعة بعد</div>
            </div> : ads.map(ad => {
        const badge = statusBadge(ad);
        const now = new Date();
        const ends = ad.ends_at ? new Date(ad.ends_at) : null;
        const expired = ends && ends < now;
        const sx = {
          s1: (DC, expired, badge, ad) => ({
            background: DC?.white || "#fff",
            borderRadius: 12,
            border: `1.5px solid ${expired ? "#FECACA" : badge.color + "33"}`,
            marginBottom: 10,
            overflow: "hidden",
            opacity: ad.status === "pending" ? 0.65 : 1
          }),
          s2: {
            display: "flex",
            gap: 10,
            padding: "12px 14px"
          },
          s3: {
            width: 64,
            height: 64,
            borderRadius: 10,
            objectFit: "cover",
            flexShrink: 0
          },
          s4: {
            width: 64,
            height: 64,
            borderRadius: 10,
            background: "#F3F4F6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28,
            flexShrink: 0
          },
          s5: {
            flex: 1,
            minWidth: 0
          },
          s6: DC => ({
            fontSize: 13,
            fontWeight: 800,
            color: DC?.text,
            marginBottom: 4
          }),
          s7: {
            fontSize: 11,
            color: "#6B7280",
            marginBottom: 6
          },
          s8: {
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexWrap: "wrap"
          },
          s9: badge => ({
            fontSize: 10,
            fontWeight: 700,
            padding: "2px 8px",
            borderRadius: 20,
            background: badge.bg,
            color: badge.color
          }),
          s10: {
            fontSize: 10,
            fontWeight: 700,
            padding: "2px 8px",
            borderRadius: 20,
            background: "#EDE9FE",
            color: "#7C3AED"
          },
          s11: {
            fontSize: 10,
            color: "#9CA3AF"
          },
          s12: {
            fontSize: 11,
            color: "#EF4444",
            marginTop: 4,
            background: "#FEF2F2",
            padding: "4px 8px",
            borderRadius: 6
          },
          s13: {
            padding: "8px 14px",
            background: "#FEF3C7",
            fontSize: 11,
            color: "#92400E",
            fontWeight: 600
          },
          s14: DC => ({
            padding: "8px 14px",
            borderTop: "1px solid " + (DC?.border || "#DDE8E1")
          }),
          s15: C => ({
            width: "100%",
            padding: "9px",
            borderRadius: 8,
            border: "none",
            background: C.primary,
            color: "white",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit"
          })
        };
        return <div key={ad.id} style={sx.s1(DC, expired, badge, ad)}>
                <div style={sx.s2}>
                  {ad.image_url ? <img src={ad.image_url} alt="" style={sx.s3} /> : <div style={sx.s4}>📢</div>}
                  <div style={sx.s5}>
                    <div style={sx.s6(DC)}>{ad.title}</div>
                    <div style={sx.s7}>{ad.city}{ad.city && ad.category ? " · " : ""}{ad.category}</div>
                    <div style={sx.s8}>
                      <span style={sx.s9(badge)}>
                        {badge.label}
                      </span>
                      {ad.card_size && ad.card_size !== "normal" && <span style={sx.s10}>
                          {ad.card_size === "large" ? "▬ كبير" : "⬛ بانر"}
                        </span>}
                      {ad.status === "approved" && <span style={sx.s11}>👁 {ad.views || 0} مشاهدة</span>}
                    </div>
                    {ad.status === "rejected" && ad.rejection_reason && <div style={sx.s12}>
                        سبب الرفض: {ad.rejection_reason}
                      </div>}
                  </div>
                </div>

                {/* شريط العمر */}
                {ad.status === "approved" && <LifeBar ad={ad} />}

                {/* رسالة قيد المراجعة */}
                {ad.status === "pending" && <div style={sx.s13}>
                    ⏳ طلبك قيد المراجعة — سنتواصل معك قريباً للدفع
                  </div>}

                {/* زر التجديد عند الانتهاء */}
                {(expired || ad.status === "rejected") && <div style={sx.s14(DC)}>
                    <button onClick={() => renewAd(ad)} style={sx.s15(C)}>
                      🔄 تجديد الإعلان
                    </button>
                  </div>}
              </div>;
      })}
      </div>
    </div>;
}
export default FeaturedAdPage;