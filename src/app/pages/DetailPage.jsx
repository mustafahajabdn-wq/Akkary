import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { C } from "../../shared/constants/colors.js";
import { ImageGallery } from "../../shared/components/common/ImageGallery.jsx";
import { formatListingPrice } from "../../shared/utils/listingFormatters.js";
import { RatingModal, ReportModal, ShareModal } from "../components/modals.jsx";
import { QASection } from "../components/engagement.jsx";
import { getDetailCache, setDetailCache, warmListingImages } from "../../shared/utils/cache.js";
import { ensureLeafletLoaded } from "../../shared/utils/leafletLoader.js";
import { reportStorageKey } from "../../shared/utils/detailMap.js";
import { resolveListingMapMeta } from "../../shared/utils/mapLocation.js";
import { getAllGeoCoords } from "../services/geoCache.js";
import { createPriceMarkerIcon, createApproxLabelIcon, createPulseIcon } from "../../shared/utils/mapMarkers.js";
import { fetchListingDetail, incrementListingViews, incrementPhoneClicks, incrementWhatsappClicks } from "../services/listingService.js";
import { findOrCreateConversationForListing } from "../services/messaging.js";
import { S } from "../../shared/styles/primitives.js";
import { trackPropertyView, trackContactClick } from "../../shared/services/metaPixel.js";

import { DS, getDetailStyles } from "./DetailPage.styles.js";
import DetailInfoTab from "./DetailInfoTab.jsx";


function toWhatsAppNumber(value) {
  let n = String(value || "").trim();

  n = n.replace(/[^\d+]/g, "");
  if (n.startsWith("+")) n = n.slice(1);
  n = n.replace(/\D/g, "");

  if (n.startsWith("00")) n = n.slice(2);
  if (n.startsWith("963")) return n;
  if (n.startsWith("09")) return "963" + n.slice(1);
  if (n.startsWith("9") && n.length === 9) return "963" + n;

  return n;
}

function DetailPage({
  item: itemProp,
  setPage,
  prevPage = "home",
  setChat,
  favs,
  toggleFav,
  setSeller,
  follows = [],
  toggleFollow,
  isFollowing = () => false,
  DC: DCProp,
  user,
  cacheDetail
}) {
  const DC = DCProp || C;
  const sx = getDetailStyles(DC);
  const { id: urlId } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = React.useState(itemProp);
  const [fetchError, setFetchError] = React.useState(false);
  const [fromCache, setFromCache] = React.useState(false);
  const [isOffline, setIsOffline] = React.useState(!navigator.onLine);
  const [showCacheBanner, setShowCacheBanner] = React.useState(false);

  React.useEffect(() => {
    if (isOffline || fromCache) {
      const t = setTimeout(() => setShowCacheBanner(true), 1000);
      return () => clearTimeout(t);
    } else {
      setShowCacheBanner(false);
    }
  }, [isOffline, fromCache]);

  React.useEffect(() => {
    const onOnline = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    if (itemProp?.id) {
      sessionStorage.setItem("lastDetailId", String(itemProp.id));
    }
  }, [itemProp?.id]);

  useEffect(() => {
    if (itemProp?._skipFetch) {
      setItem(itemProp);
      setFetchError(false);
      setFromCache(false);
      setDetailCache(itemProp);
      warmListingImages(itemProp);
      return;
    }

    const id = urlId || (itemProp ? sessionStorage.getItem("lastDetailId") : null);

    if (!id || !Number.isFinite(Number(id))) {
      setFetchError(true);
      return;
    }

    const cached = getDetailCache(id, {
      allowStale: true
    });

    if (cached) {
      setItem(cached);
      setFromCache(true);
    }

    if (!navigator.onLine) {
      if (!cached) setFetchError(true);
      return;
    }

    const timer = setTimeout(() => {
      const c = getDetailCache(id, {
        allowStale: true
      });

      if (c) {
        setItem(c);
        setFromCache(true);
      } else {
        setFetchError(true);
      }
    }, 8000);

    const isOwnerOrAdminPreview =
      prevPage === "myListings" ||
      prevPage === "my-listings" ||
      prevPage === "owner" ||
      prevPage === "admin" ||
      prevPage === "pending" ||
      user?.role === "admin" ||
      user?.isAdmin === true ||
      (itemProp?.user_id && user?.id && itemProp.user_id === user.id) ||
      (itemProp?.sellerId && user?.id && itemProp.sellerId === user.id);

    const tryFetch = () => {
      fetchListingDetail(id, { publicOnly: !isOwnerOrAdminPreview })
        .then((mapped) => {
          clearTimeout(timer);

          if (!mapped) {
            const c = getDetailCache(id, {
              allowStale: true
            });

            if (c) {
              setItem(c);
              setFromCache(true);
            } else {
              setFetchError(true);
            }

            return;
          }

          setItem(mapped);
          setFromCache(false);
          setDetailCache(mapped);
          warmListingImages(mapped);

          if (cacheDetail) cacheDetail(mapped);
        })
        .catch(() => {
          clearTimeout(timer);

          const c = getDetailCache(id, {
            allowStale: true
          });

          if (c) {
            setItem(c);
            setFromCache(true);
          } else {
            setFetchError(true);
          }
        });
    };

    tryFetch();

    return () => clearTimeout(timer);
  }, [itemProp, urlId, prevPage, user?.id, user?.role, user?.isAdmin]);

  const [tab, setTab] = useState("details");
  const [showReport, setShowReport] = useState(false);
  const [hasReported, setHasReported] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [activePhone, setActivePhone] = useState(0);
  const [viewCount, setViewCount] = useState(0);
  const [refreshingViews, setRefreshingViews] = useState(false);
  const trackedMetaViewRef = useRef(null);

  const [geoCoords, setGeoCoords] = useState({
    districts: {},
    villages: {}
  });

  const isFaved = favs?.includes(item?.id);

  useEffect(() => {
    if (item?.views != null)
      setViewCount(prev => Math.max(prev, item.views));
  }, [item?.views]);

  useEffect(() => {
    if (!item?.id || trackedMetaViewRef.current === item.id) return;

    trackedMetaViewRef.current = item.id;
    trackPropertyView(item);
  }, [item?.id]);

  useEffect(() => {
    if (!user?.id || !item?.id) {
      setHasReported(false);
      return;
    }

    try {
      setHasReported(localStorage.getItem(reportStorageKey(user.id, "listing", item.id)) === "1");
    } catch {
      setHasReported(false);
    }
  }, [user?.id, item?.id]);

  const miniMapRef = useRef(null);
  const miniMapInst = useRef(null);
  const scrollRef = useRef(null);
  const tabsRef = useRef(null);
  const qaRef = useRef(null);

  useEffect(() => {
    if (item?._scrollToQA) {
      setTab("qa");

      setTimeout(() => {
        qaRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }, 500);
    }
  }, [item?._scrollToQA]);

  function scrollTabsToTop() {
    const tabs = tabsRef.current;
    if (!tabs) return;

    tabs.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  function handleTabPress(nextTab) {
    setTab(nextTab);
    window.setTimeout(scrollTabsToTop, 60);
  }

  useEffect(() => {
    let cancelled = false;

    getAllGeoCoords()
      .then((data) => {
        if (!cancelled) {
          setGeoCoords(
            data || {
              districts: {},
              villages: {}
            }
          );
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!item?.id) return;

    // الكاش مخصص للعرض السريع فقط.
    // لا نزيد المشاهدات اعتمادًا على نسخة الكاش حتى لا يُرسل رقم views قديم.
    if (fromCache) return;

    const viewKey = "viewed_" + item.id;
    const lastView = Number(localStorage.getItem(viewKey) || 0);
    const now = Date.now();

    if (lastView && now - lastView < 60 * 1000) return;

    const baseViews = Number(item?.views || 0);

    incrementListingViews(item.id, baseViews)
      .then((nextViews) => {
        if (nextViews === null) return;
        setViewCount(nextViews);
        localStorage.setItem(viewKey, String(now));
        // حدّث الكاش بالقيمة الجديدة بعد الاعتماد على نسخة حديثة لا على الكاش القديم.
        if (item) setDetailCache({ ...item, views: nextViews });
      })
      .catch(() => {});
  }, [item?.id, fromCache]);

  async function refreshViewsFromServer() {
    if (!item?.id || refreshingViews) return;

    try {
      setRefreshingViews(true);

      const fresh = await fetchListingDetail(item.id, {
        publicOnly: false
      });

      if (!fresh) return;

      const nextViews = Number(fresh.views || 0);
      const nextItem = { ...item, ...fresh, views: nextViews };

      setViewCount(nextViews);
      setItem(nextItem);
      setFromCache(false);
      setDetailCache(nextItem);
      if (cacheDetail) cacheDetail(nextItem);
    } catch (error) {
      console.warn("[DetailPage] refreshViewsFromServer", error);
    } finally {
      setRefreshingViews(false);
    }
  }

  const [poiLayers, setPoiLayers] = useState({});
  const [poiOpen, setPoiOpen] = useState(false);
  const [loadingPoi, setLoadingPoi] = useState({});
  const [activePoi, setActivePoi] = useState({});
  const poiMarkersRef = useRef({});

  useEffect(() => {
    return () => {
      Object.values(poiMarkersRef.current || {})
        .flat()
        .forEach((marker) => {
          try {
            miniMapInst.current?.removeLayer(marker);
          } catch {}
        });

      poiMarkersRef.current = {};

      if (miniMapInst.current) {
        try {
          if (miniMapInst.current.__detailInvalidateTimer) {
            clearTimeout(miniMapInst.current.__detailInvalidateTimer);
          }

          miniMapInst.current.remove();
        } catch {}

        miniMapInst.current = null;
      }
    };
  }, []);

  const POI_TYPES = [
    {
      key: "school",
      label: "مدارس",
      icon: "🏫",
      color: "#2563EB",
      query: 'nwr["amenity"="school"]'
    },
    {
      key: "kindergarten",
      label: "رياض أطفال",
      icon: "🧒",
      color: "#EC4899",
      query: 'nwr["amenity"="kindergarten"]'
    },
    {
      key: "hospital",
      label: "مشافٍ",
      icon: "🏥",
      color: "#DC2626",
      query: 'nwr["amenity"="hospital"]'
    },
    {
      key: "pharmacy",
      label: "صيدليات",
      icon: "💊",
      color: "#059669",
      query: 'nwr["amenity"="pharmacy"]'
    },
    {
      key: "market",
      label: "متاجر",
      icon: "🛒",
      color: "#D97706",
      query: 'nwr["shop"="supermarket"]'
    },
    {
      key: "mosque",
      label: "مساجد",
      icon: "🕌",
      color: "#7C3AED",
      query: 'nwr["amenity"="place_of_worship"]["religion"="muslim"]'
    },
    {
      key: "restaurant",
      label: "مطاعم",
      icon: "🍽️",
      color: "#EA580C",
      query: 'nwr["amenity"="restaurant"]'
    },
    {
      key: "park",
      label: "حدائق",
      icon: "🌳",
      color: "#65A30D",
      query: 'nwr["leisure"="park"]'
    }
  ];

  const haversineMeters = (lat1, lon1, lat2, lon2) => {
    const R = 6371000;
    const toRad = (v) => (v * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) ** 2;

    return Math.round(2 * R * Math.asin(Math.sqrt(a)));
  };

  const fetchPoi = async (type, lat, lng) => {
    if (!window.L || !miniMapInst.current) return;

    setLoadingPoi((p) => ({
      ...p,
      [type.key]: true
    }));

    const wasActive = !!activePoi[type.key];

    try {
      if (wasActive) {
        (poiMarkersRef.current[type.key] || []).forEach((m) => {
          miniMapInst.current.removeLayer(m);
        });

        poiMarkersRef.current[type.key] = [];

        setPoiLayers((p) => ({
          ...p,
          [type.key]: 0
        }));

        setActivePoi((p) => ({
          ...p,
          [type.key]: false
        }));

        setLoadingPoi((p) => ({
          ...p,
          [type.key]: false
        }));

        return;
      }

      const query = `[out:json][timeout:10];(${type.query}(around:1500,${lat},${lng}););out center 12;`;

      const mirrors = [
        "https://overpass-api.de/api/interpreter",
        "https://overpass.kumi.systems/api/interpreter",
        "https://overpass.openstreetmap.fr/api/interpreter"
      ];

      let json = null;
      let lastError = null;

      for (const url of mirrors) {
        const ctrl = new AbortController();
        const timeoutId = setTimeout(() => ctrl.abort(), 8000);

        try {
          const res = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "text/plain;charset=UTF-8"
            },
            body: query,
            signal: ctrl.signal
          });

          clearTimeout(timeoutId);

          if (!res.ok) throw new Error(`HTTP ${res.status}`);

          json = await res.json();
          break;
        } catch (err) {
          clearTimeout(timeoutId);
          lastError = err;
        }
      }

      if (!json) throw lastError || new Error("All Overpass mirrors failed");

      const items = (json?.elements || []).slice(0, 8);

      (poiMarkersRef.current[type.key] || []).forEach((m) => {
        miniMapInst.current.removeLayer(m);
      });

      poiMarkersRef.current[type.key] = [];

      const markers = items
        .map((el) => {
          const mLat = el.lat || el.center?.lat;
          const mLng = el.lon || el.center?.lon;

          if (!mLat || !mLng) return null;

          const dist = haversineMeters(lat, lng, mLat, mLng);

          const marker = window.L.circleMarker([mLat, mLng], {
            radius: 7,
            color: type.color,
            weight: 2,
            fillColor: type.color,
            fillOpacity: 0.9
          }).addTo(miniMapInst.current);

          marker.bindPopup(
            `<div style="font-family:Tajawal,sans-serif;direction:rtl;text-align:right"><b>${type.icon} ${
              el.tags?.name || type.label
            }</b><br/>يبعد ${dist} م</div>`
          );

          return marker;
        })
        .filter(Boolean);

      poiMarkersRef.current[type.key] = markers;

      setPoiLayers((p) => ({
        ...p,
        [type.key]: markers.length
      }));

      setActivePoi((p) => ({
        ...p,
        [type.key]: markers.length > 0
      }));
    } catch (e) {
      setPoiLayers((p) => ({
        ...p,
        [type.key]: 0
      }));

      setActivePoi((p) => ({
        ...p,
        [type.key]: false
      }));
    } finally {
      setLoadingPoi((p) => ({
        ...p,
        [type.key]: false
      }));
    }
  };

  const clearAllPoi = () => {
    Object.values(poiMarkersRef.current)
      .flat()
      .forEach((m) => {
        try {
          miniMapInst.current?.removeLayer(m);
        } catch (e) {}
      });

    poiMarkersRef.current = {};
    setPoiLayers({});
    setActivePoi({});
  };

  useEffect(() => {
    if (tab !== "map") return;

    if (miniMapInst.current) {
      const t1 = setTimeout(() => {
        miniMapInst.current?.invalidateSize();
      }, 50);

      const t2 = setTimeout(() => {
        miniMapInst.current?.invalidateSize();
      }, 200);

      const t3 = setTimeout(() => {
        miniMapInst.current?.invalidateSize();
      }, 500);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }

    if (!miniMapRef.current || !item) return;

    const init = () => {
      const L = window.L;

      if (!L || miniMapInst.current) return;

      const meta = resolveListingMapMeta(item, geoCoords);
      const { lat, lng, isApprox, label } = meta;

      const map = L.map(miniMapRef.current, {
        zoomControl: true
      }).setView([lat, lng], isApprox ? 14 : 16);

      miniMapInst.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OSM"
      }).addTo(map);

      setTimeout(() => {
        const zoomBox = miniMapRef.current?.querySelector(".leaflet-top.leaflet-left");
        if (zoomBox) zoomBox.style.marginTop = "56px";
      }, 0);

      const bigRadius = isApprox ? 900 : 200;

      L.circle([lat, lng], {
        radius: bigRadius,
        color: "#1A4A2E",
        fillColor: "#2D6B45",
        fillOpacity: 0.1,
        weight: 2.5,
        opacity: 0.6,
        dashArray: isApprox ? "8, 6" : null
      }).addTo(map);

      L.circle([lat, lng], {
        radius: bigRadius * 0.4,
        color: "#1A4A2E",
        fillColor: "#1A4A2E",
        fillOpacity: 0.18,
        weight: 0
      }).addTo(map);

      if (isApprox) {
        if (!document.getElementById("detail-map-pulse-style")) {
          const s = document.createElement("style");
          s.id = "detail-map-pulse-style";
          s.textContent =
            "@keyframes detailMapPulse{0%{transform:translate(-50%,-50%) scale(.6);opacity:.7}70%,100%{transform:translate(-50%,-50%) scale(2.2);opacity:0}}@keyframes detailMapPulse2{0%{transform:translate(-50%,-50%) scale(.6);opacity:.5}70%,100%{transform:translate(-50%,-50%) scale(1.6);opacity:0}}";
          document.head.appendChild(s);
        }

        const pulseIcon = createPulseIcon(L);
        const approxLabelIcon = createApproxLabelIcon(L, label);

        L.marker([lat, lng], {
          icon: pulseIcon,
          interactive: false,
          keyboard: false,
          zIndexOffset: 1
        }).addTo(map);

        L.marker([lat, lng], {
          icon: approxLabelIcon,
          zIndexOffset: 100
        }).addTo(map);
      } else {
        const icon = createPriceMarkerIcon(L, item, {
          approx: false,
          short: false,
          anchorX: 50,
          anchorY: 46
        });

        L.marker([lat, lng], {
          icon
        }).addTo(map);
      }

      const invalidateTimer = setTimeout(() => map.invalidateSize(), 200);
      map.__detailInvalidateTimer = invalidateTimer;
    };

    let cancelled = false;

    ensureLeafletLoaded()
      .then(() => {
        if (!cancelled) init();
      })
      .catch((err) => console.error("Failed to load local Leaflet bundle:", err));

    return () => {
      cancelled = true;
    };
  }, [
    tab,
    item?.id,
    item?.lat,
    item?.lng,
    item?.city,
    item?.district,
    item?.village,
    item?.price,
    item?.currency,
    item?.type,
    geoCoords
  ]);

  if (!item) {
    return (
      <div style={DS.loadingShell(DC)}>
        <div style={DS.loadingInner(DC)}>
          {fetchError ? (
            <>
              <div style={DS.icon48Mb12}>🔍</div>
              <div style={DS.errorTitle(DC)}>الإعلان غير موجود</div>
              <div style={DS.errorText}>ربما تم حذفه أو الرابط غير صحيح</div>
              <button
                onClick={() =>
                  navigate("/", {
                    replace: true
                  })
                }
                style={DS.homeButton}
              >
                العودة للرئيسية
              </button>
            </>
          ) : (
            <>
              <div style={DS.loadingIcon}>⏳</div>
              <div style={DS.loadingText}>جارٍ تحميل الإعلان...</div>
            </>
          )}
        </div>
      </div>
    );
  }

  const mapMeta = resolveListingMapMeta(item, geoCoords);

  return (
    <div style={DS.pageShell(DC)}>
      <div ref={scrollRef} style={DS.scrollContent}>
        <div style={DS.heroShell}>
          {item.images?.length > 0 || item.photo || item?.video_url ? (
            <>
              <ImageGallery
                images={item.images?.length > 0 ? item.images : item.photo ? [item.photo] : []}
                videoUrl={item?.video_url || null}
                autoPlayVideo={localStorage.getItem("autoPlayVideo") === "on"}
              />
            </>
          ) : (
            <div style={DS.heroFallback}>{"🏠"}</div>
          )}

          <div style={DS.heroTopBar}>
            <button onClick={() => setPage(prevPage || "home")} style={DS.heroBackButton}>
              →
            </button>

            <div style={DS.heroMeta}>
              {item?.city} · {item?.district} · {item?.category}
            </div>

            <button
              onClick={() => {
                const sid = item.user_id || item.sellerId;

                if (sid) {
                  setSeller({
                    ...item,
                    sellerId: sid
                  });

                  navigate(`/seller/${sid}`);
                } else {
                  setSeller({
                    ...item
                  });

                  setPage("sellerProfile");
                }
              }}
              style={DS.sellerButton}
            >
              <div style={DS.sellerAvatar}>{item?.sellerInit}</div>

              <div style={S.textRight}>
                <div style={DS.sellerName}>{item?.seller}</div>
                <div style={DS.sellerLink}>عرض الملف</div>
              </div>
            </button>
          </div>

          <div style={DS.heroLeftActions}>
            <button onClick={() => toggleFav(item?.id)} style={DS.heroCircleAction}>
              {isFaved ? "❤️" : "🤍"}
            </button>

            <button onClick={() => setShowShare(true)} style={DS.shareButton}>
              مشاركة
            </button>
          </div>

          <div style={DS.heroPricePill}>
            <span style={DS.heroPriceValue}>{formatListingPrice(item)}</span>
          </div>
        </div>

        {item?.external_url?.trim() &&
          (() => {
            const url = item.external_url.trim();

            let label = "مشاهدة الرابط الخارجي";
            let icon = "🔗";
            let color = "#374151";
            let bg = "#F3F4F6";

            const linkSx = {
              s1: (bg, color) => ({
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "11px 16px",
                background: bg,
                border: "none",
                borderBottom: `2px solid ${color}22`,
                cursor: "pointer",
                fontFamily: "Tajawal,sans-serif",
                direction: "rtl",
                textAlign: "right"
              }),
              s2: (color) => ({
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                color: "white",
                fontWeight: 900,
                flexShrink: 0
              }),
              s3: (color) => ({
                flex: 1,
                fontSize: 13,
                fontWeight: 800,
                color
              }),
              s4: (color) => ({
                fontSize: 16,
                color,
                opacity: 0.7
              })
            };

            try {
              const host = new URL(url).hostname.replace("www.", "");

              if (host.includes("youtube.com") || host.includes("youtu.be")) {
                label = "مشاهدة الفيديو على YouTube";
                icon = "▶";
                color = "#DC2626";
                bg = "#FEF2F2";
              } else if (host.includes("tiktok.com")) {
                label = "مشاهدة الفيديو على TikTok";
                icon = "♪";
                color = "#000";
                bg = "#F9FAFB";
              } else if (
                host.includes("facebook.com") ||
                host.includes("fb.watch") ||
                host.includes("fb.com")
              ) {
                label = "فتح الرابط على Facebook";
                icon = "f";
                color = "#1877F2";
                bg = "#EFF6FF";
              } else if (host.includes("t.me") || host.includes("telegram.me")) {
                label = "فتح الرابط على Telegram";
                icon = "✈";
                color = "#0088CC";
                bg = "#E0F2FE";
              } else if (host.includes("instagram.com")) {
                label = "فتح الرابط على Instagram";
                icon = "◉";
                color = "#E1306C";
                bg = "#FDF2F8";
              }
            } catch {}

            return (
              <button
                onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
                style={linkSx.s1(bg, color)}
              >
                <span style={linkSx.s2(color)}>{icon}</span>
                <span style={linkSx.s3(color)}>{label}</span>
                <span style={linkSx.s4(color)}>↗</span>
              </button>
            );
          })()}

        <div ref={tabsRef} style={sx.s2(DC)}>
          {[
            ["details", "التفاصيل"],
            ["desc", "الوصف"],
            ["qa", "الأسئلة"],
            ["map", "الخريطة"]
          ].map(([k, l]) => {
            const tabSx = {
              s1: (tab, k, C, DC) => ({
                flex: 1,
                padding: "11px 0",
                border: "none",
                borderBottom:
                  tab === k ? "3px solid " + C.primary : "3px solid transparent",
                fontSize: 13,
                fontWeight: 800,
                cursor: "pointer",
                fontFamily: "inherit",
                background: DC.white,
                color: tab === k ? C.primary : DC.text3,
                transition: "all 0.2s"
              })
            };

            return (
              <button
                key={k}
                onClick={() => handleTabPress(k)}
                style={tabSx.s1(tab, k, C, DC)}
              >
                {l}
              </button>
            );
          })}
        </div>

        {showCacheBanner && (
          <div style={sx.s3(isOffline)}>
            <span style={sx.s4}>{isOffline ? "📵" : ""}</span>
            <span style={sx.s5(isOffline)}>
              {isOffline
                ? "أنت غير متصل — تعرض نسخة محفوظة من هذا الإعلان"
                : "يعرض نسخة محفوظة — سيتحدث تلقائياً عند الاتصال"}
            </span>
          </div>
        )}

        {tab === "details" && (
          <DetailInfoTab
            item={item}
            user={user}
            DC={DC}
            hasReported={hasReported}
            onReport={() => !hasReported && setShowReport(true)}
            onRateSeller={() => setShowRating(true)}
          />
        )}

        {tab === "desc" && (
          <div style={DS.descWrap}>
            <div style={DS.descCard(DC)}>
              <div style={DS.descHeader}>
                <div style={DS.descTitle(DC)}>{item?.title}</div>

                <button
                  type="button"
                  onClick={refreshViewsFromServer}
                  disabled={refreshingViews}
                  title="تحديث عدد المشاهدات"
                  style={{
                    ...DS.viewPill(DC),
                    border: "none",
                    cursor: refreshingViews ? "wait" : "pointer",
                    opacity: refreshingViews ? 0.75 : 1
                  }}
                >
                  <span>{refreshingViews ? "⟳" : "👁"}</span>
                  <span style={DS.viewCount}>{viewCount || 0}</span>
                  <span>مشاهدة</span>
                </button>
              </div>

              <div style={DS.descText(DC)}>
                {(() => {
                  const desc = item?.desc;

                  const hasDesc =
                    desc !== null &&
                    desc !== undefined &&
                    String(desc).trim() !== "" &&
                    String(desc).trim().toLowerCase() !== "null" &&
                    String(desc).trim().toLowerCase() !== "undefined";

                  return hasDesc ? String(desc).trim() : "عقار";
                })()}
              </div>
            </div>
          </div>
        )}

        {tab === "qa" && (
          <div ref={qaRef} style={DS.descWrap}>
            <QASection
              listingId={item?.id}
              sellerId={item?.user_id || item?.sellerId}
              DC={DC}
              user={user}
            />
          </div>
        )}

        <div style={DS.mapShell(tab)}>
          <div style={DS.poiBarWrap}>
            <div style={DS.poiBar}>
              {POI_TYPES.map((type) => {
                const isActive = activePoi[type.key];
                const isLoading = loadingPoi[type.key];
                const count = poiLayers[type.key];

                return (
                  <button
                    key={type.key}
                    onClick={() => fetchPoi(type, mapMeta?.lat || 33.51, mapMeta?.lng || 36.29)}
                    style={DS.poiButton(type, isActive, isLoading)}
                  >
                    <span>{type.icon}</span>
                    <span>{isLoading ? "⏳" : type.label}</span>
                    {count > 0 && <span style={DS.poiCount(isActive)}>{count}</span>}
                  </button>
                );
              })}

              {Object.keys(activePoi).some((k) => activePoi[k]) && (
                <button
                  onClick={() => {
                    clearAllPoi();
                  }}
                  style={DS.poiClear}
                >
                  × مسح
                </button>
              )}
            </div>
          </div>

          <div ref={miniMapRef} style={DS.mapCanvas} />
        </div>
      </div>

      <div style={DS.footerBar(DC)}>
        {(() => {
          const hasMid = item?.messenger_id && item.messenger_id.trim() !== "";
          const tabs = [true, !!item.phone2, hasMid].filter(Boolean).length;

          const sx = {
            s1: (activePhone, C, DC) => ({
              width: 28,
              height: 4,
              borderRadius: 2,
              background: activePhone === 1 ? C.primary : DC.border,
              cursor: "pointer",
              transition: "background 0.2s"
            }),
            s2: (activePhone, item) => ({
              width: 28,
              height: 4,
              borderRadius: 2,
              background: "#1877F2",
              cursor: "pointer",
              transition: "background 0.2s",
              opacity: activePhone === (item.phone2 ? 2 : 1) ? 1 : 0.3
            })
          };

          if (tabs <= 1) return null;

          return (
            <div style={DS.footerDots}>
              <div
                onClick={() => setActivePhone(0)}
                style={DS.footerDot(activePhone === 0 ? C.primary : DC.border)}
              />

              {item.phone2 && (
                <div onClick={() => setActivePhone(1)} style={sx.s1(activePhone, C, DC)} />
              )}

              {hasMid && (
                <div
                  onClick={() => setActivePhone(item.phone2 ? 2 : 1)}
                  style={sx.s2(activePhone, item)}
                />
              )}
            </div>
          );
        })()}

        <div style={DS.actionsRow}>
          <button
            onClick={async () => {
              if (!user) {
                setPage("login");
                return;
              }

              const sellerId = item.user_id || item.sellerId;

              if (!sellerId) {
                alert("لا يمكن المراسلة");
                return;
              }

              try {
                const res = await findOrCreateConversationForListing(user.id, sellerId, item.id);
                const conv = res?.conv;

                if (conv) {
                  setChat({
                    ...conv,
                    name: item.seller || "مستخدم",
                    property: item.title || ""
                  });

                  setTimeout(() => setPage("chat"), 50);
                }
              } catch (convErr) {
                alert("خطأ:" + (convErr?.message || "تعذر إنشاء المحادثة"));
              }
            }}
            style={DS.chatButton}
          >
            {"💬 مراسلة"}
          </button>

          {(() => {
            const hasMid = item?.messenger_id && item.messenger_id.trim() !== "";
            const messengerTab = item.phone2 ? 2 : 1;

            if (hasMid && activePhone === messengerTab) {
              let mid = item.messenger_id.trim();

              try {
                if (mid.includes("facebook.com")) {
                  const url = new URL(mid);

                  if (url.searchParams.get("id")) {
                    mid = url.searchParams.get("id");
                  } else {
                    mid = url.pathname.replace("/", "").split("?")[0];
                  }
                }
              } catch {}

              return (
                <button onClick={() => window.open(`https://m.me/${mid}`, "_blank")} style={DS.messengerButton}>
                  <span>📘</span>
                  <span style={DS.phoneLabel}>Messenger</span>
                </button>
              );
            }

            const ph = activePhone === 1 && item.phone2 ? item.phone2 : item.phone;

            if (!ph) return null;

            return (
              <>
                <button
                  onClick={() => {
                    trackContactClick(item, "phone");
                    window.open("tel:" + ph);

                    if (item?.id) incrementPhoneClicks(item.id);
                  }}
                  style={DS.phoneButton(DC)}
                >
                  <span>{"📞"}</span>
                  <span style={DS.phoneLabel}>{ph}</span>
                </button>

                <button
                  onClick={() => {
                    trackContactClick(item, "whatsapp");
                    const waNumber = toWhatsAppNumber(ph);

                    if (!waNumber) {
                      alert("رقم الواتساب غير صحيح");
                      return;
                    }

                    window.open("https://wa.me/" + waNumber, "_blank", "noopener,noreferrer");

                    if (item?.id) incrementWhatsappClicks(item.id);
                  }}
                  style={DS.whatsappButton}
                >
                  <span>{"💬"}</span>
                  <span style={DS.phoneLabel}>{ph}</span>
                </button>
              </>
            );
          })()}

          {(item.phone2 || (item?.messenger_id && item.messenger_id.trim() !== "")) && (
            <button
              onClick={() => {
                const hasMid = item?.messenger_id && item.messenger_id.trim() !== "";
                const max = (item.phone2 ? 1 : 0) + (hasMid ? 1 : 0);

                setActivePhone((p) => (p >= max ? 0 : p + 1));
              }}
              style={DS.switchButton(DC)}
            >
              {"❯"}
            </button>
          )}
        </div>
      </div>

      {showShare && <ShareModal item={item} onClose={() => setShowShare(false)} DC={DC} />}

      {showReport && (
        <ReportModal
          itemTitle={item.title}
          itemId={item.id}
          onClose={() => setShowReport(false)}
          onReported={() => setHasReported(true)}
          DC={DC}
        />
      )}

      {showRating && (
        <RatingModal
          sellerName={item.sellerName || item.seller}
          sellerId={item.sellerId}
          onClose={() => setShowRating(false)}
        />
      )}
    </div>
  );
}

export default DetailPage;
