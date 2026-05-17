import fs from "node:fs";
import path from "node:path";

const SITE_URL = "https://www.blabladar.com";

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
  return JSON.stringify(value).replace(/</g, "\\u003c");
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
  // لا نحدد أعمدة كثيرة هنا؛ لأن أي عمود غير موجود في قاعدة البيانات
  // يجعل PostgREST يرجع خطأ 400، فتتحول كل صفحات الإعلانات إلى 404/noindex.
  params.set("select", "*");
  params.set("id", `eq.${id}`);
  params.set("status", "eq.active");
  params.set("admin_status", "eq.approved");
  params.set("or", `(expires_at.is.null,expires_at.gte.${today})`);
  params.set("limit", "1");

  const rows = await fetchJson(`${SUPABASE_URL}/rest/v1/listings?${params.toString()}`);
  return Array.isArray(rows) ? rows[0] || null : null;
}

async function fetchListingImage(id) {
  try {
    const params = new URLSearchParams();
    // نستخدم * لدعم المشاريع التي تسمي عمود الصورة url أو image_url.
    params.set("select", "*");
    params.set("listing_id", `eq.${id}`);
    params.set("order", "is_main.desc");
    params.set("limit", "1");

    const rows = await fetchJson(`${SUPABASE_URL}/rest/v1/listing_images?${params.toString()}`);
    const row = Array.isArray(rows) ? rows[0] : null;
    return toAbsoluteUrl(row?.url || row?.image_url || row?.path || "");
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

function buildProductAdditionalProperties(listing) {
  const props = [];

  const area = getListingArea(listing);

  if (area) {
    props.push({
      "@type": "PropertyValue",
      name: "المساحة",
      value: `${area} م²`,
    });
  }

  if (listing?.rooms) {
    props.push({
      "@type": "PropertyValue",
      name: "عدد الغرف",
      value: String(listing.rooms),
    });
  }

  if (listing?.floor !== null && listing?.floor !== undefined && String(listing.floor).trim() !== "") {
    props.push({
      "@type": "PropertyValue",
      name: "الطابق",
      value: String(listing.floor),
    });
  }

  if (listing?.city || listing?.district) {
    props.push({
      "@type": "PropertyValue",
      name: "الموقع",
      value: [listing.city, listing.district, listing.village].filter(Boolean).join(" - "),
    });
  }

  return props;
}

function buildListingSeo(listing, imageUrl = "") {
  const title = cleanText(listing.title || "إعلان عقاري", 80);
  const city = cleanText(listing.city || "", 35);
  const district = cleanText(listing.district || "", 35);
  const category = cleanText(listing.category || "", 35);
  const price = formatPrice(listing);
  const pageTitle = `${title} - طابو أخضر`;

  const fallbackDescription = [
    title,
    category ? `نوع العقار: ${category}` : "",
    district || city ? `الموقع: ${[city, district].filter(Boolean).join(" - ")}` : "",
    getListingArea(listing) ? `المساحة: ${getListingArea(listing)} م²` : "",
    price ? `السعر: ${price}` : "",
  ]
    .filter(Boolean)
    .join("، ");

  const description =
    cleanText(listing.description, 160) ||
    cleanText(fallbackDescription, 160) ||
    "إعلان عقاري على منصة طابو أخضر للعقارات في سوريا.";

  const url = `${SITE_URL}/listing/${listing.id}`;

  // لا نستخدم Product schema للإعلانات العقارية؛ لأنه يجعل Google يعامل الصفحة كـ Merchant listing،
  // وعند غياب صورة منتج/شحن/سياسة إرجاع تظهر أخطاء Rich Results غير مناسبة للعقارات.
  // نُبقي البيانات المنظمة كـ WebPage فقط لتظل الصفحة قابلة للفهرسة بلا عنصر Merchant غير صالح.
  const productJsonLd = {
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
        primaryImageOfPage: imageUrl
          ? {
              "@type": "ImageObject",
              url: imageUrl,
            }
          : undefined,
      },
    ],
  };

  return `
<title>${escapeHtml(pageTitle)}</title>
<meta name="description" content="${escapeHtml(description)}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${escapeHtml(url)}">

<meta property="og:title" content="${escapeHtml(pageTitle)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:type" content="article">
<meta property="og:url" content="${escapeHtml(url)}">
${imageUrl ? `<meta property="og:image" content="${escapeHtml(imageUrl)}">` : ""}

<meta name="twitter:card" content="${imageUrl ? "summary_large_image" : "summary"}">
<meta name="twitter:title" content="${escapeHtml(pageTitle)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
${imageUrl ? `<meta name="twitter:image" content="${escapeHtml(imageUrl)}">` : ""}

<script type="application/ld+json">${safeJsonLd(productJsonLd)}</script>
`;
}

function buildNoIndexSeo(id) {
  const url = `${SITE_URL}/listing/${id}`;
  return `
<title>الإعلان غير موجود - طابو أخضر</title>
<meta name="robots" content="noindex, follow">
<link rel="canonical" href="${escapeHtml(url)}">
`;
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
      const html = cleanedHtml.replace("</head>", `${noIndexSeo}\n</head>`);

      res.statusCode = 404;
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "no-store");
      res.end(html);
      return;
    }

    const imageUrl =
      (await fetchListingImage(id)) ||
      toAbsoluteUrl(listing.image_url || listing.photo || "");

    const seo = buildListingSeo(listing, imageUrl);
    const html = cleanedHtml.replace("</head>", `${seo}\n</head>`);

    res.statusCode = 200;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader(
      "Cache-Control",
      "public, max-age=60, s-maxage=300, stale-while-revalidate=86400"
    );
    res.end(html);
  } catch (error) {
    console.error("listing-page SEO error:", error);

    const htmlTemplate = await loadIndexHtml().catch(() => "");
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.end(htmlTemplate || "");
  }
}
