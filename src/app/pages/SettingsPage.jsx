import { BackButton } from "../../shared/components/common/BackButton.jsx";
import { getCityNames } from "../services/geoCache.js";
import React, { useState, useEffect } from "react";
import { C } from "../../shared/constants/colors.js";
import { T } from "../../shared/utils/i18n.js";
import { IslamicPattern, Wave, SyriaFlag } from "../../shared/components/icons.jsx";
import { fetchProfile, updateProfile } from "../services/profileService.js";
import { S } from "../../shared/styles/primitives.js";
import { fetchMyLatestUpgradeRequest, createAccountUpgradeRequest } from "../services/accountUpgradeService.js";

function normalizeFacebookIdentifier(value) {
  const raw = String(value || "").trim();
  if (!raw) return { ok: true, value: "" };

  let cleaned = raw.replace(/^@/, "").trim();

  try {
    let urlText = cleaned;

    if (/^(www\.)?(facebook\.com|fb\.com|m\.me)\//i.test(urlText)) {
      urlText = "https://" + urlText;
    }

    if (/^https?:\/\//i.test(urlText)) {
      const url = new URL(urlText);
      const host = url.hostname.toLowerCase().replace(/^www\./, "");
      const isFacebook =
        host === "facebook.com" ||
        host === "fb.com" ||
        host === "m.me" ||
        host.endsWith(".facebook.com");

      if (!isFacebook) {
        return { ok: false, value: "", error: "أدخل رابط Facebook صحيح مثل facebook.com/username" };
      }

      const idParam = url.searchParams.get("id");
      if (idParam && /^[0-9]{5,30}$/.test(idParam)) {
        return { ok: true, value: idParam };
      }

      const parts = url.pathname.split("/").filter(Boolean);
      if (parts.length > 0) cleaned = parts[0].replace(/^@/, "").trim();
    }
  } catch {}

  if (/^[0-9]{5,30}$/.test(cleaned)) return { ok: true, value: cleaned };
  if (/^[A-Za-z0-9.]{5,80}$/.test(cleaned)) return { ok: true, value: cleaned };

  return { ok: false, value: "", error: "معرّف Facebook غير صحيح. استخدم مثلًا: facebook.com/username أو username" };
}

function SettingsPage({
  setPage,
  DC,
  dark,
  setDark,
  lang,
  setLang,
  shamcash = { code: "", show: false },
  setShamcash,
  user,
  setUser,
}) {
  DC = DC || C;

  const t = T[lang] || T.ar || {};
  const [saved, setSaved] = useState(false);
  const [profileName, setProfileName] = useState(user?.name || "");
  const [profilePhone, setProfilePhone] = useState(user?.phone || "");
  const [profilePhone2, setProfilePhone2] = useState("");
  const [profileWhatsapp, setProfileWhatsapp] = useState("");
  const [profileWhatsapp2, setProfileWhatsapp2] = useState("");
  const [profileMessengerId, setProfileMessengerId] = useState("");
  const [upgradeRequest, setUpgradeRequest] = useState(null);
  const [upgradeNote, setUpgradeNote] = useState("");
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [upgradeLoaded, setUpgradeLoaded] = useState(false);
  const [profileAccountType, setProfileAccountType] = useState(user?.accountType || user?.account_type || "individual");
  const [localCode, setLocalCode] = useState(shamcash.code || "");
  const [localShow, setLocalShow] = useState(shamcash.show || false);
  const [autoPlayVideo, setAutoPlayVideo] = useState(() => localStorage.getItem("autoPlayVideo") === "on");
  const [offlineMapsOpen, setOfflineMapsOpen] = useState(false);
  const [cities, setCities] = useState([]);
  const [offlineCities, setOfflineCities] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("offline_cities") || "[]");
    } catch {
      return [];
    }
  });
  const [dlProgress, setDlProgress] = useState({});
  const [citySize, setCitySize] = useState({});
  const [cityZoom, setCityZoom] = useState({});

  const currentAccountType = profileLoaded ? profileAccountType || "individual" : null;
  const canRequestUpgrade = profileLoaded && currentAccountType === "individual";
  const upgradeStatus = upgradeLoaded ? upgradeRequest?.status || null : null;
  const isStaleApprovedUpgrade = canRequestUpgrade && upgradeStatus === "approved";
  const isRevokedUpgrade = upgradeStatus === "revoked";
  const showUpgradeSection = profileLoaded && upgradeLoaded && canRequestUpgrade;

  const sx = {
    s1: C => ({ position: "relative", zIndex: 1, fontSize: 20, fontWeight: 900, color: C.white }),
    s2: { display: "flex", gap: 0 },
    s3: { padding: "12px 16px" },
    s4: DC => ({ fontSize: 14, fontWeight: 800, color: DC.text }),
    s5: { padding: "13px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" },
    s6: DC => ({ fontSize: 13, fontWeight: 700, color: DC.text }),
    s7: (sx, localShow, localCode, C) => ({
      ...sx.toggleWrap,
      background: localShow && localCode ? C.primary : "#D1D5DB",
      cursor: localCode ? "pointer" : "not-allowed",
      opacity: localCode ? 1 : 0.5,
    }),
    s8: (sx, localShow, localCode) => ({ ...sx.toggleKnob, right: localShow && localCode ? 3 : 23 }),
    s9: (sx, saved, C) => ({ ...sx.saveBtn, background: saved ? C.primary2 : C.primary }),
  };

  Object.assign(sx, {
    page: { background: DC.bg, minHeight: "100vh", paddingBottom: 30 },
    hero: { background: C.primary, padding: "48px 16px 50px", position: "relative", overflow: "hidden" },
    card14: { background: DC.white, borderRadius: 14, border: "1px solid " + DC.border, overflow: "hidden", marginBottom: 14 },
    card12: { background: DC.white, borderRadius: 12, border: "1px solid " + DC.border, overflow: "hidden", marginBottom: 16 },
    card12LargeGap: { background: DC.white, borderRadius: 12, border: "1px solid " + DC.border, overflow: "hidden", marginBottom: 20 },
    rowBetween: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px" },
    rowStart: { display: "flex", alignItems: "center", gap: 12 },
    subText: { fontSize: 11, color: DC.text3, marginTop: 2 },
    title14: { fontSize: 14, fontWeight: 800, color: DC.text },
    infoLeft: { display: "flex", alignItems: "center", gap: 12, fontSize: 13, fontWeight: 600, color: DC.text },
    sectionRow: { padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" },
    sectionMutedTop: { padding: "8px 16px 12px", fontSize: 11, color: DC.text3, borderTop: "1px solid " + DC.border },
    cityHead: { padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid " + DC.border },
    cityName: { fontSize: 13, fontWeight: 700, color: DC.text },
    progressText: { fontSize: 10, color: C.primary, marginTop: 2 },
    zoomSelect: {
      padding: "4px 6px",
      borderRadius: 8,
      border: "1px solid " + DC.border,
      fontSize: 11,
      fontFamily: "inherit",
      background: DC.bg,
      color: DC.text,
      cursor: "pointer",
    },
    contactLabel: { fontSize: 11, color: DC.text3, marginBottom: 5, fontWeight: 700 },
    contactInput: {
      width: "100%",
      padding: "9px 12px",
      borderRadius: 10,
      border: "1.5px solid " + DC.border,
      fontSize: 13,
      fontFamily: "inherit",
      direction: "ltr",
      textAlign: "left",
      background: DC.bg,
      color: DC.text,
      outline: "none",
      boxSizing: "border-box",
    },
    shamHeader: { padding: "13px 16px", borderBottom: "1px solid " + DC.border, display: "flex", alignItems: "center", gap: 8 },
    shamSection: { padding: "13px 16px", borderBottom: "1px solid " + DC.border },
    smallLabel: { fontSize: 12, color: DC.text3, marginBottom: 6 },
    shamInput: {
      flex: 1,
      padding: "9px 12px",
      borderRadius: 10,
      border: "1.5px solid " + DC.border,
      fontSize: 13,
      fontFamily: "inherit",
      direction: "ltr",
      textAlign: "left",
      background: DC.bg,
      color: DC.text,
      outline: "none",
    },
    deleteBtn: {
      padding: "9px 12px",
      borderRadius: 10,
      border: "1px solid #FCA5A5",
      background: "#FEF2F2",
      fontSize: 12,
      color: "#EF4444",
      fontWeight: 700,
      cursor: "pointer",
      fontFamily: "inherit",
    },
    toggleWrap: { width: 46, height: 26, borderRadius: 13, cursor: "pointer", position: "relative", transition: "background 0.2s" },
    toggleKnob: {
      position: "absolute",
      top: 3,
      width: 20,
      height: 20,
      borderRadius: "50%",
      background: "white",
      boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      transition: "right 0.2s",
    },
    previewBox: {
      margin: "0 16px 13px",
      background: "#E8F4F0",
      borderRadius: 10,
      padding: "10px 14px",
      display: "flex",
      alignItems: "center",
      gap: 10,
    },
    previewLabel: { fontSize: 11, color: C.primary, fontWeight: 700 },
    previewCode: { fontSize: 13, fontWeight: 800, color: DC.text, direction: "ltr" },
    saveBtn: {
      width: "100%",
      padding: "13px",
      color: "white",
      border: "none",
      borderRadius: 11,
      fontSize: 14,
      fontWeight: 700,
      fontFamily: "inherit",
      cursor: "pointer",
      transition: "background 0.2s",
    },
    upgradeBody: { padding: "14px 16px" },
    upgradeTextarea: {
      width: "100%",
      minHeight: 82,
      padding: "10px 12px",
      borderRadius: 12,
      border: "1.5px solid " + DC.border,
      background: DC.bg,
      color: DC.text,
      fontFamily: "inherit",
      fontSize: 13,
      outline: "none",
      resize: "vertical",
      boxSizing: "border-box",
    },
    upgradeButton: loading => ({
      width: "100%",
      marginTop: 10,
      padding: "12px",
      borderRadius: 12,
      border: "none",
      background: loading ? "#94A3B8" : C.primary,
      color: "white",
      fontSize: 14,
      fontWeight: 800,
      fontFamily: "inherit",
      cursor: loading ? "not-allowed" : "pointer",
    }),
    rejectedBox: {
      marginBottom: 10,
      padding: "10px 12px",
      borderRadius: 12,
      background: "#FEF2F2",
      color: "#DC2626",
      fontSize: 12,
      fontWeight: 700,
    },
    proBox: {
      background: "#E8F4F0",
      border: "1px solid rgba(26,74,46,0.16)",
      borderRadius: 12,
      padding: "12px",
      marginBottom: 12,
    },
    proTitle: { fontSize: 13, fontWeight: 900, color: C.primary },
    proText: { fontSize: 11, color: DC.text3, marginTop: 4, lineHeight: 1.7 },
  });

  useEffect(() => {
    if (!user?.id) {
      setProfileLoaded(true);
      return;
    }

    let cancelled = false;
    setProfileLoaded(false);

    fetchProfile(user.id)
      .then(data => {
        if (cancelled) return;

        if (data) {
          const nextAccountType = data.account_type || data.accountType || "individual";

          setProfileName(data.name || user?.name || "");
          setProfilePhone(data.phone || user?.phone || "");
          setProfilePhone2(data.phone2 || "");
          setProfileWhatsapp(data.whatsapp || "");
          setProfileWhatsapp2(data.whatsapp2 || "");
          setProfileMessengerId(data.messenger_id || "");
          setProfileAccountType(nextAccountType);

          setUser &&
            setUser(prev => {
              const prevAccountType = prev?.account_type || prev?.accountType || "individual";

              if (prevAccountType === nextAccountType) {
                return prev;
              }

              return {
                ...prev,
                account_type: nextAccountType,
                accountType: nextAccountType
              };
            });
        } else {
          setProfileAccountType("individual");
        }
      })
      .catch(error => {
        if (!cancelled) {
          console.error("fetch profile settings error:", error);
          setProfileAccountType("individual");
        }
      })
      .finally(() => {
        if (!cancelled) setProfileLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setUpgradeRequest(null);
      setUpgradeLoaded(true);
      return;
    }

    let cancelled = false;
    setUpgradeLoaded(false);

    fetchMyLatestUpgradeRequest(user.id)
      .then(data => {
        if (!cancelled) setUpgradeRequest(data || null);
      })
      .catch(error => {
        if (!cancelled) {
          console.error("fetch latest upgrade request settings error:", error);
          setUpgradeRequest(null);
        }
      })
      .finally(() => {
        if (!cancelled) setUpgradeLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    getCityNames().then(names => {
      if (names?.length) setCities(names);
    });
  }, []);

  useEffect(() => {
    if (!offlineCities.length || !("caches" in window)) return;

    offlineCities.forEach(async city => {
      try {
        const c = await window.caches.open(`offline-map-${city}`);
        const keys = await c.keys();
        let total = 0;

        for (const req of keys) {
          const res = await c.match(req);
          if (res) {
            const buf = await res.arrayBuffer();
            total += buf.byteLength;
          }
        }

        if (total > 0) {
          setCitySize(p => ({ ...p, [city]: total }));
        }
      } catch {}
    });
  }, [offlineCities.join(",")]);

  function tileXY(lat, lng, zoom) {
    const n = Math.pow(2, zoom);
    const x = Math.floor(((lng + 180) / 360) * n);
    const y = Math.floor(((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) * n);
    return { x, y };
  }

  const CITY_BOUNDS = {
    "دمشق": { minLat: 33.4, maxLat: 33.6, minLng: 36.2, maxLng: 36.4 },
    "حلب": { minLat: 36.1, maxLat: 36.3, minLng: 37.05, maxLng: 37.25 },
    "حمص": { minLat: 34.65, maxLat: 34.8, minLng: 36.65, maxLng: 36.8 },
    "حماة": { minLat: 35.1, maxLat: 35.2, minLng: 36.7, maxLng: 36.8 },
    "اللاذقية": { minLat: 35.48, maxLat: 35.58, minLng: 35.75, maxLng: 35.87 },
    "طرطوس": { minLat: 34.85, maxLat: 34.95, minLng: 35.85, maxLng: 35.95 },
    "دير الزور": { minLat: 35.3, maxLat: 35.4, minLng: 40.1, maxLng: 40.2 },
    "الرقة": { minLat: 35.93, maxLat: 36.02, minLng: 38.95, maxLng: 39.1 },
    "إدلب": { minLat: 35.9, maxLat: 36, minLng: 36.6, maxLng: 36.7 },
    "السويداء": { minLat: 32.68, maxLat: 32.78, minLng: 36.55, maxLng: 36.65 },
    "درعا": { minLat: 32.6, maxLat: 32.7, minLng: 36.08, maxLng: 36.18 },
    "القنيطرة": { minLat: 33.1, maxLat: 33.2, minLng: 35.8, maxLng: 35.9 },
    "الحسكة": { minLat: 36.48, maxLat: 36.58, minLng: 40.72, maxLng: 40.82 },
  };

  async function downloadCityTiles(cityName) {
    const bounds = CITY_BOUNDS[cityName];
    if (!bounds) return;

    const maxZ = cityZoom[cityName] || 12;
    const zooms = Array.from({ length: maxZ - 9 }, (_, i) => i + 10);
    const urls = [];

    for (const z of zooms) {
      const tl = tileXY(bounds.maxLat, bounds.minLng, z);
      const br = tileXY(bounds.minLat, bounds.maxLng, z);

      for (let x = tl.x; x <= br.x; x++) {
        for (let y = tl.y; y <= br.y; y++) {
          urls.push(`https://a.tile.openstreetmap.org/${z}/${x}/${y}.png`);
        }
      }
    }

    setDlProgress(p => ({ ...p, [cityName]: { done: 0, total: urls.length } }));

    const cacheName = `offline-map-${cityName}`;
    const cache = await window.caches.open(cacheName);

    for (let i = 0; i < urls.length; i++) {
      try {
        const matched = await cache.match(urls[i]);
        if (!matched) {
          const r = await fetch(urls[i], { mode: "cors", credentials: "omit" });
          if (r.ok) await cache.put(urls[i], r);
        }
      } catch {}

      setDlProgress(p => ({ ...p, [cityName]: { done: i + 1, total: urls.length } }));
    }

    const newList = [...new Set([...offlineCities, cityName])];
    setOfflineCities(newList);
    localStorage.setItem("offline_cities", JSON.stringify(newList));

    if (user?.id) updateProfile(user.id, { offline_cities: newList });

    try {
      const c = await window.caches.open(cacheName);
      const keys = await c.keys();
      let total = 0;

      for (const req of keys) {
        const res = await c.match(req);
        if (res) {
          const buf = await res.arrayBuffer();
          total += buf.byteLength;
        }
      }

      setCitySize(p => ({ ...p, [cityName]: total }));
    } catch {}

    setDlProgress(p => {
      const n = { ...p };
      delete n[cityName];
      return n;
    });
  }

  async function deleteCityTiles(cityName) {
    await window.caches.delete(`offline-map-${cityName}`);

    const newList = offlineCities.filter(c => c !== cityName);
    setOfflineCities(newList);
    localStorage.setItem("offline_cities", JSON.stringify(newList));

    if (user?.id) updateProfile(user.id, { offline_cities: newList });
  }

  const handleAutoPlay = val => {
    setAutoPlayVideo(val);
    localStorage.setItem("autoPlayVideo", val ? "on" : "off");
  };

  const submitUpgradeRequest = async () => {
    if (!user?.id || upgradeLoading) return;

    setUpgradeLoading(true);

    const { data, error } = await createAccountUpgradeRequest(user.id, "office", upgradeNote);

    setUpgradeLoading(false);

    if (error) {
      alert(error.code === "23505" ? "لديك طلب تحويل معلّق مسبقًا" : "تعذر إرسال طلب الحساب المهني");
      return;
    }

    setUpgradeRequest(data);
    setUpgradeLoaded(true);
    setUpgradeNote("");
    alert("تم إرسال طلب الحساب المهني بنجاح");
  };

  const save = async () => {
    const parsedMessenger = normalizeFacebookIdentifier(profileMessengerId);

    if (!parsedMessenger.ok) {
      alert(parsedMessenger.error);
      return;
    }

    if (user?.id) {
      await updateProfile(user.id, {
        name: profileName || user.name,
        phone: profilePhone || user.phone,
        phone2: profilePhone2 || null,
        whatsapp: profileWhatsapp || null,
        whatsapp2: profileWhatsapp2 || null,
        messenger_id: parsedMessenger.value || null,
        shamcash_code: localCode || null,
        shamcash_visible: localShow || false,
      });

      setUser &&
        setUser(prev => ({
          ...prev,
          name: profileName || prev.name,
          phone: profilePhone || prev.phone,
          messenger_id: parsedMessenger.value || "",
        }));

      setProfileMessengerId(parsedMessenger.value || "");

      setShamcash &&
        setShamcash({
          code: localCode,
          show: localShow,
        });
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const Toggle = ({ val, onChange }) => {
    const toggleSx = {
      s1: (val, C, DC) => ({
        width: 46,
        height: 26,
        borderRadius: 13,
        background: val ? C.primary : DC.border,
        position: "relative",
        cursor: "pointer",
        transition: "background 0.2s",
      }),
      s2: val => ({
        position: "absolute",
        top: 3,
        left: val ? 23 : 3,
        width: 20,
        height: 20,
        borderRadius: "50%",
        background: "white",
        transition: "left 0.2s",
      }),
    };

    return (
      <div onClick={() => onChange(!val)} style={toggleSx.s1(val, C, DC)}>
        <div style={toggleSx.s2(val)} />
      </div>
    );
  };

  return (
    <div style={sx.page}>
      <div style={sx.hero}>
        <IslamicPattern opacity={0.1} color="#FFFFFF" />
        <div style={S.absTopRight14}>
          <BackButton onPress={() => setPage("profile")} />
        </div>
        <div style={sx.s1(C)}>{t.settings || "الإعدادات"}</div>
        <Wave />
      </div>

      <div style={S.pad14}>
        <div style={S.sectionEyebrow(DC)}>المظهر</div>
        <div style={sx.card12}>
          <div style={sx.rowBetween}>
            <div style={sx.rowStart}>
              <span style={S.font22}>{dark ? "🌙" : "☀️"}</span>
              <div>
                <div style={sx.title14}>{t.darkMode || "الوضع الليلي"}</div>
                <div style={S.textMuted11(DC)}>
                  {dark ? "الوضع الليلي مفعّل" : "الوضع النهاري مفعّل"}
                </div>
              </div>
            </div>
            <Toggle val={dark} onChange={setDark} />
          </div>
        </div>

        <div style={S.sectionEyebrow(DC)}>اللغة / Language</div>
        <div style={sx.card12}>
          <div style={sx.s2}>
            {[
              ["ar", null, "العربية"],
              ["en", "🇬🇧", "English"],
            ].map(([v, flag, label]) => {
              const btnSx = {
                s1: (lang, v, DC, C) => ({
                  flex: 1,
                  padding: "14px 10px",
                  border: "none",
                  background: lang === v ? "#E8F4F0" : DC.white,
                  color: lang === v ? C.primary : DC.text2,
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: "inherit",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  borderLeft: v === "en" ? "1px solid " + DC.border : "none",
                }),
                s2: { borderRadius: 3 },
                s3: C => ({ fontSize: 14, color: C.primary }),
              };

              return (
                <button key={v} onClick={() => setLang(v)} style={btnSx.s1(lang, v, DC, C)}>
                  {v === "ar" ? (
                    <SyriaFlag width={28} height={18} style={btnSx.s2} />
                  ) : (
                    <span style={S.font20}>{flag}</span>
                  )}
                  <span>{label}</span>
                  {lang === v && <span style={btnSx.s3(C)}>✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div style={sx.card14}>
          <div style={sx.sectionRow}>
            <div style={sx.rowStart}>
              <span style={S.font22}>🎬</span>
              <div>
                <div style={sx.title14}>التشغيل التلقائي للفيديو</div>
                <div style={sx.subText}>في الرئيسية وعند فتح الإعلان</div>
              </div>
            </div>
            <Toggle val={autoPlayVideo} onChange={handleAutoPlay} />
          </div>
          {!autoPlayVideo && (
            <div style={sx.sectionMutedTop}>
              ✅ موفّر للبيانات — الفيديو يشتغل بالضغط عليه فقط
            </div>
          )}
        </div>

        <div style={sx.card14}>
          <div
            onClick={() => setOfflineMapsOpen(p => !p)}
            style={{ ...sx.cityHead, cursor: "pointer", justifyContent: "space-between", borderBottom: offlineMapsOpen ? "1px solid " + DC.border : "none" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={S.font22}>🗺️</span>
              <div>
                <div style={sx.title14}>خرائط أوفلاين</div>
                <div style={sx.subText}>حفظ خريطة مدينة للاستخدام بدون إنترنت</div>
              </div>
            </div>
            <span style={{ fontSize: 12, color: DC.text3 }}>{offlineMapsOpen ? "▲" : "▼"}</span>
          </div>

          {offlineMapsOpen && (
            <div style={sx.s3}>
              {cities.filter(c => CITY_BOUNDS[c]).map(city => {
                const savedCity = offlineCities.includes(city);
                const prog = dlProgress[city];

                const rowSx = {
                  s1: DC => ({
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 0",
                    borderBottom: "1px solid " + DC.border,
                  }),
                  s2: { height: 3, background: "#E8F4F0", borderRadius: 2, marginTop: 3, width: 100 },
                  s3: (C, prog) => ({
                    height: 3,
                    background: C.primary,
                    borderRadius: 2,
                    width: `${Math.round((prog.done / prog.total) * 100)}%`,
                    transition: "width 0.3s",
                  }),
                  s4: { display: "flex", gap: 6, alignItems: "center" },
                  s5: (savedCity, C) => ({
                    padding: "6px 14px",
                    borderRadius: 20,
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    fontSize: 11,
                    fontWeight: 700,
                    background: savedCity ? "#FEF2F2" : "#E8F4F0",
                    color: savedCity ? "#DC2626" : C.primary,
                  }),
                };

                return (
                  <div key={city} style={rowSx.s1(DC)}>
                    <div>
                      <div style={sx.cityName}>{city}</div>

                      {prog && (
                        <div style={sx.progressText}>
                          ⬇️ {prog.done}/{prog.total} بلاطة
                          <div style={rowSx.s2}>
                            <div style={rowSx.s3(C, prog)} />
                          </div>
                        </div>
                      )}

                      {savedCity && !prog && (
                        <div style={sx.progressText}>
                          ✅ محفوظة
                          {citySize[city] ? ` · ${(citySize[city] / 1024 / 1024).toFixed(1)} MB` : ""}
                        </div>
                      )}
                    </div>

                    {!prog && (
                      <div style={rowSx.s4}>
                        {!savedCity && (
                          <select
                            value={cityZoom[city] || 12}
                            onChange={e =>
                              setCityZoom(p => ({
                                ...p,
                                [city]: Number(e.target.value),
                              }))
                            }
                            style={sx.zoomSelect}
                          >
                            <option value={11}>zoom 11 — ~0.1MB</option>
                            <option value={12}>zoom 12 — ~0.7MB</option>
                            <option value={13}>zoom 13 — ~3MB</option>
                            <option value={14}>zoom 14 — ~12MB</option>
                            <option value={15}>zoom 15 — ~50MB</option>
                            <option value={16}>zoom 16 — ~200MB</option>
                          </select>
                        )}

                        <button
                          onClick={() => (savedCity ? deleteCityTiles(city) : downloadCityTiles(city))}
                          style={rowSx.s5(savedCity, C)}
                        >
                          {savedCity ? "🗑 حذف" : "⬇️ تحميل"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={S.sectionEyebrow(DC)}>أرقام التواصل</div>
        <div style={sx.card14}>
          {[
            ["📞", "هاتف 1", profilePhone, setProfilePhone, "09XXXXXXXX"],
            ["📞", "هاتف 2 (اختياري)", profilePhone2, setProfilePhone2, "09XXXXXXXX"],
            ["💬", "واتساب 1", profileWhatsapp, setProfileWhatsapp, "963XXXXXXXXX"],
            ["💬", "واتساب 2 (اختياري)", profileWhatsapp2, setProfileWhatsapp2, "963XXXXXXXXX"],
            ["📘", "Facebook / Messenger", profileMessengerId, setProfileMessengerId, "facebook.com/username أو username"],
          ].map(([icon, label, val, setter, ph], i, arr) => {
            const rowSx = {
              s1: (i, arr, DC) => ({
                padding: "12px 16px",
                borderBottom: i < arr.length - 1 ? "1px solid " + DC.border : "none",
              }),
            };

            return (
              <div key={i} style={rowSx.s1(i, arr, DC)}>
                <div style={sx.contactLabel}>
                  {icon} {label}
                </div>
                <input
                  value={val}
                  onChange={e => setter(e.target.value)}
                  onBlur={
                    label.includes("Facebook")
                      ? e => {
                          const parsed = normalizeFacebookIdentifier(e.target.value);
                          if (parsed.ok) setProfileMessengerId(parsed.value);
                        }
                      : undefined
                  }
                  placeholder={ph}
                  style={sx.contactInput}
                />
              </div>
            );
          })}
        </div>

        {showUpgradeSection && (
          <>
            <div style={S.sectionEyebrow(DC)}>ترقية الحساب</div>

            <div style={sx.card14}>
              <div style={sx.cityHead}>
                <span style={S.font22}>🏢</span>
                <div>
                  <div style={sx.title14}>طلب حساب مهني</div>
                  <div style={sx.subText}>
                    مناسب للمكاتب والوسطاء العقاريين، ويتم تفعيله بعد مراجعة الإدارة
                  </div>
                </div>
              </div>

              {upgradeStatus === "pending" ? (
                <div style={sx.upgradeBody}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: C.primary }}>
                    ⏳ طلبك قيد المراجعة
                  </div>
                  <div style={{ fontSize: 11, color: DC.text3, marginTop: 4 }}>
                    ستقوم الإدارة بمراجعة الطلب، ثم تفعيل الحساب المهني عند الموافقة.
                  </div>
                </div>
              ) : isStaleApprovedUpgrade ? (
                <div style={sx.upgradeBody}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#B45309" }}>
                    ⚠️ يوجد طلب تمت الموافقة عليه سابقًا، لكن حسابك حاليًا فردي
                  </div>
                  <div style={{ fontSize: 11, color: DC.text3, marginTop: 4, lineHeight: 1.7 }}>
                    إذا كنت تريد إعادة تفعيل الحساب المهني، أرسل طلبًا جديدًا أو تواصل مع الإدارة.
                  </div>
                  <button
                    type="button"
                    onClick={submitUpgradeRequest}
                    disabled={upgradeLoading}
                    style={sx.upgradeButton(upgradeLoading)}
                  >
                    {upgradeLoading ? "جارٍ الإرسال..." : "إرسال طلب جديد"}
                  </button>
                </div>
              ) : (
                <div style={sx.upgradeBody}>
                  {upgradeStatus === "rejected" && (
                    <div style={sx.rejectedBox}>
                      تم رفض الطلب السابق
                      {upgradeRequest.admin_note ? ` — ${upgradeRequest.admin_note}` : ""}
                    </div>
                  )}

                  {isRevokedUpgrade && (
                    <div style={sx.rejectedBox}>
                      تم إلغاء تفعيل الحساب المهني سابقًا، ويمكنك إرسال طلب جديد عند الحاجة.
                    </div>
                  )}

                  <div style={sx.proBox}>
                    <div style={sx.proTitle}>🏢 حساب مهني</div>
                    <div style={sx.proText}>
                      للمكاتب والوسطاء العقاريين. يمنحك هوية مهنية داخل التطبيق بعد موافقة الإدارة.
                    </div>
                  </div>

                  <textarea
                    value={upgradeNote}
                    onChange={e => setUpgradeNote(e.target.value)}
                    placeholder="اكتب اسم المكتب أو نبذة قصيرة عن نشاطك العقاري..."
                    style={sx.upgradeTextarea}
                  />

                  <button
                    type="button"
                    onClick={submitUpgradeRequest}
                    disabled={upgradeLoading}
                    style={sx.upgradeButton(upgradeLoading)}
                  >
                    {upgradeLoading ? "جارٍ الإرسال..." : "إرسال طلب الحساب المهني"}
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        <div style={sx.card14}>
          <div style={sx.shamHeader}>
            <span style={S.font18}>{"💳"}</span>
            <div>
              <div style={sx.s4(DC)}>شام كاش</div>
              <div style={S.textMuted11(DC)}>رقم حسابك وطريقة عرضه</div>
            </div>
          </div>

          <div style={sx.shamSection}>
            <div style={sx.smallLabel}>رقم الحساب</div>
            <div style={S.gap8}>
              <input
                value={localCode}
                onChange={e => setLocalCode(e.target.value)}
                placeholder="مثال:963911234567"
                style={sx.shamInput}
              />
              {localCode && (
                <button onClick={() => setLocalCode("")} style={sx.deleteBtn}>
                  حذف
                </button>
              )}
            </div>
          </div>

          <div style={sx.s5}>
            <div>
              <div style={sx.s6(DC)}>إظهار في ملفي الشخصي</div>
              <div style={sx.subText}>يظهر زر شام كاش لزوار ملفك</div>
            </div>

            <div
              onClick={() => localCode && setLocalShow(p => !p)}
              style={sx.s7(sx, localShow, localCode, C)}
            >
              <div style={sx.s8(sx, localShow, localCode)} />
            </div>
          </div>

          {localCode && localShow && (
            <div style={sx.previewBox}>
              <span style={S.font18}>{"💳"}</span>
              <div>
                <div style={sx.previewLabel}>سيظهر هكذا في ملفك</div>
                <div style={sx.previewCode}>{localCode}</div>
              </div>
            </div>
          )}
        </div>

        <button onClick={save} style={sx.s9(sx, saved, C)}>
          {saved ? "✓ تم الحفظ!" : "حفظ الإعدادات"}
        </button>
      </div>
    </div>
  );
}

export default SettingsPage;
