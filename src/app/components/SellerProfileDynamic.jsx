import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import SellerProfilePage from "../pages/SellerProfilePage.jsx";
import PageLoader from "../../shared/components/ui/PageLoader.jsx";
import { fetchSellerProfile } from "../services/profileService.js";

function ErrorView({ message, setPage }) {
  const sx = {
    shell: {
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#f8fafc",
      padding: 20,
      direction: "rtl",
      fontFamily: "Tajawal, sans-serif"
    },
    card: {
      width: "100%",
      maxWidth: 420,
      background: "#ffffff",
      border: "1px solid #e5e7eb",
      borderRadius: 16,
      padding: 20,
      textAlign: "center",
      boxShadow: "0 8px 24px rgba(0,0,0,0.06)"
    },
    icon: {
      fontSize: 40,
      marginBottom: 10
    },
    title: {
      fontSize: 18,
      fontWeight: 800,
      marginBottom: 8
    },
    text: {
      fontSize: 14,
      color: "#64748b",
      lineHeight: 1.8
    },
    btn: {
      marginTop: 18,
      padding: "10px 22px",
      borderRadius: 10,
      border: "none",
      background: "#1A4A2E",
      color: "white",
      fontSize: 13,
      fontWeight: 800,
      cursor: "pointer",
      fontFamily: "inherit"
    }
  };

  return (
    <div style={sx.shell}>
      <div style={sx.card}>
        <div style={sx.icon}>⚠️</div>
        <div style={sx.title}>تعذر فتح ملف المعلن</div>
        <div style={sx.text}>
          {message || "رابط المعلن غير صحيح أو غير مكتمل."}
        </div>
        <button onClick={() => setPage?.("home")} style={sx.btn}>
          العودة للرئيسية
        </button>
      </div>
    </div>
  );
}

function cleanName(value) {
  const name = String(value || "").trim();

  if (!name) return "";
  if (name === "مستخدم") return "";
  if (name.toLowerCase() === "user") return "";

  return name;
}

function getYearFromDate(value) {
  if (!value) return null;

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;

  return d.getFullYear();
}

function getProfileName(profile) {
  return (
    cleanName(profile?.name) ||
    cleanName(profile?.full_name) ||
    cleanName(profile?.display_name) ||
    cleanName(profile?.username) ||
    ""
  );
}

function getListingSellerName(listing) {
  return (
    cleanName(listing?.sellerName) ||
    cleanName(listing?.seller_name) ||
    cleanName(listing?.seller) ||
    cleanName(listing?.name) ||
    cleanName(listing?.profiles?.name) ||
    cleanName(listing?.profile?.name) ||
    ""
  );
}

function findListingForSeller(sbListings, userId) {
  if (!userId) return null;

  const id = String(userId);

  return (
    (sbListings || []).find(l => String(l?.user_id || "") === id) ||
    (sbListings || []).find(l => String(l?.sellerId || "") === id) ||
    (sbListings || []).find(l => String(l?.seller_id || "") === id) ||
    null
  );
}

function getSellerCreatedAt(profile, listingSeller) {
  return (
    profile?.created_at ||
    profile?.createdAt ||
    profile?.profile_created_at ||
    listingSeller?.seller_created_at ||
    listingSeller?.profile_created_at ||
    listingSeller?.sellerCreatedAt ||
    listingSeller?.created_at ||
    listingSeller?.createdAt ||
    null
  );
}

function buildSellerObject({ userId, profile, listingSeller }) {
  const profileName = getProfileName(profile);
  const listingName = getListingSellerName(listingSeller);
  const finalName = profileName || listingName || "مستخدم";

  const finalId =
    profile?.id ||
    profile?.user_id ||
    listingSeller?.user_id ||
    listingSeller?.sellerId ||
    listingSeller?.seller_id ||
    userId;

  const accountType =
    profile?.account_type ||
    profile?.accountType ||
    listingSeller?.sellerAccountType ||
    listingSeller?.accountType ||
    listingSeller?.account_type ||
    "individual";

  const createdAt = getSellerCreatedAt(profile, listingSeller);
  const joinYear =
    getYearFromDate(createdAt) ||
    listingSeller?.joinYear ||
    null;

  return {
    user_id: finalId,
    sellerId: finalId,
    seller_id: finalId,
    id: finalId,

    sellerName: finalName,
    seller: finalName,
    name: finalName,

    accountType,
    account_type: accountType,
    sellerAccountType: accountType,

    verified:
      typeof profile?.verified === "boolean"
        ? profile.verified
        : !!listingSeller?.verified,

    idVerified:
      typeof profile?.id_verified === "boolean"
        ? profile.id_verified
        : !!listingSeller?.idVerified,

    phone: profile?.phone || listingSeller?.phone || "",
    phone2: profile?.phone2 || listingSeller?.phone2 || "",
    whatsapp: profile?.whatsapp || listingSeller?.whatsapp || "",
    whatsapp2: profile?.whatsapp2 || listingSeller?.whatsapp2 || "",

    avatar_url:
      profile?.avatar_url ||
      profile?.avatar ||
      listingSeller?.avatar_url ||
      listingSeller?.sellerAvatar ||
      "",

    cover_url:
      profile?.cover_url ||
      profile?.cover ||
      listingSeller?.cover_url ||
      "",

    shamcash_code: profile?.shamcash_code || "",
    shamcash_visible: !!profile?.shamcash_visible,

    created_at: createdAt,
    joinYear,

    prevPage: "home"
  };
}

export default function SellerProfileDynamic({
  common,
  sbListings,
  setChat,
  favs,
  toggleFav,
  follows,
  toggleFollow,
  isFollowing
}) {
  const { userId } = useParams();

  const listingSeller = useMemo(
    () => findListingForSeller(sbListings, userId),
    [sbListings, userId]
  );

  const [seller, setSeller] = useState(() => {
    if (!userId) return null;

    return buildSellerObject({
      userId,
      profile: null,
      listingSeller
    });
  });

  const [loading, setLoading] = useState(Boolean(userId));

  useEffect(() => {
    let cancelled = false;

    async function loadSeller() {
      if (!userId) {
        setSeller(null);
        setLoading(false);
        return;
      }

      const fallbackSeller = buildSellerObject({
        userId,
        profile: null,
        listingSeller
      });

      setSeller(fallbackSeller);
      setLoading(true);

      try {
        const profile = await fetchSellerProfile(userId);

        if (cancelled) return;

        const mergedSeller = buildSellerObject({
          userId,
          profile: profile || null,
          listingSeller
        });

        setSeller(mergedSeller);
      } catch {
        if (!cancelled) {
          setSeller(fallbackSeller);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadSeller();

    return () => {
      cancelled = true;
    };
  }, [userId, listingSeller]);

  if (!userId) {
    return (
      <ErrorView
        setPage={common?.setPage}
        message="معرّف المعلن غير موجود في الرابط."
      />
    );
  }

  if (loading && !seller) {
    return <PageLoader />;
  }

  return (
    <SellerProfilePage
      {...common}
      seller={seller}
      prevPage="home"
      setChat={setChat}
      favs={favs}
      toggleFav={toggleFav}
      follows={follows}
      toggleFollow={toggleFollow}
      isFollowing={isFollowing}
      sbListings={sbListings}
    />
  );
}
