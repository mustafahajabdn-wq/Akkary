import { statCardStyles, smallStatStyles, storageUsageGraphicStyles } from "../../shared/styles/adminDashboardStyles.js";
import { Navigate } from "react-router-dom";
import { BackButton } from "../../shared/components/common/BackButton.jsx";
import React, { useEffect, useMemo, useState } from "react";
import { getAdminDashboardStats } from "../services/adminService.js";
import { C } from "../../shared/constants/colors.js";
import { IslamicPattern } from "../../shared/components/icons.jsx";
import { clearAllRuntimeCache, clearDetailCacheAll, clearImageCaches, clearListingsCache, formatBytes, getCacheDiagnostics, inspectListingOffline } from "../../shared/utils/cache.js";
import { S } from "../../shared/styles/primitives.js";
function StatCard({
  icon,
  label,
  value,
  color,
  bg,
  onClick
}) {
  const sx = statCardStyles;
  return <div onClick={onClick} style={sx.s1(bg, onClick, color)}>
      <div style={sx.s2}>{icon}</div>
      <div style={sx.s3(color)}>
        {value ?? <span style={sx.s4}>—</span>}
      </div>
      <div style={sx.s5(color)}>{label}</div>
    </div>;
}
function SmallStat({
  label,
  value,
  color = "#0F172A",
  hint = ""
}) {
  const sx = smallStatStyles;
  return <div style={S.softCard12Pad10x12}>
      <div style={sx.s1}>{label}</div>
      <div style={sx.s2(color)}>{value}</div>
      {hint ? <div style={sx.s3}>{hint}</div> : null}
    </div>;
}
function StorageUsageGraphic({
  usage = 0,
  quota = 0
}) {
  const safeUsage = Number(usage || 0);
  const safeQuota = Number(quota || 0);
  const percent = safeQuota > 0 ? Math.max(0, Math.min(100, Math.round(safeUsage / safeQuota * 100))) : 0;
  const remaining = Math.max(0, safeQuota - safeUsage);
  const tone = percent >= 85 ? {
    bar: "#DC2626",
    soft: "#FEF2F2",
    text: "#991B1B",
    border: "#FECACA"
  } : percent >= 65 ? {
    bar: "#EA580C",
    soft: "#FFF7ED",
    text: "#9A3412",
    border: "#FED7AA"
  } : {
    bar: "#0891B2",
    soft: "#F0F9FF",
    text: "#0C4A6E",
    border: "#BAE6FD"
  };
  const sx = storageUsageGraphicStyles;
  return <div style={sx.s1(tone)}>
      <div style={S.rowBetweenGap10Mb8}>
        <div>
          <div style={sx.s2}>استخدام التخزين التقريبي</div>
          <div style={S.text10SlateStrongMt3}>قراءة تقريبية من المتصفح للمساحة المستخدمة والمسموحة للموقع</div>
        </div>
        <div style={sx.s3(tone)}>
          {percent}%
        </div>
      </div>

      <div style={sx.s4}>
        <div style={sx.s5(percent, tone)} />
      </div>

      <div style={sx.s6}>
        <div style={S.softCard12Pad9}>
          <div style={S.text10SlateStrongMb2}>المستخدم</div>
          <div style={S.text13DarkBold}>{formatBytes(safeUsage)}</div>
        </div>
        <div style={S.softCard12Pad9}>
          <div style={S.text10SlateStrongMb2}>المتاح</div>
          <div style={S.text13DarkBold}>{safeQuota ? formatBytes(remaining) : "—"}</div>
        </div>
        <div style={S.softCard12Pad9}>
          <div style={S.text10SlateStrongMb2}>الإجمالي</div>
          <div style={S.text13DarkBold}>{safeQuota ? formatBytes(safeQuota) : "—"}</div>
        </div>
      </div>
    </div>;
}
function TinyBadge({
  label,
  tone = "default"
}) {
  const map = {
    default: {
      bg: "#F1F5F9",
      color: "#475569",
      border: "#E2E8F0"
    },
    success: {
      bg: "#ECFDF5",
      color: "#15803D",
      border: "#BBF7D0"
    },
    info: {
      bg: "#EFF6FF",
      color: "#1D4ED8",
      border: "#BFDBFE"
    },
    warn: {
      bg: "#FFF7ED",
      color: "#C2410C",
      border: "#FED7AA"
    }
  };
  const t = map[tone] || map.default;
  const sx = {
    s1: t => ({
      display: "inline-flex",
      alignItems: "center",
      padding: "3px 7px",
      borderRadius: 999,
      fontSize: 9,
      fontWeight: 800,
      background: t.bg,
      color: t.color,
      border: `1px solid ${t.border}`
    })
  };
  return <span style={sx.s1(t)}>
      {label}
    </span>;
}
function isLikelyImageUrl(url = "") {
  const value = String(url || "").toLowerCase();
  if (!value) return false;
  return /\.(png|jpe?g|webp|gif|svg|bmp|avif)(\?|$)/i.test(value) || /tile\.openstreetmap\.org/i.test(value) || /\/marker-icon/i.test(value) || /listing-images\//i.test(value);
}
function getSampleKind(url = "") {
  const value = String(url || "").toLowerCase();
  if (isLikelyImageUrl(value)) return "image";
  if (/\.html?(\?|$)/i.test(value)) return "html";
  if (/\.(js|mjs)(\?|$)/i.test(value)) return "js";
  if (/\.css(\?|$)/i.test(value)) return "css";
  if (/\.json(\?|$)/i.test(value)) return "json";
  if (/\.woff2?(\?|$)|\.ttf(\?|$)|\.otf(\?|$)/i.test(value)) return "font";
  return "file";
}
function getSampleLabel(url = "") {
  const kind = getSampleKind(url);
  if (kind === "image") return /tile\.openstreetmap\.org/i.test(url) ? "بلاطة" : "صورة";
  if (kind === "html") return "HTML";
  if (kind === "js") return "JS";
  if (kind === "css") return "CSS";
  if (kind === "json") return "JSON";
  if (kind === "font") return "FONT";
  return "FILE";
}
function getSampleTone(url = "") {
  const kind = getSampleKind(url);
  if (kind === "image") return {
    bg: "#ECFEFF",
    fg: "#0F766E",
    border: "#A5F3FC"
  };
  if (kind === "html") return {
    bg: "#FFF7ED",
    fg: "#C2410C",
    border: "#FED7AA"
  };
  if (kind === "js") return {
    bg: "#FEFCE8",
    fg: "#A16207",
    border: "#FDE68A"
  };
  if (kind === "css") return {
    bg: "#EFF6FF",
    fg: "#1D4ED8",
    border: "#BFDBFE"
  };
  if (kind === "json") return {
    bg: "#F5F3FF",
    fg: "#6D28D9",
    border: "#DDD6FE"
  };
  if (kind === "font") return {
    bg: "#F8FAFC",
    fg: "#475569",
    border: "#CBD5E1"
  };
  return {
    bg: "#F8FAFC",
    fg: "#475569",
    border: "#CBD5E1"
  };
}
function shortenUrl(url = "") {
  const value = String(url || "");
  if (!value) return "";
  try {
    const parsed = new URL(value);
    return `${parsed.hostname}${parsed.pathname}`;
  } catch {
    return value;
  }
}
function getSampleTitle(url = "") {
  const value = String(url || "");
  if (!value) return "";
  try {
    const parsed = new URL(value);
    const parts = parsed.pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] || parsed.hostname;
  } catch {
    const parts = value.split("/").filter(Boolean);
    return parts[parts.length - 1] || value;
  }
}
function CacheSamplePreview({
  url,
  size = 68,
  rounded = 12
}) {
  const isImage = isLikelyImageUrl(url);
  const tone = getSampleTone(url);
  const sx = {
    s1: (size, rounded, tone, isImage) => ({
      width: size,
      minWidth: size,
      height: size,
      borderRadius: rounded,
      overflow: "hidden",
      border: `1px solid ${tone.border}`,
      background: isImage ? "#E2E8F0" : tone.bg,
      position: "relative",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }),
    s2: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      display: "block"
    },
    s3: tone => ({
      padding: 6,
      textAlign: "center",
      color: tone.fg,
      lineHeight: 1.15
    }),
    s4: {
      fontSize: 10,
      fontWeight: 900,
      marginBottom: 4
    },
    s5: {
      fontSize: 8,
      fontWeight: 700,
      overflow: "hidden",
      display: "-webkit-box",
      WebkitLineClamp: 3,
      WebkitBoxOrient: "vertical"
    }
  };
  return <div style={sx.s1(size, rounded, tone, isImage)}>
      {isImage ? <img src={url} alt="preview" loading="lazy" referrerPolicy="no-referrer" style={sx.s2} /> : <div style={sx.s3(tone)}>
          <div style={sx.s4}>{getSampleLabel(url)}</div>
          <div style={sx.s5}>{getSampleTitle(url)}</div>
        </div>}
    </div>;
}
function SampleRow({
  url,
  statusText = "",
  statusColor = "#475569",
  thumbnailSize = 54
}) {
  const sx = {
    s1: {
      display: "flex",
      gap: 10,
      alignItems: "center"
    },
    s2: {
      minWidth: 0,
      flex: 1
    },
    s3: statusColor => ({
      fontSize: 10,
      fontWeight: 800,
      color: statusColor,
      marginBottom: 2
    }),
    s4: {
      fontSize: 9,
      color: "#334155",
      fontWeight: 700,
      marginBottom: 2,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    },
    s5: {
      fontSize: 8,
      color: "#94A3B8",
      direction: "ltr",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  };
  return <div style={sx.s1}>
      <CacheSamplePreview url={url} size={thumbnailSize} rounded={10} />
      <div style={sx.s2}>
        {statusText ? <div style={sx.s3(statusColor)}>{statusText}</div> : null}
        <div style={sx.s4}>{getSampleTitle(url)}</div>
        <div style={sx.s5}>{shortenUrl(url)}</div>
      </div>
    </div>;
}
function CacheGallery({
  urls = [],
  compact = false
}) {
  const samples = Array.isArray(urls) ? urls.filter(Boolean) : [];
  const sx = {
    s1: compact => ({
      display: "grid",
      gridTemplateColumns: compact ? "repeat(3, minmax(0, 1fr))" : "repeat(auto-fill, minmax(96px, 1fr))",
      gap: 8
    })
  };
  if (!samples.length) return null;
  return <div style={sx.s1(compact)}>
      {samples.map(url => {
      const sx = {
        s1: {
          minWidth: 0
        },
        s2: {
          fontSize: 8,
          color: "#64748B",
          fontWeight: 700,
          marginTop: 4,
          direction: "ltr",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis"
        }
      };
      return <div key={url} style={sx.s1}>
          <CacheSamplePreview url={url} size={compact ? 74 : 92} rounded={12} />
          <div style={sx.s2}>{getSampleTitle(url)}</div>
        </div>;
    })}
    </div>;
}
function ActionButton({
  label,
  onClick,
  tone = "default",
  disabled = false
}) {
  const map = {
    default: {
      bg: "#FFFFFF",
      border: "#DDE8E1",
      color: "#1A2E20"
    },
    warn: {
      bg: "#FFF7ED",
      border: "#FED7AA",
      color: "#C2410C"
    },
    danger: {
      bg: "#FEF2F2",
      border: "#FECACA",
      color: "#B91C1C"
    },
    primary: {
      bg: "#E8F4F0",
      border: "#B7D6C6",
      color: C.primary
    }
  };
  const t = map[tone] || map.default;
  const sx = {
    s1: (t, disabled) => ({
      border: `1px solid ${t.border}`,
      background: disabled ? "#F8FAFC" : t.bg,
      color: disabled ? "#94A3B8" : t.color,
      borderRadius: 12,
      padding: "10px 12px",
      fontFamily: "inherit",
      fontWeight: 800,
      fontSize: 12,
      cursor: disabled ? "not-allowed" : "pointer"
    })
  };
  return <button onClick={onClick} disabled={disabled} style={sx.s1(t, disabled)}>
      {label}
    </button>;
}
function formatAge(ageMs) {
  const age = Number(ageMs);
  if (!Number.isFinite(age) || age <= 0) return "الآن";
  const minutes = Math.floor(age / 60000);
  if (minutes < 1) return "أقل من دقيقة";
  if (minutes < 60) return `${minutes} د`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} س`;
  const days = Math.floor(hours / 24);
  return `${days} يوم`;
}
function formatDate(ts) {
  const value = Number(ts || 0);
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("ar-SY", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return "—";
  }
}
export default function AdminDashboard({
  setPage,
  DC,
  user
}) {
  const sx = {
    s1: C => ({
      background: `linear-gradient(135deg, ${C.primary} 0%, #0F2A18 100%)`,
      padding: "52px 20px 32px",
      position: "relative",
      overflow: "hidden"
    }),
    s2: {
      position: "absolute",
      top: 16,
      right: 16,
      zIndex: 2
    },
    s3: {
      padding: "16px",
      paddingBottom: 90
    },
    s4: {
      fontSize: 32,
      marginBottom: 8
    },
    s5: DC => ({
      fontSize: 13,
      color: DC?.text3
    }),
    s6: {
      display: "flex",
      gap: 8,
      marginBottom: 14
    },
    s7: {
      flex: 1,
      background: "#FEF3C7",
      borderRadius: 12,
      padding: "12px 14px",
      cursor: "pointer",
      border: "1px solid #FDE68A",
      display: "flex",
      alignItems: "center",
      gap: 8
    },
    s8: {
      fontSize: 18,
      fontWeight: 900,
      color: "#C8952A"
    },
    s9: {
      fontSize: 10,
      color: "#92400E",
      fontWeight: 700
    },
    s10: {
      flex: 1,
      background: "#FEF2F2",
      borderRadius: 12,
      padding: "12px 14px",
      cursor: "pointer",
      border: "1px solid #FECACA",
      display: "flex",
      alignItems: "center",
      gap: 8
    },
    s11: {
      fontSize: 18,
      fontWeight: 900,
      color: "#EF4444"
    },
    s12: {
      fontSize: 10,
      color: "#991B1B",
      fontWeight: 700
    },
    s13: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 8,
      marginBottom: 14
    },
    s14: DC => ({
      background: DC?.white || "#fff",
      borderRadius: 12,
      border: `1.5px solid ${DC?.border || "#DDE8E1"}`,
      padding: "12px 14px",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: 10
    }),
    s15: DC => ({
      fontSize: 12,
      fontWeight: 800,
      color: DC?.text || "#1A2E20"
    }),
    s16: DC => ({
      fontSize: 10,
      color: DC?.text3
    }),
    s17: {
      background: "#1A1A2E",
      borderRadius: 12,
      border: "1.5px solid #6366F1",
      padding: "12px 14px",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: 10
    },
    s18: {
      fontSize: 12,
      fontWeight: 800,
      color: "white"
    },
    s19: {
      fontSize: 10,
      color: "rgba(255,255,255,0.5)"
    },
    s20: DC => ({
      background: DC?.white || "#fff",
      borderRadius: 14,
      border: `1px solid ${DC?.border || "#DDE8E1"}`,
      overflow: "hidden",
      marginBottom: 14
    }),
    s21: DC => ({
      padding: "12px 16px",
      borderBottom: `1px solid ${DC?.border || "#DDE8E1"}`
    }),
    s22: DC => ({
      fontSize: 11,
      fontWeight: 800,
      color: DC?.text3,
      letterSpacing: 0.5
    }),
    s23: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
      gap: 0
    },
    s24: DC => ({
      background: DC?.white || "#fff",
      borderRadius: 16,
      border: `1px solid ${DC?.border || "#DDE8E1"}`,
      overflow: "hidden",
      marginBottom: 14
    }),
    s25: DC => ({
      padding: "14px 16px",
      borderBottom: `1px solid ${DC?.border || "#DDE8E1"}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12
    }),
    s26: DC => ({
      fontSize: 13,
      fontWeight: 900,
      color: DC?.text || "#1A2E20"
    }),
    s27: DC => ({
      fontSize: 10,
      color: DC?.text3,
      marginTop: 3
    }),
    s28: {
      padding: 14
    },
    s29: {
      marginBottom: 12,
      padding: "10px 12px",
      borderRadius: 12,
      background: "#FEF2F2",
      color: "#B91C1C",
      border: "1px solid #FECACA",
      fontSize: 12,
      fontWeight: 700
    },
    s30: DC => ({
      textAlign: "center",
      padding: "30px 0",
      color: DC?.text3,
      fontSize: 13
    }),
    s31: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 10,
      marginBottom: 10
    },
    s32: {
      background: "#F8FAFC",
      border: "1px solid #E2E8F0",
      borderRadius: 14,
      padding: 12,
      marginBottom: 10
    },
    s33: {
      background: "#F8FAFC",
      border: "1px solid #DDE8E1",
      borderRadius: 12,
      padding: 10,
      marginBottom: 10
    },
    s34: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8
    },
    s35: {
      fontSize: 11,
      fontWeight: 800,
      color: "#1A2E20"
    },
    s36: {
      background: "none",
      border: "none",
      fontSize: 14,
      cursor: "pointer",
      color: "#9CA3AF"
    },
    s37: {
      display: "grid",
      gridTemplateColumns: "repeat(4,1fr)",
      gap: 4
    },
    s38: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      background: "#F8FAFC",
      border: "1px solid #DDE8E1",
      borderRadius: 12,
      padding: "10px 14px",
      marginBottom: 10
    },
    s39: {
      fontSize: 12,
      fontWeight: 800,
      color: "#1A2E20"
    },
    s40: {
      fontSize: 11,
      color: "#9CA3AF",
      marginTop: 2
    },
    s41: warmEnabled => ({
      width: 44,
      height: 24,
      borderRadius: 12,
      cursor: "pointer",
      background: warmEnabled ? "#1A2E20" : "#D1D5DB",
      position: "relative",
      transition: "background 0.2s",
      flexShrink: 0
    }),
    s42: warmEnabled => ({
      position: "absolute",
      top: 2,
      width: 20,
      height: 20,
      borderRadius: "50%",
      background: "white",
      boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      transition: "right 0.2s",
      right: warmEnabled ? 2 : 22
    }),
    s43: DC => ({
      fontSize: 12,
      fontWeight: 900,
      color: DC?.text || "#1A2E20",
      marginBottom: 8
    }),
    s44: {
      display: "flex",
      gap: 8,
      marginBottom: 10
    },
    s45: {
      flex: 1,
      borderRadius: 12,
      border: "1px solid #DDE8E1",
      padding: "11px 12px",
      fontFamily: "inherit",
      fontSize: 13,
      outline: "none",
      direction: "ltr"
    },
    s46: {
      fontSize: 12,
      fontWeight: 900,
      color: "#0F172A",
      marginBottom: 6
    },
    s47: {
      maxHeight: 240,
      overflow: "auto",
      borderTop: "1px solid #E2E8F0",
      paddingTop: 8,
      display: "grid",
      gap: 8
    },
    s48: DC => ({
      fontSize: 12,
      fontWeight: 900,
      color: DC?.text || "#1A2E20"
    }),
    s49: {
      marginBottom: 10,
      padding: "10px 12px",
      borderRadius: 12,
      background: "#F8FAFC",
      border: "1px solid #E2E8F0",
      fontSize: 10,
      color: "#64748B",
      fontWeight: 700
    },
    s50: {
      display: "grid",
      gap: 8,
      marginBottom: 10
    },
    s51: {
      display: "grid",
      gridTemplateColumns: "1fr",
      gap: 8
    },
    s52: {
      background: "#F8FAFC",
      border: "1px solid #E2E8F0",
      borderRadius: 14,
      padding: 12
    },
    s53: DC => ({
      fontSize: 12,
      fontWeight: 900,
      color: DC?.text || "#1A2E20",
      marginBottom: 8
    })
  };
  if (!["admin", "moderator", "support", "level1", "level2"].includes(user?.role) && !(user?.allowedPages || []).includes("adminDashboard")) return <Navigate to="/profile" replace />;
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cacheReport, setCacheReport] = useState(null);
  const [cacheLoading, setCacheLoading] = useState(true);
  const [cacheBusy, setCacheBusy] = useState(false);
  const [imgCacheUrls, setImgCacheUrls] = useState([]);
  const [imgCacheLoading, setImgCacheLoading] = useState(false);
  const [showImgCache, setShowImgCache] = useState(false);
  const [warmEnabled, setWarmEnabled] = useState(() => {
    try {
      return localStorage.getItem("warm_images_enabled") !== "0";
    } catch {
      return true;
    }
  });
  const [cacheError, setCacheError] = useState("");
  const [listingProbeId, setListingProbeId] = useState("");
  const [listingProbe, setListingProbe] = useState(null);
  const imageCaches = useMemo(() => {
    const caches = Array.isArray(cacheReport?.cacheStorage?.caches) ? cacheReport.cacheStorage.caches : [];
    return caches.filter(item => /image|supabase|detail-images/i.test(item?.name || ""));
  }, [cacheReport]);
  const mapRelatedCaches = useMemo(() => Array.isArray(cacheReport?.maps?.relatedCaches) ? cacheReport.maps.relatedCaches : [], [cacheReport]);
  const imageRequestCount = imageCaches.reduce((sum, item) => sum + Number(item.requestCount || 0), 0);
  const mapTileCount = Number(cacheReport?.maps?.tileCount || 0);
  const leafletAssetCount = Number(cacheReport?.maps?.leafletAssetCount || 0);
  const leafletCached = !!cacheReport?.maps?.leafletCached;
  async function loadCacheReport() {
    setCacheLoading(true);
    setCacheError("");
    try {
      const report = await getCacheDiagnostics();
      setCacheReport(report);
    } catch (err) {
      setCacheError(err?.message || "تعذر قراءة حالة الكاش");
    } finally {
      setCacheLoading(false);
    }
  }
  useEffect(() => {
    async function load() {
      const nextStats = await getAdminDashboardStats();
      setStats(nextStats);
      setLoading(false);
    }
    load();
    loadCacheReport();
  }, []);
  async function handleProbeListing() {
    const id = String(listingProbeId || "").trim();
    if (!id) {
      setListingProbe(null);
      return;
    }
    setCacheBusy(true);
    try {
      const result = await inspectListingOffline(id);
      setListingProbe(result);
    } finally {
      setCacheBusy(false);
    }
  }
  async function loadImgCache() {
    if (!("caches" in window)) return;
    setImgCacheLoading(true);
    try {
      const cache = await window.caches.open("supabase-images");
      const keys = await cache.keys();
      const urls = keys.map(r => r.url).filter(u => /\.(jpg|jpeg|png|webp|gif)/i.test(u));
      setImgCacheUrls(urls);
      setShowImgCache(true);
    } catch {}
    setImgCacheLoading(false);
  }
  async function handleClear(kind) {
    setCacheBusy(true);
    setCacheError("");
    try {
      if (kind === "listings") clearListingsCache();else if (kind === "details") clearDetailCacheAll();else if (kind === "images") await clearImageCaches();else if (kind === "reports") {
        Object.keys(localStorage).filter(k => k.startsWith("report_sent:")).forEach(k => localStorage.removeItem(k));
      } else if (kind === "all") await clearAllRuntimeCache();
      if (kind === "details" || kind === "all") setListingProbe(null);
      await loadCacheReport();
      if (listingProbeId) {
        const result = await inspectListingOffline(listingProbeId);
        setListingProbe(result);
      }
    } catch (err) {
      setCacheError(err?.message || "تعذر تنفيذ عملية الكاش");
    } finally {
      setCacheBusy(false);
    }
  }
  return <div style={S.pageShell(DC)}>
      <div style={sx.s1(C)}>
        <IslamicPattern opacity={0.08} color="#FFFFFF" width={430} height={220} />
        <div style={sx.s2}>
          <BackButton onPress={() => setPage("profile")} />
        </div>
        <div style={S.relZ1}>
          <div style={S.heroEyebrow}>لوحة الإدارة</div>
          <div style={S.text22WhiteBoldMb2}>مرحباً، {user?.name?.split(" ")[0]} 👋</div>
          <div style={S.heroDate}>
            {new Date().toLocaleDateString("ar-SY", {
            weekday: "long",
            day: "numeric",
            month: "long"
          })}
          </div>
        </div>
      </div>

      <div style={sx.s3}>
        {loading ? <div style={S.loadingCentered60}>
            <div style={sx.s4}>⏳</div>
            <div style={sx.s5(DC)}>جارٍ تحميل الإحصائيات...</div>
          </div> : <>
            {(stats?.pending > 0 || stats?.reports > 0) && <div style={sx.s6}>
                {stats?.pending > 0 && <div onClick={() => setPage("pending")} style={sx.s7}>
                    <span style={S.icon18}>⏳</span>
                    <div>
                      <div style={sx.s8}>{stats.pending}</div>
                      <div style={sx.s9}>قيد المراجعة</div>
                    </div>
                  </div>}
                {stats?.reports > 0 && <div onClick={() => setPage("adminReports")} style={sx.s10}>
                    <span style={S.icon18}>🚩</span>
                    <div>
                      <div style={sx.s11}>{stats.reports}</div>
                      <div style={sx.s12}>بلاغ</div>
                    </div>
                  </div>}
              </div>}

            <div style={S.grid2Gap10Mb14}>
              <StatCard icon="🏠" label="إعلانات نشطة" value={stats?.listings} color={C.primary} bg="#E8F4F0" onClick={() => setPage("adminListings")} />
              <StatCard icon="👥" label="المستخدمون" value={stats?.users} color="#7C3AED" bg="#EDE9FE" onClick={() => setPage("adminUsers")} />
            </div>

            {user?.role === "admin" && <div style={sx.s13}>
              <div onClick={() => setPage("adminPropertyFields")} style={sx.s14(DC)}>
                <span style={S.icon24}>🏗️</span>
                <div>
                  <div style={sx.s15(DC)}>خصائص العقار</div>
                  <div style={sx.s16(DC)}>إدارة الحقول</div>
                </div>
              </div>
              <div onClick={() => setPage("adminSQL")} style={sx.s17}>
                <span style={S.icon24}>🖥️</span>
                <div>
                  <div style={sx.s18}>محرر SQL</div>
                  <div style={sx.s19}>استعلامات مباشرة</div>
                </div>
              </div>
            </div>}

            <div style={sx.s20(DC)}>
              <div style={sx.s21(DC)}>
                <div style={sx.s22(DC)}>📈 النشاط</div>
              </div>
              <div style={sx.s23}>
                {[{
              label: "إعلانات اليوم",
              value: stats?.todayListings,
              color: "#0891B2"
            }, {
              label: "إعلانات الأسبوع",
              value: stats?.weekListings,
              color: "#7C3AED"
            }, {
              label: "مستخدمون اليوم",
              value: stats?.todayUsers,
              color: "#16A34A"
            }].map((s, i) => {
              const sx = {
                s1: (i, DC) => ({
                  padding: "14px 10px",
                  textAlign: "center",
                  borderLeft: i > 0 ? `1px solid ${DC?.border || "#DDE8E1"}` : "none"
                }),
                s2: s => ({
                  fontSize: 22,
                  fontWeight: 900,
                  color: s.color
                }),
                s3: DC => ({
                  fontSize: 10,
                  color: DC?.text3,
                  fontWeight: 700,
                  marginTop: 3
                })
              };
              return <div key={i} style={sx.s1(i, DC)}>
                    <div style={sx.s2(s)}>{s.value ?? 0}</div>
                    <div style={sx.s3(DC)}>{s.label}</div>
                  </div>;
            })}
              </div>
            </div>

            <div style={sx.s24(DC)}>
              <div style={sx.s25(DC)}>
                <div>
                  <div style={sx.s26(DC)}>تشخيص الكاش</div>
                  <div style={sx.s27(DC)}>مراقبة التخزين المحلي وكاش الصور والأوفلاين</div>
                </div>
                <ActionButton label={cacheLoading ? "جارٍ الفحص..." : "تحديث الفحص"} onClick={loadCacheReport} tone="primary" disabled={cacheLoading || cacheBusy} />
              </div>

              <div style={sx.s28}>
                {cacheError ? <div style={sx.s29}>
                    {cacheError}
                  </div> : null}

                {cacheLoading && !cacheReport ? <div style={sx.s30(DC)}>جارٍ فحص الكاش...</div> : <>
                    <div style={sx.s31}>
                      <SmallStat label="إعلانات القائمة" value={cacheReport?.listings?.count ?? 0} color={C.primary} />
                      <SmallStat label="تفاصيل محليًا" value={cacheReport?.details?.count ?? 0} color="#7C3AED" />
                      <SmallStat label="صور بالكاش" value={imageRequestCount} color="#0891B2" />
                      <SmallStat label="بلاطات الخريطة" value={mapTileCount} color="#0F766E" hint={mapTileCount ? "تم اكتشاف بلاطات محفوظة" : "تظهر بعد فتح الخريطة"} />
                      <SmallStat label="ملفات Leaflet" value={leafletAssetCount} color="#1D4ED8" hint={leafletCached ? "محفوظة داخل الكاش" : "لم تُكتشف بعد"} />
                      <SmallStat label="الحجم المتتبع" value={formatBytes(cacheReport?.localStorage?.trackedBytes || 0)} color="#EA580C" />
                    </div>

                    <div style={sx.s32}>
                      <div style={S.grid2Gap8Mb8}>
                        <div style={S.text11SlateStrong}>كاش القائمة: {cacheReport?.listings?.fresh ? "حديث" : cacheReport?.listings?.exists ? "قديم" : "غير موجود"}</div>
                        <div style={S.text11SlateStrong}>آخر تحديث: {formatDate(cacheReport?.listings?.updatedAt)}</div>
                        <div style={S.text11SlateStrong}>تفاصيل حديثة: {cacheReport?.details?.freshCount ?? 0}</div>
                        <div style={S.text11SlateStrong}>تفاصيل قديمة: {cacheReport?.details?.staleCount ?? 0}</div>
                        <div style={S.text11SlateStrong}>طلبات Cache Storage: {cacheReport?.cacheStorage?.totalRequests ?? 0}</div>
                        <div style={S.text11SlateStrong}>المفاتيح المتتبعة: {cacheReport?.localStorage?.trackedKeys ?? 0}</div>
                        <div style={S.text11SlateStrong}>حالة Leaflet: {leafletCached ? "محفوظ" : "غير مكتشف"}</div>
                        <div style={S.text11SlateStrong}>كاشات الخرائط: {mapRelatedCaches.length}</div>
                      </div>
                      <StorageUsageGraphic usage={cacheReport?.storageEstimate?.usage || 0} quota={cacheReport?.storageEstimate?.quota || 0} />
                    </div>

                    {(() => {
                const imgBytes = (cacheReport?.cacheStorage?.caches || []).filter(c => ["supabase-images", "detail-images-v1", "images-cache"].includes(c.name)).reduce((s, c) => s + (c.requestCount || 0) * 0, 0); // عدد فقط
                const imgCount = (cacheReport?.cacheStorage?.caches || []).filter(c => ["supabase-images", "detail-images-v1", "images-cache"].includes(c.name)).reduce((s, c) => s + (c.requestCount || 0), 0);
                const listingsBytes = cacheReport?.listings?.bytes || 0;
                const detailsBytes = cacheReport?.details?.totalBytes || 0;
                const reportsCount = (() => {
                  try {
                    return Object.keys(localStorage).filter(k => k.startsWith("report_sent:")).length;
                  } catch {
                    return 0;
                  }
                })();
                const sz = b => b > 0 ? ` · ${formatBytes(b)}` : "";
                const cnt = (n, unit) => n > 0 ? ` · ${n} ${unit}` : "";
                return <div style={S.grid2Gap8Mb10}>
                          <ActionButton label={`مسح القائمة${sz(listingsBytes)}`} onClick={() => handleClear("listings")} disabled={cacheBusy} />
                          <ActionButton label={`مسح التفاصيل${sz(detailsBytes)}`} onClick={() => handleClear("details")} tone="warn" disabled={cacheBusy} />
                          <ActionButton label={`مسح الصور${cnt(imgCount, "ملف")}`} onClick={() => handleClear("images")} tone="warn" disabled={cacheBusy} />
                          <ActionButton label={imgCacheLoading ? "جاري..." : "🖼 عرض الصور"} onClick={loadImgCache} tone="default" disabled={imgCacheLoading} />
                          <ActionButton label="مسح كل الكاش" onClick={() => handleClear("all")} tone="danger" disabled={cacheBusy} />
                          <ActionButton label={`مسح البلاغات${cnt(reportsCount, "مفتاح")}`} onClick={() => handleClear("reports")} tone="warn" disabled={cacheBusy} />
                        </div>;
              })()}

                    {/* معرض صور الكاش */}
                    {showImgCache && imgCacheUrls.length > 0 && <div style={sx.s33}>
                        <div style={sx.s34}>
                          <span style={sx.s35}>🖼 supabase-images ({imgCacheUrls.length} صورة)</span>
                          <button onClick={() => setShowImgCache(false)} style={sx.s36}>✕</button>
                        </div>
                        <div style={sx.s37}>
                          {imgCacheUrls.map((url, i) => {
                    const sx = {
                      s1: {
                        width: "100%",
                        aspectRatio: "1",
                        objectFit: "cover",
                        borderRadius: 6,
                        background: "#E2E8F0"
                      }
                    };
                    return <img key={i} src={url} alt="" style={sx.s1} onError={e => {
                      e.target.style.display = "none";
                    }} />;
                  })}
                        </div>
                      </div>}

                    {/* toggle تحميل الصور المسبق */}
                    <div style={sx.s38}>
                      <div>
                        <div style={sx.s39}>🖼 تحميل الصور المسبق (Warm)</div>
                        <div style={sx.s40}>يخزن صور التفاصيل للعمل أوفلاين — يزيد حجم الكاش</div>
                      </div>
                      <div onClick={() => {
                  const next = !warmEnabled;
                  setWarmEnabled(next);
                  try {
                    localStorage.setItem("warm_images_enabled", next ? "1" : "0");
                  } catch {}
                }} style={sx.s41(warmEnabled)}>
                        <div style={sx.s42(warmEnabled)} />
                      </div>
                    </div>

                    <div style={S.whiteCard14Pad12Mb10}>
                      <div style={sx.s43(DC)}>فحص إعلان معيّن</div>
                      <div style={sx.s44}>
                        <input value={listingProbeId} onChange={e => setListingProbeId(e.target.value)} placeholder="أدخل listingId" inputMode="numeric" style={sx.s45} />
                        <ActionButton label={cacheBusy ? "جارٍ الفحص..." : "افحص"} onClick={handleProbeListing} tone="primary" disabled={cacheBusy} />
                      </div>

                      {listingProbe ? <div style={S.softCard12Pad10}>
                          <div style={sx.s46}>{listingProbe.title || `إعلان #${listingProbe.listingId}`}</div>
                          <div style={S.grid2Gap8Mb8}>
                            <div style={S.text11SlateStrong}>التفاصيل محليًا: {listingProbe.detailCached ? "نعم" : "لا"}</div>
                            <div style={S.text11SlateStrong}>الحالة: {listingProbe.detailFresh ? "حديث" : listingProbe.detailCached ? "قديم" : "غير موجود"}</div>
                            <div style={S.text11SlateStrong}>آخر حفظ: {formatDate(listingProbe.updatedAt)}</div>
                            <div style={S.text11SlateStrong}>العمر: {listingProbe.detailCached ? formatAge(listingProbe.detailAgeMs) : "—"}</div>
                            <div style={S.text11SlateStrong}>إجمالي الصور: {listingProbe.imageCount}</div>
                            <div style={S.text11SlateStrong}>صور محفوظة: {listingProbe.cachedImages} / {listingProbe.imageCount}</div>
                          </div>

                          {Array.isArray(listingProbe.images) && listingProbe.images.length > 0 ? <div style={sx.s47}>
                              {listingProbe.images.map((img, index) => {
                      const sx = {
                        s1: (index, listingProbe) => ({
                          padding: "7px 0",
                          borderBottom: index < listingProbe.images.length - 1 ? "1px dashed #E2E8F0" : "none"
                        })
                      };
                      return <div key={`${img.url}-${index}`} style={sx.s1(index, listingProbe)}>
                                  <SampleRow url={img.url} statusText={img.cached ? `محفوظة في ${img.foundIn.join("، ")}` : "غير محفوظة محليًا"} statusColor={img.cached ? "#15803D" : "#B91C1C"} thumbnailSize={54} />
                                </div>;
                    })}
                            </div> : listingProbe.detailCached ? <div style={S.text11SlateStrong}>لا توجد صور مسجلة داخل الكاش لهذا الإعلان.</div> : null}
                        </div> : <div style={S.text11SlateStrong}>أدخل رقم الإعلان لفحص وجود التفاصيل والصور محليًا.</div>}
                    </div>

                    <div style={S.whiteCard14Pad12Mb10}>
                      <div style={S.rowBetweenGap10Mb8}>
                        <div>
                          <div style={sx.s48(DC)}>كاش الخرائط و Leaflet</div>
                          <div style={S.text10SlateStrongMt3}>يبين بلاطات OpenStreetMap، وأصول Leaflet، وأين حُفظت.</div>
                        </div>
                        {leafletCached ? <TinyBadge label="Leaflet محفوظ" tone="info" /> : <TinyBadge label="Leaflet غير ظاهر" tone="warn" />}
                      </div>

                      <div style={S.grid2Gap8Mb10}>
                        <div style={S.text11SlateStrong}>بلاطات الخرائط: {mapTileCount}</div>
                        <div style={S.text11SlateStrong}>ملفات Leaflet: {leafletAssetCount}</div>
                        <div style={S.text11SlateStrong}>أصول التطبيق/الأوفلاين: {cacheReport?.maps?.appAssetCount ?? 0}</div>
                        <div style={S.text11SlateStrong}>أماكن الحفظ: {mapRelatedCaches.length ? mapRelatedCaches.map(item => item.name).join("، ") : "—"}</div>
                      </div>

                      <div style={sx.s49}>
                        ملاحظة: عدّاد بلاطات الخريطة يزيد بعد فتح صفحة الخريطة والتحريك أو التكبير، أما ملفات Leaflet فتظهر عندما تكون ملفات المكتبة أو صور marker محفوظة داخل Cache Storage أو الـ precache.
                      </div>

                      {mapRelatedCaches.length ? <div style={sx.s50}>
                          {mapRelatedCaches.map(item => {
                    const sx = {
                      s1: {
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                        marginBottom: 6
                      },
                      s2: {
                        fontSize: 11,
                        fontWeight: 900,
                        color: "#0F172A"
                      },
                      s3: {
                        fontSize: 10,
                        color: "#64748B",
                        fontWeight: 700
                      }
                    };
                    return <div key={`map-${item.name}`} style={S.softCard12Pad10x12}>
                              <div style={sx.s1}>
                                <div style={sx.s2}>{item.name}</div>
                                <div style={S.wrapGap4}>
                                  {item.mapTileCount ? <TinyBadge label={`بلاطات ${item.mapTileCount}`} tone="success" /> : null}
                                  {item.leafletAssetCount ? <TinyBadge label={`Leaflet ${item.leafletAssetCount}`} tone="info" /> : null}
                                  {item.appAssetCount ? <TinyBadge label={`أوفلاين ${item.appAssetCount}`} tone="default" /> : null}
                                </div>
                              </div>
                              <div style={sx.s3}>إجمالي الطلبات داخل هذا الكاش: {item.requestCount}</div>
                            </div>;
                  })}
                        </div> : null}

                      {cacheReport?.maps?.tileSamples?.length || cacheReport?.maps?.leafletSamples?.length ? <div style={sx.s51}>
                          {cacheReport?.maps?.tileSamples?.length ? <div style={S.softCard12Pad10}>
                              <div style={S.text10DarkBoldMb6}>عينات من بلاطات الخريطة</div>
                              <CacheGallery urls={cacheReport.maps.tileSamples} compact />
                            </div> : null}
                          {cacheReport?.maps?.leafletSamples?.length ? <div style={S.softCard12Pad10}>
                              <div style={S.text10DarkBoldMb6}>عينات من ملفات Leaflet</div>
                              <CacheGallery urls={cacheReport.maps.leafletSamples} compact />
                            </div> : null}
                        </div> : null}
                    </div>

                    <div style={sx.s52}>
                      <div style={sx.s53(DC)}>الكاشات المكتشفة</div>
                      {Array.isArray(cacheReport?.cacheStorage?.caches) && cacheReport.cacheStorage.caches.length ? <div style={S.gridGap8}>
                          {cacheReport.cacheStorage.caches.map(item => {
                    const sx = {
                      s1: {
                        background: "white",
                        border: "1px solid #E2E8F0",
                        borderRadius: 12,
                        padding: "10px 12px"
                      },
                      s2: {
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                        marginBottom: 4,
                        minWidth: 0
                      },
                      s3: {
                        fontSize: 11,
                        fontWeight: 900,
                        color: "#0F172A",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        minWidth: 0,
                        flex: 1
                      },
                      s4: item => ({
                        fontSize: 10,
                        color: "#64748B",
                        fontWeight: 700,
                        marginBottom: item.sampleUrls?.length ? 8 : 0
                      }),
                      s5: {
                        fontSize: 9,
                        color: "#94A3B8",
                        fontWeight: 700
                      },
                      s6: {
                        display: "flex",
                        flexDirection: "column",
                        gap: 4
                      },
                      s7: {
                        marginTop: 6,
                        fontSize: 9,
                        color: "#94A3B8",
                        fontWeight: 700
                      }
                    };
                    return <div key={item.name} style={sx.s1}>
                              <div style={sx.s2}>
                                <div style={sx.s3}>{item.name}</div>
                                <div style={S.wrapGap4}>
                                  {item.mapTileCount ? <TinyBadge label={`بلاطات ${item.mapTileCount}`} tone="success" /> : null}
                                  {item.leafletAssetCount ? <TinyBadge label={`Leaflet ${item.leafletAssetCount}`} tone="info" /> : null}
                                  {item.appAssetCount ? <TinyBadge label={`أوفلاين ${item.appAssetCount}`} tone="default" /> : null}
                                </div>
                              </div>
                              <div style={sx.s4(item)}>عدد الطلبات: {item.requestCount}</div>
                              {item.sampleUrls?.length ? <div style={S.gridGap8}>
                                  <div style={sx.s5}>معاينات من هذا الكاش</div>
                                  {item.sampleItems?.length ? <div style={sx.s6}>
                                      {item.sampleItems.map((f, i) => {
                            const name = f.url.split("/").pop();
                            const isImg = /\.(jpg|jpeg|png|webp|gif|svg|ico)(\?|$)/i.test(name);
                            const sx = {
                              s1: {
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                width: "100%"
                              },
                              s2: {
                                width: 28,
                                height: 28,
                                borderRadius: 4,
                                objectFit: "cover",
                                flexShrink: 0,
                                background: "#E2E8F0"
                              },
                              s3: {
                                width: 28,
                                height: 28,
                                borderRadius: 4,
                                background: "#F1F5F9",
                                flexShrink: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 9,
                                color: "#64748B",
                                fontWeight: 700
                              },
                              s4: {
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                flex: 1,
                                minWidth: 0,
                                fontSize: 9,
                                color: "#64748B",
                                direction: "ltr",
                                textAlign: "left"
                              },
                              s5: {
                                fontWeight: 700,
                                flexShrink: 0,
                                fontSize: 9,
                                color: "#0F172A"
                              }
                            };
                            return <div key={i} style={sx.s1}>
                                            {isImg ? <img src={f.url} alt="" style={sx.s2} onError={e => e.target.style.display = "none"} /> : <div style={sx.s3}>
                                                {name.split(".").pop()?.toUpperCase().slice(0, 4)}
                                              </div>}
                                            <span style={sx.s4}>{name}</span>
                                            <span style={sx.s5}>{f.size > 0 ? formatBytes(f.size) : "—"}</span>
                                          </div>;
                          })}
                                    </div> : <CacheGallery urls={item.sampleUrls} compact />}
                                </div> : <div style={sx.s7}>لا توجد عينات قابلة للعرض لهذا الكاش بعد.</div>}
                            </div>;
                  })}
                        </div> : <div style={S.text11SlateStrong}>لا يوجد Cache Storage متاح أو لم يُكتشف أي كاش بعد.</div>}
                    </div>
                  </>}
              </div>
            </div>
          </>}
      </div>
    </div>;
    }
