import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

let leafletPromise = null;
let iconsConfigured = false;

function ensureZFixStyle() {
  if (typeof document === "undefined" || document.getElementById("leaflet-zfix")) return;
  const style = document.createElement("style");
  style.id = "leaflet-zfix";
  style.textContent = ".leaflet-pane, .leaflet-top, .leaflet-bottom { z-index:1 !important; } .leaflet-control { z-index:2 !important; }";
  document.head.appendChild(style);
}

export function ensureLeafletLoaded({ addZFix = false } = {}) {
  if (addZFix) ensureZFixStyle();

  if (!leafletPromise) {
    leafletPromise = import("leaflet").then((mod) => {
      const L = mod?.default || mod;
      if (!iconsConfigured && L?.Icon?.Default) {
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: markerIcon2x,
          iconUrl: markerIcon,
          shadowUrl: markerShadow,
        });
        iconsConfigured = true;
      }
      if (typeof window !== "undefined") {
        window.L = L;
      }
      return L;
    });
  }

  return leafletPromise;
}
