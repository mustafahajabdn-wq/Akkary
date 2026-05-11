// Admin dashboard visual primitives.
// Kept out of the page so the dashboard file focuses on data and layout.

export const statCardStyles = {
    s1: (bg, onClick, color) => ({
      background: bg,
      borderRadius: 16,
      padding: "18px 16px",
      cursor: onClick ? "pointer" : "default",
      border: `1px solid ${color}18`,
      position: "relative",
      overflow: "hidden"
    }),
    s2: {
      position: "absolute",
      top: -10,
      left: -10,
      fontSize: 50,
      opacity: 0.07
    },
    s3: color => ({
      fontSize: 28,
      fontWeight: 900,
      color,
      marginBottom: 4,
      position: "relative"
    }),
    s4: {
      fontSize: 16,
      opacity: 0.5
    },
    s5: color => ({
      fontSize: 12,
      fontWeight: 700,
      color,
      opacity: 0.75,
      position: "relative"
    })
  };

export const smallStatStyles = {
    s1: {
      fontSize: 11,
      color: "#64748B",
      fontWeight: 700,
      marginBottom: 3
    },
    s2: color => ({
      fontSize: 18,
      color,
      fontWeight: 900
    }),
    s3: {
      fontSize: 9,
      color: "#94A3B8",
      fontWeight: 700,
      marginTop: 3
    }
  };

export const storageUsageGraphicStyles = {
    s1: tone => ({
      background: "#FFFFFF",
      border: `1px solid ${tone.border}`,
      borderRadius: 14,
      padding: 12
    }),
    s2: {
      fontSize: 12,
      fontWeight: 900,
      color: "#0F172A"
    },
    s3: tone => ({
      minWidth: 64,
      textAlign: "center",
      padding: "7px 10px",
      borderRadius: 999,
      background: tone.soft,
      color: tone.text,
      fontSize: 13,
      fontWeight: 900
    }),
    s4: {
      position: "relative",
      height: 12,
      borderRadius: 999,
      background: "#E2E8F0",
      overflow: "hidden",
      marginBottom: 10
    },
    s5: (percent, tone) => ({
      position: "absolute",
      inset: 0,
      width: `${percent}%`,
      background: tone.bar,
      borderRadius: 999,
      transition: "width 220ms ease"
    }),
    s6: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
      gap: 8
    }
  };

