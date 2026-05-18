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

function encodeLoc(loc) {
  return encodeURI(loc);
}

function sitemapUrl(loc, lastmod = null, priority = "0.8") {
  return `
  <url>
    <loc>${escapeXml(encodeLoc(loc))}</loc>
    ${lastmod ? `<lastmod>${escapeXml(lastmod)}</lastmod>` : ""}
    <priority>${priority}</priority>
  </url>`;
}

function slugifyArabic(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[\/\\?#&]+/g, "-")
    .replace(/-+/g, "-");
}

async function fetchActiveListings() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("Missing Supabase env vars for sitemap");
  }

  const today = new Date().toISOString().slice(0, 10);

  const params = new URLSearchParams();
  params.set("select", "id,created_at,city,district");
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
    throw new Error(`Sitemap listings fetch failed: ${response.status} ${text}`);
  }

  return await response.json();
}

function buildAreaUrls(listings) {
  const areas = new Map();

  for (const item of listings) {
    const city = String(item?.city || "").trim();
    const district = String(item?.district || "").trim();

    if (!city || !district) continue;

    const key = `${city}||${district}`;
    const current = areas.get(key) || {
      city,
      district,
      count: 0,
      lastmod: item.created_at || null,
    };

    current.count += 1;

    if (item.created_at && (!current.lastmod || item.created_at > current.lastmod)) {
      current.lastmod = item.created_at;
    }

    areas.set(key, current);
  }

  return [...areas.values()]
    .filter((area) => area.count >= 3)
    .map((area) => {
      const citySlug = slugifyArabic(area.city);
      const districtSlug = slugifyArabic(area.district);

      return sitemapUrl(
        `${SITE_URL}/real-estate/${citySlug}/${districtSlug}`,
        area.lastmod || null,
        "0.9"
      );
    });
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

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.status(503).send("Sitemap temporarily unavailable");
  }
}
