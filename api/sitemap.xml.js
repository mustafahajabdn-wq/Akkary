import { createClient } from "@supabase/supabase-js";

const SITE_URL = "https://www.blabladar.com";
const PAGE_SIZE = 1000;
const MAX_SITEMAP_URLS = 50000;

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL;

const SUPABASE_KEY =
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

function normalizeLastmod(value) {
  if (!value) return null;

  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;

  return date.toISOString();
}

function sitemapUrl(loc, lastmod = null, priority = "0.8") {
  const normalizedLastmod = normalizeLastmod(lastmod);

  return `
  <url>
    <loc>${escapeXml(encodeLoc(loc))}</loc>
    ${normalizedLastmod ? `<lastmod>${escapeXml(normalizedLastmod)}</lastmod>` : ""}
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

function getSupabase() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("Missing Supabase env vars for sitemap");
  }

  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

async function fetchActiveListings() {
  const supabase = getSupabase();
  const today = new Date().toISOString().slice(0, 10);
  const listings = [];
  let from = 0;

  while (listings.length < MAX_SITEMAP_URLS) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from("listings")
      .select("id,created_at,updated_at,city,district")
      .eq("status", "active")
      .eq("admin_status", "approved")
      .or(`expires_at.is.null,expires_at.gte.${today}`)
      .order("id", { ascending: true })
      .range(from, to);

    if (error) {
      throw new Error(`Sitemap listings fetch failed: ${error.message}`);
    }

    const page = Array.isArray(data) ? data : [];
    if (page.length === 0) break;

    listings.push(...page);
    if (page.length < PAGE_SIZE) break;

    from += PAGE_SIZE;
  }

  return listings.slice(0, MAX_SITEMAP_URLS);
}

function getItemLastmod(item) {
  return item?.updated_at || item?.created_at || null;
}

function buildAreaUrls(listings) {
  const areas = new Map();

  for (const item of listings) {
    const city = String(item?.city || "").trim();
    const district = String(item?.district || "").trim();

    if (!city || !district) continue;

    const key = `${city}||${district}`;
    const itemLastmod = getItemLastmod(item);
    const current = areas.get(key) || {
      city,
      district,
      count: 0,
      lastmod: itemLastmod,
    };

    current.count += 1;

    if (itemLastmod && (!current.lastmod || itemLastmod > current.lastmod)) {
      current.lastmod = itemLastmod;
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
        area.lastmod,
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
      .map((item) =>
        sitemapUrl(
          `${SITE_URL}/listing/${item.id}`,
          getItemLastmod(item),
          "0.8"
        )
      );

    const areaUrls = buildAreaUrls(listings);
    const allUrls = [...staticUrls, ...areaUrls, ...listingUrls].slice(
      0,
      MAX_SITEMAP_URLS
    );

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.join("\n")}
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
