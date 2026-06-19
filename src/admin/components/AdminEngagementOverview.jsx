import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { C } from "../../shared/constants/colors.js";
import { getAdminEngagementStats } from "../services/engagementStatsService.js";

const METRICS = [
  { key: "views", icon: "👁", label: "المشاهدات", color: "#0F766E", bg: "#ECFDF5" },
  { key: "phoneClicks", icon: "📞", label: "فتح الهاتف", color: "#1D4ED8", bg: "#EFF6FF" },
  { key: "whatsappClicks", icon: "💬", label: "فتح واتساب", color: "#15803D", bg: "#F0FDF4" },
  { key: "favorites", icon: "❤️", label: "إضافة للمفضلة", color: "#BE123C", bg: "#FFF1F2" },
  { key: "conversations", icon: "✉️", label: "بدء محادثة", color: "#7C3AED", bg: "#F5F3FF" },
];

function formatNumber(value) {
  return Number(value || 0).toLocaleString("ar-SY");
}

export default function AdminEngagementOverview({ DC }) {
  const anchorRef = useRef(null);
  const [target, setTarget] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const anchor = anchorRef.current;
    const dashboardRoot = anchor?.previousElementSibling;
    const dashboardBody = dashboardRoot?.children?.[1];

    if (!dashboardBody) return undefined;

    const mount = document.createElement("div");
    mount.dataset.adminEngagementOverview = "true";
    dashboardBody.prepend(mount);
    setTarget(mount);

    const observer = new MutationObserver(() => {
      if (!dashboardBody.contains(mount)) dashboardBody.prepend(mount);
    });

    observer.observe(dashboardBody, { childList: true });

    return () => {
      observer.disconnect();
      mount.remove();
    };
  }, []);

  async function load() {
    setLoading(true);
    setError("");

    try {
      setStats(await getAdminEngagementStats());
    } catch (loadError) {
      console.error("Failed to load engagement stats", loadError);
      setError("تعذر تحميل إحصائيات التفاعل");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const content = (
    <section
      style={{
        background: DC?.white || "#fff",
        border: `1px solid ${DC?.border || "#DDE8E1"}`,
        borderRadius: 16,
        padding: 14,
        marginBottom: 14,
        boxShadow: "0 5px 16px rgba(15, 23, 42, 0.05)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10,
          marginBottom: 12,
        }}
      >
        <div>
          <div style={{ fontSize: 13, fontWeight: 900, color: DC?.text || "#1A2E20" }}>
            📊 تفاعل الإعلانات
          </div>
          <div style={{ fontSize: 10, color: DC?.text3 || "#64748B", marginTop: 3 }}>
            أرقام تراكمية لجميع الإعلانات الموجودة
          </div>
        </div>

        <button
          type="button"
          onClick={load}
          disabled={loading}
          style={{
            border: `1px solid ${C.primary}`,
            background: "#fff",
            color: C.primary,
            borderRadius: 10,
            padding: "7px 10px",
            fontFamily: "inherit",
            fontSize: 10,
            fontWeight: 800,
            cursor: loading ? "wait" : "pointer",
            opacity: loading ? 0.65 : 1,
          }}
        >
          {loading ? "جارٍ التحديث..." : "تحديث"}
        </button>
      </div>

      {error ? (
        <div
          style={{
            padding: 12,
            borderRadius: 12,
            background: "#FEF2F2",
            color: "#B91C1C",
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {error}
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(105px, 1fr))",
            gap: 8,
          }}
        >
          {METRICS.map(metric => (
            <div
              key={metric.key}
              style={{
                background: metric.bg,
                border: `1px solid ${metric.color}22`,
                borderRadius: 13,
                padding: "11px 9px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 18, marginBottom: 4 }}>{metric.icon}</div>
              <div style={{ fontSize: 20, lineHeight: 1, fontWeight: 950, color: metric.color }}>
                {loading && !stats ? "—" : formatNumber(stats?.[metric.key])}
              </div>
              <div style={{ fontSize: 9.5, fontWeight: 800, color: metric.color, marginTop: 5 }}>
                {metric.label}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );

  return (
    <>
      <span ref={anchorRef} style={{ display: "none" }} />
      {target ? createPortal(content, target) : null}
    </>
  );
}
