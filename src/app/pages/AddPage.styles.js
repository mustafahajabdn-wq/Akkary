import { C } from "../../shared/constants/colors.js";
export const AP = {
  facingGrid: {
    display: "inline-grid",
    gridTemplateColumns: "repeat(3,1fr)",
    gap: 5,
    direction: "ltr"
  },
  facingCenterCell: {
    width: 54,
    height: 54,
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  facingArrowMuted: {
    fontSize: 18,
    color: "#94A3B8"
  },
  facingDirectionBtn: active => ({
    width: 54,
    height: 54,
    borderRadius: 10,
    cursor: "pointer",
    fontFamily: "inherit",
    border: "1.5px solid " + (active ? C.primary : "#E2E8F0"),
    background: active ? C.primary : "white",
    color: active ? "white" : "#0F172A",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 1
  }),
  facingDirectionIcon: {
    fontSize: 16,
    lineHeight: 1
  },
  facingDirectionLabel: {
    fontSize: 9,
    fontWeight: 700,
    lineHeight: 1.2
  },
  selectedFacingWrap: {
    marginTop: 6,
    display: "flex",
    flexWrap: "wrap",
    gap: 4
  },
  selectedFacingTag: {
    background: C.primary + "15",
    color: C.primary,
    borderRadius: 14,
    padding: "3px 8px",
    fontSize: 11,
    fontWeight: 700
  },
  selectedFacingRemove: {
    cursor: "pointer",
    marginRight: 2
  },
  lightRow: {
    display: "flex",
    gap: 6,
    alignItems: "center"
  },
  lightButton: active => ({
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 2,
    fontSize: 24,
    filter: active ? "none" : "grayscale(1) opacity(0.3)",
    transform: active ? "scale(1.1)" : "scale(1)"
  }),
  lightLabel: {
    fontSize: 11,
    color: "#94A3B8",
    marginRight: 4
  },
  mapOpenButton: {
    width: "100%",
    padding: "16px",
    borderRadius: 12,
    border: "2px dashed #CBD5E1",
    background: "white",
    cursor: "pointer",
    fontFamily: "inherit",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10
  },
  mapOpenTitle: {
    fontSize: 14,
    fontWeight: 800,
    color: "#0F172A"
  },
  mapOpenHint: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 2
  },
  mapOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    display: "flex",
    flexDirection: "column",
    background: "#fff",
    fontFamily: "Tajawal,sans-serif",
    direction: "rtl"
  },
  mapHeader: {
    background: C.primary,
    padding: "14px 16px",
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexShrink: 0
  },
  mapBackButton: {
    width: 34,
    height: 34,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.15)",
    border: "none",
    color: "white",
    fontSize: 18,
    cursor: "pointer"
  },
  mapHeaderTitle: {
    fontSize: 16,
    fontWeight: 800,
    color: "white",
    flex: 1
  },
  mapGpsButton: {
    padding: "6px 12px",
    borderRadius: 8,
    background: "rgba(255,255,255,0.15)",
    border: "none",
    color: "white",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 700,
    fontFamily: "inherit"
  },
  mapCanvasWrap: {
    flex: 1,
    position: "relative",
    overflow: "hidden"
  },
  mapCanvas: {
    width: "100%",
    height: "100%"
  },
  mapFooter: {
    padding: "12px 16px",
    borderTop: "1px solid #E5E7EB",
    flexShrink: 0
  },
  mapConfirmButton: enabled => ({
    width: "100%",
    padding: "13px",
    borderRadius: 12,
    background: enabled ? C.primary : "#9CA3AF",
    color: "white",
    border: "none",
    fontSize: 14,
    fontWeight: 800,
    fontFamily: "inherit",
    cursor: enabled ? "pointer" : "not-allowed"
  }),
  sectionWrap: headerColor => ({
    borderRadius: 12,
    border: `1px solid ${headerColor ? headerColor + "33" : C.border}`,
    marginBottom: 4
  }),
  sectionHeader: (open, bg) => ({
    width: "100%",
    padding: "12px 14px",
    background: bg,
    border: "none",
    cursor: "pointer",
    fontFamily: "inherit",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: open ? "12px 12px 0 0" : 12
  }),
  sectionHeaderRow: {
    display: "flex",
    alignItems: "center",
    gap: 8
  },
  sectionHeaderTitle: isColored => ({
    fontSize: 12,
    fontWeight: 800,
    color: isColored ? "white" : "#1A1A1A",
    letterSpacing: 0.3
  }),
  sectionHeaderArrow: isColored => ({
    fontSize: 10,
    color: isColored ? "rgba(255,255,255,0.7)" : "#A0A0A0"
  }),
  sectionBody: {
    padding: "10px 14px 14px",
    background: "#fff"
  },
  checkboxRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 0",
    cursor: "pointer"
  },
  checkboxInput: {
    width: 20,
    height: 20,
    accentColor: C.primary
  },
  fieldToggleGrid: count => ({
    display: "grid",
    gridTemplateColumns: `repeat(${count},1fr)`,
    gap: 8,
    marginBottom: 14
  }),
  fieldToggleLabel: (active, color) => ({
    fontSize: 13,
    fontWeight: 800,
    color: active ? "white" : color
  }),
  textareaWrap: {
    position: "relative"
  },
  suffix: {
    position: "absolute",
    left: 12,
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: 12,
    color: "#94A3B8",
    pointerEvents: "none"
  },
  pageRoot: {
    maxWidth: 430,
    margin: "0 auto",
    minHeight: "100vh",
    background: C.bg,
    fontFamily: "Tajawal,sans-serif",
    direction: "rtl",
    display: "flex",
    flexDirection: "column",
    position: "relative",
    paddingBottom: 120
  },
  heroTopRow: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  },
  heroBackButton: {
    width: 34,
    height: 34,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.2)",
    border: "none",
    color: "white",
    fontSize: 18,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "inherit",
    flexShrink: 0
  },
  heroSpacer: {
    width: 34,
    height: 34,
    flexShrink: 0
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: 900,
    color: "white"
  },
  heroMetaRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4
  },
  heroMetaText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)"
  },
  clearDraftButton: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
    background: "rgba(255,255,255,0.15)",
    border: "none",
    borderRadius: 8,
    padding: "3px 8px",
    cursor: "pointer",
    fontFamily: "inherit"
  },
  pageInner: {
    flex: 1,
    overflowY: "auto",
    padding: "16px 16px 120px"
  },
  formGrid: {
    display: "grid",
    gap: 0
  },
  typeGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
    marginBottom: 14
  },
  typeLabel: (active, color = C.text2) => ({
    fontSize: 13,
    fontWeight: 800,
    color: active ? "white" : color
  }),
  categoryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3,1fr)",
    gap: 6,
    marginBottom: 14
  },
  categoryLabel: (active, color = C.primary) => ({
    fontSize: 11,
    fontWeight: 700,
    color: active ? "white" : color
  }),
  fieldsGrid: {
    display: "grid",
    gap: 10,
    gridTemplateColumns: "1fr 1fr"
  },
  fieldColumn: field => ({
    gridColumn: field.ui?.width === "half" ? "span 1" : "span 2",
    display: "flex",
    flexDirection: "column",
    justifyContent: field.ui?.valign === "bottom" ? "flex-end" : "flex-start"
  }),
  uploadCount: {
    color: C.text2,
    fontSize: 14
  },
  videoRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  },
  videoName: {
    fontSize: 13,
    color: C.primary,
    fontWeight: 700
  },
  videoRemove: {
    background: "none",
    border: "none",
    color: "#DC2626",
    cursor: "pointer",
    fontSize: 16
  },
  errorBox: {
    background: "#FEE2E2",
    color: "#991B1B",
    border: "1px solid #FCA5A5",
    borderRadius: 14,
    padding: "12px 14px"
  },
  successBox: {
    background: "#DCFCE7",
    color: "#166534",
    border: "1px solid #86EFAC",
    borderRadius: 14,
    padding: "12px 14px",
    fontWeight: 800,
    lineHeight: 1.7
  },
  uploadProgressWrap: {
    position: "fixed",
    left: 0,
    right: 0,
    zIndex: 1001,
    pointerEvents: "none",
    bottom: "calc(80px + env(safe-area-inset-bottom))",
    padding: "0 0 6px"
  },
  uploadProgressTrack: {
    height: 4,
    background: "#E2E8F0"
  },
  stickyFooterWrap: {
    position: "fixed",
    bottom: 0,
    left: "50%",
    transform: "translateX(-50%)",
    width: "100%",
    maxWidth: 430,
    background: C.white,
    borderTop: `1px solid ${C.border}`,
    padding: "12px 16px 32px",
    zIndex: 200,
    boxSizing: "border-box"
  }
};
