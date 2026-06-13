import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import QRCodeStyling from "qr-code-styling";
import { C } from "../../shared/constants/colors.js";
import { IslamicPattern, Star, Wave } from "../../shared/components/icons.jsx";
import { ListingCard } from "../../shared/components/common/ListingCard.jsx";
import { FollowButton } from "../components/common/Stories.jsx";
import { BackButton } from "../../shared/components/common/BackButton.jsx";
import { LoadMoreButton } from "../../shared/components/common/LoadMoreButton.jsx";
import { RatingModal, ReportModal } from "../components/modals.jsx";
import { fetchSellerProfile } from "../services/profileService.js";
import { fetchSellerRatingStats } from "../services/ratingService.js";
import { findOrCreateConversation } from "../services/messaging.js";
import { blockUserAndCleanFollows } from "../services/blockService.js";
import { S } from "../../shared/styles/primitives.js";

function toWhatsAppNumber(value) {
  let n = String(value || "").trim().replace(/[^\d+]/g, "");
  if (n.startsWith("+")) n = n.slice(1);
  n = n.replace(/\D/g, "");
  if (n.startsWith("00")) n = n.slice(2);
  if (n.startsWith("963")) return n;
  if (n.startsWith("09")) return "963" + n.slice(1);
  if (n.startsWith("9") && n.length === 9) return "963" + n;
  return n;
}


const reportStorageKey = (userId, itemType, itemId) =>
  userId && itemId ? `report_sent:${userId}:${itemType}:${itemId}` : "";

function SellerShamcashQR({ code }) {
  const qrRef = useRef(null);

  useEffect(() => {
    if (!code || !qrRef.current) return;

    qrRef.current.innerHTML = "";

    const qr = new QRCodeStyling({
      width: 220,
      height: 220,
      type: "svg",
      data: code,
      margin: 8,
      qrOptions: {
        typeNumber: 2,
        mode: "Byte",
        errorCorrectionLevel: "L"
      },
      dotsOptions: {
        color: "#3E4F79",
        type: "square"
      },
      cornersSquareOptions: {
        color: "#3E4F79",
        type: "square"
      },
      cornersDotOptions: {
        color: "#3E4F79",
        type: "square"
      },
      backgroundOptions: {
        color: "#FFFFFF"
      }
    });

    qr.append(qrRef.current);
  }, [code]);

  return (
    <div
      style={{
        display: "inline-block",
        background: "white",
        padding: 10,
        borderRadius: 12,
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        marginBottom: 10
      }}
    >
      <div ref={qrRef} />
    </div>
  );
}

function SellerProfilePage({
  openDetail,
  seller,
  setPage,
  setChat,
  prevPage,
  favs,
  toggleFav,
  sbListings = [],
  toggleFollow,
  isFollowing = () => false,
  DC,
  user
}) {
  if (!DC) DC = C;

  const { userId: routeSellerId } = useParams();

  const sellerId =
    seller?.sellerId ||
    seller?.user_id ||
    seller?.id ||
    routeSellerId ||
    null;

  const [visibleCount, setVisibleCount] = useState(20);
  const [showRating, setShowRating] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [hasReported, setHasReported] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [sellerRatings, setSellerRatings] = useState({ avg: 0, count: 0 });
  const [sellerProfile, setSellerProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(Boolean(sellerId));
  const [profileFailed, setProfileFailed] = useState(false);
  const [showShamcash, setShowShamcash] = useState(false);
  const [activePhone, setActivePhone] = useState(0);
  const [activeWa, setActiveWa] = useState(0);

  const sx = {
    page: DC => ({
      background: DC.bg,
      minHeight: "100vh",
      paddingBottom: 80,
      color: DC.text,
      fontFamily: "Tajawal, sans-serif",
      direction: "rtl"
    }),
    emptyShell: DC => ({
      background: DC.bg,
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 20px",
      color: DC.text,
      fontFamily: "Tajawal, sans-serif",
      direction: "rtl"
    }),
    emptyIcon: {
      fontSize: 64
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: 800,
      marginTop: 16
    },
    emptyText: DC => ({
      fontSize: 13,
      color: DC.text3,
      marginTop: 8,
      textAlign: "center"
    }),
    emptyBtn: DC => ({
      marginTop: 24,
      padding: "12px 28px",
      background: DC.primary,
      color: "white",
      border: "none",
      borderRadius: 10,
      fontSize: 13,
      fontWeight: 700,
      fontFamily: "Tajawal, sans-serif",
      cursor: "pointer"
    }),
    header: DC => ({
      background: DC.primary,
      padding: "48px 16px 60px",
      position: "relative",
      overflow: "hidden",
      textAlign: "center"
    }),
    coverWrap: {
      position: "absolute",
      inset: 0,
      zIndex: 0,
      overflow: "hidden"
    },
    coverImg: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      opacity: 0.5
    },
    avatar: (isOffice, DC) => ({
      width: 80,
      height: 80,
      borderRadius: "50%",
      background: isOffice ? DC.gold : "rgba(255,255,255,0.2)",
      color: "white",
      fontSize: 30,
      fontWeight: 700,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      margin: "0 auto 12px",
      border: "3px solid rgba(255,255,255,0.5)",
      overflow: "hidden",
      boxShadow: "0 4px 16px rgba(0,0,0,0.3)"
    }),
    avatarImg: {
      width: "100%",
      height: "100%",
      objectFit: "cover"
    },
    nameRow: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      marginBottom: 6
    },
    name: DC => ({
      fontSize: 20,
      fontWeight: 900,
      color: DC.white
    }),
    verified: DC => ({
      fontSize: 14,
      color: DC.gold2
    }),
    followWrap: {
      display: "flex",
      justifyContent: "center",
      marginBottom: 8
    },
    badges: {
      display: "flex",
      justifyContent: "center",
      gap: 6,
      marginBottom: 8,
      flexWrap: "wrap"
    },
    officeBadge: DC => ({
      background: "rgba(200,149,42,0.25)",
      border: "1px solid " + DC.gold2,
      borderRadius: 20,
      padding: "3px 12px",
      fontSize: 11,
      fontWeight: 700,
      color: DC.gold2
    }),
    idBadge: {
      background: "rgba(3,105,161,0.2)",
      border: "1px solid #7DD3FC",
      borderRadius: 20,
      padding: "3px 12px",
      fontSize: 11,
      fontWeight: 700,
      color: "#7DD3FC"
    },
    ratingRow: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: 4,
      marginBottom: 8
    },
    ratingPending: {
      fontSize: 11,
      color: "rgba(255,255,255,0.6)"
    },
    ratingAvg: DC => ({
      fontSize: 13,
      color: DC.gold2,
      fontWeight: 700,
      marginRight: 4
    }),
    ratingCount: {
      fontSize: 11,
      color: "rgba(255,255,255,0.4)"
    },
    statsRow: {
      display: "flex",
      justifyContent: "center",
      marginTop: 12
    },
    statBox: i => ({
      flex: 1,
      textAlign: "center",
      borderRight: i < 2 ? "1px solid rgba(255,255,255,0.15)" : "none",
      padding: "0 10px"
    }),
    statNum: DC => ({
      fontSize: 18,
      fontWeight: 900,
      color: DC.gold2
    }),
    statLabel: {
      fontSize: 10,
      color: "rgba(255,255,255,0.5)"
    },
    actionsRow: {
      display: "flex",
      gap: 8,
      marginBottom: 14
    },
    chatBtn: DC => ({
      flex: 2,
      padding: "11px",
      background: DC.primary,
      color: "white",
      border: "none",
      borderRadius: 11,
      fontSize: 13,
      fontWeight: 700,
      fontFamily: "Tajawal,sans-serif",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 6
    }),
    lightBtn: DC => ({
      flex: 1,
      padding: "11px",
      background: DC.white,
      color: DC.text,
      border: "1px solid " + DC.border,
      borderRadius: 11,
      fontSize: 13,
      fontWeight: 700,
      fontFamily: "Tajawal,sans-serif",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 6
    }),
    blockBtn: DC => ({
      width: 46,
      padding: "11px",
      background: "#FEF2F2",
      color: DC.danger || C.danger,
      border: "1px solid #FCA5A5",
      borderRadius: 11,
      fontSize: 16,
      fontFamily: "Tajawal,sans-serif",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }),
    reportBtn: hasReported => ({
      width: 46,
      padding: "11px",
      background: hasReported ? "#F8FAFC" : "#FFF7ED",
      color: hasReported ? "#64748B" : "#C2410C",
      border: `1px solid ${hasReported ? "#CBD5E1" : "#FED7AA"}`,
      borderRadius: 11,
      fontSize: 16,
      fontFamily: "Tajawal,sans-serif",
      cursor: hasReported ? "default" : "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }),
    blockModal: DC => ({
      position: "relative",
      background: DC.white,
      borderRadius: 20,
      padding: "28px 24px",
      margin: "0 20px",
      width: "100%",
      maxWidth: 360,
      textAlign: "center",
      border: "1px solid " + DC.border
    }),
    blockText: DC => ({
      fontSize: 13,
      color: DC.text3,
      marginTop: 8,
      lineHeight: 1.5
    }),
    blockName: DC => ({
      fontWeight: 700,
      color: DC.text
    }),
    blockBtns: {
      display: "flex",
      gap: 10,
      marginTop: 20
    },
    cancelBlock: DC => ({
      flex: 1,
      padding: "12px",
      borderRadius: 10,
      border: "1px solid " + DC.border,
      background: DC.white,
      color: DC.text,
      fontSize: 13,
      fontWeight: 700,
      fontFamily: "Tajawal, sans-serif",
      cursor: "pointer"
    }),
    confirmBlock: DC => ({
      flex: 1,
      padding: "12px",
      borderRadius: 10,
      border: "none",
      background: DC.danger || C.danger,
      color: "white",
      fontSize: 13,
      fontWeight: 700,
      fontFamily: "Tajawal, sans-serif",
      cursor: "pointer"
    }),
    shamcashCard: DC => ({
      background: DC.white,
      borderRadius: 12,
      border: "1px solid " + DC.border,
      overflow: "hidden",
      marginBottom: 14
    }),
    shamcashHeader: {
      width: "100%",
      padding: "13px 14px",
      background: "none",
      border: "none",
      cursor: "pointer",
      fontFamily: "Tajawal,sans-serif",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    },
    shamcashBody: DC => ({
      borderTop: "1px solid " + DC.border,
      padding: "16px",
      textAlign: "center"
    }),
    shamcashCode: DC => ({
      fontSize: 14,
      fontWeight: 800,
      color: DC.text,
      direction: "ltr",
      marginBottom: 8
    }),
    copyBtn: DC => ({
      padding: "8px 20px",
      borderRadius: 10,
      border: "none",
      background: DC.primary,
      color: "white",
      fontSize: 12,
      fontWeight: 700,
      cursor: "pointer",
      fontFamily: "inherit"
    }),
    sectionTitle: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 12
    },
    sectionName: DC => ({
      fontSize: 15,
      fontWeight: 800,
      color: DC.text
    }),
    sectionCount: DC => ({
      fontSize: 12,
      color: DC.text3,
      marginRight: "auto"
    })
  };

  useEffect(() => {
    if (!user?.id || !sellerId) {
      setHasReported(false);
      return;
    }

    try {
      setHasReported(
        localStorage.getItem(reportStorageKey(user.id, "profile", sellerId)) === "1"
      );
    } catch {
      setHasReported(false);
    }
  }, [user?.id, sellerId]);

  useEffect(() => {
    let cancelled = false;

    async function loadRatings() {
      if (!sellerId) return;
      const stats = await fetchSellerRatingStats(sellerId);
      if (!cancelled && stats?.count > 0) setSellerRatings(stats);
    }

    loadRatings();

    return () => {
      cancelled = true;
    };
  }, [sellerId]);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      if (!sellerId) {
        setProfileLoading(false);
        setProfileFailed(true);
        return;
      }

      setProfileLoading(true);
      setProfileFailed(false);

      try {
        const data = await fetchSellerProfile(sellerId);

        if (cancelled) return;

        if (data) {
          setSellerProfile(data);
          setProfileFailed(false);
        } else if (!seller) {
          setProfileFailed(true);
        }
      } catch {
        if (!cancelled && !seller) setProfileFailed(true);
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [sellerId, seller]);

  const cleanName = value => {
    const name = String(value || "").trim();

    if (!name) return "";
    if (name === "مستخدم") return "";
    if (name.toLowerCase() === "user") return "";
    if (name.toLowerCase() === "unknown") return "";

    return name;
  };

  const trustedSellerName =
    cleanName(sellerProfile?.name) ||
    cleanName(sellerProfile?.full_name) ||
    cleanName(sellerProfile?.display_name) ||
    cleanName(seller?.sellerName) ||
    cleanName(seller?.name) ||
    cleanName(seller?.seller) ||
    "مستخدم";

  const trustedAccountType =
    sellerProfile?.account_type ||
    seller?.sellerAccountType ||
    seller?.accountType;

  const trustedVerified =
    typeof sellerProfile?.verified === "boolean"
      ? sellerProfile.verified
      : seller?.verified;

  const isOffice = trustedAccountType === "office";

  const sellerListings = (sbListings || []).filter(
    l => l.sellerId === sellerId || l.user_id === sellerId
  );

  const sellerData =
    (sbListings || []).find(l => l.sellerId === sellerId || l.user_id === sellerId) ||
    seller ||
    {};

  const openSellerChat = async () => {
    if (!user?.id) {
      setPage("login");
      return;
    }

    if (!sellerId || sellerId === user.id) return;

    const result = await findOrCreateConversation(user.id, sellerId);
    if (!result) return;

    setChat &&
      setChat({
        ...result.conv,
        name: trustedSellerName,
        property: result.isNew ? "" : result.conv?.listings?.title || ""
      });

    setPage("chat");
  };

  if (!sellerId) {
    return (
      <div style={sx.emptyShell(DC)}>
        <div style={sx.emptyIcon}>🔍</div>
        <div style={sx.emptyTitle}>تعذر فتح ملف المعلن</div>
        <div style={sx.emptyText(DC)}>رابط المعلن غير صحيح أو غير مكتمل.</div>
        <button onClick={() => setPage("home")} style={sx.emptyBtn(DC)}>
          العودة للرئيسية
        </button>
      </div>
    );
  }

  if (profileLoading && !seller && !sellerProfile) {
    return (
      <div style={sx.emptyShell(DC)}>
        <div style={sx.emptyIcon}>⏳</div>
        <div style={sx.emptyTitle}>جارٍ تحميل ملف المعلن...</div>
      </div>
    );
  }

  if (profileFailed && !seller && !sellerProfile) {
    return (
      <div style={sx.emptyShell(DC)}>
        <div style={sx.emptyIcon}>🔍</div>
        <div style={sx.emptyTitle}>تعذر فتح ملف المعلن</div>
        <div style={sx.emptyText(DC)}>ملف المعلن غير موجود أو غير متاح حاليًا.</div>
        <button onClick={() => setPage("home")} style={sx.emptyBtn(DC)}>
          العودة للرئيسية
        </button>
      </div>
    );
  }

  if (blocked) {
    return (
      <div style={sx.emptyShell(DC)}>
        <div style={sx.emptyIcon}>🚫</div>
        <div style={sx.emptyTitle}>تم حظر هذا المستخدم</div>
        <div style={sx.emptyText(DC)}>لن تظهر لك إعلاناته بعد الآن</div>
        <button
          onClick={() => {
            setBlocked(false);
            setPage("home");
          }}
          style={sx.emptyBtn(DC)}
        >
          العودة للرئيسية
        </button>
      </div>
    );
  }

  return (
    <div style={sx.page(DC)}>
      {showRating && (
        <RatingModal
          onClose={() => setShowRating(false)}
          sellerName={trustedSellerName}
          sellerId={sellerId}
        />
      )}

      {showReport && (
        <ReportModal
          itemId={sellerId}
          itemType="profile"
          itemTitle={trustedSellerName}
          onClose={() => setShowReport(false)}
          onReported={() => setHasReported(true)}
        />
      )}

      {showBlockConfirm && (
        <div style={S.fixedCenter}>
          <div onClick={() => setShowBlockConfirm(false)} style={S.overlay40} />
          <div style={sx.blockModal(DC)}>
            <div style={S.font48}>🚫</div>
            <div style={S.modalTitle17}>حظر هذا المستخدم؟</div>
            <div style={sx.blockText(DC)}>
              لن تظهر لك إعلانات{" "}
              <span style={sx.blockName(DC)}>{trustedSellerName}</span> بعد الآن
            </div>
            <div style={sx.blockBtns}>
              <button onClick={() => setShowBlockConfirm(false)} style={sx.cancelBlock(DC)}>
                إلغاء
              </button>
              <button
                onClick={async () => {
                  setShowBlockConfirm(false);
                  if (user?.id && sellerId) {
                    await blockUserAndCleanFollows(user.id, sellerId);
                  }
                  setBlocked(true);
                }}
                style={sx.confirmBlock(DC)}
              >
                حظر
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={sx.header(DC)}>
        <IslamicPattern opacity={0.1} color="#FFFFFF" />

        <div style={S.absTopRight14}>
          <BackButton onPress={() => setPage(prevPage || "home")} />
        </div>

        {sellerProfile?.cover_url && (
          <div style={sx.coverWrap}>
            <img src={sellerProfile.cover_url} alt="" style={sx.coverImg} />
          </div>
        )}

        <div style={S.relZ1}>
          <div style={sx.avatar(isOffice, DC)}>
            {sellerProfile?.avatar_url ? (
              <img src={sellerProfile.avatar_url} alt="" style={sx.avatarImg} />
            ) : (
              trustedSellerName[0]?.toUpperCase()
            )}
          </div>

          <div style={sx.nameRow}>
            <span style={sx.name(DC)}>{trustedSellerName}</span>
            {trustedVerified && <span style={sx.verified(DC)}>✓</span>}
          </div>

          {sellerId && sellerId !== user?.id && (
            <div style={sx.followWrap}>
              <FollowButton
                sellerId={sellerId}
                isFollowing={isFollowing}
                onToggle={toggleFollow}
                DC={DC}
              />
            </div>
          )}

          <div style={sx.badges}>
            {isOffice && <span style={sx.officeBadge(DC)}>🏢 مكتب موثّق</span>}
            {sellerData.idVerified && <span style={sx.idBadge}>🪪 موثّق بالهوية</span>}
          </div>

          {sellerRatings.count > 0 && (
            <div style={sx.ratingRow}>
              {sellerRatings.pending ? (
                <span style={sx.ratingPending}>⏳ {sellerRatings.count}/3 تقييم للعرض</span>
              ) : (
                <>
                  {[1, 2, 3, 4, 5].map(i => (
                    <span
                      key={i}
                      style={{
                        fontSize: 14,
                        color:
                          i <= Math.round(sellerRatings.avg)
                            ? "#C8952A"
                            : "rgba(255,255,255,0.3)"
                      }}
                    >
                      ★
                    </span>
                  ))}
                  <span style={sx.ratingAvg(DC)}>{sellerRatings.avg.toFixed(1)}</span>
                  <span style={sx.ratingCount}>({sellerRatings.count} تقييم)</span>
                </>
              )}
            </div>
          )}

          <div style={sx.statsRow}>
            {[
              [String(sellerListings.length), "إعلان"],
              [String(sellerListings.reduce((a, l) => a + (l.views || 0), 0)), "مشاهدة"],
              [
                sellerProfile?.created_at
                  ? new Date(sellerProfile.created_at).getFullYear()
                  : seller?.joinYear || "—",
                "عضو منذ"
              ]
            ].map(([n, l], i) => (
              <div key={i} style={sx.statBox(i)}>
                <div style={sx.statNum(DC)}>{n}</div>
                <div style={sx.statLabel}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        <Wave fill={DC.bg} />
      </div>

      <div style={S.pad14}>
        {(() => {
          const phones = [sellerProfile?.phone, sellerProfile?.phone2].filter(Boolean);
          // استخدم phone كرقم واتساب إذا كان whatsapp فارغاً (نفس منطق DetailPage)
          const was = [
            sellerProfile?.whatsapp || sellerProfile?.phone,
            sellerProfile?.whatsapp2 || sellerProfile?.phone2
          ].filter(Boolean);
          const curPhone = phones[activePhone] || "";
          const curWa = was[activeWa] || "";

          if (!curPhone && !curWa) return null;

          const rowSx = {
            row: {
              display: "flex",
              gap: 8,
              marginBottom: 10,
              alignItems: "center"
            },
            switcher: DC => ({
              width: 40,
              height: 54,
              background: DC.white,
              border: "1px solid " + DC.border,
              borderRadius: 12,
              fontSize: 18,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              color: DC.text2
            }),
            wa: {
              flex: 1,
              padding: "10px 8px",
              background: "#25D366",
              color: "white",
              borderRadius: 14,
              fontSize: 12,
              fontWeight: 800,
              textDecoration: "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              textAlign: "center",
              minHeight: 54
            },
            phone: DC => ({
              flex: 1,
              padding: "10px 8px",
              background: DC.white,
              color: DC.primary,
              border: "2px solid " + DC.primary,
              borderRadius: 14,
              fontSize: 12,
              fontWeight: 800,
              textDecoration: "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              textAlign: "center",
              minHeight: 54
            }),
            chat: DC => ({
              flex: 1,
              padding: "10px 8px",
              background: DC.primary,
              color: "white",
              border: "none",
              borderRadius: 14,
              fontSize: 13,
              fontWeight: 800,
              fontFamily: "Tajawal,sans-serif",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              minHeight: 54
            }),
            number: {
              direction: "ltr",
              fontSize: 11
            }
          };

          return (
            <div style={rowSx.row}>
              {(phones.length > 1 || was.length > 1) && (
                <button
                  onClick={() => {
                    if (phones.length > 1) setActivePhone(p => (p + 1) % phones.length);
                    if (was.length > 1) setActiveWa(w => (w + 1) % was.length);
                  }}
                  style={rowSx.switcher(DC)}
                >
                  ›
                </button>
              )}

              {curWa && (
                <a
                  href={"https://wa.me/" + toWhatsAppNumber(curWa)}
                  target="_blank"
                  rel="noreferrer"
                  style={rowSx.wa}
                >
                  <span style={S.font20}>💬</span>
                  <span style={rowSx.number}>{curWa}</span>
                </a>
              )}

              {curPhone && (
                <a href={"tel:" + curPhone} style={rowSx.phone(DC)}>
                  <span style={S.font20}>📞</span>
                  <span style={rowSx.number}>{curPhone}</span>
                </a>
              )}

              <button onClick={openSellerChat} style={rowSx.chat(DC)}>
                <span style={S.font20}>💬</span>
                <span>مراسلة</span>
              </button>
            </div>
          );
        })()}

        <div style={sx.actionsRow}>
          {!sellerProfile?.phone && !sellerProfile?.whatsapp && (
            <button onClick={openSellerChat} style={sx.chatBtn(DC)}>
              💬 مراسلة
            </button>
          )}

          <button onClick={() => setShowRating(true)} style={sx.lightBtn(DC)}>
            ⭐ تقييم
          </button>

          <button onClick={() => setShowBlockConfirm(true)} style={sx.blockBtn(DC)}>
            🚫
          </button>

          <button
            onClick={() => !hasReported && setShowReport(true)}
            disabled={hasReported}
            title={hasReported ? "تم الإبلاغ مسبقًا" : "الإبلاغ عن المستخدم"}
            style={sx.reportBtn(hasReported)}
          >
            {hasReported ? "🛡️" : "🚩"}
          </button>
        </div>

        {sellerProfile?.shamcash_code && sellerProfile?.shamcash_visible && (
          <div style={sx.shamcashCard(DC)}>
            <button onClick={() => setShowShamcash(v => !v)} style={sx.shamcashHeader}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={S.font20}>💳</span>
                <div style={S.textRight}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: DC.text }}>
                    شام كاش
                  </div>
                  <div style={{ fontSize: 11, color: DC.text3 }}>
                    {sellerProfile.shamcash_code}
                  </div>
                </div>
              </div>
              <span style={{ color: DC.text3, fontSize: 12 }}>
                {showShamcash ? "▲" : "▼"}
              </span>
            </button>

            {showShamcash && (
              <div style={sx.shamcashBody(DC)}>
                <SellerShamcashQR code={sellerProfile.shamcash_code} />
                <div style={sx.shamcashCode(DC)}>{sellerProfile.shamcash_code}</div>
                <button
                  onClick={() => navigator.clipboard?.writeText(sellerProfile.shamcash_code)}
                  style={sx.copyBtn(DC)}
                >
                  📋 نسخ الكود
                </button>
              </div>
            )}
          </div>
        )}

        <div style={sx.sectionTitle}>
          <Star size={14} color={DC.gold || C.gold} />
          <span style={sx.sectionName(DC)}>
            {"إعلانات " + (isOffice ? "المكتب" : trustedSellerName.split(" ")[0])}
          </span>
          <span style={sx.sectionCount(DC)}>{sellerListings.length} إعلان</span>
        </div>

        {sellerListings.slice(0, visibleCount).map(item => (
          <ListingCard
            key={item.id}
            item={item}
            onPress={i => {
              openDetail(i, "sellerProfile");
            }}
            favs={favs}
            toggleFav={toggleFav}
            DC={DC}
          />
        ))}

        <LoadMoreButton
          hasMore={sellerListings.length > visibleCount}
          loading={false}
          onPress={() => setVisibleCount(p => p + 20)}
        />
      </div>
    </div>
  );
}

export default SellerProfilePage;
