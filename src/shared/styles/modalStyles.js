// Shared modal and bottom-sheet style primitives.
// Extracted from components/modals.jsx to keep modal components focused on behavior.

import { C } from "../constants/colors.js";
import { mergeStyles } from "./primitives.js";

// ---- shared ----
export const M = {
  centerCard: {
    position: "relative",
    background: C.white,
    borderRadius: 20,
    margin: "0 20px",
    width: "100%",
    maxWidth: 360
  },
  centerCardWide: {
    position: "relative",
    background: C.white,
    borderRadius: 20,
    margin: "0 16px",
    width: "100%",
    maxWidth: 380,
    maxHeight: "85vh",
    overflowY: "auto"
  },
  bottomSheet: (theme = C, extra = null) => mergeStyles({
    position: "relative",
    background: theme.white,
    borderRadius: "22px 22px 0 0",
    padding: "20px 18px 40px"
  }, extra),
  handle: (theme = C, marginBottom = 18) => ({
    width: 40,
    height: 4,
    background: theme.border,
    borderRadius: 2,
    margin: `0 auto ${marginBottom}px`
  }),
  titleCenter: {
    textAlign: "center",
    fontWeight: 800,
    fontSize: 16,
    marginBottom: 4
  },
  subtitleCenter: (theme = C, extra = null) => mergeStyles({
    textAlign: "center",
    color: theme.text3,
    fontSize: 13,
    marginBottom: 4
  }, extra),
  bodyText: (theme = C, extra = null) => mergeStyles({
    fontSize: 13,
    color: theme.text3,
    marginTop: 6,
    lineHeight: 1.6
  }, extra),
  infoTextCenter: {
    textAlign: "center",
    fontSize: 10,
    color: C.text3,
    marginTop: 10
  },
  successBox: {
    background: "#F0FDF4",
    border: "1px solid #BBF7D0",
    borderRadius: 8,
    padding: "8px 12px",
    marginBottom: 14,
    fontSize: 11,
    color: "#166534",
    textAlign: "center"
  },
  errorBox: {
    background: "#FEF2F2",
    border: "1px solid #FECACA",
    borderRadius: 8,
    padding: "8px 12px",
    marginTop: 8,
    fontSize: 12,
    color: "#DC2626",
    textAlign: "center"
  },
  confirmCard: {
    padding: "30px 24px",
    textAlign: "center"
  },
  confirmCardCompact: {
    padding: "28px 24px"
  },
  footerRow: {
    display: "flex",
    gap: 8,
    marginTop: 12
  },
  gapWrap7: {
    display: "flex",
    gap: 7,
    flexWrap: "wrap"
  },
  gapWrap6: {
    display: "flex",
    gap: 6,
    marginTop: 8,
    flexWrap: "wrap"
  },
  input: (theme = C, extra = null) => mergeStyles({
    width: "100%",
    padding: "11px 13px",
    border: `1.5px solid ${theme.border}`,
    borderRadius: 10,
    fontSize: 14,
    fontFamily: "Tajawal, sans-serif",
    outline: "none",
    direction: "rtl",
    background: theme.white,
    boxSizing: "border-box"
  }, extra),
  textarea: (theme = C, height = 70, extra = null) => mergeStyles({
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: `1.5px solid ${theme.border}`,
    fontSize: 13,
    fontFamily: "inherit",
    resize: "none",
    height,
    boxSizing: "border-box",
    outline: "none",
    background: theme.bg,
    color: theme.text
  }, extra),
  primaryButton: (bg = C.primary, extra = null) => mergeStyles({
    padding: "11px 28px",
    background: bg,
    color: "white",
    border: "none",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit"
  }, extra),
  sheetButton: (theme = C, extra = null) => mergeStyles({
    padding: "12px",
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 700,
    fontFamily: "Tajawal, sans-serif",
    cursor: "pointer"
  }, extra),
  chipButton: (theme = C, active, activeBg = "#E8F4F0", activeColor = C.primary, extra = null) => mergeStyles({
    padding: "7px 13px",
    borderRadius: 20,
    border: active ? `2px solid ${activeColor}` : `1px solid ${theme.border}`,
    background: active ? activeBg : theme.bg,
    color: active ? activeColor : theme.text2,
    fontSize: 12,
    fontWeight: active ? 800 : 500,
    cursor: "pointer",
    fontFamily: "inherit",
    display: "flex",
    alignItems: "center",
    gap: 4,
    transition: "all 0.15s"
  }, extra),
  pillButton: (theme = C) => ({
    padding: "4px 10px",
    borderRadius: 16,
    border: `1px solid ${theme.border}`,
    background: theme.bg,
    color: theme.text2,
    fontSize: 11,
    cursor: "pointer",
    fontFamily: "inherit"
  }),
  optionButton: (theme = C, active = false, activeColor = C.primary, activeBg = "#E8F4F0") => ({
    padding: "10px 14px",
    borderRadius: 10,
    border: active ? `2px solid ${activeColor}` : `1px solid ${theme.border}`,
    background: active ? activeBg : theme.bg,
    color: active ? activeColor : theme.text2,
    fontSize: 13,
    fontWeight: active ? 700 : 500,
    fontFamily: "inherit",
    cursor: "pointer",
    textAlign: "right"
  }),
  colorSwatch: (theme = C, bg, active) => ({
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: `#${bg}`,
    cursor: "pointer",
    border: active ? `3px solid ${theme.text}` : "3px solid transparent",
    boxSizing: "border-box",
    flexShrink: 0
  })
};
