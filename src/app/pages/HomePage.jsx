import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { C } from "../../shared/constants/colors.js";
import { cities } from "../../shared/utils/geo.js";
import { T } from "../../shared/utils/i18n.js";
import { IslamicPattern, Star, Wave } from "../../shared/components/icons.jsx";
import { ListingCard } from "../../shared/components/common/ListingCard.jsx";
import { AdCard } from "../../shared/components/common/AdCard.jsx";
import { StoryViewer, StoriesBar } from "../components/common/Stories.jsx";
import { LoadMoreButton } from "../../shared/components/common/LoadMoreButton.jsx";
import { FilterBar } from "../components/common/FilterBar.jsx";
import InstallCard from "../components/InstallCard.jsx";
import { AddStoryModal } from "../components/modals.jsx";
import { getCities, getDistricts as getDistrictsCache, getDistrictByName, getVillages } from "../services/geoCache.js";
import { applyListingFilters } from "../../shared/utils/listingFilters.js";
import { findOrCreateConversation, sendConversationText } from "../services/messaging.js";
import { fetchPropertyTypes, fetchPropertyFieldOptions, fetchAppSettings } from "../services/propertyService.js";
import { fetchActiveAds } from "../services/adService.js";
import { fetchUserSavedSearches, createSavedSearch, deleteSavedSearch } from "../services/savedSearchService.js";
import { getCurrentUserId } from "../services/authService.js";
import { incrementAdImpressions } from "../services/listingService.js";
import { S } from "../../shared/styles/primitives.js";

function hasActiveFilterValue(value) {
  if (Array.isArray(value)) return value.length > 0;
  return value !== undefined && value !== null && value !== "" && value !== "الكل" && value !== "newest";
}

function filterLabelList(value) {
  if (Array.isArray(value)) return value.filter(Boolean).join(",");
  return value || "";
}

function getDbTypeFromActiveType(activeType) {
  if (activeType === "للبيع" || activeType === "sell") return "sell";
  if (activeType === "للإيجار" || activeType === "rent" || activeType === "lease" || activeType === "تأجير") return "rent";
  if (activeType === "want_buy" || activeType === "مطلوب شراء") return "want_buy";
  if (activeType === "want_rent" || activeType === "مطلوب للإيجار" || activeType === "مطلوب إيجار") return "want_rent";
  return null;
}

const normalizeFollowId = (item) => {
  if (!item) return null;
  if (typeof item === "string") return item;
  return item.seller_id || item.user_id || item.id || null;
};

const VIEWED_STORIES_TTL_MS = 24 * 60 * 60 * 1000;

const getViewedStoriesKey = (userId) => `viewedStories_${userId}`;

function formatHomeListingTimeAgo(createdAt) {
  if (!createdAt) return "";

  const createdMs = new Date(createdAt).getTime();
  if (!Number.isFinite(createdMs)) return "";

  const diff = Math.max(0, Date.now() - createdMs);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const month = 30 * day;
  const year = 365 * day;

  if (diff < minute) return "الآن";
  if (diff < hour) return `منذ ${Math.floor(diff / minute)} د`;
  if (diff < day) return `منذ ${Math.floor(diff / hour)} س`;
  if (diff < month) return `منذ ${Math.floor(diff / day)} يوم`;
  if (diff < year) return `منذ ${Math.floor(diff / month)} شهر`;
  return `منذ ${Math.floor(diff / year)} سنة`;
}

const normalizeStoryId = (value) => {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim();
  return normalized || null;
};

const getStoryCreatedAtMs = (storyLike) => {
  if (!storyLike) return 0;

  if (typeof storyLike.createdAt === "number") return storyLike.createdAt;
  if (typeof storyLike.created_at === "number") return storyLike.created_at;

  const createdAtValue = storyLike.createdAt || storyLike.created_at;
  if (typeof createdAtValue === "string") {
    const parsed = new Date(createdAtValue).getTime();
    if (!Number.isNaN(parsed)) return parsed;
  }

  return 0;
};

const getStoryOwnerId = (storyLike) => {
  if (!storyLike) return null;
  return normalizeStoryId(storyLike.ownerId || storyLike.owner_id || storyLike.userId || storyLike.user_id);
};

const getStoryExpiryMs = (storyLike) => {
  if (!storyLike) return null;

  if (typeof storyLike.expiresAt === "number") return storyLike.expiresAt;
  if (typeof storyLike.expires_at === "number") return storyLike.expires_at;

  const expiresAtValue = storyLike.expiresAt || storyLike.expires_at;
  if (typeof expiresAtValue === "string") {
    const parsed = new Date(expiresAtValue).getTime();
    if (!Number.isNaN(parsed)) return parsed;
  }

  const createdAtValue = getStoryCreatedAtMs(storyLike);
  if (createdAtValue > 0) return createdAtValue + VIEWED_STORIES_TTL_MS;

  return null;
};

const buildViewedUsersMap = (items = []) => {
  return items.reduce((acc, item) => {
    const ownerId = normalizeStoryId(item.ownerId);
    if (!ownerId) return acc;

    const current = acc[ownerId];
    if (!current || (item.storyCreatedAt || 0) >= (current.lastStoryAt || 0)) {
      acc[ownerId] = {
        lastStoryAt: item.storyCreatedAt || 0,
        expiresAt: item.expiresAt || 0,
        seenAt: item.seenAt || 0
      };
    }

    return acc;
  }, {});
};

const normalizeViewedStoriesPayload = (payload) => {
  const now = Date.now();

  if (Array.isArray(payload)) {
    return {
      items: payload
        .map(id => normalizeStoryId(id))
        .filter(Boolean)
        .map(id => ({
          id,
          ownerId: null,
          storyCreatedAt: 0,
          seenAt: now,
          expiresAt: now + VIEWED_STORIES_TTL_MS
        }))
    };
  }

  if (payload && typeof payload === "object") {
    const source = Array.isArray(payload.items) ? payload.items : [];

    return {
      items: source
        .map(item => {
          const id = normalizeStoryId(item?.id);
          if (!id) return null;

          const seenAt = typeof item.seenAt === "number" ? item.seenAt : now;
          const expiresAt = typeof item.expiresAt === "number"
            ? item.expiresAt
            : getStoryExpiryMs(item) || seenAt + VIEWED_STORIES_TTL_MS;

          return {
            id,
            ownerId: getStoryOwnerId(item),
            storyCreatedAt: typeof item.storyCreatedAt === "number"
              ? item.storyCreatedAt
              : getStoryCreatedAtMs(item),
            seenAt,
            expiresAt
          };
        })
        .filter(Boolean)
    };
  }

  return { items: [] };
};

const pruneViewedStoriesPayload = (payload) => {
  const now = Date.now();
  const normalized = normalizeViewedStoriesPayload(payload);

  return {
    items: normalized.items.filter(item => {
      if (typeof item.expiresAt === "number") return item.expiresAt > now;
      return now - item.seenAt < VIEWED_STORIES_TTL_MS;
    })
  };
};

const readViewedStoriesState = (userId) => {
  if (!userId) return { ids: [], users: {}, payload: { items: [] } };

  try {
    const raw = localStorage.getItem(getViewedStoriesKey(userId));
    const parsed = raw ? JSON.parse(raw) : { items: [] };
    const payload = pruneViewedStoriesPayload(parsed);

    return {
      ids: payload.items.map(item => item.id),
      users: buildViewedUsersMap(payload.items),
      payload
    };
  } catch {
    return { ids: [], users: {}, payload: { items: [] } };
  }
};

function HomePage({
  setPage,
  setDetail,
  openDetail,
  setDetailPrevPage,
  setSeller,
  setSelectedAd,
  favs,
  toggleFav,
  follows = [],
  toggleFollow,
  isFollowing = () => false,
  DC,
  lang,
  dark,
  setDark,
  sbListings = [],
  hasMoreListings = true,
  loadMoreListings = () => {},
  loadListings = () => {},
  loadingMore = false,
  user,
  unreadNotifs = 0,
  setUnreadNotifs,
  showInstall = false,
  onInstall = () => {},
  onDismissInstall = () => {},
  isOffline = false
}) {
  const t = T[lang] || T["ar"];

  const [savedSearches, setSavedSearches] = useState([]);
  const [toastMsg, setToastMsg] = useState("");
  const [ads, setAds] = useState([]);
  const [adsInterval, setAdsInterval] = useState(10);
  const [adsSize, setAdsSize] = useState("normal");
  const [homeTypes, setHomeTypes] = useState([]);
  const [filterOpts, setFilterOpts] = useState({
    condition: [],
    finishing: [],
    heating: [],
    furnished: []
  });
  const [filterDistricts, setFilterDistricts] = useState([]);
  const [filterVillages, setFilterVillages] = useState([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingVillages, setLoadingVillages] = useState(false);
  const [districtsError, setDistrictsError] = useState("");
  const [villagesError, setVillagesError] = useState("");
  const [activeSearchId, setActiveSearchId] = useState(null);
  const [cityOptions, setCityOptions] = useState(() => ["الكل", ...cities]);
  const [visibleCount, setVisibleCount] = useState(20);
  const [internalLoadingMore, setInternalLoadingMore] = useState(false);
  const [cardSettings, setCardSettings] = useState(() => {
    try {
      const savedShowTimeAgo = localStorage.getItem("card_show_time_ago");
      return {
        showSellerName: false,
        showPriceOnContact: true,
        showTimeAgo: savedShowTimeAgo === "true"
      };
    } catch {
      return {
        showSellerName: false,
        showPriceOnContact: true,
        showTimeAgo: false
      };
    }
  });
  const [sbStories, setSbStories] = useState([]);
  const [viewingStories, setViewingStories] = useState(null);
  const [viewedStoryIds, setViewedStoryIds] = useState([]);
  const [viewedUsersMap, setViewedUsersMap] = useState({});
  const [showAddStory, setShowAddStory] = useState(false);
  const [activeType, setActiveType] = useState("الكل");
  const [activeCity, setActiveCity] = useState("الكل");
  const [activeDistrict, setActiveDistrict] = useState("الكل");
  const [activeVillage, setActiveVillage] = useState("الكل");
  const [activeSheet, setActiveSheet] = useState(null);
  const [filters, setFilters] = useState({});

  const followIdsSet = useMemo(() => {
    return new Set((follows || []).map(normalizeFollowId).filter(Boolean));
  }, [follows]);

  const sx = {
    s1: DC => ({
      background: DC.bg,
      minHeight: "100vh",
      paddingBottom: 80
    }),
    s2: C => ({
      background: C.primary,
      padding: "48px 20px 50px",
      position: "relative",
      overflow: "hidden"
    }),
    s3: {
      position: "absolute",
      top: 20,
      left: 20,
      opacity: 0.3
    },
    s4: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 18
    },
    s5: {
      fontSize: 11,
      color: "rgba(255,255,255,0.5)",
      letterSpacing: 1,
      marginBottom: 2
    },
    s6: C => ({
      fontSize: 26,
      fontWeight: 900,
      color: C.white
    }),
    s7: C => ({
      color: C.gold2
    }),
    s8: {
      position: "relative",
      width: 36,
      height: 36,
      borderRadius: "50%",
      background: "rgba(255,255,255,0.12)",
      border: "none",
      fontSize: 16,
      cursor: "pointer"
    },
    s9: {
      position: "absolute",
      top: 2,
      right: 2,
      width: 16,
      height: 16,
      borderRadius: "50%",
      background: "#EF4444",
      border: "1.5px solid white",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 9,
      color: "white",
      fontWeight: 900
    },
    s10: {
      position: "relative",
      width: 36,
      height: 36,
      borderRadius: "50%",
      background: "rgba(255,255,255,0.12)",
      border: "none",
      fontSize: 16,
      cursor: "pointer"
    },
    s11: C => ({
      position: "absolute",
      top: 4,
      right: 4,
      width: 8,
      height: 8,
      borderRadius: "50%",
      background: "#EF4444",
      border: "1.5px solid " + C.primary
    }),
    s12: {
      width: 36,
      height: 36,
      borderRadius: "50%",
      background: "rgba(255,255,255,0.12)",
      border: "none",
      fontSize: 16,
      cursor: "pointer"
    },
    s13: {
      width: 44,
      height: 44,
      borderRadius: 12,
      background: "rgba(255,255,255,0.15)",
      border: "none",
      fontSize: 20,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0
    },
    s14: C => ({
      flex: 1,
      background: C.white,
      borderRadius: 12,
      padding: "11px 14px",
      display: "flex",
      alignItems: "center",
      gap: 8,
      cursor: "pointer",
      boxShadow: "0 4px 20px rgba(0,0,0,0.2)"
    }),
    s15: C => ({
      fontSize: 16,
      color: C.text3
    }),
    s16: C => ({
      fontSize: 13,
      color: C.text3,
      flex: 1
    }),
    s17: {
      display: "flex",
      alignItems: "center",
      gap: 6
    },
    s18: (filters, C) => ({
      fontSize: 11,
      color: filters._newOnly ? "#fff" : C.primary,
      background: filters._newOnly ? C.primary : "none",
      border: "none",
      borderRadius: 20,
      padding: filters._newOnly ? "4px 10px" : "0",
      cursor: "pointer",
      fontFamily: "inherit",
      fontWeight: 700,
      display: "flex",
      alignItems: "center",
      gap: 4,
      transition: "all 0.2s"
    }),
    s19: {
      padding: "14px 14px 0"
    },
    s20: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12
    },
    s21: {
      display: "flex",
      alignItems: "center",
      gap: 8
    },
    s22: DC => ({
      fontSize: 15,
      fontWeight: 800,
      color: DC.text
    }),
    s23: DC => ({
      fontSize: 12,
      color: DC.text3
    }),
    s24: DC => ({
      textAlign: "center",
      padding: "40px 20px",
      color: DC.text3
    }),
    s25: DC => ({
      fontSize: 15,
      fontWeight: 700,
      marginTop: 10,
      color: DC.text
    }),
    s26: DC => ({
      fontSize: 12,
      color: DC.text3,
      marginTop: 6,
      lineHeight: 1.7
    }),
    s27: DC => ({
      fontSize: 15,
      fontWeight: 700,
      marginTop: 10,
      color: DC.text
    }),
    s28: {
      fontSize: 15,
      fontWeight: 700,
      marginTop: 10
    },
    s29: C => ({
      marginTop: 12,
      padding: "9px 22px",
      background: C.primary,
      color: "white",
      border: "none",
      borderRadius: 9,
      fontSize: 13,
      fontWeight: 700,
      fontFamily: "Tajawal,sans-serif",
      cursor: "pointer"
    })
  };

  useEffect(() => {
    fetchPropertyTypes().then(data => {
      if (data?.length) setHomeTypes(data);
    });

    fetchPropertyFieldOptions(["condition", "finishing", "heating", "furnished"]).then(data => {
      if (!data?.length) return;

      const opts = {
        condition: [],
        finishing: [],
        heating: [],
        furnished: []
      };

      data.forEach(f => {
        const key = f.field_key;
        if (opts[key] !== undefined && Array.isArray(f.options)) {
          f.options.forEach(o => {
            if (!opts[key].includes(o)) opts[key].push(o);
          });
        }
      });

      setFilterOpts(opts);
    });
  }, []);

  useEffect(() => {
    fetchAppSettings([
      "ads_enabled",
      "ads_interval",
      "ads_card_size",
      "card_show_seller_name",
      "card_show_price_on_contact",
      "card_show_time_ago"
    ]).then(map => {
      const nextCardSettings = {
        showSellerName: map.card_show_seller_name !== "false",
        showPriceOnContact: map.card_show_price_on_contact !== "false",
        showTimeAgo: map.card_show_time_ago !== "false"
      };

      setCardSettings(nextCardSettings);

      try {
        localStorage.setItem("card_show_time_ago", nextCardSettings.showTimeAgo ? "true" : "false");
      } catch {}

      if (map.ads_enabled === "false") return;
      if (map.ads_interval) setAdsInterval(Number(map.ads_interval) || 10);
      if (map.ads_card_size) setAdsSize(map.ads_card_size);

      fetchActiveAds().then(adsData => {
        if (adsData?.length) setAds(adsData);
      });
    });
  }, []);

  useEffect(() => {
    getCities().then(data => {
      if (data?.length) setCityOptions(["الكل", ...data.map(c => c.name)]);
    });
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    fetchUserSavedSearches(user.id).then(data => {
      if (data?.length) setSavedSearches((data || []).slice(0, 10));
    });
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setViewedStoryIds([]);
      setViewedUsersMap({});
      return;
    }

    const current = readViewedStoriesState(user.id);

    setViewedStoryIds(current.ids);
    setViewedUsersMap(current.users);

    try {
      localStorage.setItem(getViewedStoriesKey(user.id), JSON.stringify(current.payload));
    } catch {}

    if (current.ids.length) return;

    try {
      const legacyRaw = localStorage.getItem("viewedStories");
      const legacyParsed = legacyRaw ? JSON.parse(legacyRaw) : [];
      const legacyPayload = pruneViewedStoriesPayload(legacyParsed);
      const legacyIds = legacyPayload.items.map(item => item.id);

      setViewedStoryIds(legacyIds);
      setViewedUsersMap(buildViewedUsersMap(legacyPayload.items));

      if (legacyIds.length) {
        localStorage.setItem(getViewedStoriesKey(user.id), JSON.stringify(legacyPayload));
      }
    } catch {
      setViewedStoryIds([]);
      setViewedUsersMap({});
    }
  }, [user?.id]);

  useEffect(() => {
    if (activeCity === "الكل") {
      setFilterDistricts([]);
      setFilterVillages([]);
      setLoadingDistricts(false);
      setLoadingVillages(false);
      return;
    }

    setFilterDistricts([]);
    setFilterVillages([]);
    setActiveDistrict("الكل");
    setActiveVillage("الكل");
    setLoadingDistricts(true);
    setDistrictsError("");

    getDistrictsCache(activeCity).then(data => {
      setFilterDistricts(data);
      setDistrictsError(data?.length ? "" : "لا توجد أحياء مسجّلة لهذه المدينة");
      setLoadingDistricts(false);
    }).catch(() => {
      setFilterDistricts([]);
      setLoadingDistricts(false);
      setDistrictsError("خطأ في الاتصال");
    });
  }, [activeCity]);

  useEffect(() => {
    if (activeDistrict === "الكل") {
      setFilterVillages([]);
      setLoadingVillages(false);
      setVillagesError("");
      return;
    }

    setFilterVillages([]);
    setActiveVillage("الكل");
    setLoadingVillages(true);
    setVillagesError("");

    const localDistrict = filterDistricts.find(d => d.name === activeDistrict);

    const loadVillages = districtId => {
      getVillages(districtId).then(data => {
        setFilterVillages(data);
        setLoadingVillages(false);
      }).catch(() => {
        setVillagesError("تعذّر جلب القرى");
        setLoadingVillages(false);
      });
    };

    if (localDistrict?.id) {
      loadVillages(localDistrict.id);
      return;
    }

    getDistrictByName(activeDistrict, activeCity).then(dist => {
      loadVillages(dist?.id || null);
    });
  }, [activeCity, activeDistrict, filterDistricts]);

  useEffect(() => {
    setVisibleCount(20);
  }, [activeType, activeCity, activeDistrict, activeVillage, filters]);

  const serverFilters = useMemo(() => ({
    activeType,
    activeCity,
    activeDistrict,
    activeVillage,
    filters
  }), [activeType, activeCity, activeDistrict, activeVillage, filters]);

  const loadListingsRef = useRef(loadListings);
  const loadMoreListingsRef = useRef(loadMoreListings);

  useEffect(() => {
    loadListingsRef.current = loadListings;
  }, [loadListings]);

  useEffect(() => {
    loadMoreListingsRef.current = loadMoreListings;
  }, [loadMoreListings]);

  const isFirstFilterRender = useRef(true);

  useEffect(() => {
    if (isFirstFilterRender.current) {
      isFirstFilterRender.current = false;
      return;
    }

    const fn = loadListingsRef.current;
    if (typeof fn !== "function") return;

    Promise.resolve(fn(true, serverFilters)).catch(err => {
      console.error("loadListings on filter change failed:", err);
    });
  }, [serverFilters]);

  const filtered = useMemo(() => applyListingFilters(sbListings, {
    activeType,
    activeCity,
    activeDistrict,
    activeVillage,
    filters
  }), [sbListings, activeType, activeCity, activeDistrict, activeVillage, filters]);

  const hasFilters =
    activeType !== "الكل" ||
    activeCity !== "الكل" ||
    activeDistrict !== "الكل" ||
    activeVillage !== "الكل" ||
    Object.values(filters).some(hasActiveFilterValue);

  const handleLoadMorePress = useCallback(async () => {
    if (loadingMore || internalLoadingMore) return;

    const nextTarget = visibleCount + 20;
    setVisibleCount(nextTarget);

    if (filtered.length >= nextTarget) return;
    if (!hasMoreListings) return;

    setInternalLoadingMore(true);

    try {
      const fn = loadMoreListingsRef.current;
      if (typeof fn === "function") {
        await Promise.resolve(fn(serverFilters));
      }
    } catch (err) {
      console.error("loadMoreListings with filters failed:", err);
    } finally {
      setInternalLoadingMore(false);
    }
  }, [
    visibleCount,
    loadingMore,
    internalLoadingMore,
    hasMoreListings,
    filtered.length,
    serverFilters
  ]);

  const openSheet = useCallback(name => setActiveSheet(s => s === name ? null : name), []);
  const closeSheet = useCallback(() => setActiveSheet(null), []);

  const markStoriesViewed = useCallback((storyEntries = [], ownerId = null) => {
    if (!user?.id || !Array.isArray(storyEntries) || !storyEntries.length) return;

    const now = Date.now();
    const currentState = readViewedStoriesState(user.id);
    const itemsMap = new Map(currentState.payload.items.map(item => [item.id, item]));

    storyEntries.forEach(entry => {
      const storyId = normalizeStoryId(typeof entry === "string" ? entry : entry?.id);
      if (!storyId) return;

      const resolvedOwnerId = normalizeStoryId(
        ownerId || (typeof entry === "object" ? getStoryOwnerId(entry) : null)
      );

      const storyCreatedAt = typeof entry === "string" ? 0 : getStoryCreatedAtMs(entry);
      const expiresAt = typeof entry === "string"
        ? now + VIEWED_STORIES_TTL_MS
        : getStoryExpiryMs(entry) || now + VIEWED_STORIES_TTL_MS;

      itemsMap.set(storyId, {
        id: storyId,
        ownerId: resolvedOwnerId,
        storyCreatedAt,
        seenAt: now,
        expiresAt
      });
    });

    const prunedPayload = pruneViewedStoriesPayload({
      items: Array.from(itemsMap.values())
    });

    const nextIds = prunedPayload.items.map(item => item.id);
    const nextUsers = buildViewedUsersMap(prunedPayload.items);

    try {
      localStorage.setItem(getViewedStoriesKey(user.id), JSON.stringify(prunedPayload));
    } catch {}

    setViewedStoryIds(prev => {
      if (prev.length === nextIds.length && prev.every(id => nextIds.includes(id))) {
        return prev;
      }

      return nextIds;
    });

    setViewedUsersMap(nextUsers);
  }, [user?.id]);

  const markStoryViewed = useCallback((storyEntry, storyUser = null) => {
    if (!storyEntry) return;

    const resolvedOwnerId = normalizeStoryId(storyUser?.id || getStoryOwnerId(storyEntry));

    markStoriesViewed([
      typeof storyEntry === "object"
        ? {
            ...storyEntry,
            ownerId: resolvedOwnerId
          }
        : storyEntry
    ], resolvedOwnerId);
  }, [markStoriesViewed]);

  const handleViewStory = useCallback(storyUser => {
    const src = Array.isArray(sbStories) ? sbStories.filter(Boolean) : [];
    const withStories = src.filter(u => u.stories?.length > 0);

    const ordered = [
      ...withStories.filter(u => u.isMe),
      ...withStories.filter(u => !u.isMe && followIdsSet.has(u.id)),
      ...withStories.filter(u => !u.isMe && !followIdsSet.has(u.id))
    ];

    if (!ordered.length) return;

    const selectedUser = ordered.find(u => u.id === storyUser.id);

    if (selectedUser && !selectedUser.isMe) {
      markStoriesViewed(
        (selectedUser.stories || []).map(story => ({ ...story, ownerId: selectedUser.id })),
        selectedUser.id
      );
    }

    const startIndex = ordered.findIndex(u => u.id === storyUser.id);

    setViewingStories({
      users: ordered,
      startIndex: Math.max(0, startIndex)
    });
  }, [sbStories, followIdsSet, markStoriesViewed]);

  const handleAddStory = useCallback(() => {
    setTimeout(() => {
      if (window._reloadStories) window._reloadStories();
    }, 500);
  }, []);

  const showToast = msg => setToastMsg(msg);

  const saveSearch = useCallback(async () => {
    if (!user) {
      setPage("login");
      return;
    }

    const userId = await getCurrentUserId();

    if (!userId) {
      setPage("login");
      return;
    }

    const label = [
      activeCity !== "الكل" ? activeCity : null,
      activeDistrict !== "الكل" ? activeDistrict : null,
      activeType !== "الكل" ? activeType : null,
      filters.category && filters.category !== "الكل" ? filters.category : null,
      filters.minPrice || filters.maxPrice ? (filters.minPrice || "0") + "—" + (filters.maxPrice || "∞") : null,
      filters.minArea || filters.maxArea ? "مساحة " + (filters.minArea || "0") + "—" + (filters.maxArea || "∞") : null,
      hasActiveFilterValue(filters.floor) ? "طابق " + filterLabelList(filters.floor) : null,
      hasActiveFilterValue(filters.facing) ? "جهة " + filterLabelList(filters.facing) : null,
      filters.ownership && filters.ownership !== "الكل" ? filters.ownership : null
    ].filter(Boolean).join(" · ") || "بحث محفوظ";

    const { data: inserted, error } = await createSavedSearch({
      user_id: userId,
      query: label,
      city: activeCity !== "الكل" ? activeCity : null,
      district: activeDistrict !== "الكل" ? activeDistrict : null,
      type: activeType !== "الكل" ? getDbTypeFromActiveType(activeType) : null,
      category: filters.category && filters.category !== "الكل" ? filters.category : null,
      min_price: filters.minPrice || null,
      max_price: filters.maxPrice || null,
      min_area: filters.minArea || null,
      max_area: filters.maxArea || null,
      currency: filters.currency && filters.currency !== "الكل" ? filters.currency : null,
      floor: hasActiveFilterValue(filters.floor) ? filterLabelList(filters.floor) : null,
      facing: hasActiveFilterValue(filters.facing) ? filterLabelList(filters.facing) : null,
      ownership_type: filters.ownership && filters.ownership !== "الكل" ? filters.ownership : null,
      notif: true
    });

    if (!error) {
      setSavedSearches(p => [inserted || {
        id: Date.now(),
        query: label
      }, ...p]);

      showToast("🔔 تم حفظ البحث!");
    } else {
      console.error("saveSearch error:", error);

      const msg =
        error.code === "42501"
          ? "⚠️ خطأ صلاحيات (RLS) — تحقق من سياسات Supabase"
          : error.code === "23505"
            ? "⚠️ هذا البحث محفوظ مسبقاً"
            : "⚠️ خطأ: " + (error.message || error.code || "غير معروف");

      showToast(msg);
    }
  }, [user, activeCity, activeDistrict, activeType, filters, setPage, showToast]);

  const deleteSearch = useCallback(async id => {
    setSavedSearches(p => p.filter(s => s.id !== id));
    await deleteSavedSearch(id);
  }, []);

  const clearFilters = useCallback(() => {
    setActiveType("الكل");
    setActiveCity("الكل");
    setActiveDistrict("الكل");
    setActiveVillage("الكل");
    setFilters({});
    closeSheet();
  }, [closeSheet]);

  return (
    <div style={sx.s1(DC)}>
      <div style={sx.s2(C)}>
        <IslamicPattern opacity={0.1} color="#FFFFFF" />
        <div style={sx.s3}>
          <Star size={30} color={C.gold2} />
        </div>

        <div style={S.relZ1}>
          <div style={sx.s4}>
            <div>
              <div style={sx.s5}>تطبيق طابو أخضر العقاري</div>
              <div style={sx.s6(C)}>
                طابو <span style={sx.s7(C)}>أخضر</span>
              </div>
            </div>

            <div style={S.gap8}>
              <button onClick={() => setPage("notifications")} style={sx.s8}>
                🔔
                {unreadNotifs > 0 && (
                  <div style={sx.s9}>
                    {unreadNotifs > 9 ? "9+" : unreadNotifs}
                  </div>
                )}
              </button>

              <button onClick={() => setPage("favs")} style={sx.s10}>
                🤍
                {favs.length > 0 && <div style={sx.s11(C)} />}
              </button>

              <button onClick={() => setDark(d => !d)} style={sx.s12}>
                {dark ? "☀️" : "🌙"}
              </button>
            </div>
          </div>

          <div style={S.gap8}>
            <button onClick={() => setPage("mapView")} style={sx.s13}>
              🗺️
            </button>

            <div onClick={() => setPage("search")} style={sx.s14(C)}>
              <span style={sx.s15(C)}>🔍</span>
              <span style={sx.s16(C)}>بحث في الإعلانات...</span>
            </div>
          </div>
        </div>

        <Wave fill={DC.bg} />
      </div>

      <FilterBar
        DC={DC}
        user={user}
        activeType={activeType}
        setActiveType={setActiveType}
        activeCity={activeCity}
        setActiveCity={setActiveCity}
        activeDistrict={activeDistrict}
        setActiveDistrict={setActiveDistrict}
        activeVillage={activeVillage}
        setActiveVillage={setActiveVillage}
        filters={filters}
        setFilters={setFilters}
        activeSheet={activeSheet}
        setActiveSheet={setActiveSheet}
        savedSearches={savedSearches}
        setSavedSearches={setSavedSearches}
        filterOpts={filterOpts}
        homeTypes={homeTypes}
        filterDistricts={filterDistricts}
        filterVillages={filterVillages}
        loadingDistricts={loadingDistricts}
        loadingVillages={loadingVillages}
        districtsError={districtsError}
        villagesError={villagesError}
        cityOptions={cityOptions}
        hasFilters={hasFilters}
        saveSearch={saveSearch}
        clearFilters={clearFilters}
        resultCount={filtered.length}
        activeSearchId={activeSearchId}
        setActiveSearchId={setActiveSearchId}
        showQuickFilters={true}
      />

      <div style={sx.s19}>
        <StoriesBar
          follows={follows}
          onView={handleViewStory}
          onAdd={() => setShowAddStory(true)}
          onProfile={u => {
            if (!u || !setSeller) return;

            setSeller({
              sellerId: u.id,
              sellerName: u.name,
              seller: u.name,
              user_id: u.id,
              prevPage: "home"
            });

            setPage("sellerProfile");
          }}
          viewedIds={viewedStoryIds}
          viewedUsers={viewedUsersMap}
          onViewed={markStoryViewed}
          onStoriesLoaded={setSbStories}
          DC={DC}
          user={user}
        />

        {viewingStories && (
          <StoryViewer
            startIndex={viewingStories.startIndex}
            users={viewingStories.users}
            onClose={() => {
              setViewingStories(null);
              if (window._reloadStories) window._reloadStories();
            }}
            onAddStory={() => {
              setViewingStories(null);
              setShowAddStory(true);
            }}
            DC={DC}
            onDelete={() => {
              setViewingStories(null);
              if (window._reloadStories) window._reloadStories();
            }}
            onViewProfile={u => {
              setViewingStories(null);

              setSeller({
                sellerId: u.id,
                sellerName: u.name,
                seller: u.name,
                user_id: u.id,
                prevPage: "home"
              });

              setPage("sellerProfile");
            }}
            onReply={async (storyUser, story, text) => {
              if (!user) return;

              const sellerId = storyUser.id;
              if (!sellerId || sellerId === user.id) return;

              const result = await findOrCreateConversation(user.id, sellerId);
              const conv = result?.conv;

              if (!conv?.id) return;

              const msg = `↩️ رد على حالتك:"${story.text.slice(0, 40)}${story.text.length > 40 ? "..." : ""}" — ${text}`;

              await sendConversationText({
                conversationId: conv.id,
                senderId: user.id,
                receiverId: sellerId,
                content: msg,
                senderName: user.name
              });

              if (window._reloadConvs) window._reloadConvs();
            }}
            onViewed={markStoryViewed}
          />
        )}

        {showAddStory && (
          <AddStoryModal
            onClose={() => setShowAddStory(false)}
            onAdd={handleAddStory}
            DC={DC}
            user={user}
          />
        )}

        <div style={sx.s20}>
          <div style={sx.s21}>
            <Star size={16} color={C.gold} />
            <span style={sx.s22(DC)}>أحدث الإعلانات</span>
          </div>

          <span style={sx.s23(DC)}>{filtered.length} نتيجة</span>
        </div>

        <InstallCard
          DC={DC}
          show={showInstall}
          onInstall={onInstall}
          onDismiss={onDismissInstall}
        />

        {filtered.slice(0, visibleCount).map((item, index) => (
          <React.Fragment key={item.id}>
            <ListingCard
              item={{
                ...item,
                timeAgo: cardSettings?.showTimeAgo === true
                  ? item.timeAgo || formatHomeListingTimeAgo(item.created_at)
                  : ""
              }}
              onPress={i => {
                openDetail(i, "home");
              }}
              favs={favs}
              toggleFav={toggleFav}
              DC={DC}
              cardSettings={cardSettings || {
                showSellerName: false,
                showPriceOnContact: true,
                showTimeAgo: false
              }}
            />

            {ads.length > 0 && (index + 1) % adsInterval === 0 && (() => {
              const currentAd = ads[Math.floor((index + 1) / adsInterval - 1) % ads.length];

              return (
                <AdCard
                  key={"ad-" + index}
                  ad={currentAd}
                  size={currentAd?.card_size || adsSize}
                  onImpression={incrementAdImpressions}
                  onPress={a => {
                    setSelectedAd(a);
                    setPage("adDetail");
                  }}
                  DC={DC}
                />
              );
            })()}
          </React.Fragment>
        ))}

        <LoadMoreButton
          hasMore={filtered.length > visibleCount || hasMoreListings}
          loading={loadingMore || internalLoadingMore}
          onPress={handleLoadMorePress}
        />

        {filtered.length === 0 && (
          <div style={sx.s24(DC)}>
            {sbListings.length === 0 ? (
              isOffline ? (
                <>
                  <div style={S.font48}>📵</div>
                  <div style={sx.s25(DC)}>أنت غير متصل</div>
                  <div style={sx.s26(DC)}>
                    لا توجد إعلانات محفوظة للعرض أوفلاين
                    <br />
                    افتح الإعلانات مرة وأنت متصل لتظهر هنا
                  </div>
                </>
              ) : (
                <>
                  <div style={S.font40}>⏳</div>
                  <div style={sx.s27(DC)}>جاري تحميل الإعلانات...</div>
                </>
              )
            ) : (
              <>
                <div style={S.font40}>🔍</div>
                <div style={sx.s28}>لا توجد نتائج</div>
                <button onClick={clearFilters} style={sx.s29(C)}>
                  مسح الفلاتر
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default HomePage;
