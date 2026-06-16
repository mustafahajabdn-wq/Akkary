import React from "react";
import { C, getListingTypeStyle } from "../../constants/colors.js";
import { IslamicPattern } from "../icons.jsx";
import { LISTING_MAX_DAYS } from "../../utils/listing.js";
import { timeAgo } from "../../utils/time.js";
import { S } from "../../styles/primitives.js";
import { CC } from "../../styles/componentStyles.js";
import { LazyImage } from "./LazyImage.jsx";
import { CurrencyTag, OwnershipTag, OfficeBadge } from "./Badges.jsx";
function CardMedia({
  item,
  isWant,
  emoji,
  typeColor,
  typeLabel,
  isNew,
  DC,
  isFaved,
  toggleFav
}) {
  const hasVideo = !isWant && !!item.video_url;
  const photoSrc = !isWant ? item.photo || item.images?.[0] || null : null;
  const hasPhoto = !!photoSrc;
  const sx = {
    s1: (isWant, DC) => ({
      width: 130,
      height: 130,
      background: isWant ? "#FFFBEB" : DC.bg2,
      flexShrink: 0,
      position: "relative",
      overflow: "hidden"
    }),
    s2: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      position: "absolute",
      inset: 0
    },
    s3: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      position: "absolute",
      inset: 0
    },
    s4: {
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 36,
      position: "absolute",
      inset: 0
    },
    s5: {
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%,-50%)",
      width: 30,
      height: 30,
      borderRadius: "50%",
      background: "rgba(0,0,0,0.40)",
      border: "2px solid rgba(255,255,255,0.9)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 4
    },
    s6: {
      fontSize: 12,
      color: "white",
      marginRight: -1
    },
    s7: {
      position: "absolute",
      top: 4,
      left: 4,
      width: 24,
      height: 24,
      borderRadius: "50%",
      background: "rgba(255,255,255,0.92)",
      border: "none",
      fontSize: 11,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 5
    },
    s8: typeColor => ({
      position: "absolute",
      bottom: 4,
      right: 0,
      left: 0,
      textAlign: "center",
      background: typeColor,
      color: "white",
      fontSize: 8,
      fontWeight: 900,
      padding: "2px 4px",
      zIndex: 5
    })
  };
  return <div style={sx.s1(isWant, DC)}>
      {hasVideo ? <video src={item.video_url} preload="metadata" muted playsInline style={sx.s2} /> : hasPhoto ? <LazyImage src={photoSrc} alt="" style={sx.s3} /> : <div style={sx.s4}>
          <IslamicPattern opacity={0.1} color={C.primary} width={100} height={100} />
          <span style={S.relZ1}>{isWant ? "🔍" : emoji}</span>
        </div>}

      {hasVideo && <div style={sx.s5}>
          <span style={sx.s6}>▶</span>
        </div>}

      <button onClick={e => {
      e.stopPropagation();
      toggleFav?.(item.id);
    }} style={sx.s7}>
        {isFaved ? "❤️" : "🤍"}
      </button>

      <div style={sx.s8(typeColor)}>
        {typeLabel}
        {isNew ? " ✨" : ""}
      </div>
    </div>;
}
function ListingCard({
  item,
  onPress,
  favs,
  toggleFav,
  DC,
  cardSettings = {},
  mode = "public",
  onBump,
  onEdit,
  onToggleStatus,
  onDelete,
  onHide,
  onApprove,
  onReject,
  onUnflag,
  onExtend,
  onApprovePending,
  onRejectPending,
  onDeletePending
}) {
  const sx = {
    s1: {
      display: "flex",
      height: 130,
      overflow: "hidden"
    },
    s2: {
      display: "flex",
      gap: 5,
      overflow: "hidden"
    },
    s3: {
      display: "flex",
      marginTop: 2
    }
  };
  if (!DC) DC = C;
  const isFaved = favs?.includes(Number(item.id)) || favs?.includes(String(item.id));
  const isWant = item.type === "want_buy" || item.type === "want_rent";
  const categoryKey = String(item.category || "").trim();
  const emoji = {
    "شقة": "🏢",
    "بيت عربي": "🏠",
    "أرض سكنية": "🏗️",
    "أرض زراعية": "🌾",
    "محل": "🏪",
    "محل تجاري": "🏪",
    "مستودع": "📦",
    "مكتب": "🖥️",
    "فيلا-مزرعة": "🏡",
    "فيلا": "🏡",
    "مزرعة": "🌿",
    "شاليه": "🏖️",
    "سكن طلاب": "🎓"
  }[categoryKey] || "🏠";
  const typeStyle = getListingTypeStyle(item.type);
  const typeLabel = typeStyle.label;
  const typeColor = typeStyle.color;
  const priceValue = item.price ?? item.price_num ?? null;
  const hasPrice = priceValue !== null && priceValue !== undefined && priceValue !== "" && Number(priceValue) !== 0;
  const areaValue = item.total_area ?? item.net_area ?? item.land_area ?? null;
  const roomCount = item.rooms ?? null;
  const salonsValue = item.salle ?? null;
  const ownershipText = item.ownership ?? "";
  const sellerName = item.seller || "مستخدم";
  const sellerInit = item.sellerInit || sellerName[0] || "م";
  const isNew = (item.daysOld || 0) <= 3;
  const roomsSalonsLine = [roomCount ? roomCount === 1 ? "غرفة" : roomCount === 2 ? "غرفتان" : `${roomCount} غرف` : null, salonsValue ? salonsValue === 1 ? "صالون" : salonsValue === 2 ? "صالونان" : `${salonsValue} صالونات` : null].filter(Boolean).join(" و");
  return <div onClick={() => onPress && onPress(item)} onMouseEnter={() => {
    if (item.photo) {
      const img = new Image();
      img.src = item.photo;
    }
  }} onTouchStart={() => {
    if (item.photo) {
      const img = new Image();
      img.src = item.photo;
    }
  }} style={CC.listingCard(DC, isWant)}>
      <div style={CC.listingTopBar(typeColor)} />

      <div style={sx.s1}>
        <CardMedia item={item} isWant={isWant} emoji={emoji} typeColor={typeColor} typeLabel={typeLabel} isNew={isNew} DC={DC} isFaved={isFaved} toggleFav={toggleFav} />

        <div style={CC.listingBody}>
          <div style={CC.listingTitle(DC)}>
            {item.title || item.category}
          </div>

          <div style={S.rowCenterGap4Overflow}>
            <span style={CC.listingPrice}>
              {hasPrice ? isWant ? `حتى ${priceValue}` : priceValue : cardSettings.showPriceOnContact !== false ? "السعر عند التواصل" : "—"}
            </span>

            {hasPrice && <span style={CC.listingCurrency}>
                {item.currency || "USD"}
              </span>}

            {!isWant && (item.type === "rent" || item.type === "lease") && hasPrice && <span style={CC.listingRentSuffix}>/شهر</span>}
          </div>

          <div style={sx.s2}>
            {areaValue && <span style={CC.statPill(DC, isWant)}>
                📐{areaValue}م²
              </span>}

            {roomsSalonsLine && <span style={CC.statPill(DC, isWant)}>
                {roomsSalonsLine}
              </span>}
          </div>

          {ownershipText && item.type !== "want_rent" && <div style={sx.s3}>
              <span style={CC.ownershipPill}>
                📋{ownershipText}
              </span>
            </div>}

          <div style={CC.listingMetaRow}>
            <span style={CC.listingLocation(DC)}>
              📍{item.city}
              {item.district ? " — " + item.district : ""}
            </span>

            <div style={CC.listingTimeCol}>
              <span style={CC.listingTime(DC)}>{item.time}</span>
              {cardSettings.showTimeAgo !== false && item.timeAgo && <span style={CC.listingTimeAgo(DC)}>
                  {item.timeAgo}
                </span>}
            </div>
          </div>

          {cardSettings.showSellerName !== false && mode !== "owner" && <div style={S.rowCenterGap4Overflow}>
              <div style={CC.sellerAvatar(item.accountType)}>
                {sellerInit}
              </div>

              <span style={CC.sellerName}>
                {sellerName}
              </span>

              {item.verified && <span style={CC.verifiedTick}>✓</span>}

              <OfficeBadge type={item.accountType} />
            </div>}

          {mode === "owner" && item.daysOld !== undefined && (() => {
          let rem;
          if (item.expires_at) {
            rem = Math.ceil((new Date(item.expires_at) - Date.now()) / 86400000);
          } else {
            rem = LISTING_MAX_DAYS - (item.daysOld || 0);
          }
          const totalDays = item.expires_at ? Math.ceil((new Date(item.expires_at) - new Date(item.created_at || Date.now())) / 86400000) : LISTING_MAX_DAYS;
          const pct = Math.max(0, Math.min(100, Math.round(rem / totalDays * 100)));
          const expired = rem <= 0;
          const urgent = rem <= 7;
          const color = expired ? "#EF4444" : urgent ? "#C8952A" : C.primary;
          const bg = expired ? "#FEF2F2" : urgent ? "#FFFBEB" : "#F0FDF4";
          const label = expired ? "⚠️ انتهى" : urgent ? "⏳ قريب" : "🟢 جديد";
          return <div style={CC.expiryBox(bg, urgent, expired)}>
                <div style={CC.expiryHead}>
                  <span style={CC.expiryLabel(color)}>{label}</span>
                  <span style={CC.expiryValue(color)}>
                    {expired ? "مخفي" : rem + " يوم"}
                  </span>
                </div>

                <div style={CC.expiryTrack}>
                  <div style={CC.expiryFill(pct, color)} />
                </div>
              </div>;
        })()}
        </div>
      </div>

      {mode === "owner" && <div style={CC.actionRow(DC)}>
          {(item.daysOld || 0) > 7 && onBump && <button onClick={e => {
        e.stopPropagation();
        onBump(item);
      }} style={CC.ownerActionButton({
        borderRadius: 0,
        borderLeft: `1px solid ${DC.border}`,
        background: "#FFFBEB",
        color: "#C8952A"
      })}>
              🔄 تجديد
            </button>}

          {onEdit && <button onClick={e => {
        e.stopPropagation();
        onEdit(item);
      }} style={CC.ownerActionButton({
        borderLeft: `1px solid ${DC.border}`,
        background: "#F9FAFB",
        color: DC.text
      })}>
              ✏️ تعديل
            </button>}

          {onToggleStatus && item.admin_status === "approved" && <button onClick={e => {
        e.stopPropagation();
        onToggleStatus(item);
      }} style={CC.ownerActionButton({
        borderLeft: `1px solid ${DC.border}`,
        background: item.status === "active" ? "#FEF3C7" : "#E8F4F0",
        color: item.status === "active" ? "#92400E" : "#1A4A2E"
      })}>
              {item.status === "active" ? "🙈 إخفاء" : "👁 إظهار"}
            </button>}

          {onDelete && <button onClick={e => {
        e.stopPropagation();
        onDelete(item);
      }} style={CC.ownerActionButton({
        background: "#FEF2F2",
        color: "#EF4444"
      })}>
              🗑️ حذف
            </button>}
        </div>}

      {mode === "admin" && <div style={CC.actionRow(DC)}>
          {onHide && <button onClick={e => {
        e.stopPropagation();
        onHide(item);
      }} style={CC.adminActionButton(DC, {
        background: item.status === "hidden" ? "#E8F4F0" : "#F3F4F6",
        color: item.status === "hidden" ? "#1A4A2E" : "#374151"
      })}>
              {item.status === "hidden" ? "👁" : "🙈"}
            </button>}
          {onUnflag && <button onClick={e => {
        e.stopPropagation();
        onUnflag(item);
      }} style={CC.adminActionButton(DC, {
        background: item.admin_status === "flagged" ? "#EFF6FF" : item.admin_status === "hidden_by_reports" ? "#F0FDF4" : "#FFF7ED",
        color: item.admin_status === "flagged" ? "#2563EB" : item.admin_status === "hidden_by_reports" ? "#15803D" : "#C2410C"
      })}>
              {item.admin_status === "flagged" ? "👁 إظهار إداري" : item.admin_status === "hidden_by_reports" ? "🟢 إعادة نشر بعد المراجعة" : "🚫 إخفاء إداري"}
            </button>}
          {onApprove && item.admin_status !== "approved" && item.admin_status !== "flagged" && item.admin_status !== "hidden_by_reports" && <button onClick={e => {
        e.stopPropagation();
        onApprove(item);
      }} style={CC.adminActionButton(DC, {
        background: "#F0FDF4",
        color: "#16A34A"
      })}>
              ✅ قبول
            </button>}
          {onReject && item.admin_status === "pending" && <button onClick={e => {
        e.stopPropagation();
        onReject(item);
      }} style={CC.adminActionButton(DC, {
        background: "#FEF2F2",
        color: "#EF4444"
      })}>
              ❌ رفض
            </button>}
          {onDelete && <button onClick={e => {
        e.stopPropagation();
        onDelete(item);
      }} style={CC.adminActionButton(DC, {
        borderLeft: undefined,
        background: "#FEE2E2",
        color: "#991B1B"
      })}>
              🗑️ حذف
            </button>}
          {onEdit && <button onClick={e => {
        e.stopPropagation();
        onEdit(item);
      }} style={CC.adminActionButton(DC, {
        background: "#EFF6FF",
        color: "#2563EB"
      })}>
              ✏️ تعديل كامل
            </button>}
        </div>}

      {mode === "pending" && <div style={CC.actionRow(DC)}>
          {onApprovePending && <button onClick={e => {
        e.stopPropagation();
        onApprovePending(item);
      }} style={CC.pendingActionButton({
        borderLeft: `1px solid ${DC.border}`,
        background: "#F0FDF4",
        color: "#16A34A"
      })}>
              ✅ موافقة
            </button>}

          {onRejectPending && <button onClick={e => {
        e.stopPropagation();
        onRejectPending(item);
      }} style={CC.pendingActionButton({
        background: "#FEF2F2",
        color: "#EF4444"
      })}>
              ❌ رفض
            </button>}
          {onDeletePending && <button onClick={e => {
        e.stopPropagation();
        onDeletePending(item);
      }} style={CC.pendingActionButton({
        borderRight: "1px solid #FEE2E2",
        background: "#FFF1F2",
        color: "#9B1C1C"
      })}>
              🗑 حذف
            </button>}
        </div>}
    </div>;
}

const ListingCardMemo = React.memo(ListingCard);
export { ListingCardMemo as ListingCard };
