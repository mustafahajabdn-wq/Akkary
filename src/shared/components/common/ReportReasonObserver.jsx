import React from "react";

const CUSTOM_REASON = "المنطقة عليها إشكال ملكية";
const FALLBACK_REASON = "غير ذلك";

function isListingReportModal() {
  return Array.from(document.querySelectorAll("div,span,h1,h2,h3"))
    .some((node) => String(node.textContent || "").trim() === "🚩 الإبلاغ عن إعلان");
}

function setTextareaValue(textarea, value) {
  if (!textarea) return;

  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLTextAreaElement.prototype,
    "value"
  )?.set;

  if (setter) setter.call(textarea, value);
  else textarea.value = value;

  textarea.dispatchEvent(new Event("input", { bubbles: true }));
  textarea.dispatchEvent(new Event("change", { bubbles: true }));
}

function makeCustomButton(nativeButton) {
  const button = nativeButton.cloneNode(true);
  button.type = "button";
  button.dataset.ownershipIssueReason = "true";
  button.style.borderColor = nativeButton.style.borderColor || "#E5E7EB";
  button.style.background = nativeButton.style.background || "#F8FAFC";
  button.style.color = nativeButton.style.color || "#1F2937";
  button.style.fontWeight = "700";
  button.innerHTML = `<span style="font-size:16px">⚪</span>${CUSTOM_REASON}`;
  return button;
}

function applyObserverPatch() {
  if (!isListingReportModal()) return;

  const reasonButtons = Array.from(document.querySelectorAll("button"))
    .filter((button) => {
      const text = String(button.textContent || "").trim();
      return [
        "إعلان وهمي أو احتيالي",
        "صور مضللة أو غير حقيقية",
        "سعر مبالغ فيه أو غير منطقي",
        "محتوى مسيء أو غير لائق",
        "رقم هاتف خاطئ أو غير موجود",
        "إعلان مكرر",
        FALLBACK_REASON,
      ].some((label) => text.includes(label));
    });

  if (!reasonButtons.length) return;
  if (document.querySelector('button[data-ownership-issue-reason="true"]')) return;

  const firstButton = reasonButtons[0];
  const fallbackButton = reasonButtons.find((button) =>
    String(button.textContent || "").includes(FALLBACK_REASON)
  );
  const customButton = makeCustomButton(firstButton);

  customButton.addEventListener("click", () => {
    fallbackButton?.click();

    const textarea = document.querySelector("textarea");
    setTextareaValue(textarea, CUSTOM_REASON);

    customButton.innerHTML = `<span style="font-size:16px">🔴</span>${CUSTOM_REASON}`;
    customButton.style.borderColor = "#DC2626";
    customButton.style.background = "#FEF2F2";
    customButton.style.color = "#DC2626";
    customButton.style.fontWeight = "800";
  });

  reasonButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (button === fallbackButton) return;
      customButton.innerHTML = `<span style="font-size:16px">⚪</span>${CUSTOM_REASON}`;
      customButton.style.borderColor = firstButton.style.borderColor || "#E5E7EB";
      customButton.style.background = firstButton.style.background || "#F8FAFC";
      customButton.style.color = firstButton.style.color || "#1F2937";
      customButton.style.fontWeight = "700";
    });
  });

  firstButton.parentElement?.insertBefore(customButton, firstButton);
}

export default function ReportReasonObserver() {
  React.useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return undefined;

    applyObserverPatch();

    const observer = new MutationObserver(() => applyObserverPatch());
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
