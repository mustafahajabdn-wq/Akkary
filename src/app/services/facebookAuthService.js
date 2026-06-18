import { getSupabase } from "../../shared/services/supabaseClient.js";

export async function signInWithFacebookOAuth(redirectTo) {
  const sb = getSupabase();

  if (!sb) {
    throw new Error("تسجيل الدخول غير متاح حالياً");
  }

  const { error } = await sb.auth.signInWithOAuth({
    provider: "facebook",
    options: {
      redirectTo,
      scopes: "email,public_profile",
    },
  });

  if (error) throw error;
}
