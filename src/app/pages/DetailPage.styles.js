import { C } from "../../shared/constants/colors.js";

export const DS = {
  loadingShell: DC => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: DC.bg
  }),
  loadingInner: DC => ({
    textAlign: 'center',
    color: DC.text3,
    padding: '0 24px'
  }),
  icon48Mb12: {
    fontSize: 48,
    marginBottom: 12
  },
  errorTitle: DC => ({
    fontSize: 16,
    fontWeight: 800,
    color: DC.text,
    marginBottom: 8
  }),
  errorText: {
    fontSize: 13,
    marginBottom: 20
  },
  homeButton: {
    padding: '10px 24px',
    background: '#1A4A2E',
    color: 'white',
    border: 'none',
    borderRadius: 12,
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'Tajawal,sans-serif'
  },
  loadingIcon: {
    fontSize: 32,
    marginBottom: 12
  },
  loadingText: {
    fontSize: 14
  },
  pageShell: DC => ({
    maxWidth: 430,
    margin: '0 auto',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: DC.bg,
    fontFamily: 'Tajawal,sans-serif',
    direction: 'rtl'
  }),
  scrollContent: {
    flex: 1,
    overflowY: 'auto',
    paddingBottom: 'calc(170px + env(safe-area-inset-bottom))'
  },
  heroShell: {
    position: 'relative',
    height: 360,
    background: '#111',
    overflow: 'hidden',
    flexShrink: 0
  },
  heroFallback: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    fontSize: 64,
    background: 'linear-gradient(135deg,#1A4A2E,#2D6B45)'
  },
  heroTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: '44px 14px 12px',
    background: 'linear-gradient(to bottom,rgba(0,0,0,0.6) 0%,transparent 100%)',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    zIndex: 10
  },
  heroBackButton: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: 'rgba(0,0,0,0.35)',
    border: 'none',
    color: 'white',
    fontSize: 20,
    cursor: 'pointer',
    flexShrink: 0,
    backdropFilter: 'blur(4px)'
  },
  heroMeta: {
    flex: 1,
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 1.4,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    textShadow: '0 1px 3px rgba(0,0,0,0.8)'
  },
  sellerButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: 'rgba(0,0,0,0.35)',
    border: 'none',
    borderRadius: 20,
    padding: '5px 10px',
    cursor: 'pointer',
    backdropFilter: 'blur(4px)',
    flexShrink: 0
  },
  sellerAvatar: {
    width: 26,
    height: 26,
    borderRadius: '50%',
    background: '#E8B84B',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    fontWeight: 800,
    color: '#1A4A2E'
  },
  sellerName: {
    fontSize: 10,
    fontWeight: 800,
    color: 'white',
    textShadow: '0 1px 2px rgba(0,0,0,0.8)'
  },
  sellerLink: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.75)'
  },
  heroLeftActions: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    display: 'flex',
    gap: 8,
    zIndex: 10
  },
  heroCircleAction: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: 'rgba(0,0,0,0.45)',
    border: 'none',
    fontSize: 18,
    cursor: 'pointer',
    backdropFilter: 'blur(4px)'
  },
  shareButton: {
    height: 34,
    padding: '0 12px',
    borderRadius: 20,
    background: 'rgba(0,0,0,0.45)',
    border: 'none',
    color: 'white',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    backdropFilter: 'blur(4px)',
    fontFamily: 'Tajawal,sans-serif',
    display: 'flex',
    alignItems: 'center',
    gap: 5
  },
  heroPricePill: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    zIndex: 10,
    height: 34,
    padding: '0 12px',
    borderRadius: 20,
    background: 'rgba(0,0,0,0.45)',
    backdropFilter: 'blur(4px)',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: 6
  },
  heroPriceValue: {
    fontSize: 12,
    fontWeight: 900,
    color: 'white'
  },
  heroPriceCurrency: {
    fontSize: 12,
    fontWeight: 700,
    color: 'rgba(255,255,255,0.72)'
  },
  heroChipRow: {
    display: 'flex',
    gap: 8,
    marginTop: 10,
    flexWrap: 'wrap'
  },
  softChip: (color, bg) => ({
    fontSize: 11,
    fontWeight: 700,
    color,
    background: bg,
    borderRadius: 20,
    padding: '4px 10px'
  }),
  ratingCard: DC => ({
    background: DC.white,
    borderRadius: 12,
    padding: '12px 14px',
    marginTop: 10,
    border: '1px solid ' + DC.border
  }),
  sellerRatingButton: {
    marginTop: 10,
    width: '100%',
    padding: '9px',
    borderRadius: 10,
    border: '1px solid #FCD34D',
    background: '#FFFBEB',
    fontSize: 12,
    color: '#92400E',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit'
  },
  reportButton: hasReported => ({
    marginTop: 8,
    width: '100%',
    padding: '9px',
    borderRadius: 10,
    border: `1px solid ${hasReported ? '#D1D5DB' : '#FCA5A5'}`,
    background: hasReported ? '#F8FAFC' : '#FEF2F2',
    fontSize: 12,
    color: hasReported ? '#64748B' : '#EF4444',
    fontWeight: 700,
    cursor: hasReported ? 'default' : 'pointer',
    fontFamily: 'inherit'
  }),
  descWrap: {
    padding: '14px'
  },
  descCard: DC => ({
    background: DC.white,
    borderRadius: 12,
    padding: '16px',
    marginBottom: 10,
    border: '1px solid ' + DC.border,
    direction: 'rtl'
  }),
  descHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 10
  },
  descTitle: DC => ({
    fontSize: 22,
    fontWeight: 900,
    color: DC.text,
    textAlign: 'right',
    lineHeight: 1.4,
    flex: 1
  }),
  viewPill: DC => ({
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 12,
    color: DC.text3,
    background: DC.bg,
    borderRadius: 20,
    padding: '3px 10px',
    flexShrink: 0
  }),
  viewCount: {
    fontWeight: 600
  },
  descText: DC => ({
    fontSize: 18,
    color: DC.text2,
    lineHeight: 2,
    textAlign: 'right',
    direction: 'rtl',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word'
  }),
  mapShell: tab => ({
    position: 'relative',
    height: 'calc(100dvh - 190px)',
    display: tab === 'map' ? 'flex' : 'none',
    flexDirection: 'column',
    overflow: 'hidden'
  }),
  poiBarWrap: {
    position: 'absolute',
    top: 10,
    right: 10,
    left: 10,
    zIndex: 1001
  },
  poiBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    overflowX: 'auto',
    paddingBottom: 2,
    scrollbarWidth: 'none'
  },
  poiButton: (type, isActive, isLoading) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: '6px 10px',
    borderRadius: 999,
    border: '1.5px solid',
    borderColor: isActive ? type.color : '#D9E2EC',
    background: isActive ? type.color : 'rgba(255,255,255,0.96)',
    color: isActive ? 'white' : '#334155',
    fontSize: 11,
    fontWeight: 800,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.15s',
    boxShadow: '0 2px 10px rgba(0,0,0,0.10)',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    opacity: isLoading ? 0.7 : 1
  }),
  poiCount: isActive => ({
    background: isActive ? 'rgba(255,255,255,0.22)' : '#EEF2F7',
    color: isActive ? 'white' : '#475569',
    borderRadius: 999,
    padding: '0 5px',
    fontSize: 10,
    lineHeight: '16px',
    minWidth: 16,
    textAlign: 'center'
  }),
  poiClear: {
    padding: '6px 10px',
    borderRadius: 999,
    border: '1.5px solid #FCA5A5',
    background: 'rgba(255,255,255,0.96)',
    color: '#DC2626',
    fontSize: 11,
    fontWeight: 800,
    cursor: 'pointer',
    fontFamily: 'inherit',
    boxShadow: '0 2px 10px rgba(0,0,0,0.10)',
    whiteSpace: 'nowrap',
    flexShrink: 0
  },
  mapCanvas: {
    flex: 1,
    width: '100%'
  },
  mapInfoCard: DC => ({
    position: 'absolute',
    bottom: 16,
    right: 14,
    left: 14,
    background: DC.white,
    borderRadius: 14,
    padding: '10px 14px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
    zIndex: 1000
  }),
  centerBetween: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  mapInfoTitle: DC => ({
    fontSize: 13,
    fontWeight: 800,
    color: DC.text
  }),
  mapInfoLocation: DC => ({
    fontSize: 11,
    color: DC.text3,
    marginTop: 2
  }),
  mapAccuracyChip: approx => ({
    fontSize: 10,
    fontWeight: 800,
    borderRadius: 999,
    padding: '3px 8px',
    background: approx ? '#FEF3C7' : '#E8F4F0',
    color: approx ? '#B45309' : C.primary,
    border: `1px solid ${approx ? '#F59E0B' : '#B7E4D3'}`
  }),
  mapPriceWrap: {
    textAlign: 'center'
  },
  mapPrice: {
    fontSize: 16,
    fontWeight: 900,
    color: C.primary
  },
  mapCurrency: DC => ({
    fontSize: 10,
    color: DC.text3
  }),
  footerBar: DC => ({
    position: 'fixed',
    bottom: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '100%',
    maxWidth: 430,
    padding: '10px 14px calc(20px + env(safe-area-inset-bottom))',
    background: DC.white,
    borderTop: '1px solid ' + DC.border,
    zIndex: 3000
  }),
  footerDots: {
    display: 'flex',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 8
  },
  footerDot: (active, color) => ({
    width: 28,
    height: 4,
    borderRadius: 2,
    background: color ?? active,
    cursor: 'pointer',
    transition: 'background 0.2s',
    opacity: color ? undefined : 1
  }),
  actionsRow: {
    display: 'flex',
    gap: 6
  },
  chatButton: {
    flex: 2,
    padding: 13,
    borderRadius: 12,
    border: 'none',
    background: C.primary,
    color: 'white',
    fontSize: 13,
    fontWeight: 800,
    cursor: 'pointer',
    fontFamily: 'inherit',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4
  },
  messengerButton: {
    flex: 1,
    padding: 13,
    borderRadius: 12,
    border: 'none',
    background: '#1877F2',
    color: 'white',
    fontSize: 13,
    fontWeight: 800,
    cursor: 'pointer',
    fontFamily: 'inherit',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1
  },
  phoneButton: DC => ({
    flex: 1,
    padding: 13,
    borderRadius: 12,
    border: '1.5px solid ' + C.primary,
    background: DC.white,
    color: C.primary,
    fontSize: 13,
    fontWeight: 800,
    cursor: 'pointer',
    fontFamily: 'inherit',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1
  }),
  whatsappButton: {
    flex: 1,
    padding: 13,
    borderRadius: 12,
    border: 'none',
    background: '#25D366',
    color: 'white',
    fontSize: 13,
    fontWeight: 800,
    cursor: 'pointer',
    fontFamily: 'inherit',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1
  },
  phoneLabel: {
    fontSize: 9,
    fontWeight: 600,
    direction: 'ltr',
    letterSpacing: 0
  },
  switchButton: DC => ({
    width: 38,
    padding: 0,
    borderRadius: 12,
    border: '1.5px solid ' + DC.border,
    background: DC.bg,
    color: DC.text,
    fontSize: 16,
    fontWeight: 800,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  })
};

export function getDetailStyles(DC) {
  return {
    s1: {
      fontSize: 12,
      fontWeight: 700,
      color: "rgba(255,255,255,0.75)"
    },
    s2: DC => ({
      display: "flex",
      borderBottom: "2px solid " + DC.border,
      background: DC.white,
      position: "sticky",
      top: 0,
      zIndex: 20
    }),
    s3: isOffline => ({
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "9px 14px",
      background: isOffline ? "#FFF7ED" : "#EFF6FF",
      borderBottom: "1px solid " + (isOffline ? "#FED7AA" : "#BFDBFE"),
      fontSize: 12,
      fontFamily: "Tajawal,sans-serif",
      direction: "rtl"
    }),
    s4: {
      fontSize: 15
    },
    s5: isOffline => ({
      color: isOffline ? "#92400E" : "#1E40AF",
      fontWeight: 700
    }),
    s6: {
      padding: "12px 14px"
    },
    s7: DC => ({
      background: DC.white,
      borderRadius: 12,
      overflow: "hidden",
      border: "1px solid " + DC.border
    }),
    s8: {
      display: "flex",
      gap: 6,
      marginTop: 6,
      flexWrap: "wrap"
    }
  };
    }
