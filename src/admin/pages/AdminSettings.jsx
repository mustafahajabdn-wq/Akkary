import { BackButton } from "../../shared/components/common/BackButton.jsx";
import { Navigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { fetchAppSettings, updateAppSetting } from "../services/adminService.js";
import { C } from "../../shared/constants/colors.js";
import { IslamicPattern, Wave } from "../../shared/components/icons.jsx";
import { S } from "../../shared/styles/primitives.js";
import { DEFAULT_TRACKING_SETTINGS } from "../../shared/services/metaPixel.js";

// مجموعات الإعدادات
const GROUPS = {
  "📢 الإعلانات المدفوعة": ["ads_enabled", "ads_interval", "featured_count"],
  "🏠 نشر الإعلانات": ["max_listings_individual", "max_listings_office", "want_auto_approve", "max_images", "max_video_size_mb"],
  "⏳ مدة الإعلانات (يوم)": ["listing_duration_sell", "listing_duration_rent", "listing_duration_want_buy", "listing_duration_want_rent"],
  "🚩 الإشراف": ["reports_limit_to_hide_listing", "maintenance"],
  "👁️ الزوار والإحصائيات": ["visitor_presence_enabled"],
  "📡 التتبع والتحليلات": ["meta_pixel_enabled", "meta_pixel_id", "track_page_view", "track_property_view", "track_contact_click", "track_search"],
  "💳 عرض البطاقات": ["card_show_seller_name", "card_show_price_on_contact", "card_show_time_ago"],
  "📞 التواصل": ["support_whatsapp", "support_email", "whatsapp_offer", "whatsapp_request"],
  "🌐 معلومات التطبيق": ["app_name_ar", "app_name_en", "tagline_ar", "tagline_en"]
};

const SETTING_LABELS = {
  ads_enabled: "🟢 تفعيل الإعلانات المدفوعة",
  ads_interval: "📊 فاصل الإعلانات",
  featured_count: "⭐ عدد المميزة",
  max_listings_individual: "👤 حد الإعلانات — فردي",
  max_listings_office: "🏢 حد الإعلانات — مكتب",
  want_auto_approve: "🔍 نشر الطلبات مباشرة",
  max_images: "🖼️ عدد الصور الأقصى",
  max_video_size_mb: "🎥 حجم الفيديو (MB)",
  reports_limit_to_hide_listing: "🚩 بلاغات الإخفاء التلقائي",
  maintenance: "🛠️ وضع الصيانة",
  visitor_presence_enabled: "👁️ تفعيل عدّاد الزوار",
  meta_pixel_enabled: "📡 تفعيل Meta Pixel",
  meta_pixel_id: "🔢 رقم Meta Pixel ID",
  track_page_view: "👁️ تتبع فتح الصفحات",
  track_property_view: "🏠 تتبع مشاهدة العقار",
  track_contact_click: "📞 تتبع الضغط على التواصل",
  track_search: "🔎 تتبع عمليات البحث",
  card_show_seller_name: "👤 اسم المعلن على الكارد",
  card_show_price_on_contact: "💰 السعر عند التواصل",
  card_show_time_ago: "⏱️ وقت الإعلان على الكارد",
  support_whatsapp: "📞 واتساب الدعم",
  support_email: "📧 إيميل الدعم",
  whatsapp_offer: "💬 واتساب نشر إعلان",
  whatsapp_request: "💬 واتساب طلب عقار",
  app_name_ar: "📱 اسم التطبيق — عربي",
  app_name_en: "📱 اسم التطبيق — إنجليزي",
  tagline_ar: "🏷️ الشعار — عربي",
  tagline_en: "🏷️ الشعار — إنجليزي",
  listing_duration_sell: "🏷️ مدة إعلان البيع",
  listing_duration_rent: "🔑 مدة إعلان التأجير",
  listing_duration_want_buy: "🔍 مدة طلب الشراء",
  listing_duration_want_rent: "🔍 مدة طلب الاستئجار"
};

const SETTING_OPTIONS = {
  ads_enabled: ["true", "false"],
  ads_interval: ["5", "10", "15", "20", "30"],
  featured_count: ["3", "5", "6", "8", "10"],
  max_listings_individual: ["3", "5", "7", "10", "15", "20", "50"],
  max_listings_office: ["10", "15", "20", "30", "50", "100"],
  want_auto_approve: ["true", "false"],
  max_images: ["5", "10", "15", "20"],
  max_video_size_mb: ["10", "20", "30", "50", "100"],
  reports_limit_to_hide_listing: ["1", "2", "3", "5", "10"],
  maintenance: ["true", "false"],
  visitor_presence_enabled: ["true", "false"],
  meta_pixel_enabled: ["true", "false"],
  track_page_view: ["true", "false"],
  track_property_view: ["true", "false"],
  track_contact_click: ["true", "false"],
  track_search: ["true", "false"],
  card_show_seller_name: ["true", "false"],
  card_show_price_on_contact: ["true", "false"],
  card_show_time_ago: ["true", "false"],
  listing_duration_sell: ["30", "60", "90", "120", "180", "365"],
  listing_duration_rent: ["30", "60", "90", "120", "180", "365"],
  listing_duration_want_buy: ["7", "14", "30", "60", "90"],
  listing_duration_want_rent: ["7", "14", "30", "60", "90"]
};

function mergeDefaultSettings(rows = []) {
  const map = new Map();

  (Array.isArray(rows) ? rows : []).forEach(row => {
    if (row?.key) map.set(row.key, row);
  });

  Object.entries({
    ...DEFAULT_TRACKING_SETTINGS,
    card_show_time_ago: "false"
  }).forEach(([key, value]) => {
    if (!map.has(key)) {
      map.set(key, {
        key,
        value,
        label: SETTING_LABELS[key] || key
      });
    }
  });

  return Array.from(map.values());
}

export default function AdminSettings({
  setPage,
  DC,
  user
}) {
  const sx = {
    s1: {
      background: "#374151",
      padding: "48px 16px 50px",
      position: "relative",
      overflow: "hidden"
    }
  };

  if (user?.role !== "admin" && !(user?.allowedPages || []).includes("adminSettings")) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const data = await fetchAppSettings();
    setSettings(mergeDefaultSettings(data));
    setLoading(false);
  }

  async function save(key, value) {
    try {
      await updateAppSetting(key, value);

      setSettings(p =>
        p.map(s =>
          s.key === key
            ? {
                ...s,
                value
              }
            : s
        )
      );

      setSaved(key);
      setTimeout(() => setSaved(null), 2000);
    } catch (error) {
      console.error("save app setting error:", error);
      alert(error?.message || "تعذر حفظ الإعداد");
    }
  }

  const settingMap = Object.fromEntries(settings.map(s => [s.key, s]));

  return (
    <div style={S.pageShell(DC)}>
      <div style={sx.s1}>
        <IslamicPattern opacity={0.1} color="#FFFFFF" width={430} height={200} />

        <div style={S.absTopRight14}>
          <BackButton onPress={() => setPage("adminDashboard")} />
        </div>

        <div style={S.relZ1}>
          <div style={S.title20White}>⚙️ إعدادات التطبيق</div>
        </div>

        <Wave />
      </div>

      <div style={S.pad14Bottom80}>
        {loading ? (
          <div style={S.emptyStateCentered}>⏳</div>
        ) : (
          <>
            {Object.entries(GROUPS).map(([groupLabel, keys]) => {
              const groupSettings = keys.map(k => settingMap[k]).filter(Boolean);

              const sx = {
                s1: {
                  marginBottom: 16
                },
                s2: DC => ({
                  fontSize: 12,
                  fontWeight: 800,
                  color: DC?.text3 || "#8A9E90",
                  marginBottom: 8,
                  letterSpacing: 0.5
                }),
                s3: DC => ({
                  background: DC?.white || "#fff",
                  borderRadius: 12,
                  border: "1.5px solid " + (DC?.border || "#DDE8E1"),
                  overflow: "hidden"
                })
              };

              if (!groupSettings.length) return null;

              return (
                <div key={groupLabel} style={sx.s1}>
                  <div style={sx.s2(DC)}>{groupLabel}</div>

                  <div style={sx.s3(DC)}>
                    {groupSettings.map((s, i) => {
                      const opts = SETTING_OPTIONS[s.key];
                      const label = SETTING_LABELS[s.key] || s.label || s.key;
                      const isSaved = saved === s.key;

                      const sx = {
                        s1: (i, groupSettings, DC) => ({
                          padding: "14px 16px",
                          borderBottom:
                            i < groupSettings.length - 1
                              ? "1px solid " + (DC?.border || "#DDE8E1")
                              : "none"
                        }),
                        s2: DC => ({
                          fontSize: 13,
                          fontWeight: 700,
                          color: DC?.text || "#1A2E20",
                          marginBottom: 8
                        }),
                        s3: {
                          display: "flex",
                          gap: 5,
                          flexWrap: "wrap"
                        },
                        s4: DC => ({
                          flex: 1,
                          padding: "8px 12px",
                          borderRadius: 8,
                          border: "1.5px solid " + (DC?.border || "#DDE8E1"),
                          fontSize: 12,
                          fontFamily: "monospace",
                          direction: "ltr",
                          textAlign: "left",
                          outline: "none",
                          background: DC?.bg || "#F2F5F3",
                          color: DC?.text || "#1A2E20"
                        }),
                        s5: (isSaved, C) => ({
                          padding: "8px 14px",
                          borderRadius: 8,
                          border: "none",
                          background: isSaved ? "#16A34A" : C.primary,
                          color: "white",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                          fontFamily: "inherit",
                          transition: "background 0.2s"
                        })
                      };

                      return (
                        <div key={s.key} style={sx.s1(i, groupSettings, DC)}>
                          <div style={sx.s2(DC)}>{label}</div>

                          {opts ? (
                            <div style={sx.s3}>
                              {opts.map(o => {
                                const sx = {
                                  s1: (s, o, C, DC) => ({
                                    padding: "6px 14px",
                                    borderRadius: 20,
                                    border:
                                      "1.5px solid " +
                                      (s.value === o ? C.primary : DC?.border || "#DDE8E1"),
                                    background:
                                      s.value === o ? "#E8F4F0" : DC?.bg || "#F2F5F3",
                                    color:
                                      s.value === o ? C.primary : DC?.text || "#1A2E20",
                                    fontSize: 12,
                                    fontWeight: s.value === o ? 800 : 600,
                                    cursor: "pointer",
                                    fontFamily: "inherit"
                                  })
                                };

                                return (
                                  <button
                                    key={o}
                                    onClick={() => save(s.key, o)}
                                    style={sx.s1(s, o, C, DC)}
                                  >
                                    {o}
                                    {isSaved && s.value === o ? " ✓" : ""}
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <div style={S.gap8}>
                              <input
                                defaultValue={s.value || ""}
                                id={`s-${s.key}`}
                                style={sx.s4(DC)}
                              />

                              <button
                                onClick={() =>
                                  save(
                                    s.key,
                                    document.getElementById(`s-${s.key}`)?.value
                                  )
                                }
                                style={sx.s5(isSaved, C)}
                              >
                                {isSaved ? "✓" : "حفظ"}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
