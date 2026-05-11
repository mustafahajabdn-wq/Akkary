import React from "react";

export function BackButton({ onPress, light = true }) {
  return (
    <button
      onClick={onPress}
      style={{
        width: 36,
        height: 36,
        borderRadius: "50%",
        background: light ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.07)",
        border: "none",
        fontSize: 18,
        cursor: "pointer",
        color: light ? "white" : "#1A2E20",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
      aria-label="رجوع"
    >
      →
    </button>
  );
}
