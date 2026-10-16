// Paleta "Premium" (dorado sobre fondo oscuro) — usada en badges/CTAs de plan
// premium (PremiumButton, PremiumBanner, ProviderCTA, ProfesionalCard, etc).
// Es un tratamiento visual deliberadamente distinto del tema claro/oscuro
// principal (PALETTE), no un duplicado a fusionar — vive siempre en dark.
// Valores 1:1 con el legacy `Colors.ts`; ahora derivados de BRAND.colors.
import { BRAND } from './brand/brand';
import { withAlpha } from './color';

const C = BRAND.colors;
const P = C.premium;

export const PREMIUM = {
  colorPrimary: P.primary,
  colorPrimaryDark: P.primaryDark,
  white: C.white,
  background: P.background,
  card: P.card,
  gold: P.gold,
  goldLight: withAlpha(P.gold, 0.1),
  goldBorder: withAlpha(P.gold, 0.2),
  textPrimary: C.white,
  textSecondary: withAlpha(C.white, 0.7),
  textTertiary: withAlpha(C.white, 0.4),
  borderSubtle: withAlpha(C.white, 0.1),
  inputBackground: withAlpha(C.white, 0.05),
  shadows: {
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
    global: {
      shadowColor: C.black,
      shadowOffset: { width: 6, height: 2 },
      shadowOpacity: 0.7,
      shadowRadius: 5,
      elevation: 15,
    },
  },
};
