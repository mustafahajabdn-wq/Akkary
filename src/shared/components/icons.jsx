// مكوّنات SVG مشتركة — أنماط زخرفية وعناصر هوية
import React from "react";
import { C } from "../constants/colors.js";

export const IslamicPattern = ({ opacity = 0.08, color = "#FFFFFF", width = 430, height = 300 }) => {
  const s = 80;
  const sw = 0.6;
  const stepX = s;
  const stepY = s * 0.85;

  const starPath = (cx, cy, r) => {
    const pts = [];
    for (let i = 0; i < 8; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 4;
      const b = a + Math.PI / 8;
      pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
      pts.push(`${cx + r * 0.5 * Math.cos(b)},${cy + r * 0.5 * Math.sin(b)}`);
    }
    return "M" + pts.join("L") + "Z";
  };

  const items = [];
  const d = s * 0.45;
  const hd = d * 0.5;
  const sx = {
    s1: (op) => ({ position: "absolute", top: 0, left: 0, opacity: op, pointerEvents: "none" }),
  };

  for (let row = -1; row < Math.ceil(height / stepY) + 2; row++) {
    for (let col = -1; col < Math.ceil(width / stepX) + 2; col++) {
      const x = col * stepX + (row % 2 ? stepX / 2 : 0);
      const y = row * stepY;
      const k = `${row}_${col}`;
      items.push(
        <path key={`s${k}`} d={starPath(x, y, s * 0.35)} fill="none" stroke={color} strokeWidth={sw} />,
        <line key={`l0${k}`} x1={x - d} y1={y} x2={x - hd} y2={y} stroke={color} strokeWidth={sw} />,
        <line key={`l1${k}`} x1={x + hd} y1={y} x2={x + d} y2={y} stroke={color} strokeWidth={sw} />,
        <line key={`l2${k}`} x1={x} y1={y - d} x2={x} y2={y - hd} stroke={color} strokeWidth={sw} />,
        <line key={`l3${k}`} x1={x} y1={y + hd} x2={x} y2={y + d} stroke={color} strokeWidth={sw} />
      );
    }
  }

  return (
    <svg width={width} height={height} style={sx.s1(opacity)}>
      {items}
    </svg>
  );
};

export const Star = ({ size = 16, color = C.gold }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <polygon points="12,2 14,9 21,9 15.5,13.5 17.5,20.5 12,16 6.5,20.5 8.5,13.5 3,9 10,9" />
  </svg>
);

export const Wave = ({ fill = "#F8F6F1" }) => {
  const sx = {
    s1: { position: "absolute", bottom: 0, left: 0 },
  };
  return (
    <svg width="100%" height="36" viewBox="0 0 400 36" preserveAspectRatio="none" style={sx.s1}>
      <path d="M0,36 L0,18 Q50,0 100,18 Q150,36 200,18 Q250,0 300,18 Q350,36 400,18 L400,36 Z" fill={fill} />
    </svg>
  );
};

export function SyriaFlag({ width = 28, height = 18, style = {} }) {
  const sx = {
    s1: (st) => ({ display: "block", ...st }),
  };
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 60 40"
      xmlns="http://www.w3.org/2000/svg"
      style={sx.s1(style)}
      aria-label="Syria Flag"
      role="img"
    >
      <rect width="60" height="13.333" y="0" fill="#007A3D" />
      <rect width="60" height="13.333" y="13.333" fill="#FFFFFF" />
      <rect width="60" height="13.334" y="26.666" fill="#000000" />
      <text x="20" y="22.2" textAnchor="middle" fontSize="10" fill="#CE1126">★</text>
      <text x="40" y="22.2" textAnchor="middle" fontSize="10" fill="#CE1126">★</text>
    </svg>
  );
}
