import React from "react";

export default function AddViaWhatsAppPage() {
  React.useEffect(() => {
    const query = window.location.search || "";
    window.location.replace(`/api/add-whatsapp${query}`);
  }, []);

  return (
    <main dir="rtl" style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#F4F7F5", color: "#1A4A2E", fontFamily: "Arial, sans-serif", textAlign: "center" }}>
      <strong>جارٍ فتح صفحة الإعلان...</strong>
    </main>
  );
}
