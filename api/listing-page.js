import fs from "node:fs";
import path from "node:path";

const SITE_URL = "https://www.blabladar.com";
const SOCIAL_FALLBACK_IMAGE = `${SITE_URL}/icons/icon-192.png`;

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL;

const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;

function toAbsoluteUrl(value = "") {
  const text = String(value || "").trim();
  if (!text) return "";

  if (/^https?:\/\//i.test(text)) return text;
  if (text.startsWith("//")) return `https:${text}`;
  if (text.startsWith("/")) return `${SITE_URL}${text}`;

  return `${SITE_URL}/${text.replace(/^\.?\//, "")}`;
}

function escapeHtml(value = "") {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function cleanText(value = "", max = 170) {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
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
  if (!Number.isFinite(date.getTime())) return undefined;

  return date.toISOString();
}

function getPriceNumber(listing) {
  const n = Number(String(listing?.price || 0).replace(/,/g, ""));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function getPriceCurrency(listing) {
  const cur = String(listing?.currency || "").trim().toUpperCase();

  if (["USD", "SYP", "EUR", "TRY"].includes(cur)) return cur;

  return "SYP";
}

function formatPrice(listing) {
  const price = getPriceNumber(listing);
  if (!price) return "";

  return `${price.toLocaleString("en-US")} ${getPriceCurrency(listing)}`;
}

function getAvailability(listing) {
  const active =
    listing?.status === "active" &&
    listing?.admin_status === "approved";

  if (!active) return "https://schema.org/OutOfStock";

  if (listing?.expires_at) {
    const today = new Date().toISOString().slice(0, 10);
    const expires = String(listing.expires_at).slice(0, 10);

    if (expires < today) return "https://schema.org/OutOfStock";
  }

  return "https://schema.org/InStock";
}

function getListingArea(listing) {
  const value =
    listing?.net_area ??
    listing?.area ??
    listing?.total_area ??
    listing?.land_area ??
    listing?.build_area;

  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function getListingLocation(listing) {
  return [
    listing?.city,
    listing?.district,
    listing?.village,
    listing?.location_detail,
  ]
    .map((value) => cleanText(value, 180))
    .filter(Boolean)
    .join(" - ");
}

async function fetchJson(url) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("Missing Supabase env vars");
  }

  const response = await fetch(url, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Supabase fetch failed: ${response.status} ${text}`);
  }

  return response.json();
}

async function fetchListing(id) {
  const today = new Date().toISOString().slice(0, 10);

  const params = new URLSearchParams();

  // نستخدم جميع الأعمدة حتى تبقى الدالة متوافقة مع تغييرات جدول الإعلانات.
  params.set("select", "*");
  params.set("id", `eq.${id}`);
  params.set("status", "eq.active");
  params.set("admin_status", "eq.approved");
  params.set("or", `(expires_at.is.null,expires_at.gte.${today})`);
  params.set("limit", "1");

  const rows = await fetchJson(
    `${SUPABASE_URL}/rest/v1/listings?${params.toString()}`
  );

  return Array.isArray(rows) ? rows[0] || null : null;
}

async function fetchListingImage(id) {
  try {
    const params = new URLSearchParams();

    params.set("select", "*");
    params.set("listing_id", `eq.${id}`);
    params.set("order", "is_main.desc");
    params.set("limit", "1");

    const rows = await fetchJson(
      `${SUPABASE_URL}/rest/v1/listing_images?${params.toString()}`
    );

    const row = Array.isArray(rows) ? rows[0] : null;

    return toAbsoluteUrl(
      row?.url ||
      row?.image_url ||
      row?.path ||
      ""
    );
  } catch {
    return "";
  }
}

async function loadIndexHtml() {
  const localPath = path.join(process.cwd(), "dist", "index.html");

  if (fs.existsSync(localPath)) {
    return fs.readFileSync(localPath, "utf8");
  }

  const response = await fetch(`${SITE_URL}/index.html?seo-template=1`);
  if (response.ok) return response.text();

  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body>
  <div id="root"></div>
</body>
</html>`;
}

function removeOldSeo(html) {
  return String(html || "")
    .replace(/<title>[\s\S]*?<\/title>/i, "")
    .replace(/<meta\s+name=["']description["'][^>]*>/gi, "")
    .replace(/<meta\s+name=["']robots["'][^>]*>/gi, "")
    .replace(/<meta\s+property=["']og:[^"']+["'][^>]*>/gi, "")
    .replace(/<meta\s+name=["']twitter:[^"']+["'][^>]*>/gi, "")
    .replace(/<link\s+rel=["']canonical["'][^>]*>/gi, "")
    .replace(
      /<script\s+type=["']application\/ld\+json["'][\s\S]*?<\/script>/gi,
      ""
    )
    .replace(
      /<section\s+id=["']seo-listing-content["'][\s\S]*?<\/section>/gi,
      ""
    );
}

function injectIntoRoot(html, bodyContent) {
  const rootPattern = /<div([^>]*\bid=["']root["'][^>]*)>\s*<\/div>/i;

  if (rootPattern.test(html)) {
    return html.replace(
      rootPattern,
      (_match, attributes) => `<div${attributes}>${bodyContent}</div>`
    );
  }

  return html.replace(
    "</body>",
    `<div id="root">${bodyContent}</div>\n</body>`
  );
}

function buildListingJsonLd(listing, imageUrl, description, pageTitle, url) {
  const price = getPriceNumber(listing);
  const locationName = getListingLocation(listing);
  const area = getListingArea(listing);

  const lat = Number(listing?.map_lat ?? listing?.lat);
  const lng = Number(listing?.map_lng ?? listing?.lng);
  const hasCoordinates = Number.isFinite(lat) && Number.isFinite(lng);

  const listingEntity = {
    "@type": "RealEstateListing",
    "@id": `${url}#listing`,
    url,
    name: cleanText(listing?.title || "إعلان عقاري", 120),
    headline: cleanText(listing?.title || "إعلان عقاري", 120),
    description,
    inLanguage: "ar",
    datePosted: validIsoDate(listing?.created_at),
    dateModified: validIsoDate(listing?.updated_at || listing?.created_at),
    image: imageUrl ? [imageUrl] : undefined,
    contentLocation: locationName
      ? {
          "@type": "Place",
          name: locationName,
          address: {
            "@type": "PostalAddress",
            addressLocality:
              cleanText(listing?.district || listing?.village || listing?.city, 100) ||
              undefined,
            addressRegion: cleanText(listing?.city, 100) || undefined,
            addressCountry: "SY",
          },
          geo: hasCoordinates
            ? {
                "@type": "GeoCoordinates",
                latitude: lat,
                longitude: lng,
              }
            : undefined,
        }
      : undefined,
    about: {
      "@type": "Place",
      name: cleanText(listing?.category || "عقار", 80),
      additionalProperty: [
        area
          ? {
              "@type": "PropertyValue",
              name: "المساحة",
              value: area,
              unitText: "متر مربع",
            }
          : null,
        listing?.rooms
          ? {
              "@type": "PropertyValue",
              name: "عدد الغرف",
              value: Number(listing.rooms),
            }
          : null,
        listing?.floor !== null &&
        listing?.floor !== undefined &&
        String(listing.floor).trim() !== ""
          ? {
              "@type": "PropertyValue",
              name: "الطابق",
              value: String(listing.floor),
            }
          : null,
      ].filter(Boolean),
    },
    offers: price
      ? {
          "@type": "Offer",
          url,
          price,
          priceCurrency: getPriceCurrency(listing),
          availability: getAvailability(listing),
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
        isPartOf: {
          "@type": "WebSite",
          "@id": `${SITE_URL}/#website`,
          name: "طابو أخضر",
          url: SITE_URL,
        },
        primaryImageOfPage: imageUrl
          ? {
              "@type": "ImageObject",
              url: imageUrl,
            }
          : undefined,
        mainEntity: {
          "@id": `${url}#listing`,
        },
      },
      listingEntity,
    ],
  };
}

function buildListingSeo(listing, imageUrl = "") {
  const title = cleanText(listing?.title || "إعلان عقاري", 90);
  const city = cleanText(listing?.city || "", 35);
  const district = cleanText(listing?.district || "", 35);
  const category = cleanText(listing?.category || "", 35);
  const price = formatPrice(listing);
  const area = getListingArea(listing);

  const pageTitle = `${title} | طابو أخضر`;

  const fallbackDescription = [
    title,
    category ? `نوع العقار: ${category}` : "",
    district || city
      ? `الموقع: ${[city, district].filter(Boolean).join(" - ")}`
      : "",
    area ? `المساحة: ${area} م²` : "",
    price ? `السعر: ${price}` : "",
  ]
    .filter(Boolean)
    .join("، ");

  const description =
    cleanText(listing?.description, 160) ||
    cleanText(fallbackDescription, 160) ||
    "إعلان عقاري على منصة طابو أخضر للعقارات في سوريا.";

  const url = `${SITE_URL}/listing/${listing.id}`;
  const socialImage = imageUrl || SOCIAL_FALLBACK_IMAGE;
  const jsonLd = buildListingJsonLd(
    listing,
    imageUrl,
    description,
    pageTitle,
    url
  );

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
<meta property="og:image" content="${escapeHtml(socialImage)}">
<meta property="og:image:alt" content="${escapeHtml(title)}">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(pageTitle)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
<meta name="twitter:image" content="${escapeHtml(socialImage)}">

<script type="application/ld+json">${safeJsonLd(jsonLd)}</script>
`;
}

function buildListingBody(listing, imageUrl = "") {
  const title = cleanText(listing?.title || "إعلان عقاري", 140);
  const description =
    cleanText(listing?.description, 5000) ||
    "عقار";

  const location = getListingLocation(listing);
  const price = formatPrice(listing);
  const category = cleanText(listing?.category || "", 80);
  const area = getListingArea(listing);
  const rooms = Number(listing?.rooms);
  const hasRooms = Number.isFinite(rooms) && rooms > 0;

  const floorValue =
    listing?.floor !== null &&
    listing?.floor !== undefined &&
    String(listing.floor).trim() !== ""
      ? String(listing.floor).trim()
      : "";

  const ownership = cleanText(listing?.ownership || "", 120);

  const detailRows = [
    price ? ["السعر", price] : null,
    location ? ["الموقع", location] : null,
    category ? ["نوع العقار", category] : null,
    area ? ["المساحة", `${area} م²`] : null,
    hasRooms ? ["عدد الغرف", String(rooms)] : null,
    floorValue ? ["الطابق", floorValue] : null,
    ownership ? ["الملكية", ownership] : null,
  ].filter(Boolean);

  const rowsHtml = detailRows
    .map(
      ([label, value]) => `
        <div style="display:grid;grid-template-columns:minmax(90px,130px) 1fr;gap:12px;padding:9px 0;border-bottom:1px solid #e5e7eb">
          <dt style="font-weight:800;color:#1A4A2E">${escapeHtml(label)}</dt>
          <dd style="margin:0;color:#1f2937">${escapeHtml(value)}</dd>
        </div>`
    )
    .join("");

  return `
<section
  id="seo-listing-content"
  aria-label="تفاصيل الإعلان العقاري"
  style="max-width:920px;margin:24px auto;padding:20px;font-family:Tajawal,Arial,sans-serif;line-height:1.9;direction:rtl;color:#111827;background:#ffffff"
>
  <article>
    <header>
      <h1 style="margin:0 0 16px;font-size:clamp(24px,4vw,38px);line-height:1.4;color:#153d28">
        ${escapeHtml(title)}
      </h1>
    </header>

    ${imageUrl ? `
      <figure style="margin:0 0 20px">
        <img
          src="${escapeHtml(imageUrl)}"
          alt="${escapeHtml(title)}"
          loading="eager"
          style="display:block;width:100%;max-height:560px;object-fit:cover;border-radius:14px"
        >
      </figure>` : ""}

    ${rowsHtml ? `<dl style="margin:0 0 22px">${rowsHtml}</dl>` : ""}

    <section aria-labelledby="listing-description-heading">
      <h2 id="listing-description-heading" style="margin:0 0 8px;font-size:21px;color:#153d28">
        وصف الإعلان
      </h2>
      <p style="margin:0;white-space:pre-line;color:#374151">
        ${escapeHtml(description)}
      </p>
    </section>
  </article>
</section>`;
}

function buildNoIndexSeo(id, status = "not-found") {
  const url = `${SITE_URL}/listing/${id}`;
  const isTemporary = status === "temporary-error";

  return `
<title>${isTemporary ? "تعذر تحميل الإعلان مؤقتًا" : "الإعلان غير موجود"} | طابو أخضر</title>
<meta name="description" content="${isTemporary ? "تعذر تحميل بيانات الإعلان مؤقتًا." : "الإعلان المطلوب غير موجود أو لم يعد متاحًا."}">
<meta name="robots" content="noindex, follow">
<link rel="canonical" href="${escapeHtml(url)}">
`;
}

function buildNotFoundBody({ temporary = false } = {}) {
  const title = temporary
    ? "تعذر تحميل الإعلان مؤقتًا"
    : "الإعلان غير موجود";

  const description = temporary
    ? "حدث خلل مؤقت أثناء تحميل بيانات الإعلان."
    : "ربما تم حذف الإعلان أو انتهت صلاحيته أو أن الرابط غير صحيح.";

  return `
<section
  id="seo-listing-content"
  style="max-width:760px;margin:40px auto;padding:24px;font-family:Tajawal,Arial,sans-serif;line-height:1.9;direction:rtl;text-align:center"
>
  <h1 style="color:#153d28">${escapeHtml(title)}</h1>
  <p>${escapeHtml(description)}</p>
  <p><a href="${SITE_URL}/" style="color:#1A4A2E;font-weight:800">العودة إلى الصفحة الرئيسية</a></p>
</section>`;
}

export default async function handler(req, res) {
  const id = String(req.query?.id || "").replace(/\D/g, "");

  if (!id) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.end("Invalid listing id");
    return;
  }

  try {
    const htmlTemplate = await loadIndexHtml();
    const cleanedHtml = removeOldSeo(htmlTemplate);
    const listing = await fetchListing(id);

    if (!listing) {
      const noIndexSeo = buildNoIndexSeo(id);
      const notFoundBody = buildNotFoundBody();

      let html = cleanedHtml.replace(
        "</head>",
        `${noIndexSeo}\n</head>`
      );

      html = injectIntoRoot(html, notFoundBody);

      res.statusCode = 404;
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader(
        "Cache-Control",
        "public, max-age=60, s-maxage=300, stale-while-revalidate=600"
      );
      res.end(html);
      return;
    }

    const imageUrl =
      (await fetchListingImage(id)) ||
      toAbsoluteUrl(
        listing.image_url ||
        listing.photo ||
        ""
      );

    const seo = buildListingSeo(listing, imageUrl);
    const bodyContent = buildListingBody(listing, imageUrl);

    let html = cleanedHtml.replace(
      "</head>",
      `${seo}\n</head>`
    );

    html = injectIntoRoot(html, bodyContent);

    res.statusCode = 200;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader(
      "Cache-Control",
      "public, max-age=60, s-maxage=600, stale-while-revalidate=3600"
    );
    res.end(html);
  } catch (error) {
    console.error("listing-page SEO error:", error);

    const htmlTemplate = await loadIndexHtml().catch(() => "");
    const noIndexSeo = buildNoIndexSeo(id, "temporary-error");
    const errorBody = buildNotFoundBody({ temporary: true });

    let html = removeOldSeo(htmlTemplate || "");

    if (html.includes("</head>")) {
      html = html.replace(
        "</head>",
        `${noIndexSeo}\n</head>`
      );
    }

    if (html) {
      html = injectIntoRoot(html, errorBody);
    }

    res.statusCode = 503;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.end(html || "Service unavailable");
  }
}
