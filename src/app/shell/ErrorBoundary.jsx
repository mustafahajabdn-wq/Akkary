import React from "react";
import { logClientError } from "../../shared/services/errorLogger.js";

function safeString(value) {
  try {
    if (typeof value === "string") return value;
    if (value instanceof Error) return `${value.name}: ${value.message}`;
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function getNow() {
  try {
    return new Date().toLocaleString("ar");
  } catch {
    return String(Date.now());
  }
}

// عند نشر إصدار جديد، الـ JS chunks تتغيّر أسماؤها hash.
// المتصفحات أو Service Workers قد تحاول تحميل chunk قديم محذوف.
// نكتشف هذه الحالة ونعيد التحميل تلقائيًا مرة واحدة.
const CHUNK_RELOAD_KEY = "aq_chunk_reload_at";
const CHUNK_RELOAD_COOLDOWN_MS = 30_000;

function isChunkLoadError(err) {
  if (!err) return false;

  const msg = String(err?.message || err || "");
  const name = String(err?.name || "");

  return (
    name === "ChunkLoadError" ||
    /Failed to fetch dynamically imported module/i.test(msg) ||
    /Loading chunk \d+ failed/i.test(msg) ||
    /error loading dynamically imported module/i.test(msg) ||
    /Importing a module script failed/i.test(msg)
  );
}

function tryAutoRecoverFromChunkError() {
  try {
    const last = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) || 0);

    if (Date.now() - last < CHUNK_RELOAD_COOLDOWN_MS) return false;

    sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()));

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .getRegistrations()
        .then(regs => Promise.all(regs.map(r => r.unregister())))
        .catch(() => {})
        .finally(() => window.location.reload());
    } else {
      window.location.reload();
    }

    return true;
  } catch {
    return false;
  }
}

function showMobileError(message) {
  try {
    const text = String(message || "Unknown error").slice(0, 1200);

    alert("❌ خطأ في التطبيق\n\n" + text);

    const old = document.getElementById("__mobile_error_toast__");
    if (old) old.remove();

    const div = document.createElement("div");
    div.id = "__mobile_error_toast__";
    div.innerText = text;
    div.style.position = "fixed";
    div.style.left = "50%";
    div.style.bottom = "20px";
    div.style.transform = "translateX(-50%)";
    div.style.width = "calc(100% - 24px)";
    div.style.maxWidth = "430px";
    div.style.background = "#7f1d1d";
    div.style.color = "white";
    div.style.padding = "12px 14px";
    div.style.borderRadius = "12px";
    div.style.zIndex = "999999";
    div.style.fontSize = "12px";
    div.style.lineHeight = "1.7";
    div.style.whiteSpace = "pre-wrap";
    div.style.wordBreak = "break-word";
    div.style.boxShadow = "0 10px 30px rgba(0,0,0,0.25)";
    div.style.direction = "rtl";
    div.style.fontFamily = "Tajawal, sans-serif";

    document.body.appendChild(div);

    setTimeout(() => {
      try {
        div.remove();
      } catch {}
    }, 10000);

    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("خطأ في التطبيق", {
        body: text.slice(0, 180)
      });
    }
  } catch {}
}

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      error: null,
      info: null,
      timestamp: null,
      route: typeof window !== "undefined" ? window.location.href : "",
      lastWindowError: null,
      lastRejection: null,
      lastClick: null,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : ""
    };

    this.handleWindowError = this.handleWindowError.bind(this);
    this.handleUnhandledRejection = this.handleUnhandledRejection.bind(this);
    this.handleDocumentClick = this.handleDocumentClick.bind(this);
  }

  static getDerivedStateFromError(error) {
    return {
      error,
      timestamp: getNow(),
      route: typeof window !== "undefined" ? window.location.href : ""
    };
  }

  componentDidMount() {
    window.addEventListener("error", this.handleWindowError);
    window.addEventListener("unhandledrejection", this.handleUnhandledRejection);
    document.addEventListener("click", this.handleDocumentClick, true);
  }

  componentWillUnmount() {
    window.removeEventListener("error", this.handleWindowError);
    window.removeEventListener("unhandledrejection", this.handleUnhandledRejection);
    document.removeEventListener("click", this.handleDocumentClick, true);
  }

  componentDidCatch(error, info) {
    // إذا كان الخطأ بسبب chunk قديم بعد deploy، أعد التحميل تلقائيًا.
    if (isChunkLoadError(error) && tryAutoRecoverFromChunkError()) {
      return;
    }

    const payload = {
      name: error?.name || "Error",
      message: error?.message || String(error),
      stack: error?.stack || "",
      componentStack: info?.componentStack || "",
      route: typeof window !== "undefined" ? window.location.href : "",
      timestamp: getNow(),
      lastWindowError: this.state.lastWindowError,
      lastRejection: this.state.lastRejection,
      lastClick: this.state.lastClick,
      userAgent: this.state.userAgent
    };

    void logClientError(error, {
      source: "react.error_boundary",
      stack: payload.stack,
      extra: {
        name: payload.name,
        componentStack: payload.componentStack,
        route: payload.route,
        timestamp: payload.timestamp,
        lastWindowError: payload.lastWindowError,
        lastRejection: payload.lastRejection,
        lastClick: payload.lastClick,
        userAgent: payload.userAgent
      }
    });

    const mobileMessage = [
      `النوع: ${payload.name}`,
      `الرسالة: ${payload.message}`,
      `الوقت: ${payload.timestamp}`,
      `المسار: ${payload.route}`,
      "",
      "Component Stack:",
      payload.componentStack || "لا يوجد",
      "",
      "JS Stack:",
      (payload.stack || "").slice(0, 500)
    ].join("\n");

    showMobileError(mobileMessage);

    console.group("🔥 React ErrorBoundary");
    console.error("Error object:", error);
    console.error("Error name:", payload.name);
    console.error("Error message:", payload.message);
    console.error("JS stack:", payload.stack);
    console.error("Component stack:", payload.componentStack);
    console.error("Route:", payload.route);
    console.error("Timestamp:", payload.timestamp);
    console.error("Last window error:", payload.lastWindowError);
    console.error("Last rejection:", payload.lastRejection);
    console.error("Last click:", payload.lastClick);
    console.error("User agent:", payload.userAgent);
    console.groupEnd();

    this.setState({
      error,
      info,
      timestamp: payload.timestamp,
      route: payload.route
    });
  }

  handleWindowError(event) {
    // إذا كان الخطأ بسبب chunk قديم بعد deploy، أعد التحميل تلقائيًا.
    if (isChunkLoadError(event?.error || event) && tryAutoRecoverFromChunkError()) {
      return;
    }

    const details = {
      message: event?.message || "",
      filename: event?.filename || "",
      lineno: event?.lineno || null,
      colno: event?.colno || null,
      errorName: event?.error?.name || "",
      errorMessage: event?.error?.message || "",
      stack: event?.error?.stack || "",
      time: getNow()
    };

    void logClientError(event?.error || new Error(details.message || "window.error"), {
      source: "window.error_boundary_listener",
      stack: details.stack,
      extra: details
    });

    console.group("🧨 window.error");
    console.error(details);
    console.groupEnd();

    this.setState({
      lastWindowError: details
    });

    const msg = [
      "🔥 window.error",
      `الرسالة: ${details.message}`,
      `الملف: ${details.filename}`,
      `السطر: ${details.lineno}`,
      `العمود: ${details.colno}`,
      `النوع: ${details.errorName}`,
      `تفاصيل: ${details.errorMessage}`
    ].join("\n");

    showMobileError(msg);
  }

  handleUnhandledRejection(event) {
    const reason = event?.reason;

    // إذا كان الخطأ بسبب chunk قديم بعد deploy، أعد التحميل تلقائيًا.
    if (isChunkLoadError(reason) && tryAutoRecoverFromChunkError()) {
      return;
    }

    const details = {
      reasonType: typeof reason,
      reason:
        reason instanceof Error
          ? {
              name: reason.name,
              message: reason.message,
              stack: reason.stack || ""
            }
          : safeString(reason),
      time: getNow()
    };

    void logClientError(
      reason instanceof Error ? reason : new Error(safeString(reason || "Unhandled promise rejection")),
      {
        source: "unhandledrejection.error_boundary_listener",
        stack: reason?.stack || "",
        extra: details
      }
    );

    console.group("🧨 unhandledrejection");
    console.error(details);
    console.groupEnd();

    this.setState({
      lastRejection: details
    });

    const msg = [
      "🔥 Promise Rejection",
      `النوع: ${details.reasonType}`,
      `الوقت: ${details.time}`,
      `السبب: ${safeString(details.reason).slice(0, 800)}`
    ].join("\n");

    showMobileError(msg);
  }

  handleDocumentClick(event) {
    try {
      const t = event?.target;

      const details = {
        tagName: t?.tagName || "",
        id: t?.id || "",
        className:
          typeof t?.className === "string"
            ? t.className
            : safeString(t?.className || ""),
        text: (t?.innerText || t?.textContent || "").trim().slice(0, 120),
        time: getNow()
      };

      this.setState({
        lastClick: details
      });
    } catch {}
  }

  renderBlock(title, content, bg = "#f5f5f5", color = "#222") {
    const sx = {
      s1: (bgColor, textColor) => ({
        background: bgColor,
        color: textColor,
        padding: 10,
        borderRadius: 8,
        marginBottom: 10,
        overflowX: "auto",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        lineHeight: 1.7
      }),
      s2: {
        fontWeight: 900,
        marginBottom: 6
      }
    };

    return (
      <div style={sx.s1(bg, color)}>
        <div style={sx.s2}>{title}</div>
        <div>{content || "—"}</div>
      </div>
    );
  }

  render() {
    const sx = {
      s1: {
        padding: 20,
        fontFamily: "Tajawal, monospace",
        direction: "rtl",
        fontSize: 12,
        background: "#fff",
        color: "#111",
        minHeight: "100vh"
      },
      s2: {
        fontSize: 20,
        fontWeight: 900,
        color: "#b00020",
        marginBottom: 14
      },
      s3: {
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        marginTop: 14
      },
      s4: {
        padding: "10px 24px",
        background: "#1A4A2E",
        color: "white",
        border: "none",
        borderRadius: 10,
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: 14,
        fontWeight: 700
      },
      s5: {
        padding: "10px 24px",
        background: "#f3f4f6",
        color: "#111827",
        border: "1px solid #d1d5db",
        borderRadius: 10,
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: 14,
        fontWeight: 700
      }
    };

    if (this.state.error) {
      const err = this.state.error;
      const msg = err?.message || String(err) || "unknown";
      const name = err?.name || "Error";
      const stack = err?.stack || "";
      const componentStack = this.state.info?.componentStack || "";

      return (
        <div style={sx.s1}>
          <div style={sx.s2}>❌ خطأ في التطبيق</div>

          {this.renderBlock("نوع الخطأ", name, "#fff4f4", "#900")}
          {this.renderBlock("رسالة الخطأ", msg, "#fff4f4", "#900")}
          {this.renderBlock("الوقت", this.state.timestamp || getNow())}
          {this.renderBlock("الرابط الحالي", this.state.route || "")}
          {this.renderBlock("JS Stack", stack || "لا يوجد")}
          {this.renderBlock("Component Stack", componentStack || "لا يوجد")}
          {this.renderBlock("آخر window.error", safeString(this.state.lastWindowError || "لا يوجد"))}
          {this.renderBlock("آخر Promise rejection", safeString(this.state.lastRejection || "لا يوجد"))}
          {this.renderBlock("آخر عنصر تم الضغط عليه", safeString(this.state.lastClick || "لا يوجد"))}
          {this.renderBlock("User Agent", this.state.userAgent || "")}

          <div style={sx.s3}>
            <button
              onClick={() => {
                this.setState({
                  error: null,
                  info: null,
                  timestamp: null
                });
                window.location.reload();
              }}
              style={sx.s4}
            >
              إعادة المحاولة
            </button>

            <button
              onClick={async () => {
                const dump = [
                  `Error Name: ${name}`,
                  `Message: ${msg}`,
                  `Time: ${this.state.timestamp || ""}`,
                  `Route: ${this.state.route || ""}`,
                  `\n=== JS Stack ===\n${stack || ""}`,
                  `\n=== Component Stack ===\n${componentStack || ""}`,
                  `\n=== Last window.error ===\n${safeString(this.state.lastWindowError || "")}`,
                  `\n=== Last rejection ===\n${safeString(this.state.lastRejection || "")}`,
                  `\n=== Last click ===\n${safeString(this.state.lastClick || "")}`,
                  `\n=== User Agent ===\n${this.state.userAgent || ""}`
                ].join("\n");

                try {
                  await navigator.clipboard.writeText(dump);
                  alert("تم نسخ تفاصيل الخطأ");
                } catch {
                  alert("تعذر نسخ تفاصيل الخطأ");
                }
              }}
              style={sx.s5}
            >
              نسخ تفاصيل الخطأ
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
        }
