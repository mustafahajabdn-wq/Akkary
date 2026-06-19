import { incrementWhatsappClicks } from "../services/listingService.js";
import { trackContactClick } from "../../shared/services/metaPixel.js";

const INSTALL_FLAG = "__tabuAkhdarListingWhatsAppInstalled";
const SITE_ORIGIN = "https://www.blabladar.com";

const MESSAGE_TEXT =
  "مرحبًا، شاهدتُ إعلانكم على تطبيق «طابو أخضر»، ويُرجى تزويدي بمزيدٍ من التفاصيل والصور.";

function normalizeDigits(value) {
  const arabic = "٠١٢٣٤٥٦٧٨٩";
  const persian = "۰۱۲۳۴۵۶۷۸۹";

  return String(value || "")
    .replace(/[٠-٩]/g, digit => String(arabic.indexOf(digit)))
    .replace(/[۰-۹]/g, digit => String(persian.indexOf(digit)));
}

function toWhatsAppNumber(value) {
  let number = normalizeDigits(value).trim();

  number = number.replace(/[^\d+]/g, "");
  if (number.startsWith("+")) number = number.slice(1);
  number = number.replace(/\D/g, "");

  if (number.startsWith("00")) number = number.slice(2);
  if (number.startsWith("963")) return number;
  if (number.startsWith("09")) return `963${number.slice(1)}`;
  if (number.startsWith("9") && number.length === 9) return `963${number}`;

  return number;
}

function getListingId() {
  const match = window.location.pathname.match(/^\/listing\/([^/?#]+)(?:\/|$)/i);
  return match?.[1]?.trim() || "";
}

function isListingWhatsAppButton(button) {
  const text = normalizeDigits(button?.textContent || "").trim();

  return (
    text.includes("💬") &&
    !text.includes("مراسلة") &&
    /\d{7,}/.test(text.replace(/\s/g, ""))
  );
}

function extractPhone(button) {
  return normalizeDigits(button?.textContent || "").replace(/[^\d+]/g, "");
}

export function installListingWhatsAppMessage() {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (window[INSTALL_FLAG]) return;

  window[INSTALL_FLAG] = true;

  document.addEventListener(
    "click",
    event => {
      const listingId = getListingId();
      if (!listingId) return;

      const button = event.target?.closest?.("button");
      if (!button || !isListingWhatsAppButton(button)) return;

      const waNumber = toWhatsAppNumber(extractPhone(button));
      if (!waNumber) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      const listingUrl = `${SITE_ORIGIN}/listing/${encodeURIComponent(listingId)}`;
      const message = `${MESSAGE_TEXT}\n\nرابط الإعلان:\n${listingUrl}`;
      const whatsappUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;

      try {
        trackContactClick({ id: Number(listingId) || listingId }, "whatsapp");
      } catch {}

      incrementWhatsappClicks(listingId).catch(() => {});
      window.location.href = whatsappUrl;
    },
    true
  );
}
