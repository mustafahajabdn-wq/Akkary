import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../shared/services/supabaseClient.js";
import {
  markGoogleAuthReturn,
  markGoogleSessionAvailable,
  markGoogleUiUpdated,
} from "../services/authService.js";

export default function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        markGoogleAuthReturn(window.location.pathname);

        const hash = new URLSearchParams(window.location.hash.slice(1));
        const access_token = hash.get("access_token");
        const refresh_token = hash.get("refresh_token");

        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (error) throw error;
          markGoogleSessionAvailable({
            source: "auth_callback_setSession",
            path: window.location.pathname,
          });
        } else {
          const { data, error } = await supabase.auth.getSession();
          if (error) throw error;
          if (data?.session) {
            markGoogleSessionAvailable({
              source: "auth_callback_getSession",
              path: window.location.pathname,
            });
          }
        }

        if (!alive) return;

        requestAnimationFrame(() => {
          markGoogleUiUpdated({
            source: "auth_callback_navigate_home",
            path: "/home",
          });
        });

        navigate("/home", { replace: true });
      } catch (err) {
        console.error("OAuth callback failed:", err);
        if (alive) navigate("/login", { replace: true });
      }
    })();

    return () => {
      alive = false;
    };
  }, [navigate]);

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f8f8f6",
        color: "#1f2937",
        fontSize: 22,
        fontWeight: 700,
      }}
    >
      جار تسجيل الدخول...
    </div>
  );
}
