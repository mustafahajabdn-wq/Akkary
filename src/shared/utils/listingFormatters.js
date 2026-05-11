// src/shared/utils/listingFormatters.js

const DEFAULT_BRAND = "طابو أخضر";
const DEFAULT_BASE_URL = "https://www.blabladar.com";

function toNumber(value) {
  if (value === null || value === undefined || value === "") return 0;

  const cleaned = String(value)
    .replace(/,/g, "")
    .replace(/[^\d.-]/g, "");

  const num = Number(cleaned);
  return Number.isFinite(num) ? num : 0;
}

function getExtra(item, key) {
  const extra = item?.extra_fields;

  if (!extra) return undefined;

  if (typeof extra === "string") {
    try {
      const parsed = JSON.parse(extra);
      return parsed?.[key];
    } catch {
      return undefined;
    }
  }

  if (typeof extra === "object") {
    return extra?.[key];
  }

  return undefined;
}

export function formatListingPrice(item) {
  const price = toNumber(item?.price ?? item?.priceNum);

  if (price <= 0) {
    return "السعر عند التواصل";
  }

  const currency = item?.currency || "";
  return `${price.toLocaleString("en-US")} ${currency}`.trim();
}

export function formatListingLocation(item) {
  return [
    item?.city,
    item?.district,
    item?.village,
  ]
    .filter(Boolean)
    .join(" — ");
}

export function formatListingArea(item) {
  const area = toNumber(
    item?.total_area ??
      item?.area ??
      item?.land_area ??
      item?.build_area ??
      getExtra(item, "total_area") ??
      getExtra(item, "area") ??
      getExtra(item, "land_area") ??
      getExtra(item, "build_area")
  );

  return area > 0 ? `${area}م²` : "";
}

export function formatListingRooms(item) {
  const rooms = toNumber(item?.rooms ?? getExtra(item, "rooms"));

  const salonRaw =
    item?.salle ??
    item?.salon ??
    item?.salons ??
    item?.living_rooms ??
    getExtra(item, "salle") ??
    getExtra(item, "salon") ??
    getExtra(item, "salons") ??
    getExtra(item, "living_rooms");

  const salons =
    salonRaw === true || salonRaw === "true"
      ? 1
      : toNumber(salonRaw);

  const parts = [];

  if (rooms > 0) {
    if (rooms === 1) parts.push("غرفة");
    else if (rooms === 2) parts.push("غرفتان");
    else parts.push(`${rooms} غرف`);
  }

  if (salons > 0) {
    if (salons === 1) parts.push("صالون");
    else if (salons === 2) parts.push("صالونان");
    else parts.push(`${salons} صالونات`);
  }

  return parts.join(" و");
}

export function getListingPhone(item) {
  return (
    item?.phone ||
    item?.phone2 ||
    item?.whatsapp ||
    item?.whatsapp2 ||
    ""
  );
}

export function getListingUrl(item, baseUrl = DEFAULT_BASE_URL) {
  if (item?.external_url) return item.external_url;

  const id = item?.id;
  if (!id) return baseUrl;

  return `${baseUrl.replace(/\/$/, "")}/listing/${id}`;
}

export function getListingShareData(item, options = {}) {
  return {
    brand: options.brand || DEFAULT_BRAND,
    title: item?.title || "إعلان عقاري",
    price: formatListingPrice(item),
    location: formatListingLocation(item),
    rooms: formatListingRooms(item),
    area: formatListingArea(item),
    phone: getListingPhone(item),
    url: getListingUrl(item, options.baseUrl),
  };
}

export function buildListingShareText(item, options = {}) {
  const data = getListingShareData(item, options);

  return [
    `🏠 ${data.title}`,
    `💰 ${data.price}`,
    data.location ? `📍 ${data.location}` : "",
    data.rooms ? `🛏 ${data.rooms}` : "",
    data.area ? `📐 ${data.area}` : "",
    data.phone ? `📞 ${data.phone}` : "",
    "",
    `🔗 ${data.url}`,
    "",
    `عبر تطبيق ${data.brand}`,
  ]
    .filter((line) => line !== "")
    .join("\n");
}

export default {
  formatListingPrice,
  formatListingLocation,
  formatListingArea,
  formatListingRooms,
  getListingPhone,
  getListingUrl,
  getListingShareData,
  buildListingShareText,
};
