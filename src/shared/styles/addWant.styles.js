import { C } from "../constants/colors.js";

const fontFamily = "Tajawal,sans-serif";
const ERROR_COLOR = "#DC2626";

function resolveInputArgs(DCOrOptions = C, maybeOptions = {}) {
  const looksLikeColorPalette = !!(
    DCOrOptions &&
    typeof DCOrOptions === "object" &&
    ("text" in DCOrOptions || "border" in DCOrOptions || "white" in DCOrOptions)
  );

  return {
    DC: looksLikeColorPalette ? DCOrOptions : C,
    options: looksLikeColorPalette ? maybeOptions : (DCOrOptions || {}),
  };
}

export const AW = {
  label: (DC = C) => ({
    display: "block",
    fontSize: 13,
    fontWeight: 700,
    color: DC.text,
    marginBottom: 6,
    fontFamily,
  }),

  input: (DCOrOptions = C, maybeOptions = {}) => {
    const { DC, options } = resolveInputArgs(DCOrOptions, maybeOptions);
    const error = !!options.error;

    return {
      width: "100%",
      padding: "11px 13px",
      borderRadius: 10,
      border: error ? `1.8px solid ${ERROR_COLOR}` : `1px solid ${DC.border}`,
      fontSize: 14,
      fontFamily,
      background: DC.white,
      color: DC.text,
      marginBottom: 14,
      boxSizing: "border-box",
      outline: "none",
      direction: "rtl",
    };
  },

  inputInline: (DCOrOptions = C, maybeOptions = {}) => ({
    ...AW.input(DCOrOptions, maybeOptions),
    marginBottom: 0,
  }),

  textarea: (DCOrOptions = C, maybeOptions = {}) => ({
    ...AW.input(DCOrOptions, maybeOptions),
    minHeight: 80,
    resize: "vertical",
  }),

  row: {
    display: "flex",
    gap: 8,
    marginBottom: 14,
  },

  grid: (columns = 3, gap = 6) => ({
    display: "grid",
    gridTemplateColumns: `repeat(${columns},1fr)`,
    gap,
    marginBottom: 14,
  }),

  wrapRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 14,
  },

  choiceButton: ({ active, color, bg, border, flex = 1 }) => ({
    flex,
    padding: "11px",
    borderRadius: 10,
    border: active ? `2px solid ${color}` : `1px solid ${border || color}`,
    background: active ? color : bg || "white",
    color: active ? "white" : color,
    fontWeight: 800,
    fontSize: 13,
    cursor: "pointer",
    fontFamily,
  }),

  compactButton: ({ active, color, bg, border, flex }) => ({
    ...(flex ? { flex } : {}),
    padding: "9px 4px",
    borderRadius: 9,
    border: active ? `2px solid ${color}` : `1px solid ${border || color}`,
    background: active ? color : bg || "white",
    color: active ? "white" : color,
    fontSize: 11,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily,
  }),

  chipButton: ({ active, color, bg, border }) => ({
    padding: "8px 14px",
    borderRadius: 18,
    cursor: "pointer",
    fontFamily,
    fontSize: 12,
    fontWeight: 600,
    border: active ? `1.5px solid ${color}` : `1.5px solid ${border || C.border}`,
    background: active ? bg || `${color}15` : "transparent",
    color: active ? color : C.text2,
  }),

  iconChoiceButton: ({ active, color, bg, border }) => ({
    padding: "11px",
    borderRadius: 10,
    border: active ? `2px solid ${color}` : `1px solid ${border || color}`,
    background: active ? color : bg || "white",
    color: active ? "white" : color,
    cursor: "pointer",
    fontFamily,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  }),

  footer: (DC = C) => ({
    position: "fixed",
    bottom: 0,
    left: "50%",
    transform: "translateX(-50%)",
    width: "100%",
    maxWidth: 430,
    background: DC.white,
    borderTop: `1px solid ${DC.border}`,
    padding: "12px 16px 32px",
    zIndex: 200,
    boxSizing: "border-box",
  }),

  submitButton: ({ loading, color, minHeight = undefined }) => ({
    width: "100%",
    ...(minHeight ? { minHeight } : {}),
    padding: "14px",
    borderRadius: 12,
    border: "none",
    background: loading ? "#D1D5DB" : color,
    color: "white",
    fontSize: 15,
    fontWeight: 900,
    cursor: loading ? "default" : "pointer",
    fontFamily,
  }),

  warningBox: {
    marginBottom: 10,
    padding: "12px 14px",
    borderRadius: 12,
    background: "#FFF7ED",
    border: "1px solid #FCD34D",
    color: "#92400E",
    fontSize: 12,
    fontWeight: 700,
    lineHeight: 1.8,
  },
};
