// إعادة تصدير الألوان من tokens — اختصار C يُستخدم في كل الواجهة
import { COLORS } from "../styles/tokens.js";

export const C = COLORS;

export const LISTING_TYPE_COLORS = {
  sell: {
    key: "sell",
    label: "للبيع",
    color: "#1A4A2E",
    bg: "#E8F4F0",
    border: "#1A4A2E",
    icon: "🏷️"
  },
  rent: {
    key: "rent",
    label: "للإيجار",
    color: "#2C5F8A",
    bg: "#EFF6FF",
    border: "#2C5F8A",
    icon: "🔑"
  },
  lease: {
    key: "lease",
    label: "تأجير",
    color: "#2C5F8A",
    bg: "#EFF6FF",
    border: "#2C5F8A",
    icon: "🔑"
  },
  want_buy: {
    key: "want_buy",
    label: "مطلوب شراء",
    color: "#C8952A",
    bg: "#FEF3C7",
    border: "#C8952A",
    icon: "🔍"
  },
  want_rent: {
    key: "want_rent",
    label: "مطلوب للإيجار",
    color: "#7A3E1D",
    bg: "#FFF3EA",
    border: "#7A3E1D",
    icon: "🔍"
  }
};

export function getListingTypeKey(value) {
  if (value === "للبيع" || value === "sell") return "sell";
  if (value === "للإيجار" || value === "rent") return "rent";
  if (value === "lease" || value === "تأجير") return "lease";
  if (value === "want_buy" || value === "مطلوب شراء") return "want_buy";
  if (value === "want_rent" || value === "مطلوب للإيجار" || value === "مطلوب إيجار") return "want_rent";
  return "sell";
}

export function getListingTypeStyle(value) {
  const key = getListingTypeKey(value);
  return LISTING_TYPE_COLORS[key] || LISTING_TYPE_COLORS.sell;
}

export function getListingTypeLabel(value) {
  return getListingTypeStyle(value).label;
}

export function getListingTypeColor(value) {
  return getListingTypeStyle(value).color;
}
