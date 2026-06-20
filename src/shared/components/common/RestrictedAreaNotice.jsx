import React from "react";
import { createPortal } from "react-dom";
import { getSupabase } from "../../services/supabaseClient.js";
import { RESTRICTED_AREA_MESSAGE } from "../../utils/restrictedAreas.js";

function onlyDigits(value) {
  return String(value ?? "")
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/\D/g, "");
}

function toWhatsAppNumber(value) {
  let number = onlyDigits(value);

  if (number.startsWith("00")) number = number.slice(2);
  if (number.startsWith("963")) return number;
  if (number.startsWith("09")) return `963${number.slice(1)}`;
  if (number.startsWith("9") && number.length === 9) return `963${number}`;

  return number;
}

function valueOrDash(value) {
  const text = String(value ?? "").trim();
  return text || "-";
}

function listingTypeLabel(type) {
  return {
    sell: "للبيع",
    rent: "للإيجار",
    want_buy: "مطلوب شراء",
    want_rent: "مطلوب إيجار",
  }[type] || valueOrDash(type);
}

function buildWhatsAppMessage(listing, area) {
  return [
    "مرحبًا، أريد مراجعة وثائق ملكية عقار قبل نشره على طابو أخضر.",
    `المنطقة المطابقة: ${valueOrDash(area)}`,
    `نوع الإعلان: ${listingTypeLabel(listing?.type)}`,
    `نوع العقار: ${valueOrDash(listing?.category)}`,
    `المدينة: ${valueOrDash(listing?.city)}`,
    `المنطقة: ${valueOrDash(listing?.district)}`,
    `القرية: ${valueOrDash(listing?.village)}`,
    `تفاصيل الموقع: ${valueOrDash(listing?.location_detail)}`,
    `رقم تواصل المعلن: ${valueOrDash(listing?.phone || listing?.phone2)}`,
  ].join("\n");
}

async function loadSupportWhatsApp() {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("app_settings")
    .select("key,value")
    .in("key", ["support_whatsapp", "whatsapp_offer"]);

  if (error) throw error;

  const settings = Object.fromEntries(
    (data || []).map((item) => [item.key, item.value])
  );

  return toWhatsAppNumber(
    settings.support_whatsapp || settings.whatsapp_offer || ""
  );
}

function RestrictedModal({ detail, supportNumber, onClose }) {
  const listing = detail?.listing || {};
  const message = buildWhatsAppMessage(listing, detail?.area);
  const canOpenWhatsApp = Boolean(supportNumber);

  function openWhatsApp() {
    if (!canOpenWhatsApp) return;

    window.location.href =
      `https://wa.me/${supportNumber}?text=${encodeURIComponent(message)}`;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="restricted-area-title"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100000,
        background: "rgba(15,23,42,.58)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 18,
        direction: "rtl",
        fontFamily: "Tajawal,Arial,sans-serif",
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          width: "min(100%, 470px)",
          background: "#fff",
          borderRadius: 20,
          padding: 20,
          boxShadow: "0 24px 80px rgba(15,23,42,.28)",
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 12px",
            background: "#FFF7ED",
            fontSize: 24,
          }}
        >
          🛡️
        </div>

        <h2
          id="restricted-area-title"
          style={{
            margin: "0 0 8px",
            textAlign: "center",
            color: "#1A4A2E",
            fontSize: 20,
          }}
        >
          يلزم التحقق من وثائق الملكية
        </h2>

        <div
          style={{
            textAlign: "center",
            color: "#9A3412",
            fontSize: 13,
            fontWeight: 800,
            marginBottom: 12,
          }}
        >
          المنطقة: {detail?.area || "منطقة محظورة"}
        </div>

        <p
          style={{
            margin: 0,
            color: "#475569",
            fontSize: 14,
            lineHeight: 1.9,
            textAlign: "right",
          }}
        >
          {RESTRICTED_AREA_MESSAGE}
        </p>

        {!canOpenWhatsApp && (
          <div
            style={{
              marginTop: 12,
              padding: 10,
              borderRadius: 10,
              background: "#FEF2F2",
              color: "#B91C1C",
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            رقم واتساب الإدارة غير مضبوط في إعدادات التطبيق.
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
            marginTop: 18,
          }}
        >
          <button
            type="button"
            onClick={openWhatsApp}
            disabled={!canOpenWhatsApp}
            style={{
              border: "none",
              borderRadius: 12,
              padding: "12px 10px",
              background: canOpenWhatsApp ? "#16A34A" : "#94A3B8",
              color: "#fff",
              fontFamily: "inherit",
              fontSize: 13,
              fontWeight: 900,
              cursor: canOpenWhatsApp ? "pointer" : "not-allowed",
            }}
          >
            💬 التواصل عبر واتساب
          </button>

          <button
            type="button"
            onClick={onClose}
            style={{
              border: "1px solid #CBD5E1",
              borderRadius: 12,
              padding: "12px 10px",
              background: "#F8FAFC",
              color: "#334155",
              fontFamily: "inherit",
              fontSize: 13,
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}

function ImportSummary({ importedCount, restrictedItems, onClose }) {
  if (!restrictedItems.length) return null;

  return (
    <div
      role="status"
      style={{
        position: "fixed",
        right: 12,
        left: 12,
        bottom: 14,
        zIndex: 99999,
        maxWidth: 620,
        margin: "0 auto",
        padding: 14,
        borderRadius: 16,
        background: "#FFFBEB",
        border: "1px solid #FCD34D",
        boxShadow: "0 18px 44px rgba(15,23,42,.18)",
        direction: "rtl",
        fontFamily: "Tajawal,Arial,sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 10,
        }}
      >
        <div>
          <div style={{ fontSize: 14, fontWeight: 900, color: "#92400E" }}>
            نتيجة الاستيراد
          </div>
          <div style={{ marginTop: 4, fontSize: 12.5, color: "#78350F" }}>
            تم استيراد {importedCount} إعلانًا، وتم تجاوز {restrictedItems.length} إعلانًا لوجودها ضمن مناطق محظورة.
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="إغلاق"
          style={{
            border: "none",
            background: "transparent",
            color: "#92400E",
            fontSize: 20,
            cursor: "pointer",
          }}
        >
          ×
        </button>
      </div>

      <div
        style={{
          marginTop: 10,
          maxHeight: 150,
          overflowY: "auto",
          display: "grid",
          gap: 6,
        }}
      >
        {restrictedItems.map((item, index) => (
          <div
            key={`${item.area}-${item.listing?.title || index}-${index}`}
            style={{
              padding: "8px 10px",
              borderRadius: 10,
              background: "rgba(255,255,255,.75)",
              color: "#78350F",
              fontSize: 11.5,
            }}
          >
            <strong>{item.listing?.title || "إعلان بلا عنوان"}</strong>
            <span> — {item.area}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RestrictedAreaNotice() {
  const [modalDetail, setModalDetail] = React.useState(null);
  const [supportNumber, setSupportNumber] = React.useState("");
  const [importedCount, setImportedCount] = React.useState(0);
  const [restrictedItems, setRestrictedItems] = React.useState([]);
  const lastImportEventAtRef = React.useRef(0);

  React.useEffect(() => {
    let alive = true;

    loadSupportWhatsApp()
      .then((number) => {
        if (alive) setSupportNumber(number);
      })
      .catch(() => {
        if (alive) setSupportNumber("");
      });

    return () => {
      alive = false;
    };
  }, []);

  React.useEffect(() => {
    function onRestrictedAreaEvent(event) {
      const detail = event?.detail || {};

      if (detail.source === "add" && detail.kind === "restricted") {
        setModalDetail(detail);
        return;
      }

      if (detail.source !== "import") return;

      const now = Date.now();
      if (now - lastImportEventAtRef.current > 5 * 60 * 1000) {
        setImportedCount(0);
        setRestrictedItems([]);
      }
      lastImportEventAtRef.current = now;

      if (detail.kind === "import-success") {
        setImportedCount((count) => count + 1);
      }

      if (detail.kind === "restricted") {
        setRestrictedItems((items) => [
          ...items,
          {
            listing: detail.listing || {},
            area: detail.area || "منطقة محظورة",
          },
        ]);
      }
    }

    window.addEventListener("restricted-area-event", onRestrictedAreaEvent);
    return () => {
      window.removeEventListener("restricted-area-event", onRestrictedAreaEvent);
    };
  }, []);

  if (typeof document === "undefined") return null;

  return createPortal(
    <>
      {modalDetail && (
        <RestrictedModal
          detail={modalDetail}
          supportNumber={supportNumber}
          onClose={() => setModalDetail(null)}
        />
      )}

      <ImportSummary
        importedCount={importedCount}
        restrictedItems={restrictedItems}
        onClose={() => {
          setImportedCount(0);
          setRestrictedItems([]);
        }}
      />
    </>,
    document.body
  );
}
