//تفضل، هذا AppShell.jsx كامل بعد حذف نافذة فردي / مكتب من Google، وجعل الحساب الجديد دائمًا individual تلقائيًا.

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { C } from "../../shared/constants/colors.js";
import { ADMIN_ROLES, LIMITED_ADMIN_ROLES } from "../../shared/constants/access.js";
import { ADMIN_ID } from "../../shared/utils/env.js";
import { loadAppData, loadCitiesFromDB } from "../../shared/utils/geo.js";
import { fetchUserFavorites, fetchUserFollows, fetchMyListings, updateLastSeen, upsertFollow, toggleFollowDB, toggleFavDB } from "../services/userService.js";
import { fetchProfile, liftSuspensionIfExpired, fetchRolePermissions, createProfileIfMissing, fetchUnreadNotificationsCount, fetchUnreadMessagesCount, subscribeToNotifications, subscribeToUnreadMessages, updateShamcash as updateShamcashDB } from "../services/profileService.js";
import { BottomNav } from "../../shared/components/common/BottomNav.jsx";
import { buildOptimisticUser, getCurrentSession, markGoogleSessionAvailable, markGoogleUiUpdated, subscribeToAuthStateChange } from "../services/authService.js";
import { fetchApprovedListingsPage, subscribeToListingsChanges } from "../services/listingService.js";
import PageLoader from "../../shared/components/ui/PageLoader.jsx";
import { useInstallPrompt } from "../hooks/useInstallPrompt.js";
import "../../shared/services/supabaseClient.js";
import { getListingsCache, setListingsCache, mergeListingsCache, getDetailCache, setDetailCache, migrateLegacyCache } from "../../shared/utils/cache.js";
import { LoginGateSheet, DeniedNotificationSheet } from "./AppShellModals.jsx";
import { getPageFromPath, pageToRoute } from "./routes.js";
import { getAppShellStyles } from "./AppShell.styles.js";
import AppRoutes from "./AppShell.routes.jsx";
import { AdminApp } from "./adminBoundary.jsx";
import { trackPageView } from "../../shared/services/metaPixel.js";

function runDeferredTask(task, timeout = 250) {
  if (typeof window === "undefined") return () => {};

  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(() => task?.(), {
      timeout
    });
    return () => window.cancelIdleCallback?.(id);
  }

  const id = window.setTimeout(() => task?.(), timeout);
  return () => window.clearTimeout(id);
}

export default function AppShell() {
  const location = useLocation();

  const {
    show: showInstall,
    install,
    dismiss: dismissInstall
  } = useInstallPrompt();

  const [showDeniedNotif, setShowDeniedNotif] = React.useState(false);
  const navigate = useNavigate();

  const page = useMemo(() => getPageFromPath(location.pathname), [location.pathname]);
  const setPage = useCallback(next => navigate(pageToRoute[next] || "/"), [navigate]);

  useEffect(() => {
    trackPageView({
      path: location.pathname,
      url: window.location.href
    });
  }, [location.pathname, location.search]);

  const [detail, setDetail] = useState(null);
  const [selectedAd, setSelectedAd] = useState(null);
  const [targetUser, setTargetUser] = useState(null);
  const [detailPrevPage, setDetailPrevPage] = useState("home");
  const [chat, setChat] = useState(null);
  const [seller, setSeller] = useState(null);
  const [favs, setFavs] = useState([]);
  const [follows, setFollows] = useState([]);

  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("aqari_user_snap");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const userRef = React.useRef(user);
  const [accessSyncing, setAccessSyncing] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [myListings, setMyListings] = useState([]);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const [sbListings, setSbListings] = useState(() => getListingsCache({
    allowStale: true
  })?.items || []);

  const [listingsCursor, setListingsCursor] = useState(null);
  const [hasMoreListings, setHasMoreListings] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const PAGE_SIZE = 50;

  const [shamcash, setShamcash] = useState({
    code: "",
    show: false
  });

  const [dark, setDark] = useState(false);
  const [lang, setLang] = useState("ar");
  const [loginGate, setLoginGate] = useState(false);
  const hydratingAuthUserRef = React.useRef(null);

  useEffect(() => {
    return () => {
      if (window._lsInterval) clearInterval(window._lsInterval);
    };
  }, []);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    try {
      if (!user?.id) {
        localStorage.removeItem("aqari_user_snap");
        return;
      }

      localStorage.setItem("aqari_user_snap", JSON.stringify({
        id: user.id,
        email: user.email || "",
        name: user.name || "مستخدم",
        accountType: user.accountType || "individual",
        isAdmin: !!user.isAdmin,
        role: user.role || "user",
        allowedPages: Array.isArray(user.allowedPages) ? user.allowedPages : []
      }));
    } catch {}
  }, [user]);

  const refreshUserRoleAccess = useCallback(async ({ reason = "manual" } = {}) => {
    const current = userRef.current;
    if (!current?.id) return null;

    setAccessSyncing(true);

    try {
      const profile = await fetchProfile(current.id);
      if (!profile) return null;

      const nextRole = profile.role || "user";
      const nextIsAdmin = ADMIN_ROLES.includes(nextRole);

      const nextAllowedPages = LIMITED_ADMIN_ROLES.includes(nextRole)
        ? await fetchRolePermissions(nextRole)
        : [];

      const isActuallySuspended =
        !!profile.is_suspended &&
        !(profile.suspended_until && new Date(profile.suspended_until) < new Date());

      setUser(prev => prev?.id === current.id ? {
        ...prev,
        phone: profile.phone || prev?.phone || "",
        name: profile.name || prev?.name || current.name || "مستخدم",
        accountType: profile.account_type || prev?.accountType || current.accountType || "individual",
        role: nextRole,
        isAdmin: nextIsAdmin,
        allowedPages: nextAllowedPages,
        isSuspended: isActuallySuspended,
        suspendedUntil: isActuallySuspended ? profile.suspended_until || null : null,
        video_allowed: !!profile.video_allowed,
        permissionsRefreshedAt: Date.now(),
        permissionsRefreshReason: reason
      } : prev);

      return { role: nextRole, allowedPages: nextAllowedPages };
    } catch {
      return null;
    } finally {
      setAccessSyncing(false);
    }
  }, []);

  useEffect(() => {
    const current = userRef.current;

    const needsPrivilegedCheck =
      !!current?.id &&
      (LIMITED_ADMIN_ROLES.includes(current?.role) || (!!current?.isAdmin && current?.role !== "admin"));

    const accessSensitiveRoute =
      location.pathname === "/importer" ||
      location.pathname === "/pending" ||
      location.pathname.startsWith("/admin");

    if (!needsPrivilegedCheck || !accessSensitiveRoute) return;

    refreshUserRoleAccess({ reason: `route:${location.pathname}` });
  }, [location.pathname, refreshUserRoleAccess]);

  useEffect(() => {
    const handleStorage = e => {
      if (e.key !== "aqari_role_permissions_updated_at") return;

      const current = userRef.current;
      if (!LIMITED_ADMIN_ROLES.includes(current?.role)) return;

      refreshUserRoleAccess({ reason: "storage" });
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [refreshUserRoleAccess]);

  useEffect(() => {
    const buildResolvedUser = (u, profile, allowedPages = null) => {
      const isActuallySuspended =
        !!profile?.is_suspended &&
        !(profile?.suspended_until && new Date(profile.suspended_until) < new Date());

      if (profile?.is_suspended && profile?.suspended_until && new Date(profile.suspended_until) < new Date()) {
        liftSuspensionIfExpired(u.id, profile.suspended_until);
      }

      return {
        id: u.id,
        email: u.email || "",
        phone: profile?.phone || u.phone || "",
        name: profile?.name || u.user_metadata?.name || u.user_metadata?.full_name || u.email?.split("@")[0] || "مستخدم",
        accountType: profile?.account_type || u.user_metadata?.account_type || "individual",
        isAdmin: ADMIN_ROLES.includes(profile?.role),
        role: profile?.role || "user",
        isSuspended: isActuallySuspended,
        suspendedUntil: isActuallySuspended ? profile?.suspended_until || null : null,
        video_allowed: !!profile?.video_allowed,
        allowedPages: allowedPages ?? []
      };
    };

    let alive = true;

    const applySessionFast = (session, source = "unknown") => {
      const u = session?.user;

      if (!u || !alive) {
        setAuthReady(true);
        return;
      }

      markGoogleSessionAvailable({
        source,
        path: window.location.pathname
      });

      setUser(prev => {
        const sameUser = prev?.id === u.id;
        const fallback = sameUser ? prev : {};

        const next = {
          ...buildOptimisticUser(u, fallback),
          role: fallback.role || "user",
          isAdmin: !!fallback.isAdmin,
          allowedPages: Array.isArray(fallback.allowedPages) ? fallback.allowedPages : [],
          permissionsRefreshedAt: fallback.permissionsRefreshedAt || null,
          permissionsRefreshReason: fallback.permissionsRefreshReason || null
        };

        return sameUser ? { ...prev, ...next } : next;
      });

      setAuthReady(true);

      requestAnimationFrame(() => {
        markGoogleUiUpdated({
          source,
          path: window.location.pathname
        });
      });

      if (hydratingAuthUserRef.current === u.id) return;

      hydratingAuthUserRef.current = u.id;

      (async () => {
        try {
          const data = await fetchProfile(u.id);
          if (!alive) return;

          if (data) {
            let nextUser = buildResolvedUser(u, data);

            if (LIMITED_ADMIN_ROLES.includes(data.role)) {
              const allowed = await fetchRolePermissions(data.role);
              if (!alive) return;
              nextUser = buildResolvedUser(u, data, allowed);
            }

            setUser(prev => prev?.id === u.id ? {
              ...prev,
              ...nextUser
            } : nextUser);

            if (data.shamcash_code) {
              setShamcash({
                code: data.shamcash_code,
                show: data.shamcash_visible || false
              });
            }

            return;
          }

          const profileName =
            u.user_metadata?.full_name ||
            u.user_metadata?.name ||
            u.email?.split("@")[0] ||
            "مستخدم";

          // مهم جدًا:
          // لا نستخدم upsert هنا؛ لأن أي فشل مؤقت في fetchProfile أثناء TOKEN_REFRESHED
          // قد يجعل التطبيق يظن أن البروفايل غير موجود، ثم يكتب الاسم القديم
          // ويعيد account_type إلى individual. لذلك ننشئ البروفايل فقط إذا كان غير موجود فعلًا.
          const freshProfile = await createProfileIfMissing(u.id, {
            name: profileName,
            account_type: "individual",
            terms_accepted_at: new Date().toISOString()
          });

          if (!alive) return;

          // إذا لم نستطع تحميل/إنشاء البروفايل، نترك بيانات المستخدم الحالية كما هي
          // ولا نكتب أي قيمة افتراضية فوق الاسم أو نوع الحساب.
          if (!freshProfile) {
            console.warn("Profile was not loaded or created; keeping current user state.");
            return;
          }

          const nextUser = buildResolvedUser(u, freshProfile);

          setUser(prev => prev?.id === u.id ? {
            ...prev,
            ...nextUser
          } : nextUser);
        } finally {
          if (hydratingAuthUserRef.current === u.id) {
            hydratingAuthUserRef.current = null;
          }
        }
      })();
    };

    const unsubscribe = subscribeToAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        hydratingAuthUserRef.current = null;
        setUser(null);

        try {
          localStorage.removeItem("aqari_user_snap");
        } catch {}

        setFavs([]);
        setFollows([]);
        setMyListings([]);
        setUnreadNotifs(0);
        setUnreadMessages(0);
        setAuthReady(true);

        if (window._lsInterval) {
          clearInterval(window._lsInterval);
          window._lsInterval = null;
        }

        return;
      }

      if (!session) return;

      if (["INITIAL_SESSION", "SIGNED_IN", "TOKEN_REFRESHED", "USER_UPDATED"].includes(event)) {
        applySessionFast(session, event);
      }
    });

    const bootstrapSession = async () => {
      const session = await getCurrentSession();
      if (!alive) return;

      if (session?.user) {
        applySessionFast(session, "getCurrentSession");
        return;
      }

      setAuthReady(true);
    };

    bootstrapSession();

    return () => {
      alive = false;
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    if (!user?.id) {
      if (window._lsInterval) {
        clearInterval(window._lsInterval);
        window._lsInterval = null;
      }
      return;
    }

    updateLastSeen(user.id);

    if (user.id !== ADMIN_ID) {
      runDeferredTask(() => upsertFollow(user.id, ADMIN_ID), 900);
    }

    const lsInterval = setInterval(() => {
      updateLastSeen(user.id);
    }, 60000);

    window._lsInterval = lsInterval;

    return () => {
      if (window._lsInterval === lsInterval) {
        clearInterval(lsInterval);
        window._lsInterval = null;
      } else {
        clearInterval(lsInterval);
      }
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    let cancelled = false;

    const cancelPrimary = runDeferredTask(() => {
      fetchUserFavorites(user.id).then(favIds => {
        if (!cancelled) setFavs(favIds || []);
      });

      fetchUserFollows(user.id).then(sellerIds => {
        if (!cancelled) setFollows(sellerIds || []);
      });
    }, 200);

    const cancelListings = runDeferredTask(() => {
      fetchMyListings(user.id).then(listings => {
        if (!cancelled) setMyListings(listings || []);
      });
    }, 900);

    return () => {
      cancelled = true;
      cancelPrimary?.();
      cancelListings?.();
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    let cancelled = false;

    const load = () => fetchUnreadNotificationsCount(user.id).then(count => {
      if (!cancelled) setUnreadNotifs(count || 0);
    });

    const cancelInitialLoad = runDeferredTask(load, 700);
    const unsubscribe = subscribeToNotifications(user.id, load);

    return () => {
      cancelled = true;
      cancelInitialLoad?.();
      unsubscribe?.();
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    let cancelled = false;

    const load = () => fetchUnreadMessagesCount(user.id).then(count => {
      if (!cancelled) setUnreadMessages(count || 0);
    });

    const cancelInitialLoad = runDeferredTask(load, 900);
    const unsubscribe = subscribeToUnreadMessages(user.id, load);

    return () => {
      cancelled = true;
      cancelInitialLoad?.();
      unsubscribe?.();
    };
  }, [user?.id]);

  const listingFiltersRef = React.useRef({});

  const loadListings = useCallback(async (reset = true, filters = null) => {
    const nextFilters =
      filters && typeof filters === "object"
        ? filters
        : listingFiltersRef.current || {};

    if (reset) {
      listingFiltersRef.current = nextFilters;
    }

    if (!reset && loadingMore) {
      return {
        items: [],
        hasMore: hasMoreListings
      };
    }

    if (!reset) setLoadingMore(true);

    try {
      const mapped = await fetchApprovedListingsPage({
        limit: PAGE_SIZE,
        beforeCreatedAt: !reset ? listingsCursor : null,
        filters: nextFilters
      });

      if (reset) {
        setSbListings(mapped);
        setListingsCache(mapped);
      } else {
        setSbListings(() => mergeListingsCache(mapped).items || []);
      }

      if (mapped.length > 0) {
        setListingsCursor(mapped[mapped.length - 1].created_at);
      } else if (reset) {
        setListingsCursor(null);
      }

      const hasMore = mapped.length === PAGE_SIZE;
      setHasMoreListings(hasMore);

      return {
        items: mapped,
        hasMore
      };
    } catch (error) {
      console.error("loadListings failed", error);

      if (reset) {
        setSbListings([]);
        setListingsCursor(null);
        setHasMoreListings(false);
      }

      return {
        items: [],
        hasMore: false
      };
    } finally {
      if (!reset) setLoadingMore(false);
    }
  }, [listingsCursor, loadingMore, hasMoreListings]);

  const loadMoreListings = useCallback((filters = null) => {
    return loadListings(false, filters);
  }, [loadListings]);

  const reloadListingsRef = React.useRef(() => {});
  const detailCacheRef = React.useRef({});

  React.useEffect(() => {
    reloadListingsRef.current = (filters = null) => {
      return loadListings(true, filters || listingFiltersRef.current || {});
    };
  }, [loadListings]);

  useEffect(() => {
    migrateLegacyCache();

    const cachedListings = getListingsCache({
      allowStale: true
    })?.items || [];

    if (cachedListings.length) setSbListings(cachedListings);

    const onOnline = () => {
      setIsOffline(false);
      loadListings(true, listingFiltersRef.current || {});
    };

    const onOffline = () => setIsOffline(true);

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    if (navigator.onLine) loadListings(true, listingFiltersRef.current || {});

    runDeferredTask(() => loadCitiesFromDB(), 150);
    runDeferredTask(() => loadAppData(), 250);

    const unsubscribeListings = subscribeToListingsChanges(() => reloadListingsRef.current());

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      unsubscribeListings();
    };
  }, []);

  const updateShamcash = useCallback(async newVal => {
    setShamcash(newVal);
    if (user?.id) await updateShamcashDB(user.id, newVal.code, newVal.show);
  }, [user?.id]);

  const toggleFollow = useCallback(sellerId => {
    if (!user) {
      setLoginGate(true);
      return;
    }

    if (sellerId === user?.id) return;
    if (sellerId === ADMIN_ID) return;

    setFollows(prev => {
      const isFollowed = prev.includes(sellerId);
      const next = isFollowed ? prev.filter(f => f !== sellerId) : [...prev, sellerId];

      toggleFollowDB(user.id, sellerId, isFollowed).then(({ error }) => {
        if (error) setFollows(p => isFollowed ? [...p, sellerId] : p.filter(f => f !== sellerId));
      });

      return next;
    });
  }, [user?.id, user]);

  const isFollowing = useCallback(id => (follows || []).includes(id), [follows]);

  const toggleFav = useCallback(rawId => {
    if (!user) {
      setLoginGate(true);
      return;
    }

    const id = Number(rawId);

    setFavs(prev => {
      const isFaved = prev.includes(id);
      const next = isFaved ? prev.filter(f => f !== id) : [...prev, id];

      toggleFavDB(user.id, id, isFaved).then(({ error }) => {
        if (error) setFavs(p => isFaved ? [...p, id] : p.filter(f => f !== id));
      });

      return next;
    });
  }, [user?.id, user]);

  const DC = useMemo(() => dark ? {
    ...C,
    bg: "#0F1A14",
    bg2: "#1A2E20",
    white: "#1E2D22",
    border: "#2A3D30",
    text: "#F0F0F0",
    text2: "#B0C0B5",
    text3: "#607060"
  } : C, [dark]);

  const sx = useMemo(() => getAppShellStyles(DC, lang), [DC, lang]);

  const showNav = ![
    "login",
    "splash",
    "detail",
    "want",
    "add",
    "chat",
    "sellerProfile",
    "settings",
    "notifications",
    "loginHistory",
    "savedSearches",
    "mapView",
    "adDetail"
  ].includes(page);

  const PROTECTED = useMemo(() => new Set([
    "addChoice",
    "want",
    "add",
    "favs",
    "messages",
    "chat",
    "profile",
    "following",
    "myListings",
    "loginHistory",
    "savedSearches",
    "notifications",
    "settings"
  ]), []);

  const openDetail = useCallback((item, prevPage = "home") => {
    if (!item?.id) return;

    const cached = detailCacheRef.current[item.id] || getDetailCache(item.id, {
      allowStale: true
    });

    setDetail(cached || item);
    setDetailPrevPage(prevPage);
    navigate(`/listing/${item.id}`);
  }, [navigate]);

  const cacheDetail = useCallback(item => {
    if (!item?.id) return;

    detailCacheRef.current[item.id] = item;

    setDetailCache({
      ...item,
      description: item.desc || item.description || "",
      phone: item.phone || item.sellerPhone || "",
      images: Array.isArray(item.images) ? item.images.filter(Boolean) : [],
      _skipFetch: true
    });
  }, []);

  const guardedSetPage = useCallback(next => {
    if (PROTECTED.has(next) && !user) {
      setLoginGate(true);
      return;
    }

    setPage(next);
  }, [PROTECTED, user, setPage]);

  const Protected = useMemo(() => ({ element }) => {
    if (!authReady) return <PageLoader />;
    if (!user) return <Navigate to="/home" replace />;
    return element;
  }, [authReady, user]);

  useEffect(() => {
    if (authReady && !user) setLoginGate(false);
  }, [authReady, user]);

  const common = useMemo(() => ({
    setPage: guardedSetPage,
    DC,
    lang,
    user,
    openDetail,
    setTargetUser,
    cacheDetail,
    refreshUserRoleAccess,
    accessSyncing,
    authReady
  }), [
    guardedSetPage,
    DC,
    lang,
    user,
    openDetail,
    setTargetUser,
    cacheDetail,
    refreshUserRoleAccess,
    accessSyncing,
    authReady
  ]);

  const SLIDE_UP_PAGES = new Set([
    "/listing",
    "/chat",
    "/add-listing",
    "/wanted",
    "/add-choice",
    "/settings",
    "/notifications",
    "/login-history",
    "/saved-searches",
    "/map",
    "/seller",
    "/ad",
    "/profile",
    "/following",
    "/my-listings",
    "/search",
    "/favorites"
  ]);

  const transitionClass =
    SLIDE_UP_PAGES.has(location.pathname) || location.pathname.startsWith("/listing/")
      ? "page-slide-up"
      : "page-fade-in";

  return (
    <div style={sx.root}>
      <div key={location.key} className={transitionClass} style={sx.shell}>
        <AppRoutes
          common={common}
          user={user}
          setUser={setUser}
          setPage={setPage}
          showInstall={showInstall}
          install={install}
          dismissInstall={dismissInstall}
          detail={detail}
          setDetail={setDetail}
          detailPrevPage={detailPrevPage}
          setDetailPrevPage={setDetailPrevPage}
          openDetail={openDetail}
          cacheDetail={cacheDetail}
          chat={chat}
          setChat={setChat}
          seller={seller}
          setSeller={setSeller}
          selectedAd={selectedAd}
          setSelectedAd={setSelectedAd}
          targetUser={targetUser}
          favs={favs}
          toggleFav={toggleFav}
          follows={follows}
          toggleFollow={toggleFollow}
          isFollowing={isFollowing}
          dark={dark}
          setDark={setDark}
          setLang={setLang}
          sbListings={sbListings}
          hasMoreListings={hasMoreListings}
          loadMoreListings={loadMoreListings}
          loadingMore={loadingMore}
          loadListings={loadListings}
          reloadListingsRef={reloadListingsRef}
          myListings={myListings}
          setMyListings={setMyListings}
          unreadNotifs={unreadNotifs}
          setUnreadNotifs={setUnreadNotifs}
          isOffline={isOffline}
          shamcash={shamcash}
          updateShamcash={updateShamcash}
          setShowDeniedNotif={setShowDeniedNotif}
          AdminApp={AdminApp}
          Protected={Protected}
        />

        <LoginGateSheet
          open={loginGate}
          sx={sx}
          onClose={() => setLoginGate(false)}
          onLogin={() => {
            setLoginGate(false);
            setPage("login");
          }}
        />
      </div>

      <DeniedNotificationSheet
        open={showDeniedNotif}
        sx={sx}
        onClose={() => setShowDeniedNotif(false)}
      />

      {showNav && (
        <BottomNav
          page={page}
          setPage={guardedSetPage}
          DC={DC}
          lang={lang}
          unreadMessages={unreadMessages}
          user={user}
        />
      )}
    </div>
  );
}
