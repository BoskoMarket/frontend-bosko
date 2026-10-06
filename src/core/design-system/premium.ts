// Paleta "Premium" (dorado) — badges/CTAs/paneles de plan premium y proveedor
// (PremiumButton, PremiumBanner, ProviderCTA, EditProfileModal, ServiceDetailModal…).
// Sigue el tema como el resto de la UI: `PREMIUM_PALETTE.dark / .light`, consumida
// con `usePremiumColors()` (mismo patrón que `useThemeColors()`).
// - `gold`: dorado para texto/íconos, theme-aware (en light es un dorado oscuro con
//   contraste >= 4.5:1 sobre los fondos claros).
// - `goldFill` / `goldFillEnd` / `onGold`: relleno dorado (botones/gradientes) y su tinta;
//   iguales en ambos temas.
// - `primary` / `primaryDark`: los del brand (los valores casi idénticos heredados de Colors.ts eran un typo).
// Todo derivado de BRAND.colors.
import { BRAND } from './brand/brand';
import { withAlpha } from './color';

const C = BRAND.colors;
const P = C.premium;

export const PREMIUM_PALETTE = {
  dark: {
    primary: C.primary,
    primaryDark: C.primaryDark,
    background: P.dark.background,
    card: P.dark.card,
    cardEnd: P.dark.cardEnd,
    panel: P.dark.panel,
    panelEnd: P.dark.panelEnd,
    gold: P.dark.goldText,
    goldLight: withAlpha(P.dark.goldText, 0.1),
    goldBorder: withAlpha(P.dark.goldText, 0.2),
    goldFill: P.gold,
    goldFillEnd: P.goldDeep,
    onGold: P.onGold,
    textPrimary: C.white,
    textSecondary: withAlpha(C.white, 0.7),
    textTertiary: withAlpha(C.white, 0.4),
    borderSubtle: withAlpha(C.white, 0.1),
    inputBackground: withAlpha(C.white, 0.05),
    surfaceSubtle: withAlpha(C.white, 0.03),
    footerBackground: withAlpha(C.black, 0.2),
  },
  light: {
    primary: C.primary,
    primaryDark: C.primaryDark,
    background: P.light.background,
    card: P.light.card,
    cardEnd: P.light.cardEnd,
    panel: P.light.panel,
    panelEnd: P.light.panelEnd,
    gold: P.light.goldText,
    goldLight: withAlpha(P.light.goldText, 0.1),
    goldBorder: withAlpha(P.light.goldText, 0.3),
    goldFill: P.gold,
    goldFillEnd: P.goldDeep,
    onGold: P.onGold,
    textPrimary: C.light.text,
    textSecondary: withAlpha(C.light.text, 0.7),
    textTertiary: withAlpha(C.light.text, 0.45),
    borderSubtle: withAlpha(C.light.ink, 0.1),
    inputBackground: withAlpha(C.light.ink, 0.04),
    surfaceSubtle: withAlpha(C.light.ink, 0.03),
    footerBackground: withAlpha(C.light.ink, 0.04),
  },
};

// Widened to string values so dark and light palettes are interchangeable.
export type PremiumColors = { [K in keyof typeof PREMIUM_PALETTE.dark]: string };

// Sombras: independientes del tema (negro / dorado / bordo).
export const PREMIUM_SHADOWS = {
  small: {
    shadowColor: C.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 2,
  },
  medium: {
    shadowColor: C.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
  },
  large: {
    shadowColor: C.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 20,
  },
  gold: {
    shadowColor: P.gold,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 16,
  },
  brand: {
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  global: {
    shadowColor: C.black,
    shadowOffset: { width: 6, height: 2 },
    shadowOpacity: 0.7,
    shadowRadius: 5,
    elevation: 15,
  },
};
