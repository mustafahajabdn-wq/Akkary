import fs from "node:fs";
import path from "node:path";

const SITE_URL = "https://www.blabladar.com";
const DEFAULT_SHARE_IMAGE = `${SITE_URL}/icons/icon-512.png?v=3`;
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

function escapeHtml(value = "") {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function cleanText(value = "", max = 170) {
  return String(value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function toAbsoluteUrl(value = "") {
  const text = String(value ?? "").trim();
  if (!text) return "";
  if (/^https?:\/\//i.test(text)) return text;
  if (text.startsWith("//")) return `https:${text}`;
  if (text.startsWith("/")) return `${SITE_URL}${text}`;
  return "";
}

function isValidShareImageUrl(value = "") {
  try {
    const url = new URL(String(value ?? "").trim());
    if (url.protocol !== "https:" || !url.hostname) return false;

    const pathname = url.pathname.toLowerCase();
    if (/(?:^|\/)(?:og-default|placeholder|no-image|default-image)(?:[._-]|\/|$)/i.test(pathname)) {
      return false;
    }

    return (
      /\.(?:png|jpe?g|webp|gif|avif|svg)$/i.test(pathname) ||
      pathname.includes("/storage/v1/object/")
    );
  } catch {
    return false;
  }
}

function normalizeImageCandidate(value) {
  if (!value) return "";

  if (Array.isArray(value)) {
    for (const item of value) {
      const normalized = normalizeImageCandidate(item);
      if (normalized) return normalized;
    }
    return "";
  }

  if (typeof value === "object") {
    return normalizeImageCandidate(
      value.url || value.image_url || value.public_url || value.publicUrl || value.src || value.path || ""
    );
  }

  const absoluteUrl = toAbsoluteUrl(value);
  return isValidShareImageUrl(absoluteUrl) ? absoluteUrl : "";
}

function imageMimeType(value = "") {
  let pathname = "";
  try {
    pathname = new URL(value).pathname.toLowerCase();
  } catch {}

  if (pathname.endsWith(".jpg") || pathname.endsWith(".jpeg")) return "image/jpeg";
  if (pathname.endsWith(".webp")) return "image/webp";
  if (pathname.endsWith(".gif")) return "image/gif";
  return "image/png";
}

function safeJsonLd(value) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function validIsoDate(value) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : undefined;
}

function priceNumber(listing) {
  const value = Number(String(listing?.price || 0).replace(/,/g, ""));
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function currency(listing) {
  const value = String(listing?.currency || "").trim().toUpperCase();
  return ["USD", "SYP", "EUR", "TRY"].includes(value) ? value : "SYP";
}

function priceText(listing) {
  const value = priceNumber(listing);
  return value ? `${value.toLocaleString("en-US")} ${currency(listing)}` : "";
}

function listingArea(listing) {
  const value = listing?.net_area ?? listing?.area ?? listing?.total_area ?? listing?.land_area ?? listing?.build_area;
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function listingLocation(listing) {
  return [listing?.city, listing?.district, listing?.village, listing?.location_detail]
    .map((value) => cleanText(value, 180))
    .filter(Boolean)
    .join(" - ");
}

async function fetchJson(url) {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error("Missing Supabase env vars");

  const response = await fetch(url, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(`Supabase fetch failed: ${response.status} ${message}`);
  }

  return response.json();
}

async function fetchListing(id) {
  const today = new Date().toISOString().slice(0, 10);
  const params = new URLSearchParams({
    select: "*",
    id: `eq.${id}`,
    status: "eq.active",
    admin_status: "eq.approved",
    or: `(expires_at.is.null,expires_at.gte.${today})`,
    limit: "1",
  });
  const rows = await fetchJson(`${SUPABASE_URL}/rest/v1/listings?${params}`);
  return Array.isArray(rows) ? rows[0] || null : null;
}

async function fetchListingImage(id) {
  try {
    const params = new URLSearchParams({
      select: "*",
      listing_id: `eq.${id}`,
      order: "is_main.desc",
      limit: "20",
    });
    const rows = await fetchJson(`${SUPABASE_URL}/rest/v1/listing_images?${params}`);
    return normalizeImageCandidate(Array.isArray(rows) ? rows : []);
  } catch {
    return "";
  }
}

function getListingImageFromRow(listing) {
  return normalizeImageCandidate([
    listing?.images,
    listing?.image_urls,
    listing?.photos,
    listing?.image_url,
    listing?.photo,
    listing?.cover_image,
    listing?.thumbnail,
  ]);
}

async function loadIndexHtml() {
  const localPath = path.join(process.cwd(), "dist", "index.html");
  if (fs.existsSync(localPath)) return fs.readFileSync(localPath, "utf8");

  const response = await fetch(`${SITE_URL}/index.html?seo-template=1`);
  if (response.ok) return response.text();

  return '<!doctype html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div></body></html>';
}

function removeOldSeo(html) {
  return String(html || "")
    .replace(/<title>[\s\S]*?<\/title>/i, "")
    .replace(/<meta\s+name=["'](?:description|robots|twitter:[^"']+)["'][^>]*>/gi, "")
    .replace(/<meta\s+property=["']og:[^"']+["'][^>]*>/gi, "")
    .replace(/<link\s+rel=["']canonical["'][^>]*>/gi, "")
    .replace(/<script\s+type=["']application\/ld\+json["'][\s\S]*?<\/script>/gi, "");
}

function injectIntoRoot(html, content) {
  const root = /<div([^>]*\bid=["']root["'][^>]*)>\s*<\/div>/i;
  if (root.test(html)) return html.replace(root, (_match, attrs) => `<div${attrs}>${content}</div>`);
  return html.replace("</body>", `<div id="root">${content}</div></body>`);
}

function buildJsonLd(listing, shareImage, description, pageTitle, url) {
  const area = listingArea(listing);
  const location = listingLocation(listing);
  const price = priceNumber(listing);
  const lat = Number(listing?.map_lat ?? listing?.lat);
  const lng = Number(listing?.map_lng ?? listing?.lng);
  const hasCoordinates = Number.isFinite(lat) && Number.isFinite(lng);

  const entity = {
    "@type": "RealEstateListing",
    "@id": `${url}#listing`,
    url,
    name: cleanText(listing?.title || "إعلان عقاري", 120),
    headline: cleanText(listing?.title || "إعلان عقاري", 120),
    description,
    inLanguage: "ar",
    datePosted: validIsoDate(listing?.created_at),
    dateModified: validIsoDate(listing?.updated_at || listing?.created_at),
    image: [shareImage],
    contentLocation: location
      ? {
          "@type": "Place",
          name: location,
          address: {
            "@type": "PostalAddress",
            addressLocality: cleanText(listing?.district || listing?.village || listing?.city, 100) || undefined,
            addressRegion: cleanText(listing?.city, 100) || undefined,
            addressCountry: "SY",
          },
          geo: hasCoordinates
            ? { "@type": "GeoCoordinates", latitude: lat, longitude: lng }
            : undefined,
        }
      : undefined,
    about: {
      "@type": "Place",
      name: cleanText(listing?.category || "عقار", 80),
      additionalProperty: [
        area ? { "@type": "PropertyValue", name: "المساحة", value: area, unitText: "متر مربع" } : null,
        Number(listing?.rooms) > 0 ? { "@type": "PropertyValue", name: "عدد الغرف", value: Number(listing.rooms) } : null,
        listing?.floor !== null && listing?.floor !== undefined && String(listing.floor).trim()
          ? { "@type": "PropertyValue", name: "الطابق", value: String(listing.floor) }
          : null,
      ].filter(Boolean),
    },
    offers: price
      ? {
          "@type": "Offer",
          url,
          price,
          priceCurrency: currency(listing),
          availability: "https://schema.org/InStock",
        }
      : undefined,
  };

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name: pageTitle,
        description,
        inLanguage: "ar",
        isPartOf: { "@type": "WebSite", "@id": `${SITE_URL}/#website`, name: "طابو أخضر", url: SITE_URL },
        primaryImageOfPage: { "@type": "ImageObject", url: shareImage },
        mainEntity: { "@id": `${url}#listing` },
      },
      entity,
    ],
  };
}

function buildSeo(listing, listingImage = "") {
  const title = cleanText(listing?.title || "إعلان عقاري", 90);
  const city = cleanText(listing?.city || "", 35);
  const district = cleanText(listing?.district || "", 35);
  const category = cleanText(listing?.category || "", 35);
  const area = listingArea(listing);
  const price = priceText(listing);
  const pageTitle = `${title} | طابو أخضر`;
  const fallbackDescription = [
    title,
    category ? `نوع العقار: ${category}` : "",
    district || city ? `الموقع: ${[city, district].filter(Boolean).join(" - ")}` : "",
    area ? `المساحة: ${area} م²` : "",
    price ? `السعر: ${price}` : "",
  ].filter(Boolean).join("، ");
  const description = cleanText(listing?.description, 160) || cleanText(fallbackDescription, 160) || "إعلان عقاري على منصة طابو أخضر للعقارات في سوريا.";
  const url = `${SITE_URL}/listing/${listing.id}`;
  const validListingImage = normalizeImageCandidate(listingImage);
  const shareImage = validListingImage || DEFAULT_SHARE_IMAGE;
  const shareImageAlt = validListingImage ? title : "طابو أخضر";
  const imageType = imageMimeType(shareImage);
  const structuredData = buildJsonLd(listing, shareImage, description, pageTitle, url);

  return `
<title>${escapeHtml(pageTitle)}</title>
<meta name="description" content="${escapeHtml(description)}">
<meta name="robots" content="index, follow, max-image-preview:large">
<link rel="canonical" href="${escapeHtml(url)}">
<meta property="og:site_name" content="طابو أخضر">
<meta property="og:locale" content="ar_SY">
<meta property="og:title" content="${escapeHtml(pageTitle)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${escapeHtml(url)}">
<meta property="og:image" content="${escapeHtml(shareImage)}">
<meta property="og:image:secure_url" content="${escapeHtml(shareImage)}">
<meta property="og:image:type" content="${escapeHtml(imageType)}">
<meta property="og:image:width" content="512">
<meta property="og:image:height" content="512">
<meta property="og:image:alt" content="${escapeHtml(shareImageAlt)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(pageTitle)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
<meta name="twitter:image" content="${escapeHtml(shareImage)}">
<script type="application/ld+json">${safeJsonLd(structuredData)}</script>`;
}

function buildBody(listing, listingImage = "") {
  const title = cleanText(listing?.title || "إعلان عقاري", 140);
  const description = cleanText(listing?.description, 5000) || "عقار";
  const area = listingArea(listing);
  const rows = [
    priceText(listing) ? ["السعر", priceText(listing)] : null,
    listingLocation(listing) ? ["الموقع", listingLocation(listing)] : null,
    listing?.category ? ["نوع العقار", cleanText(listing.category, 80)] : null,
    area ? ["المساحة", `${area} م²`] : null,
    Number(listing?.rooms) > 0 ? ["عدد الغرف", String(listing.rooms)] : null,
    listing?.floor !== null && listing?.floor !== undefined && String(listing.floor).trim() ? ["الطابق", String(listing.floor)] : null,
    listing?.ownership ? ["الملكية", cleanText(listing.ownership, 120)] : null,
  ].filter(Boolean);
  const details = rows.map(([label, value]) => `<div style="display:grid;grid-template-columns:minmax(90px,130px) 1fr;gap:12px;padding:9px 0;border-bottom:1px solid #e5e7eb"><dt style="font-weight:800;color:#1A4A2E">${escapeHtml(label)}</dt><dd style="margin:0;color:#1f2937">${escapeHtml(value)}</dd></div>`).join("");

  return `<section id="seo-listing-content" aria-label="تفاصيل الإعلان العقاري" style="max-width:920px;margin:24px auto;padding:20px;font-family:Tajawal,Arial,sans-serif;line-height:1.9;direction:rtl;color:#111827;background:#fff"><article><h1 style="margin:0 0 16px;font-size:clamp(24px,4vw,38px);line-height:1.4;color:#153d28">${escapeHtml(title)}</h1>${listingImage ? `<figure style="margin:0 0 20px"><img src="${escapeHtml(listingImage)}" alt="${escapeHtml(title)}" loading="eager" style="display:block;width:100%;max-height:560px;object-fit:cover;border-radius:14px"></figure>` : ""}${details ? `<dl style="margin:0 0 22px">${details}</dl>` : ""}<section><h2 style="margin:0 0 8px;font-size:21px;color:#153d28">وصف الإعلان</h2><p style="margin:0;white-space:pre-line;color:#374151">${escapeHtml(description)}</p></section></article></section>`;
}

function buildUnavailable(id, temporary = false) {
  const title = temporary ? "تعذر تحميل الإعلان مؤقتًا" : "الإعلان غير موجود";
  const description = temporary ? "حدث خلل مؤقت أثناء تحميل بيانات الإعلان." : "ربما تم حذف الإعلان أو انتهت صلاحيته أو أن الرابط غير صحيح.";
  const url = `${SITE_URL}/listing/${id}`;
  return {
    head: `<title>${escapeHtml(title)} | طابو أخضر</title><meta name="description" content="${escapeHtml(description)}"><meta name="robots" content="noindex, follow"><link rel="canonical" href="${escapeHtml(url)}">`,
    body: `<section id="seo-listing-content" style="max-width:760px;margin:40px auto;padding:24px;font-family:Tajawal,Arial,sans-serif;line-height:1.9;direction:rtl;text-align:center"><h1 style="color:#153d28">${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p><p><a href="${SITE_URL}/">العودة إلى الصفحة الرئيسية</a></p></section>`,
  };
}

export default async function handler(req, res) {
  const id = String(req.query?.id || "").replace(/\D/g, "");

  if (!id) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.end("Invalid listing id");
    return;
  }

  try {
    const template = removeOldSeo(await loadIndexHtml());
    const listing = await fetchListing(id);

    if (!listing) {
      const page = buildUnavailable(id);
      const html = injectIntoRoot(template.replace("</head>", `${page.head}</head>`), page.body);
      res.statusCode = 404;
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=600");
      res.end(html);
      return;
    }

    const listingImage = (await fetchListingImage(id)) || getListingImageFromRow(listing);
    const html = injectIntoRoot(
      template.replace("</head>", `${buildSeo(listing, listingImage)}</head>`),
      buildBody(listing, listingImage)
    );

    res.statusCode = 200;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=60, s-maxage=600, stale-while-revalidate=3600");
    res.end(html);
  } catch (error) {
    console.error("listing-page SEO error:", error);
    const page = buildUnavailable(id, true);
    const template = removeOldSeo(await loadIndexHtml().catch(() => ""));
    const html = template ? injectIntoRoot(template.replace("</head>", `${page.head}</head>`), page.body) : "Service unavailable";
    res.statusCode = 503;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.end(html);
  }
}
