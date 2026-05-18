import fs from "node:fs";
import path from "node:path";

const SITE_URL = "https://www.blabladar.com";
const MIN_AREA_LISTINGS = 1;

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL;

const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;

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
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function normalizeArabic(value = "") {
  return String(value || "")
    .trim()
    .replace(/[ًٌٍَُِّْ]/g, "")
    .replace(/[إأآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function slugToName(value = "") {
  try {
    return decodeURIComponent(String(value || ""))
      .replace(/-/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  } catch {
    return String(value || "")
      .replace(/-/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
}

function nameToSlug(value = "") {
  return encodeURIComponent(
    String(value || "")
      .trim()
      .replace(/\s+/g, "-")
  );
}

function areaUrl(city, district = "") {
  const citySlug = nameToSlug(city);
  const districtSlug = nameToSlug(district);
  return districtSlug
    ? `${SITE_URL}/real-estate/${citySlug}/${districtSlug}`
    : `${SITE_URL}/real-estate/${citySlug}`;
}

function getAreaFromRequest(req) {
  const rawCity = req.query?.city || "";
  const rawDistrict = req.query?.district || "";

  const city = cleanText(slugToName(rawCity), 60);
  const district = cleanText(slugToName(rawDistrict), 80);

  return { city, district };
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
      Prefer: "count=exact",
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Supabase fetch failed: ${response.status} ${text}`);
  }

  return response.json();
}

async function fetchAreaListings(city, district) {
  const today = new Date().toISOString().slice(0, 10);
  const params = new URLSearchParams();

  params.set("select", "*");
  params.set("status", "eq.active");
  params.set("admin_status", "eq.approved");
  params.set("or", `(expires_at.is.null,expires_at.gte.${today})`);
  params.set("order", "created_at.desc");
  params.set("limit", "24");

  if (city) params.set("city", `ilike.${city}`);
  if (district) params.set("district", `ilike.${district}`);

  const rows = await fetchJson(`${SUPABASE_URL}/rest/v1/listings?${params.toString()}`);
  return Array.isArray(rows) ? rows : [];
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
  return html
    .replace(/<title>[\s\S]*?<\/title>/i, "")
    .replace(/<meta\s+name=["']description["'][^>]*>/gi, "")
    .replace(/<meta\s+name=["']robots["'][^>]*>/gi, "")
    .replace(/<meta\s+property=["']og:[^"']+["'][^>]*>/gi, "")
    .replace(/<meta\s+name=["']twitter:[^"']+["'][^>]*>/gi, "")
    .replace(/<link\s+rel=["']canonical["'][^>]*>/gi, "")
    .replace(/<script\s+type=["']application\/ld\+json["'][\s\S]*?<\/script>/gi, "");
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

function buildListingLine(listing) {
  const title = cleanText(listing?.title || "عقار", 90);
  const parts = [
    listing?.category ? cleanText(listing.category, 30) : "",
    getListingArea(listing) ? `${getListingArea(listing)} م²` : "",
    listing?.rooms ? `${listing.rooms} غرف` : "",
    formatPrice(listing) ? `السعر ${formatPrice(listing)}` : "",
  ].filter(Boolean);

  return `${title}${parts.length ? ` — ${parts.join("، ")}` : ""}`;
}

function buildAreaSeo({ city, district, listings }) {
  const areaName = district || city;
  const locationText = district ? `${district} - ${city}` : city;
  const url = areaUrl(city, district);
  const count = listings.length;

  const pageTitle = district
    ? `عقارات للبيع والإيجار في ${district} - طابو أخضر`
    : `عقارات للبيع والإيجار في ${city} - طابو أخضر`;

  const sampleCategories = [...new Set(listings.map((item) => cleanText(item.category, 30)).filter(Boolean))]
    .slice(0, 4);

  const description = cleanText(
    district
      ? `تصفح أحدث عقارات ${district} في ${city} على طابو أخضر: ${sampleCategories.join("، ") || "شقق ومنازل ومحلات"} للبيع والإيجار مع الأسعار والمساحات والتفاصيل.`
      : `تصفح أحدث عقارات ${city} على طابو أخضر: ${sampleCategories.join("، ") || "شقق ومنازل ومحلات"} للبيع والإيجار مع الأسعار والمساحات والتفاصيل.`,
    160
  );

  const itemList = listings.slice(0, 12).map((listing, index) => ({
    "@type": "ListItem",
    position: index + 1,
    url: `${SITE_URL}/listing/${listing.id}`,
    name: cleanText(listing.title || "إعلان عقاري", 90),
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        name: pageTitle,
        description,
        url,
        inLanguage: "ar",
        isPartOf: {
          "@type": "WebSite",
          name: "طابو أخضر",
          url: SITE_URL,
        },
        about: {
          "@type": "Place",
          name: locationText,
        },
      },
      ...(itemList.length
        ? [
            {
              "@type": "ItemList",
              "@id": `${url}#listings`,
              name: `أحدث العقارات في ${areaName}`,
              numberOfItems: itemList.length,
              itemListElement: itemList,
            },
          ]
        : []),
    ],
  };

  const listingLinks = listings
    .slice(0, 8)
    .map((listing) => {
      const href = `${SITE_URL}/listing/${listing.id}`;
      return `<li><a href="${escapeHtml(href)}">${escapeHtml(buildListingLine(listing))}</a></li>`;
    })
    .join("\n");

  const fallbackContent = `
<section id="seo-area-content" style="max-width:980px;margin:24px auto;padding:16px;font-family:Tajawal,Arial,sans-serif;line-height:1.9;direction:rtl">
  <h1>${escapeHtml(pageTitle.replace(" - طابو أخضر", ""))}</h1>
  <p>${escapeHtml(description)}</p>
  ${listingLinks ? `<h2>أحدث الإعلانات في ${escapeHtml(areaName)}</h2><ul>${listingLinks}</ul>` : ""}
</section>`;

  const seo = `
<title>${escapeHtml(pageTitle)}</title>
<meta name="description" content="${escapeHtml(description)}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${escapeHtml(url)}">

<meta property="og:title" content="${escapeHtml(pageTitle)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${escapeHtml(url)}">

<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${escapeHtml(pageTitle)}">
<meta name="twitter:description" content="${escapeHtml(description)}">

<script type="application/ld+json">${safeJsonLd(jsonLd)}</script>
`;

  return { seo, fallbackContent, count };
}

function buildNoIndexSeo(city, district) {
  const url = city ? areaUrl(city, district) : `${SITE_URL}/real-estate`;
  return `
<title>المنطقة غير متاحة - طابو أخضر</title>
<meta name="robots" content="noindex, follow">
<link rel="canonical" href="${escapeHtml(url)}">
`;
}

export default async function handler(req, res) {
  const { city, district } = getAreaFromRequest(req);

  if (!city) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.end("Invalid area");
    return;
  }

  try {
    const htmlTemplate = await loadIndexHtml();
    const cleanedHtml = removeOldSeo(htmlTemplate);
    const listings = await fetchAreaListings(city, district);

    // إذا كان الرابط لمنطقة لا يوجد فيها إعلانات فعالة، لا نطلب من Google فهرسته.
    if (listings.length < MIN_AREA_LISTINGS) {
      const noIndexSeo = buildNoIndexSeo(city, district);
      const html = cleanedHtml.replace("</head>", `${noIndexSeo}\n</head>`);

      res.statusCode = 404;
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=600");
      res.end(html);
      return;
    }

    const { seo, fallbackContent } = buildAreaSeo({ city, district, listings });
    let html = cleanedHtml.replace("</head>", `${seo}\n</head>`);
    html = html.replace("</body>", `${fallbackContent}\n</body>`);

    res.statusCode = 200;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=60, s-maxage=900, stale-while-revalidate=3600");
    res.end(html);
  } catch (error) {
    console.error("area-page SEO error:", error);

    const htmlTemplate = await loadIndexHtml().catch(() => "");
    const noIndexSeo = buildNoIndexSeo(city, district);
    const html = removeOldSeo(htmlTemplate || "").replace("</head>", `${noIndexSeo}\n</head>`);

    res.statusCode = 503;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.end(html || "Service unavailable");
  }
}

export { nameToSlug, normalizeArabic };
