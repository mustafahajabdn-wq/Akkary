const SITE_URL = "https://www.blabladar.com";

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

async function fetchActiveListings() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn("Missing Supabase env vars for sitemap");
    return [];
  }

  const today = new Date().toISOString().slice(0, 10);

  const params = new URLSearchParams();
  params.set("select", "id,created_at");
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
          item.created_at || null,
          "0.8"
        );
      });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls.join("\n")}
${listingUrls.join("\n")}
</urlset>`;

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader(
      "Cache-Control",
      "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400"
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
    res.setHeader(
      "Cache-Control",
      "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400"
    );
    res.status(200).send(fallbackXml);
  }
}
