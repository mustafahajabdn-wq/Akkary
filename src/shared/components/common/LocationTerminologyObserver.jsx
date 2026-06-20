import React from "react";

function translateLocationLabel(value) {
  if (!value) return value;

  const leading = value.match(/^\s*/)?.[0] || "";
  const trailing = value.match(/\s*$/)?.[0] || "";
  const text = value.trim();

  const exact = {
    "القرية": "الموقع",
    "اختر القرية": "اختر الموقع",
    "— اختر القرية —": "— اختر الموقع —",
    "كل القرى": "كل المواقع",
    "لا توجد قرى": "لا توجد مواقع",
    "كل الأحياء": "كل المناطق / الأحياء",
    "لا توجد أحياء": "لا توجد مناطق / أحياء",
    "المدينة ← المنطقة / الحي ← القرية": "المدينة ← المنطقة / الحي ← الموقع",
    "+ إضافة قرية": "+ إضافة موقع",
    "إضافة القرية": "إضافة الموقع",
    "تعديل القرية": "تعديل الموقع",
  };

  let translated = exact[text] || text;

  if (translated.startsWith("القرى في ")) {
    translated = `الموقع في ${translated.slice("القرى في ".length)}`;
  } else if (translated.startsWith("القرية في ")) {
    translated = `الموقع في ${translated.slice("القرية في ".length)}`;
  } else if (translated.startsWith("الأحياء في ")) {
    translated = `المنطقة / الحي في ${translated.slice("الأحياء في ".length)}`;
  }

  translated = translated.replace(
    /^(\d+)\s+قرية\s+·\s+اضغط للفتح$/,
    "$1 موقع · اضغط للفتح"
  );

  if (translated === text) return value;
  return `${leading}${translated}${trailing}`;
}

function translateTextNode(node) {
  if (!node || node.nodeType !== Node.TEXT_NODE) return;
  const next = translateLocationLabel(node.nodeValue || "");
  if (next !== node.nodeValue) node.nodeValue = next;
}

function translateSubtree(node) {
  if (!node) return;

  if (node.nodeType === Node.TEXT_NODE) {
    translateTextNode(node);
    return;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return;

  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
  let textNode = walker.nextNode();
  while (textNode) {
    translateTextNode(textNode);
    textNode = walker.nextNode();
  }
}

export default function LocationTerminologyObserver() {
  React.useEffect(() => {
    if (typeof document === "undefined" || !document.body) return undefined;

    translateSubtree(document.body);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "characterData") {
          translateTextNode(mutation.target);
          continue;
        }

        mutation.addedNodes.forEach(translateSubtree);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
