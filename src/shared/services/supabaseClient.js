import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../utils/env.js";

/**
 * عميل Supabase مشترك بين طبقات التطبيق.
 * وجوده في shared يمنع اعتماد خدمات shared أو admin على services/ الخاصة بالتطبيق العام.
 */
function createAuthMutex() {
  let tail = Promise.resolve();
  return (_name, _acquireTimeout, fn) => {
    const next = tail.then(() => fn()).catch((err) => {
      if (err?.name === "AbortError") return;
      throw err;
    });
    tail = next.catch(() => {});
    return next;
  };
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    lock: createAuthMutex(),
  },
});

export function getSupabase() {
  return supabase;
}
