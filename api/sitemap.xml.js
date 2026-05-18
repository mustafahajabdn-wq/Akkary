const SITE_URL = "https://www.blabladar.com";
const MIN_AREA_LISTINGS = 3;

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL;

const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;

function escapeXml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function sitemapUrl(loc, lastmod = null, priority = "0.8") {
  return `
  <url>
    <loc>${escapeXml(loc)}</loc>
    ${lastmod ? `<lastmod>${escapeXml(lastmod)}</lastmod>` : ""}
    <priority>${priority}</priority>
  </url>`;
}

function cleanText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function nameToSlug(value = "") {
  return encodeURIComponent(cleanText(value).replace(/\s+/g, "-"));
}

function areaUrl(city, district = "") {
  const citySlug = nameToSlug(city);
  const districtSlug = nameToSlug(district);
  return districtSlug
    ? `${SITE_URL}/real-estate/${citySlug}/${districtSlug}`
    : `${SITE_URL}/real-estate/${citySlug}`;
}

function maxIso(a, b) {
  const av = a ? Date.parse(a) : 0;
  const bv = b ? Date.parse(b) : 0;
  if (!av && !bv) return null;
  return av >= bv ? a : b;
}

async function fetchActiveListings() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn("Missing Supabase env vars for sitemap");
    return [];
  }

  const today = new Date().toISOString().slice(0, 10);

  const params = new URLSearchParams();
  params.set("select", "id,city,district,created_at,updated_at");
  params.set("status", "eq.active");
  params.set("admin_status", "eq.approved");
  params.set("or", `(expires_at.is.null,expires_at.gte.${today})`);
  params.set("order", "created_at.desc");
  params.set("limit", "5000");

  const url = `${SUPABASE_URL}/rest/v1/listings?${params.toString()}`;

  const response = await fetch(url, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    console.error("Sitemap listings fetch failed:", response.status, text);
    return [];
  }

  return await response.json();
}

function buildAreaUrls(listings = []) {
  const cityGroups = new Map();
  const districtGroups = new Map();

  for (const item of listings) {
    const city = cleanText(item?.city);
    const district = cleanText(item?.district);
    const lastmod = item?.updated_at || item?.created_at || null;

    if (!city) continue;

    const cityKey = city;
    const cityRecord = cityGroups.get(cityKey) || { city, count: 0, lastmod: null };
    cityRecord.count += 1;
    cityRecord.lastmod = maxIso(cityRecord.lastmod, lastmod);
    cityGroups.set(cityKey, cityRecord);

    if (district) {
      const districtKey = `${city}|||${district}`;
      const districtRecord = districtGroups.get(districtKey) || { city, district, count: 0, lastmod: null };
      districtRecord.count += 1;
      districtRecord.lastmod = maxIso(districtRecord.lastmod, lastmod);
      districtGroups.set(districtKey, districtRecord);
    }
  }

  const cityUrls = [...cityGroups.values()]
    .filter((item) => item.count >= MIN_AREA_LISTINGS)
    .map((item) => sitemapUrl(areaUrl(item.city), item.lastmod, "0.85"));

  const districtUrls = [...districtGroups.values()]
    .filter((item) => item.count >= MIN_AREA_LISTINGS)
    .map((item) => sitemapUrl(areaUrl(item.city, item.district), item.lastmod, "0.85"));

  return [...cityUrls, ...districtUrls];
}

export default async function handler(req, res) {
  try {
    const listings = await fetchActiveListings();

    const staticUrls = [
      sitemapUrl(`${SITE_URL}/`, null, "1.0"),
      sitemapUrl(`${SITE_URL}/search`, null, "0.9"),
      sitemapUrl(`${SITE_URL}/about`, null, "0.8"),
    ];

    const listingUrls = listings
      .filter((item) => item?.id)
      .map((item) => {
        return sitemapUrl(
          `${SITE_URL}/listing/${item.id}`,
          item.updated_at || item.created_at || null,
          "0.8"
        );
      });

    const areaUrls = buildAreaUrls(listings);

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls.join("\n")}
${areaUrls.join("\n")}
${listingUrls.join("\n")}
</urlset>`;

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader(
      "Cache-Control",
      "public, max-age=300, s-maxage=1800, stale-while-revalidate=3600"
    );
    res.status(200).send(xml);
  } catch (error) {
    console.error("sitemap error:", error);

    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrl(`${SITE_URL}/`, null, "1.0")}
${sitemapUrl(`${SITE_URL}/search`, null, "0.9")}
${sitemapUrl(`${SITE_URL}/about`, null, "0.8")}
</urlset>`;

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.status(200).send(fallbackXml);
  }
}
