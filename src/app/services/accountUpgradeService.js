import { getSupabase } from "../../shared/services/supabaseClient.js";

export async function fetchMyLatestUpgradeRequest(userId) {
  if (!userId) return null;

  const sb = getSupabase();
  if (!sb) return null;

  const { data, error } = await sb
    .from("account_upgrade_requests")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("fetchMyLatestUpgradeRequest error:", error);
    return null;
  }

  return data;
}

export async function createAccountUpgradeRequest(userId, requestedType = "office", note = "") {
  if (!userId) {
    return {
      data: null,
      error: new Error("Missing user id")
    };
  }

  const sb = getSupabase();

  if (!sb) {
    return {
      data: null,
      error: new Error("Supabase is not available")
    };
  }

  const { data: latest, error: latestError } = await sb
    .from("account_upgrade_requests")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestError) {
    console.error("fetch latest upgrade request before create error:", latestError);
  }

  if (latest?.status === "pending") {
    return {
      data: latest,
      error: {
        code: "23505",
        message: "لديك طلب تحويل معلّق مسبقًا"
      }
    };
  }

  if (latest?.id) {
    const { data, error } = await sb
      .from("account_upgrade_requests")
      .update({
        requested_type: "office",
        note: note?.trim() || null,
        admin_note: null,
        status: "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("id", latest.id)
      .eq("user_id", userId)
      .select("*")
      .single();

    if (error) {
      console.error("update old account upgrade request error:", error);
    }

    return { data, error };
  }

  const { data, error } = await sb
    .from("account_upgrade_requests")
    .insert({
      user_id: userId,
      requested_type: "office",
      note: note?.trim() || null,
      status: "pending"
    })
    .select("*")
    .single();

  if (error) {
    console.error("createAccountUpgradeRequest error:", error);
  }

  return { data, error };
}
