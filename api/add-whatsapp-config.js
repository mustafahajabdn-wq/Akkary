const FALLBACK_WA = "963000000000";
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;

function cleanPhone(value = "") {
  return String(value || "").replace(/[^0-9]/g, "");
}

async function fetchWhatsappOffer() {
  if (!SUPABASE_URL || !SUPABASE_KEY) return "";

  try {
    const endpoint = `${SUPABASE_URL}/rest/v1/app_settings?select=value&key=eq.whatsapp_offer&limit=1`;
    const response = await fetch(endpoint, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) return "";

    const rows = await response.json();
    const value = rows?.[0]?.value;
    const clean = cleanPhone(
      typeof value === "string" || typeof value === "number"
        ? value
        : JSON.stringify(value || "")
    );

    return clean;
  } catch (error) {
    console.warn("[add-whatsapp-config] failed:", error);
    return "";
  }
}

export default async function handler(req, res) {
  const whatsapp_offer = await fetchWhatsappOffer();

  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.end(JSON.stringify({ whatsapp_offer: whatsapp_offer || FALLBACK_WA }));
}
