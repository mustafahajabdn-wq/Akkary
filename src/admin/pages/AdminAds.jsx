import { BackButton } from "../../shared/components/common/BackButton.jsx";
import { Navigate } from "react-router-dom";
import React, { useState, useEffect, useRef } from "react";
import { approveAdWithNotification, createAdCode, deleteAdCode, deleteAdminAd, fetchAdCodes, fetchAdminAds, rejectAdWithNotification, saveAdminAd, updateAdminAd, uploadAdImage } from "../services/adminService.js";
import { C } from "../../shared/constants/colors.js";
import { IslamicPattern, Wave } from "../../shared/components/icons.jsx";
import { S, mergeStyles } from "../../shared/styles/primitives.js";
import { fDate } from "../../shared/utils/formatters.js";
const CATEGORIES = ["مكتب عقاري", "ورشة بناء", "نقل أثاث", "مواد بناء", "ديكور", "تمويل عقاري", "خدمات عقارية", "أخرى"];
const adUi = {
  progressWrap: {
    marginTop: 8
  },
  progressMeta: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 10,
    color: "#6B7280",
    marginBottom: 3,
    fontWeight: 700
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    background: "#E5E7EB",
    overflow: "hidden"
  },
  progressBar: (pct, color) => ({
    height: "100%",
    width: `${pct}%`,
    background: color,
    borderRadius: 2,
    transition: "width 0.3s"
  }),
  card: (DC, borderColor) => ({
    background: DC?.white || "#fff",
    borderRadius: 14,
    border: `2px solid ${borderColor}`,
    marginBottom: 12,
    overflow: "hidden"
  }),
  pendingBanner: {
    background: "#FEF3C7",
    padding: "8px 14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  },
  pendingAction: bg => ({
    padding: "5px 12px",
    borderRadius: 20,
    border: "none",
    background: bg,
    color: "white",
    fontSize: 11,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit"
  }),
  header: {
    display: "flex",
    gap: 10,
    padding: "12px 14px",
    borderBottom: "1px solid #F3F4F6"
  },
  thumb: {
    width: 70,
    height: 70,
    borderRadius: 10,
    overflow: "hidden",
    flexShrink: 0,
    background: "#F3F4F6",
    position: "relative"
  },
  thumbImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },
  thumbFallback: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 28
  },
  moreBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    background: "rgba(0,0,0,0.6)",
    color: "white",
    fontSize: 9,
    fontWeight: 700,
    padding: "1px 5px",
    borderRadius: 8
  },
  metaWrap: {
    flex: 1,
    minWidth: 0
  },
  titleRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
    flexWrap: "wrap"
  },
  title: DC => ({
    fontSize: 14,
    fontWeight: 900,
    color: DC?.text || "#1A2E20"
  }),
  statusChip: (active, isExpired) => ({
    fontSize: 10,
    padding: "2px 8px",
    borderRadius: 20,
    fontWeight: 700,
    background: active && !isExpired ? "#E8F4F0" : isExpired ? "#FEF2F2" : "#F3F4F6",
    color: active && !isExpired ? C.primary : isExpired ? "#EF4444" : "#6B7280"
  }),
  sizeChip: {
    fontSize: 10,
    padding: "2px 8px",
    borderRadius: 20,
    fontWeight: 700,
    background: "#EDE9FE",
    color: "#7C3AED"
  },
  subMeta: {
    fontSize: 11,
    color: "#6B7280",
    lineHeight: 1.7
  },
  textButton: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: 700,
    color: C.primary,
    background: "none",
    border: "none",
    cursor: "pointer",
    fontFamily: "inherit",
    padding: 0
  },
  statsPanel: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 6,
    padding: "8px 10px",
    background: "#F8FAFC",
    borderRadius: 8
  },
  toggleTrack: active => ({
    width: 44,
    height: 24,
    borderRadius: 12,
    border: "none",
    background: active ? C.primary : "#D1D5DB",
    cursor: "pointer",
    position: "relative",
    flexShrink: 0,
    marginTop: 4
  }),
  toggleKnob: active => ({
    width: 18,
    height: 18,
    borderRadius: "50%",
    background: "white",
    position: "absolute",
    top: 3,
    transition: "left 0.2s",
    left: active ? 23 : 3
  }),
  sectionMuted: {
    padding: "8px 14px",
    background: "#FAFAFA",
    borderBottom: "1px solid #F3F4F6"
  },
  description: {
    padding: "8px 14px",
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 1.6,
    borderBottom: "1px solid #F3F4F6"
  },
  galleryWrap: {
    padding: "8px 14px",
    borderBottom: "1px solid #F3F4F6"
  },
  galleryRow: {
    display: "flex",
    gap: 6,
    marginTop: 8,
    overflowX: "auto",
    paddingBottom: 4
  },
  galleryThumb: {
    width: 70,
    height: 60,
    borderRadius: 8,
    objectFit: "cover",
    flexShrink: 0,
    border: "1.5px solid #E5E7EB",
    cursor: "pointer"
  },
  actionsRow: {
    display: "flex",
    gap: 0
  },
  actionBtn: (bg, color, borderLeft = true) => ({
    flex: 1,
    padding: "10px",
    border: "none",
    background: bg,
    color,
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
    ...(borderLeft ? {
      borderLeft: "1px solid #E5E7EB"
    } : {})
  })
};
function daysLeft(endsAt) {
  if (!endsAt) return null;
  const d = Math.ceil((new Date(endsAt) - Date.now()) / 86400000);
  return d;
}
function ProgressBar({
  starts,
  ends,
  active
}) {
  const sx = {
    s1: color => ({
      color
    })
  };
  if (!starts || !ends) return null;
  const total = new Date(ends) - new Date(starts);
  const elapsed = Date.now() - new Date(starts);
  const pct = Math.min(100, Math.max(0, Math.round(elapsed / total * 100)));
  const left = daysLeft(ends);
  const color = left < 3 ? "#EF4444" : left < 7 ? "#C8952A" : C.primary;
  return <div style={adUi.progressWrap}>
      <div style={adUi.progressMeta}>
        <span>{fDate(starts)}</span>
        <span style={sx.s1(color)}>{left !== null ? left <= 0 ? "⚠️ انتهى" : `${left} يوم متبقي` : ""}</span>
        <span>{fDate(ends)}</span>
      </div>
      <div style={adUi.progressTrack}>
        <div style={adUi.progressBar(pct, color)} />
      </div>
    </div>;
}
function AdCard({
  ad,
  onEdit,
  onDelete,
  onToggle,
  onExtend,
  onCopy,
  onApprove,
  onReject,
  DC
}) {
  const [showImages, setShowImages] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const allImages = [ad.image_url, ...(Array.isArray(ad.images) ? ad.images : [])].filter(Boolean);
  const left = daysLeft(ad.ends_at);
  const isExpired = left !== null && left <= 0;
  const sx = {
    s1: {
      fontSize: 12,
      fontWeight: 800,
      color: "#92400E"
    },
    s2: {
      fontSize: 11,
      color: "#92400E",
      marginRight: 6
    },
    s3: {
      fontSize: 11,
      color: "#92400E"
    },
    s4: {
      fontSize: 11,
      fontWeight: 700,
      color: "#8B5CF6"
    },
    s5: {
      fontSize: 11,
      fontWeight: 700,
      color: "#3B82F6"
    },
    s6: {
      fontSize: 11,
      fontWeight: 700,
      color: "#10B981"
    },
    s7: {
      fontSize: 11,
      fontWeight: 700,
      color: "#F59E0B"
    },
    s8: C => ({
      fontSize: 11,
      fontWeight: 700,
      color: C.primary,
      background: "none",
      border: "none",
      cursor: "pointer",
      fontFamily: "inherit",
      padding: 0
    })
  };
  return <div style={adUi.card(DC, ad.status === "pending" ? "#FDE68A" : ad.active && !isExpired ? C.primary : "#E5E7EB")}>
      {/* شارة الطلب المعلق */}
      {ad.status === "pending" && <div style={adUi.pendingBanner}>
          <div>
            <span style={sx.s1}>⏳ طلب جديد من مستخدم</span>
            {ad.profiles?.name && <span style={sx.s2}>— {ad.profiles.name}</span>}
            {ad.duration_days && <span style={sx.s3}> · {ad.duration_days} يوم</span>}
          </div>
          <div style={S.gap6}>
            <button onClick={() => onApprove(ad.id)} style={adUi.pendingAction("#16A34A")}>✓ قبول</button>
            <button onClick={() => onReject(ad.id)} style={adUi.pendingAction("#EF4444")}>✕ رفض</button>
          </div>
        </div>}
      {/* Header */}
      <div style={adUi.header}>
        {/* صورة رئيسية */}
        <div style={adUi.thumb}>
          {ad.image_url ? <img src={ad.image_url} alt="" style={adUi.thumbImage} /> : <div style={adUi.thumbFallback}>📢</div>}
          {allImages.length > 1 && <div style={adUi.moreBadge}>+{allImages.length - 1}</div>}
        </div>

        <div style={adUi.metaWrap}>
          <div style={adUi.titleRow}>
            <span style={adUi.title(DC)}>{ad.title}</span>
            <span style={adUi.statusChip(ad.active, isExpired)}>
              {isExpired ? "⚠️ انتهى" : ad.active ? "🟢 نشط" : "⚫ موقوف"}
            </span>
            <span style={adUi.sizeChip}>
              {ad.card_size === "large" ? "📐 كبير" : ad.card_size === "banner" ? "🪧 بانر" : "📄 عادي"}
            </span>
          </div>
          <div style={adUi.subMeta}>
            {ad.category && <span>{ad.category} · </span>}
            {ad.city && <span>📍{ad.city} · </span>}
            {ad.phone && <span dir="ltr">📞{ad.phone}</span>}
          </div>

          {/* إحصائيات منسدلة */}
          <button onClick={e => {
          e.stopPropagation();
          setShowStats(p => !p);
        }} style={adUi.textButton}>
            {showStats ? "▲ إخفاء الإحصائيات" : "📊 إظهار الإحصائيات"}
          </button>
          {showStats && <div style={adUi.statsPanel}>
              <span style={sx.s4}>📊 {ad.impressions || 0} ظهور</span>
              <span style={sx.s5}>👁 {ad.views || 0} مشاهدة</span>
              <span style={sx.s6}>📞 {ad.phone_clicks || 0} هاتف</span>
              <span style={sx.s7}>💬 {ad.whatsapp_clicks || 0} واتساب</span>
            </div>}
        </div>

        {/* Toggle */}
        <button onClick={() => onToggle(ad)} style={adUi.toggleTrack(ad.active && !isExpired)}>
          <div style={adUi.toggleKnob(ad.active && !isExpired)} />
        </button>
      </div>

      {/* شريط زمني */}
      {(ad.starts_at || ad.ends_at) && <div style={adUi.sectionMuted}>
          <ProgressBar starts={ad.starts_at} ends={ad.ends_at} active={ad.active} />
        </div>}

      {/* وصف */}
      {ad.description && <div style={adUi.description}>
          {ad.description}
        </div>}

      {/* معرض الصور */}
      {allImages.length > 1 && <div style={adUi.galleryWrap}>
          <button onClick={() => setShowImages(p => !p)} style={sx.s8(C)}>
            {showImages ? "▲ إخفاء الصور" : `▼ عرض ${allImages.length} صور`}
          </button>
          {showImages && <div style={adUi.galleryRow}>
              {allImages.map((img, i) => <img key={i} src={img} alt="" style={adUi.galleryThumb} onClick={() => window.open(img, "_blank")} />)}
            </div>}
        </div>}

      {/* أزرار */}
      <div style={adUi.actionsRow}>
        <button onClick={() => onEdit(ad)} style={adUi.actionBtn("#F0FDF4", C.primary)}>
          ✏️ تعديل
        </button>
        <button onClick={() => onExtend(ad, 7)} style={adUi.actionBtn("#EFF6FF", "#3B82F6")}>
          +7 أيام
        </button>
        <button onClick={() => onExtend(ad, 30)} style={adUi.actionBtn("#FEF3C7", "#C8952A")}>
          +شهر
        </button>
        <button onClick={() => onCopy(ad)} style={adUi.actionBtn("#F3F4F6", "#6B7280")}>
          📋 نسخ
        </button>
        <button onClick={() => onDelete(ad.id)} style={adUi.actionBtn("#FEF2F2", "#EF4444", false)}>
          🗑
        </button>
      </div>
    </div>;
}
function AdForm({
  ad,
  onSave,
  onClose,
  DC
}) {
  const [form, setForm] = useState({
    title: ad?.title || "",
    category: ad?.category || "",
    city: ad?.city || "",
    phone: ad?.phone || "",
    phone2: ad?.phone2 || "",
    description: ad?.description || "",
    image_url: ad?.image_url || "",
    starts_at: ad?.starts_at?.split("T")[0] || "",
    ends_at: ad?.ends_at?.split("T")[0] || "",
    active: ad?.active ?? true,
    card_size: ad?.card_size || "normal"
  });
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [previewImgs, setPreviewImgs] = useState(Array.isArray(ad?.images) ? ad.images : []);
  const fileRef = useRef();
  const set = (k, v) => setForm(p => ({
    ...p,
    [k]: v
  }));
  async function uploadImg(file) {
    const ext = file.type.split("/")[1] || "jpg";
    const path = `ads/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    return uploadAdImage(file, path);
  }
  async function handleFiles(files) {
    setUploading(true);
    const urls = [];
    for (const f of files) {
      const url = await uploadImg(f);
      if (url) urls.push(url);
    }
    if (!form.image_url && urls[0]) set("image_url", urls[0]);
    setPreviewImgs(p => [...p, ...urls].slice(0, 7));
    setUploading(false);
  }
  async function handleSave() {
    if (!form.title.trim()) {
      alert("العنوان مطلوب");
      return;
    }
    const data = {
      ...form,
      images: previewImgs.filter(u => u !== form.image_url)
    };
    onSave(data);
  }
  const inp = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 9,
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
  const sx = {
    s1: DC => ({
      position: "relative",
      background: DC?.white || "#fff",
      borderRadius: "22px 22px 0 0",
      maxHeight: "90vh",
      display: "flex",
      flexDirection: "column"
    }),
    s2: {
      padding: "16px 20px 12px",
      borderBottom: "1px solid #E5E7EB",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexShrink: 0
    },
    s3: DC => ({
      fontSize: 16,
      fontWeight: 900,
      color: DC?.text || "#1A2E20"
    }),
    s4: {
      width: 32,
      height: 32,
      borderRadius: "50%",
      border: "none",
      background: "#F3F4F6",
      fontSize: 16,
      cursor: "pointer"
    },
    s5: {
      overflowY: "auto",
      padding: "16px 20px 0"
    },
    s6: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 8,
      marginBottom: 0
    },
    s7: inp => ({
      ...inp,
      marginBottom: 10
    }),
    s8: inp => ({
      ...inp,
      height: 70,
      resize: "none",
      paddingTop: 10
    }),
    s9: DC => ({
      fontSize: 12,
      fontWeight: 700,
      color: DC?.text3 || "#8A9E90",
      marginBottom: 6
    }),
    s10: {
      marginBottom: 12
    },
    s11: DC => ({
      fontSize: 12,
      fontWeight: 700,
      color: DC?.text3 || "#8A9E90",
      marginBottom: 6
    }),
    s12: (DC, previewImgs) => ({
      width: "100%",
      padding: "10px",
      borderRadius: 9,
      border: "2px dashed " + (DC?.border || "#DDE8E1"),
      background: "#FAFAFA",
      color: previewImgs.length >= 7 ? "#9CA3AF" : "#6B7280",
      fontSize: 12,
      fontWeight: 700,
      cursor: previewImgs.length >= 7 ? "not-allowed" : "pointer",
      fontFamily: "inherit",
      marginBottom: 8
    }),
    s13: {
      display: "flex",
      gap: 6,
      flexWrap: "wrap"
    },
    s14: DC => ({
      fontSize: 10,
      color: DC?.text3,
      marginTop: 4
    }),
    s15: inp => ({
      ...inp,
      direction: "ltr",
      textAlign: "left",
      marginTop: 6,
      fontSize: 11
    }),
    s16: {
      padding: "12px 20px 32px",
      flexShrink: 0,
      borderTop: "1px solid #E5E7EB",
      display: "flex",
      gap: 10
    },
    s17: C => ({
      flex: 1,
      padding: "13px",
      background: C.primary,
      color: "white",
      border: "none",
      borderRadius: 12,
      fontSize: 14,
      fontWeight: 800,
      cursor: "pointer",
      fontFamily: "inherit"
    }),
    s18: {
      padding: "13px 20px",
      background: "#F3F4F6",
      color: "#374151",
      border: "none",
      borderRadius: 12,
      fontSize: 13,
      fontWeight: 700,
      cursor: "pointer",
      fontFamily: "inherit"
    }
  };
  return <div style={S.fixedBottomSheet999}>
      <div onClick={onClose} style={S.overlay50} />
      <div style={sx.s1(DC)}>
        <div style={sx.s2}>
          <div style={sx.s3(DC)}>{ad?.id ? "✏️ تعديل إعلان" : "📢 إعلان مدفوع جديد"}</div>
          <button onClick={onClose} style={sx.s4}>✕</button>
        </div>
        <div style={sx.s5}>
          <input value={form.title} onChange={e => set("title", e.target.value)} placeholder="اسم الإعلان *" style={inp} />

          <div style={sx.s6}>
            <select value={form.category} onChange={e => set("category", e.target.value)} style={sx.s7(inp)}>
              <option value="">الفئة</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input value={form.city} onChange={e => set("city", e.target.value)} placeholder="المدينة" style={inp} />
            <input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="هاتف 1" style={mergeStyles(inp, S.ltrLeft)} />
            <input value={form.phone2} onChange={e => set("phone2", e.target.value)} placeholder="هاتف 2" style={mergeStyles(inp, S.ltrLeft)} />
            <input type="date" value={form.starts_at} onChange={e => set("starts_at", e.target.value)} style={inp} />
            <input type="date" value={form.ends_at} onChange={e => set("ends_at", e.target.value)} style={inp} />
          </div>

          <textarea value={form.description} onChange={e => set("description", e.target.value)} placeholder="وصف مختصر (اختياري)" style={sx.s8(inp)} />

          {/* حجم البطاقة */}
          <div style={S.mb10}>
            <div style={sx.s9(DC)}>📐 حجم البطاقة</div>
            <div style={S.gap8}>
              {[["normal", "عادي"], ["large", "كبير"], ["banner", "بانر"]].map(([val, label]) => {
              const sx = {
                s1: (form, val, C, DC) => ({
                  flex: 1,
                  padding: "8px",
                  borderRadius: 9,
                  border: `1.5px solid ${form.card_size === val ? C.primary : DC?.border || "#DDE8E1"}`,
                  background: form.card_size === val ? "#E8F4F0" : "white",
                  color: form.card_size === val ? C.primary : "#6B7280",
                  fontSize: 12,
                  fontWeight: form.card_size === val ? 800 : 500,
                  cursor: "pointer",
                  fontFamily: "inherit"
                })
              };
              return <button key={val} onClick={() => set("card_size", val)} style={sx.s1(form, val, C, DC)}>
                  {label}
                </button>;
            })}
            </div>
          </div>

          {/* رفع الصور */}
          <div style={sx.s10}>
            <div style={sx.s11(DC)}>📸 الصور</div>
            <input ref={fileRef} type="file" accept="image/*" multiple style={S.hidden} onChange={e => handleFiles(Array.from(e.target.files))} />
            <button onClick={() => fileRef.current.click()} disabled={uploading || previewImgs.length >= 7} style={sx.s12(DC, previewImgs)}>
              {uploading ? "⏳ جارٍ الرفع..." : previewImgs.length >= 7 ? "⛔ الحد الأقصى 7 صور" : `📁 اختر صور (${previewImgs.length}/7)`}
            </button>

            {/* معاينة الصور */}
            {previewImgs.length > 0 && <div style={sx.s13}>
                {previewImgs.map((img, i) => {
              const sx = {
                s1: {
                  position: "relative"
                },
                s2: (img, form, C) => ({
                  width: 64,
                  height: 56,
                  borderRadius: 8,
                  objectFit: "cover",
                  border: `2px solid ${img === form.image_url ? C.primary : "#E5E7EB"}`,
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
                  background: "rgba(0,0,0,0.5)",
                  border: "none",
                  borderRadius: "50%",
                  width: 14,
                  height: 14,
                  color: "white",
                  fontSize: 9,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }
              };
              return <div key={i} style={sx.s1}>
                    <img src={img} alt="" style={sx.s2(img, form, C)} onClick={() => set("image_url", img)} />
                    {img === form.image_url && <div style={sx.s3(C)}>★</div>}
                    <button onClick={() => {
                  setPreviewImgs(p => p.filter((_, j) => j !== i));
                  if (form.image_url === img) set("image_url", "");
                }} style={sx.s4}>✕</button>
                  </div>;
            })}
              </div>}
            {previewImgs.length > 0 && <div style={sx.s14(DC)}>اضغط على صورة لجعلها الرئيسية ★</div>}

            <input value={form.image_url} onChange={e => set("image_url", e.target.value)} placeholder="أو أدخل رابط صورة مباشرة..." style={sx.s15(inp)} />
          </div>
        </div>

        <div style={sx.s16}>
          <button onClick={handleSave} style={sx.s17(C)}>
            💾 {ad?.id ? "حفظ التعديلات" : "نشر الإعلان"}
          </button>
          <button onClick={onClose} style={sx.s18}>
            إلغاء
          </button>
        </div>
      </div>
    </div>;
}
export default function AdminAds({
  setPage,
  DC,
  user
}) {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [editingAd, setEditingAd] = useState(null);
  const [showCodes, setShowCodes] = useState(false);
  const [codes, setCodes] = useState([]);
  const [genDays, setGenDays] = useState(30);
  const [genSize, setGenSize] = useState("normal");
  const [genLoading, setGenLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const sx = {
    s1: {
      position: "absolute",
      top: 14,
      left: 16,
      zIndex: 2
    },
    s2: {
      padding: "7px 16px",
      borderRadius: 20,
      background: "white",
      border: "none",
      color: "#C8952A",
      fontSize: 12,
      fontWeight: 800,
      cursor: "pointer",
      fontFamily: "inherit"
    },
    s3: {
      fontSize: 12,
      color: "#FDE68A",
      fontWeight: 700,
      marginTop: 4
    },
    s4: DC => ({
      background: DC?.white || "#fff",
      borderRadius: 12,
      border: "1.5px solid " + (DC?.border || "#DDE8E1"),
      marginBottom: 14,
      overflow: "hidden"
    }),
    s5: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "13px 16px",
      cursor: "pointer"
    },
    s6: DC => ({
      fontSize: 13,
      fontWeight: 800,
      color: DC?.text
    }),
    s7: DC => ({
      fontSize: 12,
      color: DC?.text3
    }),
    s8: DC => ({
      borderTop: "1px solid " + (DC?.border || "#DDE8E1"),
      padding: "12px 14px"
    }),
    s9: {
      display: "flex",
      gap: 8,
      marginBottom: 12,
      flexWrap: "wrap"
    },
    s10: DC => ({
      flex: 1,
      padding: "8px",
      borderRadius: 8,
      border: "1.5px solid " + (DC?.border || "#DDE8E1"),
      fontSize: 12,
      fontFamily: "inherit",
      background: DC?.white || "#fff"
    }),
    s11: DC => ({
      flex: 1,
      padding: "8px",
      borderRadius: 8,
      border: "1.5px solid " + (DC?.border || "#DDE8E1"),
      fontSize: 12,
      fontFamily: "inherit",
      background: DC?.white || "#fff"
    }),
    s12: C => ({
      padding: "8px 14px",
      borderRadius: 8,
      border: "none",
      background: C.primary,
      color: "white",
      fontSize: 12,
      fontWeight: 700,
      cursor: "pointer",
      fontFamily: "inherit",
      flexShrink: 0
    }),
    s13: DC => ({
      fontSize: 14,
      fontWeight: 800,
      color: DC?.text
    }),
    s14: {
      marginTop: 16,
      padding: "10px 24px",
      background: "#C8952A",
      color: "white",
      border: "none",
      borderRadius: 12,
      fontSize: 13,
      fontWeight: 700,
      cursor: "pointer",
      fontFamily: "inherit"
    }
  };
  if (user?.role !== "admin" && !(user?.allowedPages || []).includes("adminAds")) return <Navigate to="/admin/dashboard" replace />;
  useEffect(() => {
    load();
  }, []);
  async function loadCodes() {
    const data = await fetchAdCodes();
    setCodes(Array.isArray(data) ? data : []);
  }
  async function generateCode() {
    setGenLoading(true);
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const code = Array.from({
      length: 8
    }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    await createAdCode({
      code,
      duration_days: genDays,
      card_size: genSize
    });
    await loadCodes();
    setGenLoading(false);
  }
  async function deleteCode(id) {
    await deleteAdCode(id);
    setCodes(p => p.filter(c => c.id !== id));
  }
  async function load() {
    setLoading(true);
    const data = await fetchAdminAds();
    setAds(Array.isArray(data) ? data : []);
    setLoading(false);
  }
  async function approveAd(id) {
    const ad = ads.find(a => a.id === id);
    await approveAdWithNotification(ad);
    setAds(p => p.map(a => a.id === id ? {
      ...a,
      status: "approved",
      active: true
    } : a));
  }
  async function rejectAd(id) {
    const ad = ads.find(a => a.id === id);
    const reason = window.prompt("سبب الرفض:");
    if (reason === null) return;
    await rejectAdWithNotification(ad, reason);
    setAds(p => p.map(a => a.id === id ? {
      ...a,
      status: "rejected",
      active: false,
      rejection_reason: reason
    } : a));
  }
  async function saveAd(data) {
    const isEdit = !!editingAd?.id;
    const payload = {
      title: data.title,
      description: data.description,
      category: data.category,
      city: data.city,
      phone: data.phone,
      phone2: data.phone2,
      image_url: data.image_url,
      images: data.images,
      starts_at: data.starts_at || null,
      ends_at: data.ends_at || null,
      active: data.active,
      card_size: data.card_size || "normal"
    };
    if (isEdit) {
      await saveAdminAd(payload, editingAd.id);
      setAds(p => p.map(a => a.id === editingAd.id ? {
        ...a,
        ...payload
      } : a));
    } else {
      const newAd = await saveAdminAd(payload, null);
      if (newAd?.id) setAds(p => [newAd, ...p]);
    }
    setShowForm(false);
    setEditingAd(null);
  }
  async function deleteAd(id) {
    if (!window.confirm("حذف هذا الإعلان؟")) return;
    await deleteAdminAd(id);
    setAds(p => p.filter(a => a.id !== id));
  }
  async function toggleAd(ad) {
    const newActive = !ad.active;
    await updateAdminAd(ad.id, {
      active: newActive
    });
    setAds(p => p.map(a => a.id === ad.id ? {
      ...a,
      active: newActive
    } : a));
  }
  async function extendAd(ad, days) {
    const base = ad.ends_at ? new Date(ad.ends_at) : new Date();
    if (base < new Date()) base.setTime(Date.now());
    base.setDate(base.getDate() + days);
    const newEnds = base.toISOString().split("T")[0];
    await updateAdminAd(ad.id, {
      ends_at: newEnds,
      active: true
    });
    setAds(p => p.map(a => a.id === ad.id ? {
      ...a,
      ends_at: newEnds,
      active: true
    } : a));
  }
  function copyAd(ad) {
    setEditingAd({
      ...ad,
      id: null,
      title: ad.title + " (نسخة)",
      active: true,
      views: 0
    });
    setShowForm(true);
  }
  const filtered = ads.filter(a => {
    const left = daysLeft(a.ends_at);
    if (filter === "active") return a.active && (left === null || left > 0);
    if (filter === "expired") return left !== null && left <= 0;
    if (filter === "inactive") return !a.active;
    return true;
  });
  const activeCount = ads.filter(a => a.active && (daysLeft(a.ends_at) === null || daysLeft(a.ends_at) > 0)).length;
  const expiredCount = ads.filter(a => daysLeft(a.ends_at) !== null && daysLeft(a.ends_at) <= 0).length;
  const totalViews = ads.reduce((s, a) => s + (a.views || 0), 0);
  return <div style={S.pageShell(DC)}>
      <div style={S.primaryHero("#C8952A")}>
        <IslamicPattern opacity={0.1} color="#FFFFFF" width={430} height={200} />
        <div style={S.absTopRight14}>
          <BackButton onPress={() => setPage("adminDashboard")} />
        </div>
        <div style={sx.s1}>
          <button onClick={() => {
          setEditingAd(null);
          setShowForm(true);
        }} style={sx.s2}>
            + إضافة
          </button>
        </div>
        <div style={S.relZ1}>
          <div style={S.title20White}>📢 الإعلانات المدفوعة</div>
          {ads.filter(a => a.status === "pending").length > 0 && <div style={sx.s3}>
              ⏳ {ads.filter(a => a.status === "pending").length} طلب جديد ينتظر المراجعة
            </div>}
          <div style={S.heroStatsRow}>
            <span style={S.whiteStrong12}>🟢 {activeCount} نشط</span>
            <span style={S.whiteStrong12}>⚠️ {expiredCount} منتهي</span>
            <span style={S.whiteStrong12}>👁 {totalViews.toLocaleString()} مشاهدة</span>
          </div>
        </div>
        <Wave />
      </div>

      <div style={S.pad14Bottom80}>

        {/* قسم الأكواد */}
        <div style={sx.s4(DC)}>
          <div onClick={() => {
          setShowCodes(p => !p);
          if (!showCodes) loadCodes();
        }} style={sx.s5}>
            <span style={sx.s6(DC)}>🔑 أكواد الدفع</span>
            <span style={sx.s7(DC)}>{showCodes ? "▲" : "▼"}</span>
          </div>
          {showCodes && <div style={sx.s8(DC)}>
              {/* توليد كود */}
              <div style={sx.s9}>
                <select value={genDays} onChange={e => setGenDays(Number(e.target.value))} style={sx.s10(DC)}>
                  {[7, 14, 30, 60, 90].map(d => <option key={d} value={d}>{d} يوم</option>)}
                </select>
                <select value={genSize} onChange={e => setGenSize(e.target.value)} style={sx.s11(DC)}>
                  <option value="normal">عادي</option>
                  <option value="large">كبير</option>
                  <option value="card">بانر</option>
                </select>
                <button onClick={generateCode} disabled={genLoading} style={sx.s12(C)}>
                  {genLoading ? "⏳" : "+ توليد كود"}
                </button>
              </div>
              {/* قائمة الأكواد */}
              {codes.length === 0 ? <div style={S.text12LightCentered}>لا توجد أكواد</div> : codes.map(c => {
            const sx = {
              s1: c => ({
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 10px",
                borderRadius: 8,
                background: c.used ? "#F9FAFB" : "#F0FDF4",
                border: "1px solid " + (c.used ? "#E5E7EB" : "#BBF7D0"),
                marginBottom: 6
              }),
              s2: c => ({
                fontFamily: "monospace",
                fontSize: 14,
                fontWeight: 900,
                letterSpacing: 2,
                color: c.used ? "#9CA3AF" : "#16A34A",
                flex: 1
              }),
              s3: {
                fontSize: 10,
                color: "#6B7280"
              },
              s4: {
                display: "flex",
                alignItems: "center",
                gap: 4
              },
              s5: {
                fontSize: 10,
                color: "#EF4444",
                fontWeight: 700
              },
              s6: {
                padding: "3px 7px",
                borderRadius: 6,
                border: "none",
                background: "#FEF2F2",
                color: "#EF4444",
                fontSize: 11,
                cursor: "pointer",
                fontFamily: "inherit"
              },
              s7: C => ({
                padding: "4px 8px",
                borderRadius: 6,
                border: "none",
                background: "#E8F4F0",
                color: C.primary,
                fontSize: 11,
                cursor: "pointer",
                fontFamily: "inherit",
                fontWeight: 700
              }),
              s8: {
                padding: "4px 8px",
                borderRadius: 6,
                border: "none",
                background: "#FEF2F2",
                color: "#EF4444",
                fontSize: 11,
                cursor: "pointer",
                fontFamily: "inherit"
              }
            };
            return <div key={c.id} style={sx.s1(c)}>
                  <span style={sx.s2(c)}>{c.code}</span>
                  <span style={sx.s3}>{c.duration_days} يوم · {c.card_size === "normal" ? "عادي" : c.card_size === "large" ? "كبير" : "بانر"}</span>
                  {c.used ? <span style={sx.s4}>
                        <span style={sx.s5}>✓ مستخدم</span>
                        <button onClick={() => deleteCode(c.id)} style={sx.s6}>🗑</button>
                      </span> : <>
                        <button onClick={() => navigator.clipboard?.writeText(c.code)} style={sx.s7(C)}>نسخ</button>
                        <button onClick={() => deleteCode(c.id)} style={sx.s8}>🗑</button>
                      </>}
                </div>;
          })}
            </div>}
        </div>

        {/* فلتر */}
        <div style={S.flexGap6Mb12}>
          {[["all", "الكل"], ["active", "نشط"], ["expired", "منتهي"], ["inactive", "موقوف"]].map(([v, l]) => {
          const sx = {
            s1: (filter, v, DC) => ({
              flex: 1,
              padding: "8px",
              borderRadius: 9,
              border: "1.5px solid " + (filter === v ? "#C8952A" : DC?.border || "#DDE8E1"),
              background: filter === v ? "#FEF3C7" : DC?.white || "#fff",
              color: filter === v ? "#92400E" : DC?.text || "#1A2E20",
              fontSize: 11,
              fontWeight: 800,
              cursor: "pointer",
              fontFamily: "inherit"
            })
          };
          return <button key={v} onClick={() => setFilter(v)} style={sx.s1(filter, v, DC)}>
              {l}
            </button>;
        })}
        </div>

        {loading ? <div style={S.emptyStateCentered}>⏳</div> : filtered.length === 0 ? <div style={S.emptyStateCentered}>
              <div style={S.font40}>📢</div>
              <div style={sx.s13(DC)}>لا توجد إعلانات</div>
              <button onClick={() => {
          setEditingAd(null);
          setShowForm(true);
        }} style={sx.s14}>
                + إضافة إعلان مدفوع
              </button>
            </div> : filtered.map(ad => <AdCard key={ad.id} ad={ad} DC={DC} onEdit={a => {
        setEditingAd(a);
        setShowForm(true);
      }} onDelete={deleteAd} onToggle={toggleAd} onExtend={extendAd} onCopy={copyAd} onApprove={approveAd} onReject={rejectAd} />)}
      </div>

      {showForm && <AdForm ad={editingAd} DC={DC} onSave={saveAd} onClose={() => {
      setShowForm(false);
      setEditingAd(null);
    }} />}
    </div>;
}