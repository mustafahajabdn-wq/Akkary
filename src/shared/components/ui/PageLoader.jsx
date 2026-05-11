export default function PageLoader({
  title = "جارٍ التحميل..."
}) {
  const sx = {
    s1: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "60vh"
    },
    s2: {
      width: 40,
      height: 40,
      border: "4px solid #e5e7eb",
      borderTop: "4px solid #1A4A2E",
      borderRadius: "50%",
      animation: "spin 1s linear infinite"
    },
    s3: {
      marginTop: 12,
      fontSize: 14,
      color: "#374151"
    }
  };
  return <div style={sx.s1}>
      <div style={sx.s2} />
      <p style={sx.s3}>{title}</p>
      <style>{`@keyframes spin{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}`}</style>
    </div>;
}