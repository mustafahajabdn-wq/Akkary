export function ensureSpinKeyframes() {
  if (typeof document === "undefined" || document.getElementById("lazy-spin")) return;
  const style = document.createElement("style");
  style.id = "lazy-spin";
  style.textContent = "@keyframes spin { to { transform: rotate(360deg); } }";
  document.head.appendChild(style);
}

ensureSpinKeyframes();
