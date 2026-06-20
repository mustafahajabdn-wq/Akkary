import React from "react";
import LocationsHierarchyPage from "./LocationsHierarchyPage.jsx";

function translateLocationText(value) {
  if (!value) return value;

  let next = value
    .replace(
      /المدينة ← المنطقة \/ الحي ← القرية/g,
      "المدينة ← المنطقة / الحي ← الموقع"
    )
    .replace(/\+ إضافة قرية/g, "+ إضافة موقع")
    .replace(/إضافة القرية/g, "إضافة الموقع")
    .replace(/تعديل القرية/g, "تعديل الموقع")
    .replace(/القرية في /g, "الموقع في ")
    .replace(/(\d+)\s+قرية\s+·\s+اضغط للفتح/g, "$1 موقع · اضغط للفتح");

  if (next.trim() === "القرية") {
    const leading = next.match(/^\s*/)?.[0] || "";
    const trailing = next.match(/\s*$/)?.[0] || "";
    next = `${leading}الموقع${trailing}`;
  }

  return next;
}

function translateTree(root) {
  if (!root || typeof document === "undefined") return;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();

  while (node) {
    const translated = translateLocationText(node.nodeValue || "");
    if (translated !== node.nodeValue) node.nodeValue = translated;
    node = walker.nextNode();
  }
}

export default function LocationsHierarchyDisplayPage(props) {
  const rootRef = React.useRef(null);

  React.useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    translateTree(root);

    const observer = new MutationObserver(() => translateTree(root));
    observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={rootRef}>
      <LocationsHierarchyPage {...props} />
    </div>
  );
}
