// Centralized JS style primitives used across the app.
// Keep reusable layout, typography, card, modal, and small utility styles here.
// Page-specific styles should stay near the page unless reused in two or more places.

export const mergeStyles = (...styles) => Object.assign({}, ...styles.filter(Boolean));

export const S = {
  hidden: { display: "none" },
  flex1: { flex: 1 },
  relZ1: { position: "relative", zIndex: 1 },
  absTopRight14: { position: "absolute", top: 14, right: 16, zIndex: 2 },

  fixedCenter: {
    position: "fixed",
    inset: 0,
    zIndex: 999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  fixedCenterHi: {
    position: "fixed",
    inset: 0,
    zIndex: 99999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  fixedBottomSheet: {
    position: "fixed",
    inset: 0,
    zIndex: 99999,
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
  },
  fixedBottomSheet999: {
    position: "fixed",
    inset: 0,
    zIndex: 999,
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
  },

  overlay40: { position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" },
  overlay45: { position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)" },
  overlay50: { position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" },

  pageShell: (theme) => ({
    maxWidth: 430,
    margin: "0 auto",
    minHeight: "100vh",
    background: theme?.bg || "#F2F5F3",
    fontFamily: "Tajawal,sans-serif",
    direction: "rtl",
  }),

  primaryHero: (primary) => ({
    background: primary,
    padding: "48px 16px 50px",
    position: "relative",
    overflow: "hidden",
  }),

  card: (theme, extra = null) =>
    mergeStyles(
      {
        background: theme.white,
        borderRadius: 12,
        padding: "12px 14px",
        marginBottom: 12,
        border: `1px solid ${theme.border}`,
      },
      extra
    ),

  title20White: { fontSize: 20, fontWeight: 900, color: "white" },
  text11SlateStrong: { fontSize: 11, color: "#475569", fontWeight: 700 },
  emptyStateCentered: { textAlign: "center", padding: 40 },

  gap8: { display: "flex", gap: 8 },
  gap6: { display: "flex", gap: 6 },
  gap10: { display: "flex", gap: 10 },
  rowCenterGap8: { display: "flex", alignItems: "center", gap: 8 },
  rowCenterGap4Overflow: { display: "flex", alignItems: "center", gap: 4, overflow: "hidden" },
  centerBetween: { display: "flex", alignItems: "center", justifyContent: "space-between" },

  font16: { fontSize: 16 },
  font18: { fontSize: 18 },
  font20: { fontSize: 20 },
  font22: { fontSize: 22 },
  font24: { fontSize: 24 },
  font40: { fontSize: 40 },
  font48: { fontSize: 48 },
  font48Mb12: { fontSize: 48, marginBottom: 12 },
  font52: { fontSize: 52 },
  font56: { fontSize: 56 },

  modalTitle17: { fontSize: 17, fontWeight: 800, marginTop: 12 },
  mb18: { marginBottom: 18 },
  mb10: { marginBottom: 10 },
  pad14Bottom80: { padding: "14px", paddingBottom: 80 },
  pad14: { padding: "14px 14px" },

  bodyText374151: { fontSize: 12, color: "#374151", lineHeight: 2 },
  textCenter: { textAlign: "center" },
  textRight: { textAlign: "right" },
  coverImage: { width: "100%", height: "100%", objectFit: "cover" },

  textMuted11: (theme) => ({ fontSize: 11, color: theme.text3 }),
  textMuted11Strong: (theme) => ({ fontSize: 11, color: theme.text3, fontWeight: 700 }),
  label12: (theme, marginBottom = 6) => ({
    fontSize: 12,
    fontWeight: 700,
    color: theme.text2,
    marginBottom,
  }),
  labelMutedBlock6: (theme) => ({
    fontSize: 12,
    fontWeight: 700,
    color: theme?.text3,
    display: "block",
    marginBottom: 6,
  }),
  labelMutedBlock4: (theme) => ({
    fontSize: 12,
    fontWeight: 700,
    color: theme?.text3,
    display: "block",
    marginBottom: 4,
  }),
  sectionEyebrow: (theme) => ({
    fontSize: 11,
    fontWeight: 800,
    color: theme.text3,
    marginBottom: 8,
    letterSpacing: 1,
  }),

  whiteMeta12: { fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 4 },
  whiteStrong12: { fontSize: 12, color: "rgba(255,255,255,0.8)", fontWeight: 700 },

  ltrRight: { direction: "ltr", textAlign: "right" },


  icon18: { fontSize: 18 },
  icon24: { fontSize: 24 },
  icon32Mb8: { fontSize: 32, marginBottom: 8 },
  text22WhiteBoldMb2: { fontSize: 22, fontWeight: 900, color: "white", marginBottom: 2 },
  heroEyebrow: { fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 6, fontWeight: 600, letterSpacing: 1 },
  heroDate: { fontSize: 12, color: "rgba(255,255,255,0.45)" },
  heroStatsRow: { display: "flex", gap: 16, marginTop: 8 },
  heroStatWhite12: { fontSize: 12, color: "rgba(255,255,255,0.6)", fontWeight: 700 },
  loadingCentered60: { textAlign: "center", padding: 60 },

  text13DarkBold: { fontSize: 13, color: "#0F172A", fontWeight: 900 },
  text12DarkBold: { fontSize: 12, fontWeight: 900, color: "#0F172A" },
  text12DarkBoldMb8: { fontSize: 12, fontWeight: 900, color: "#0F172A", marginBottom: 8 },
  text12DarkBoldMb6: { fontSize: 12, fontWeight: 900, color: "#0F172A", marginBottom: 6 },
  text11Slate: { fontSize: 11, color: "#64748B" },
  text11SlateStrong: { fontSize: 11, color: "#64748B", fontWeight: 700 },
  text11SlateStrongMb3: { fontSize: 11, color: "#64748B", fontWeight: 700, marginBottom: 3 },
  text11SlateStrongMb2: { fontSize: 11, color: "#64748B", fontWeight: 700, marginBottom: 2 },
  text11SlateStrongMt3: { fontSize: 11, color: "#64748B", fontWeight: 700, marginTop: 3 },
  text10SlateStrong: { fontSize: 10, color: "#64748B", fontWeight: 700 },
  text10SlateStrongMb2: { fontSize: 10, color: "#64748B", fontWeight: 700, marginBottom: 2 },
  text10SlateStrongMt3: { fontSize: 10, color: "#64748B", fontWeight: 700, marginTop: 3 },
  text10LightStrong: { fontSize: 10, color: "#9CA3AF", fontWeight: 700 },
  text10LightStrongMb6: { fontSize: 10, fontWeight: 700, color: "#9CA3AF", marginBottom: 6 },
  text9LightStrongMt3: { fontSize: 9, color: "#94A3B8", fontWeight: 700, marginTop: 3 },
  text10DarkBoldMb6: { fontSize: 10, fontWeight: 900, color: "#0F172A", marginBottom: 6 },
  text10Light: { fontSize: 10, color: "#9CA3AF" },
  text11Light: { fontSize: 11, color: "#9CA3AF" },
  text11LightMt3: { fontSize: 11, color: "#9CA3AF", marginTop: 3 },
  text12LightCentered: { textAlign: "center", padding: 12, fontSize: 12, color: "#9CA3AF" },
  text12LightCentered16: { textAlign: "center", padding: "16px 0", color: "#9CA3AF", fontSize: 12 },
  text11DarkStrongMb8: { fontSize: 11, fontWeight: 800, color: "#1A2E20", marginBottom: 8 },

  softCard12Pad10: { background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: 10 },
  softCard12Pad9: { background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: "9px 10px" },
  softCard12Pad10x12: { background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: "10px 12px" },
  whiteCard14Pad12Mb10: { background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 14, padding: 12, marginBottom: 10 },
  whiteCard14Pad12: { background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 14, padding: 12 },
  whiteCard14Pad12Danger: { marginBottom: 12, padding: "10px 12px", borderRadius: 12, background: "#FEF2F2", color: "#B91C1C", border: "1px solid #FECACA", fontSize: 12, fontWeight: 700 },
  noteBox: { marginBottom: 10, padding: "10px 12px", borderRadius: 12, background: "#F8FAFC", border: "1px solid #E2E8F0", fontSize: 10, color: "#64748B", fontWeight: 700 },
  squareThumb: { width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 6, background: "#E2E8F0" },

  grid2Gap10Mb14: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 },
  grid2Gap8Mb8: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 },
  grid2Gap8Mb10: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 },
  grid3Gap8: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 },
  gridGap8: { display: "grid", gap: 8 },
  flexGap8Mb12Wrap: { display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" },
  flexGap6Mb12: { display: "flex", gap: 6, marginBottom: 12 },
  rowBetweenGap10Mb8: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 8 },
  rowBetweenGap8Mb6: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 6 },
  wrapGap4: { display: "flex", flexWrap: "wrap", gap: 4 },
  wrapGap5: { display: "flex", flexWrap: "wrap", gap: 5 },

  panelToggle: { width: 44, height: 24, borderRadius: 12, cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 },
  panelToggleKnob: { position: "absolute", top: 2, width: 20, height: 20, borderRadius: "50%", background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "right 0.2s" },
  ltrLeft: { direction: "ltr", textAlign: "left" },
};
