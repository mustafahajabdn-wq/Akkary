import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { C } from "../../shared/constants/colors.js";
import { IslamicPattern, SyriaFlag } from "../../shared/components/icons.jsx";
import { supabase } from "../../shared/services/supabaseClient.js";
import {
  buildTrustedUser,
  signInWithEmailPassword,
  signUpWithEmail,
  signInWithGoogleOAuth,
  sendPhoneOtp as sendOtpViaService,
  verifyPhoneOtp as verifyOtpViaService,
  isAuthAvailable,
  startGoogleAuthMeasurement,
} from "../services/authService.js";
import { fetchAppSetting } from "../services/propertyService.js";

export const SSX = {
  page: {
    minHeight: "100dvh",
    background: "linear-gradient(160deg,#1A4A2E 0%,#2D6B45 50%,#1A4A2E 100%)",
    display: "flex",
    flexDirection: "column",
    fontFamily: "Tajawal,sans-serif",
    direction: "rtl",
  },
  hero: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 24px 20px",
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    background: "rgba(255,255,255,0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 40,
    marginBottom: 16,
    boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
  },
  brandRow: { display: "flex", alignItems: "center", gap: 8, justifyContent: "center", marginBottom: 4 },
  flag: { borderRadius: 4, boxShadow: "0 2px 8px rgba(0,0,0,0.3)" },
  brandText: { fontSize: 28, fontWeight: 900 },
  subtitle: { fontSize: 13, color: "rgba(255,255,255,0.65)" },
  s1: { color: "white" },
  s2: { color: "#D4A63A" },
  dividerWrap: { display: "flex", alignItems: "center", gap: 8, marginTop: 14 },
  sectionGap: { marginBottom: 16 },
  toggleRow: { display: "flex", gap: 8, marginBottom: 16 },
  methodTabs: { display: "flex", marginBottom: 20, borderRadius: 12, overflow: "hidden" },
  otpRow: { display: "flex", gap: 8, justifyContent: "center", direction: "ltr", marginBottom: 14 },
  modalBackdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    zIndex: 999,
  },
  modalActions: { display: "flex", gap: 10 },
  termsCheck: { marginTop: 2 },
  phoneRow: { display: "flex", alignItems: "center", gap: 8, marginBottom: 10 },
};

export function getLoginStyles(DC) {
  return {
    sheet: {
      background: DC.white,
      borderRadius: "28px 28px 0 0",
      padding: "24px 24px 40px",
      boxShadow: "0 -8px 40px rgba(0,0,0,0.15)",
    },
    sheetTitle: {
      fontSize: 17,
      fontWeight: 900,
      color: DC.text,
      marginBottom: 14,
      textAlign: "center",
    },
    googleBtn: {
      width: "100%",
      padding: "13px",
      borderRadius: 14,
      border: "1.5px solid " + DC.border,
      background: DC.white,
      color: DC.text,
      fontSize: 14,
      fontWeight: 700,
      cursor: "pointer",
      fontFamily: "inherit",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    },
    dividerLine: { flex: 1, height: 1, background: DC.border },
    dividerText: { fontSize: 11, fontWeight: 600, color: DC.text3 },
    methodTabs: { ...SSX.methodTabs, border: "1.5px solid " + DC.border },
    sectionTitle: { fontSize: 18, fontWeight: 900, color: DC.text, marginBottom: 16 },
    field: {
      width: "100%",
      padding: "12px 14px",
      borderRadius: 12,
      border: "1.5px solid " + DC.border,
      fontSize: 13,
      fontFamily: "inherit",
      background: DC.bg,
      color: DC.text,
      outline: "none",
      marginBottom: 10,
    },
    passwordWrap: {
      position: "relative",
      marginBottom: 10,
    },
    passwordField: {
      width: "100%",
      paddingTop: 12,
      paddingBottom: 12,
      paddingInlineStart: 14,
      paddingInlineEnd: 44,
      borderRadius: 12,
      border: "1.5px solid " + DC.border,
      fontSize: 13,
      fontFamily: "inherit",
      background: DC.bg,
      color: DC.text,
      outline: "none",
    },
    eyeBtn: {
      position: "absolute",
      insetInlineEnd: 8,
      top: "50%",
      transform: "translateY(-50%)",
      width: 32,
      height: 32,
      border: "none",
      background: "transparent",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      color: DC.text3,
      padding: 0,
      fontFamily: "inherit",
    },
    termsRow: {
      display: "flex",
      alignItems: "flex-start",
      gap: 8,
      marginBottom: 12,
      fontSize: 12,
      color: DC.text2,
    },
    termsLink: {
      color: C.primary,
      fontWeight: 800,
      cursor: "pointer",
      textDecoration: "underline",
    },
    error: { color: C.danger, fontSize: 12, marginBottom: 10 },
    errorCentered: { color: C.danger, fontSize: 12, marginBottom: 10, textAlign: "center" },
    primaryBtn: {
      width: "100%",
      padding: "12px",
      borderRadius: 12,
      border: "none",
      background: C.primary,
      color: "white",
      fontSize: 14,
      fontWeight: 800,
      cursor: "pointer",
      fontFamily: "inherit",
    },
    secondaryBtn: {
      width: "100%",
      marginTop: 10,
      padding: "10px",
      borderRadius: 12,
      border: "1px solid " + DC.border,
      background: DC.white,
      color: DC.text2,
      fontSize: 13,
      cursor: "pointer",
      fontFamily: "inherit",
    },
    countryCode: {
      padding: "12px 14px",
      borderRadius: 12,
      border: "1.5px solid " + DC.border,
      background: DC.bg,
      fontSize: 13,
      fontWeight: 700,
      color: DC.text2,
    },
    phoneInput: {
      flex: 1,
      padding: "12px 14px",
      borderRadius: 12,
      border: "1.5px solid " + DC.border,
      fontSize: 13,
      fontFamily: "inherit",
      background: DC.bg,
      color: DC.text,
      outline: "none",
    },
    otpHint: { fontSize: 12, color: DC.text3, marginBottom: 16 },
    otpInput: {
      width: 46,
      height: 52,
      textAlign: "center",
      fontSize: 22,
      fontWeight: 800,
      borderRadius: 12,
      border: "1.5px solid " + DC.border,
      background: DC.white,
      outline: "none",
    },
    modalSheet: {
      width: "100%",
      maxWidth: 520,
      background: DC.white,
      borderRadius: "22px 22px 0 0",
      padding: "20px",
    },
    modalScrollableSheet: {
      width: "100%",
      maxWidth: 520,
      background: DC.white,
      borderRadius: "22px 22px 0 0",
      padding: "20px",
      maxHeight: "72vh",
      overflow: "auto",
    },
    modalTitle: { fontSize: 17, fontWeight: 900, color: DC.text, marginBottom: 12 },
    modalText: { fontSize: 13, color: DC.text2, lineHeight: 1.9 },
    modalTextCompact: { fontSize: 13, color: DC.text2, lineHeight: 1.8, marginBottom: 14 },
    modalCancel: {
      flex: 1,
      padding: "12px",
      borderRadius: 12,
      border: "1px solid " + DC.border,
      background: DC.white,
      color: DC.text2,
      fontSize: 13,
      cursor: "pointer",
      fontFamily: "inherit",
    },
    modalConfirm: {
      flex: 1,
      padding: "12px",
      borderRadius: 12,
      border: "none",
      background: C.primary,
      color: "white",
      fontSize: 14,
      fontWeight: 800,
      cursor: "pointer",
      fontFamily: "inherit",
    },
    s3: { fontSize: 18, fontWeight: 900, color: DC.text, marginBottom: 10 },
    s4: {
      width: "100%",
      padding: "12px",
      borderRadius: 12,
      border: "none",
      background: C.primary,
      color: "white",
      fontSize: 14,
      fontWeight: 800,
      cursor: "pointer",
      fontFamily: "inherit",
      marginTop: 16,
    },
    s5: { fontSize: 17, fontWeight: 900, color: DC.text, marginBottom: 10 },
  };
}

export function getMethodButtonStyle(value, method, DC) {
  return {
    flex: 1,
    padding: "10px",
    border: "none",
    background: method === value ? C.primary : DC.bg,
    color: method === value ? "white" : DC.text2,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
  };
}

const GoogleIcon = (
  <svg width="20" height="20" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.6 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.5 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16.1 19 13 24 13c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.5 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.3 26.7 36 24 36c-5.2 0-9.5-3.3-11.1-7.9l-6.5 5C9.6 39.5 16.3 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.3 5.6l6.2 5.2C36.9 36.2 44 31 44 24c0-1.3-.1-2.6-.4-3.9z" />
  </svg>
);

const EyeIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <line x1="2" y1="2" x2="22" y2="22" />
  </svg>
);


function parseAuthMethodsSetting(value) {
  const fallback = { email: true, phone: false, google: true };

  try {
    if (value === null || value === undefined || value === "") return fallback;

    const parsed = typeof value === "string" ? JSON.parse(value) : value;

    return {
      email: parsed?.email !== false,
      phone: parsed?.phone === true,
      google: parsed?.google !== false,
    };
  } catch {
    return fallback;
  }
}

function LoginPage({ setPage, setUser, DC = C }) {
  const navigate = useNavigate();
  const [method, setMethod] = useState("email");
  const [authMethods, setAuthMethods] = useState({ email: true, phone: false, google: true });
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", ""]);
  const [name, setName] = useState("");
  const accountType = "individual";
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(() => localStorage.getItem("terms_accepted") === "1");
  const [showGoogleTerms, setShowGoogleTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const r0 = useRef(null);
  const r1 = useRef(null);
  const r2 = useRef(null);
  const r3 = useRef(null);
  const r4 = useRef(null);
  const otpRefs = useMemo(() => [r0, r1, r2, r3, r4], []);

  const googleAuthInProgressRef = useRef(false);

  useEffect(() => {
    const resetGoogleLoading = () => {
      if (googleAuthInProgressRef.current) {
        googleAuthInProgressRef.current = false;
        setLoading(false);
      }
    };

    window.addEventListener("pageshow", resetGoogleLoading);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        resetGoogleLoading();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("pageshow", resetGoogleLoading);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  const sx = useMemo(() => getLoginStyles(DC), [DC]);

  const methodButtonStyle = useCallback((value) => getMethodButtonStyle(value, method, DC), [DC, method]);


  useEffect(() => {
    let alive = true;

    fetchAppSetting("auth_methods")
      .then(value => {
        if (!alive) return;
        setAuthMethods(parseAuthMethodsSetting(value));
      })
      .catch(() => {
        if (!alive) return;
        setAuthMethods({ email: true, phone: false, google: true });
      });

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (method === "phone" && !authMethods.phone) {
      setMethod(authMethods.email ? "email" : "phone");
    }

    if (method === "email" && !authMethods.email && authMethods.phone) {
      setMethod("phone");
    }
  }, [authMethods.email, authMethods.phone, method]);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!authMethods.google) return;
    if (!clientId || !isAuthAvailable()) return;

    // Don't show Google One Tap until the user has explicitly accepted terms.
    // For new users, the explicit "المتابعة بحساب Google" button enforces the
    // terms modal flow before any auth call is made.
    if (!termsAccepted) return;

    const handleCredential = async (response) => {
      // Safety check: terms must already be accepted before reaching this point.
      // If not, refuse to proceed instead of silently consenting on the user's behalf.
      if (localStorage.getItem("terms_accepted") !== "1") {
        setError("يجب الموافقة على الشروط والأحكام أولاً");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const { data, error: sbErr } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token: response.credential,
        });

        if (sbErr) throw sbErr;
        if (!data?.user) throw new Error("تعذر جلب المستخدم");

        const trustedUser = await buildTrustedUser(data.user, {
          email: data.user.email,
          name: data.user.user_metadata?.full_name || data.user.user_metadata?.name,
          accountType,
        });

        setUser(trustedUser);
        setPage("home");
      } catch (err) {
        setError(err.message || "فشل تسجيل الدخول بـ Google");
        setLoading(false);
      }
    };

    const init = () => {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredential,
        auto_select: false,
        cancel_on_tap_outside: false,
        ux_mode: "popup",
      });

      window.google.accounts.id.prompt();
    };

    if (window.google?.accounts?.id) {
      init();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = init;
    document.head.appendChild(script);

    return () => window.google?.accounts?.id?.cancel?.();
  }, [termsAccepted, authMethods.google]); // eslint-disable-line react-hooks/exhaustive-deps

  const acceptTerms = useCallback(() => {
    localStorage.setItem("terms_accepted", "1");
    setTermsAccepted(true);
  }, []);

  const openTermsPage = useCallback((event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();

    setShowGoogleTerms(false);
    navigate("/terms");
  }, [navigate]);

  const syncAfterAuth = useCallback(async (authUser, fallback = {}) => {
    const trustedUser = await buildTrustedUser(authUser, fallback);
    setUser(trustedUser);
    setPage("home");
  }, [setUser, setPage]);

  const loginWithEmail = useCallback(async () => {
    if (!authMethods.email) {
      setError("تسجيل الدخول بالإيميل غير متاح حالياً");
      return;
    }

    if (!email || !password) {
      setError("أدخل الإيميل وكلمة المرور");
      return;
    }

    if (isSignup && !name.trim()) {
      setError("أدخل الاسم الكامل");
      return;
    }

    if (isSignup && !termsAccepted) {
      setError("يجب الموافقة على الشروط والأحكام للتسجيل");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (!isAuthAvailable()) {
        setUser({
          email,
          name: name.trim() || email.split("@")[0],
          accountType,
        });

        setPage("home");
        return;
      }

      const data = isSignup
        ? await signUpWithEmail({
            email,
            password,
            name: name.trim(),
            accountType,
            termsAcceptedAt: new Date().toISOString(),
          })
        : await signInWithEmailPassword({
            email,
            password,
          });

      if (!data?.user) throw new Error("تعذر جلب المستخدم بعد تسجيل الدخول");

      await syncAfterAuth(data.user, {
        email,
        name: name.trim() || email.split("@")[0],
        accountType,
      });
    } catch (err) {
      setError(err?.message || "حدث خطأ أثناء تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  }, [authMethods.email, email, password, name, accountType, isSignup, termsAccepted, syncAfterAuth, setUser, setPage]);

  const loginWithGoogle = useCallback(async ({ skipTermsCheck = false } = {}) => {
    if (!authMethods.google) {
      setError("تسجيل الدخول بحساب Google غير متاح حالياً");
      return;
    }

    setLoading(true);
    setError("");

    if (!isAuthAvailable()) {
      setError("غير متاح حالياً");
      setLoading(false);
      return;
    }

    if (!skipTermsCheck && !termsAccepted) {
      setShowGoogleTerms(true);
      setLoading(false);
      return;
    }

    try {
      googleAuthInProgressRef.current = true;
      startGoogleAuthMeasurement();

      await signInWithGoogleOAuth(window.location.origin + "/auth/callback");

      window.setTimeout(() => {
        if (document.visibilityState === "visible" && googleAuthInProgressRef.current) {
          googleAuthInProgressRef.current = false;
          setLoading(false);
        }
      }, 2500);
    } catch (err) {
      googleAuthInProgressRef.current = false;
      setError(err.message);
      setLoading(false);
    }
  }, [authMethods.google, termsAccepted]);

  const sendPhoneOtp = useCallback(async () => {
    if (!authMethods.phone) {
      setError("تسجيل الدخول بالهاتف غير متاح حالياً");
      return;
    }

    if (phone.replace(/\D/g, "").length < 9) {
      setError("أدخل رقم هاتف صحيح");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await sendOtpViaService("+963" + phone.replace(/\D/g, ""));
      setStep(2);
    } catch (err) {
      setError(err?.message || "تعذر إرسال رمز التحقق، حاول مجدداً");
    } finally {
      setLoading(false);
    }
  }, [authMethods.phone, phone]);

  const verifyPhoneOtp = useCallback(async () => {
    const entered = otp.join("");

    if (entered.length < 5) {
      setError("أدخل الرمز كاملاً");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const normalizedPhone = "+963" + phone.replace(/\D/g, "");
      const data = await verifyOtpViaService(normalizedPhone, entered);

      if (!data?.user) throw new Error("تعذر التحقق من المستخدم");

      await syncAfterAuth(data.user, {
        phone: normalizedPhone,
        name: data.user.user_metadata?.name || data.user.user_metadata?.full_name || "مستخدم",
        accountType,
      });
    } catch (err) {
      setError(err?.message || "رمز خاطئ أو منتهي الصلاحية");
    } finally {
      setLoading(false);
    }
  }, [otp, phone, accountType, syncAfterAuth]);

  const handleOtpInput = useCallback((i, val) => {
    if (!/^\d*$/.test(val)) return;

    setOtp(prev => {
      const n = [...prev];
      n[i] = val.slice(-1);
      return n;
    });

    if (val && i < 4) otpRefs[i + 1].current?.focus();
  }, [otpRefs]);

  const handleOtpKey = useCallback((i, e) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      otpRefs[i - 1].current?.focus();
    }
  }, [otp, otpRefs]);


  const availableMethods = [
    authMethods.email ? ["email", "📧 إيميل"] : null,
    authMethods.phone ? ["phone", "📱 هاتف"] : null,
  ].filter(Boolean);

  const dividerText = authMethods.email && authMethods.phone
    ? "أو بالإيميل والهاتف"
    : authMethods.email
      ? "أو بالإيميل"
      : authMethods.phone
        ? "أو بالهاتف"
        : "لا توجد طريقة دخول متاحة حالياً";

  const isFBBrowser = /FBAN|FBAV|FB_IAB/i.test(navigator.userAgent);

  return (
    <div style={SSX.page}>
      {/* بانر متصفح فيسبوك */}
      {isFBBrowser && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 99999,
          background: "#1877F2", color: "#fff",
          padding: "10px 14px", display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: 10, direction: "rtl",
          boxShadow: "0 2px 10px rgba(0,0,0,0.2)", fontSize: 13,
        }}>
          <span style={{ flex: 1, lineHeight: 1.5 }}>
            🌐 لتسجيل الدخول افتح الموقع في متصفح Chrome أو Safari
          </span>
          <button
            onClick={() => {
              const url = "https://www.blabladar.com" + window.location.pathname;
              const isAndroid = /android/i.test(navigator.userAgent);
              if (isAndroid) {
                window.location.href = `intent://${url.replace("https://", "")}#Intent;scheme=https;package=com.android.chrome;end`;
              } else {
                window.open(url, "_blank");
              }
            }}
            style={{
              background: "#fff", color: "#1877F2", border: "none",
              borderRadius: 20, padding: "5px 12px", fontWeight: 800,
              fontSize: 12, cursor: "pointer", whiteSpace: "nowrap",
              fontFamily: "inherit",
            }}
          >
            افتح ↗
          </button>
        </div>
      )}
      <IslamicPattern opacity={0.06} color="#FFFFFF" />

      <div style={SSX.hero}>
        <div style={SSX.heroIcon}>🏠</div>

        <div style={SSX.brandRow}>
          <SyriaFlag width={36} height={24} style={SSX.flag} />

          <span style={SSX.brandText}>
            <span style={SSX.s1}>طابو</span>
            <span style={SSX.s2}> أخضر</span>
          </span>

          <SyriaFlag width={36} height={24} style={SSX.flag} />
        </div>

        <div style={SSX.subtitle}>المنصة العقارية الأولى في سوريا</div>
      </div>

      <div style={sx.sheet}>
        <div style={sx.sheetTitle}>تسجيل الدخول أو إنشاء حساب</div>

        {step === 1 && authMethods.google && (
          <div style={SSX.sectionGap}>
            <button onClick={loginWithGoogle} disabled={loading} style={sx.googleBtn}>
              {GoogleIcon}
              المتابعة بحساب Google
            </button>

            <div style={SSX.dividerWrap}>
              <div style={sx.dividerLine} />
              <span style={sx.dividerText}>{dividerText}</span>
              <div style={sx.dividerLine} />
            </div>
          </div>
        )}

        {step === 1 && availableMethods.length > 1 && (
          <div style={sx.methodTabs}>
            {availableMethods.map(([v, l]) => (
              <button
                key={v}
                onClick={() => {
                  setMethod(v);
                  setError("");
                }}
                style={methodButtonStyle(v)}
              >
                {l}
              </button>
            ))}
          </div>
        )}

        {step === 1 && availableMethods.length === 0 && !authMethods.google && (
          <div style={sx.errorCentered}>لا توجد طريقة دخول متاحة حالياً</div>
        )}

        {step === 1 && method === "email" && authMethods.email && (
          <div>
            <div style={sx.sectionTitle}>
              {isSignup ? "إنشاء حساب جديد 🎉" : "أهلاً وسهلاً 👋"}
            </div>

            {isSignup && (
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="الاسم الكامل"
                style={sx.field}
              />
            )}

            <input
              value={email}
              onChange={e => {
                setEmail(e.target.value);
                setError("");
              }}
              placeholder="البريد الإلكتروني"
              type="email"
              style={sx.field}
            />

            <div style={sx.passwordWrap}>
              <input
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  setError("");
                }}
                placeholder="كلمة المرور"
                type={showPassword ? "text" : "password"}
                style={sx.passwordField}
              />

              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={sx.eyeBtn}
                aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
              >
                {showPassword ? EyeOffIcon : EyeIcon}
              </button>
            </div>

            {isSignup && (
              <div style={sx.termsRow}>
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={() => {
                    if (!termsAccepted) {
                      acceptTerms();
                    } else {
                      localStorage.removeItem("terms_accepted");
                      setTermsAccepted(false);
                    }
                  }}
                  style={SSX.termsCheck}
                />

                <div>
                  أوافق على{" "}
                  <button
                    type="button"
                    onClick={openTermsPage}
                    style={{ ...sx.termsLink, border: "none", background: "transparent", padding: 0, fontFamily: "inherit", fontSize: "inherit" }}
                  >
                    الشروط والأحكام
                  </button>
                </div>
              </div>
            )}

            {error && <div style={sx.error}>{error}</div>}

            <button onClick={loginWithEmail} disabled={loading} style={sx.primaryBtn}>
              {loading ? "جاري المعالجة..." : isSignup ? "إنشاء الحساب" : "تسجيل الدخول"}
            </button>

            <button
              onClick={() => {
                setIsSignup(v => !v);
                setError("");
              }}
              style={sx.secondaryBtn}
            >
              {isSignup ? "لديك حساب بالفعل؟ تسجيل الدخول" : "ليس لديك حساب؟ إنشاء حساب"}
            </button>
          </div>
        )}

        {step === 1 && method === "phone" && authMethods.phone && (
          <div>
            <div style={sx.sectionTitle}>تسجيل الدخول بالهاتف 📱</div>

            <div style={SSX.phoneRow}>
              <div style={sx.countryCode}>+963</div>

              <input
                value={phone}
                onChange={e => {
                  setPhone(e.target.value);
                  setError("");
                }}
                placeholder="9xxxxxxxx"
                inputMode="numeric"
                style={sx.phoneInput}
              />
            </div>

            {error && <div style={sx.error}>{error}</div>}

            <button onClick={sendPhoneOtp} disabled={loading} style={sx.primaryBtn}>
              {loading ? "جاري الإرسال..." : "إرسال الرمز"}
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <div style={sx.s3}>أدخل رمز التحقق</div>

            <div style={sx.otpHint}>
              أرسلنا رمزًا إلى الرقم +963{phone.replace(/\D/g, "")}
            </div>

            <div style={SSX.otpRow}>
              {otp.map((d, i) => (
                <input
                  key={i}
                  ref={otpRefs[i]}
                  value={d}
                  onChange={e => handleOtpInput(i, e.target.value)}
                  onKeyDown={e => handleOtpKey(i, e)}
                  maxLength={1}
                  inputMode="numeric"
                  style={sx.otpInput}
                />
              ))}
            </div>

            {error && <div style={sx.errorCentered}>{error}</div>}

            <button onClick={verifyPhoneOtp} disabled={loading} style={sx.primaryBtn}>
              {loading ? "جاري التحقق..." : "تأكيد"}
            </button>

            <button
              onClick={() => {
                setStep(1);
                setOtp(["", "", "", "", ""]);
                setError("");
              }}
              style={sx.secondaryBtn}
            >
              رجوع
            </button>
          </div>
        )}
      </div>

            {showGoogleTerms && (
        <div style={SSX.modalBackdrop} onClick={() => setShowGoogleTerms(false)}>
          <div onClick={e => e.stopPropagation()} style={sx.modalSheet}>
            <div style={sx.s5}>متابعة Google</div>

            <div style={sx.modalTextCompact}>
              يلزم قبول الشروط أولًا قبل المتابعة بحساب Google.{" "}
              <button
                type="button"
                onClick={openTermsPage}
                style={{ ...sx.termsLink, border: "none", background: "transparent", padding: 0, fontFamily: "inherit", fontSize: "inherit", display: "inline", cursor: "pointer" }}
              >
                قراءة الشروط
              </button>
            </div>

            <div style={SSX.modalActions}>
              <button onClick={() => setShowGoogleTerms(false)} style={sx.modalCancel}>
                إلغاء
              </button>

              <button
                onClick={() => {
                  acceptTerms();
                  setShowGoogleTerms(false);
                  loginWithGoogle({ skipTermsCheck: true });
                }}
                style={sx.modalConfirm}
              >
                أوافق وأتابع
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LoginPage;
