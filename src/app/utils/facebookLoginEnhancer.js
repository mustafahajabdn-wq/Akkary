import { signInWithFacebookOAuth } from "../services/facebookAuthService.js";

const SLOT_ID = "aqari-facebook-login-slot";
const MODAL_ID = "aqari-facebook-terms-modal";
const INSTALLED_FLAG = "__aqariFacebookLoginEnhancerInstalled";

function createFacebookIcon() {
  const icon = document.createElement("span");
  icon.textContent = "f";
  Object.assign(icon.style, {
    width: "22px",
    height: "22px",
    borderRadius: "50%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#1877F2",
    color: "#fff",
    fontFamily: "Arial, sans-serif",
    fontSize: "18px",
    fontWeight: "900",
    lineHeight: "1",
  });
  return icon;
}

function showInlineError(slot, message) {
  let errorNode = slot.querySelector("[data-facebook-error]");

  if (!errorNode) {
    errorNode = document.createElement("div");
    errorNode.dataset.facebookError = "true";
    Object.assign(errorNode.style, {
      marginTop: "8px",
      color: "#DC2626",
      fontSize: "12px",
      textAlign: "center",
      fontWeight: "700",
      lineHeight: "1.6",
    });
    slot.appendChild(errorNode);
  }

  errorNode.textContent = message || "فشل تسجيل الدخول بواسطة Facebook";
}

function closeTermsModal() {
  document.getElementById(MODAL_ID)?.remove();
}

function showTermsModal(onConfirm) {
  closeTermsModal();

  const backdrop = document.createElement("div");
  backdrop.id = MODAL_ID;
  Object.assign(backdrop.style, {
    position: "fixed",
    inset: "0",
    zIndex: "100000",
    background: "rgba(0,0,0,.48)",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    direction: "rtl",
    fontFamily: "Tajawal, sans-serif",
  });

  const sheet = document.createElement("div");
  Object.assign(sheet.style, {
    width: "100%",
    maxWidth: "520px",
    background: "#fff",
    borderRadius: "22px 22px 0 0",
    padding: "20px",
    boxSizing: "border-box",
  });

  const title = document.createElement("div");
  title.textContent = "متابعة Facebook";
  Object.assign(title.style, {
    fontSize: "17px",
    fontWeight: "900",
    color: "#1A2E20",
    marginBottom: "10px",
  });

  const text = document.createElement("div");
  text.innerHTML = 'يلزم قبول الشروط أولًا قبل المتابعة بحساب Facebook. <a href="/terms" style="color:#1A6B3A;font-weight:800">قراءة الشروط</a>';
  Object.assign(text.style, {
    fontSize: "13px",
    color: "#556B5D",
    lineHeight: "1.8",
    marginBottom: "14px",
  });

  const actions = document.createElement("div");
  Object.assign(actions.style, {
    display: "flex",
    gap: "10px",
  });

  const cancel = document.createElement("button");
  cancel.type = "button";
  cancel.textContent = "إلغاء";
  Object.assign(cancel.style, {
    flex: "1",
    padding: "12px",
    borderRadius: "12px",
    border: "1px solid #DDE8E1",
    background: "#fff",
    color: "#556B5D",
    fontFamily: "inherit",
    fontSize: "13px",
    cursor: "pointer",
  });

  const confirm = document.createElement("button");
  confirm.type = "button";
  confirm.textContent = "أوافق وأتابع";
  Object.assign(confirm.style, {
    flex: "1",
    padding: "12px",
    borderRadius: "12px",
    border: "none",
    background: "#1877F2",
    color: "#fff",
    fontFamily: "inherit",
    fontSize: "14px",
    fontWeight: "800",
    cursor: "pointer",
  });

  cancel.addEventListener("click", closeTermsModal);
  backdrop.addEventListener("click", event => {
    if (event.target === backdrop) closeTermsModal();
  });

  confirm.addEventListener("click", () => {
    try {
      localStorage.setItem("terms_accepted", "1");
    } catch {}
    closeTermsModal();
    onConfirm?.();
  });

  actions.append(cancel, confirm);
  sheet.append(title, text, actions);
  backdrop.appendChild(sheet);
  document.body.appendChild(backdrop);
}

function findInsertionTarget() {
  const buttons = Array.from(document.querySelectorAll("button"));
  const googleButton = buttons.find(button =>
    String(button.textContent || "").includes("المتابعة بحساب Google")
  );

  if (googleButton?.parentElement) {
    return { parent: googleButton.parentElement, after: googleButton };
  }

  const nodes = Array.from(document.querySelectorAll("div"));
  const title = nodes.find(node =>
    String(node.textContent || "").trim() === "تسجيل الدخول أو إنشاء حساب"
  );

  if (title?.parentElement) {
    return { parent: title.parentElement, after: title };
  }

  return null;
}

function mountButton() {
  const onLoginPage = window.location.pathname === "/login";
  const existing = document.getElementById(SLOT_ID);

  if (!onLoginPage) {
    existing?.remove();
    closeTermsModal();
    return;
  }

  if (existing) return;

  const target = findInsertionTarget();
  if (!target) return;

  const slot = document.createElement("div");
  slot.id = SLOT_ID;
  Object.assign(slot.style, {
    marginTop: "9px",
    marginBottom: "2px",
  });

  const button = document.createElement("button");
  button.type = "button";
  Object.assign(button.style, {
    width: "100%",
    padding: "13px",
    borderRadius: "14px",
    border: "1.5px solid #1877F2",
    background: "#1877F2",
    color: "#fff",
    fontSize: "14px",
    fontWeight: "800",
    cursor: "pointer",
    fontFamily: "inherit",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    boxShadow: "0 2px 8px rgba(24,119,242,.18)",
  });

  const label = document.createElement("span");
  label.textContent = "المتابعة بحساب Facebook";
  button.append(createFacebookIcon(), label);

  const startLogin = async () => {
    if (button.disabled) return;

    button.disabled = true;
    button.style.opacity = ".72";
    label.textContent = "جارٍ فتح Facebook...";
    slot.querySelector("[data-facebook-error]")?.remove();

    try {
      await signInWithFacebookOAuth(`${window.location.origin}/auth/callback`);

      window.setTimeout(() => {
        if (document.visibilityState === "visible") {
          button.disabled = false;
          button.style.opacity = "1";
          label.textContent = "المتابعة بحساب Facebook";
        }
      }, 3000);
    } catch (error) {
      button.disabled = false;
      button.style.opacity = "1";
      label.textContent = "المتابعة بحساب Facebook";
      showInlineError(slot, error?.message || "فشل تسجيل الدخول بواسطة Facebook");
    }
  };

  button.addEventListener("click", () => {
    let accepted = false;
    try {
      accepted = localStorage.getItem("terms_accepted") === "1";
    } catch {}

    if (!accepted) {
      showTermsModal(startLogin);
      return;
    }

    startLogin();
  });

  slot.appendChild(button);
  target.after.insertAdjacentElement("afterend", slot);
}

export function installFacebookLoginEnhancer() {
  if (typeof window === "undefined" || window[INSTALLED_FLAG]) return;

  window[INSTALLED_FLAG] = true;

  const observer = new MutationObserver(() => mountButton());
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  window.addEventListener("pageshow", mountButton);
  window.addEventListener("popstate", mountButton);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") mountButton();
  });

  mountButton();
}
