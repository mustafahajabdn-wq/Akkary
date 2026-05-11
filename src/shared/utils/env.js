// متغيرات البيئة العامة — Supabase والإدارة
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const ADMIN_ID = import.meta.env.VITE_ADMIN_ID || "37c6a844-36cd-4d0e-9ad4-1303d6a76508";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
}
