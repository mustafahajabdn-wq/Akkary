// ثوابت ودوال خاصة بالإعلانات والقصص
export const LISTING_MAX_DAYS = 30;

export const getStale = (d) => {
  d = d || 0;
  if (d <= 7) {
    return { label: "جديد", color: "#065F46", bg: "#D1FAE5", icon: "🟢", urgent: false, expired: false };
  }
  if (d <= 20) {
    return { label: "نشيط", color: "#1A4A2E", bg: "#E8F5E9", icon: "🟡", urgent: false, expired: false };
  }
  if (d <= 29) {
    return { label: "يحتاج تجديد", color: "#92400E", bg: "#FEF3C7", icon: "🟠", urgent: true, expired: false };
  }
  return { label: "منتهي", color: "#991B1B", bg: "#FEE2E2", icon: "🔴", urgent: true, expired: true };
};

export const freshBar = (d) => {
  const pct = Math.max(0, Math.round(((LISTING_MAX_DAYS - (d || 0)) / LISTING_MAX_DAYS) * 100));
  return {
    pct,
    color: pct > 66 ? "#22C55E" : pct > 33 ? "#C8952A" : "#EF4444",
  };
};

export const UPDATE_TYPES = {
  available: { label: "متاح", icon: "✅", color: "1A4A2E", bg: "E8F4F0" },
  price: { label: "تخفيض سعر", icon: "💰", color: "92400E", bg: "FEF3C7" },
  visit: { label: "موعد معاينة", icon: "📅", color: "1565C0", bg: "EFF6FF" },
  sold: { label: "تم البيع", icon: "🎉", color: "6B21A8", bg: "F3F0FF" },
  custom: { label: "تحديث", icon: "📝", color: "374151", bg: "F9FAFB" },
};

export const STORIES_INIT = [
  { id: "me", name: "حالتي", init: "أ", isMe: true, accountType: "individual", stories: [] },
];

export const STORY_TYPE_COLORS = {
  listing: "1A4A2E",
  price: "92400E",
  visit: "1565C0",
  rent: "2D6B45",
  custom: "374151",
};

export const STORY_TYPES_LABELS = [
  { key: "listing", icon: "🏠", label: "إعلان عقاري" },
  { key: "price", icon: "💰", label: "تخفيض سعر" },
  { key: "visit", icon: "📅", label: "موعد معاينة" },
  { key: "rent", icon: "🔑", label: "للإيجار" },
  { key: "custom", icon: "✏️", label: "نص حر" },
];
