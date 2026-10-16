// /theme/tokens.ts
// Identidad "Señal Nocturna" — el bordo se enciende en rosa señal.
// Todo derivado de BRAND.colors (sin literales).
import { BRAND } from './brand/brand';
import { withAlpha } from './color';

const C = BRAND.colors;

export const TOKENS = {
  color: {
    primary: C.primary,       // bordo (ancla, fijo en ambos temas)
    primaryDark: C.primaryDark,
    primaryMid: C.primaryMid,
    signal: C.signal,         // acento "señal", solo en gradiente con primary
    mint: C.mint,             // verificado / completado / en vivo
    mintDeep: C.mintDeep,     // fin de la rampa de éxito (gradiente mint → mintDeep)
    /** @deprecated use useThemeColors() (tc.bg / tc.text / tc.textSub) */
    bg: C.legacy.bg,
    /** @deprecated use useThemeColors() (tc.bg / tc.text / tc.textSub) */
    text: C.legacy.text,
    /** @deprecated use useThemeColors() (tc.bg / tc.text / tc.textSub) */
    sub: C.legacy.sub,
    error: C.error,
    warning: C.warning,
    info: C.info,
    /** Star ratings (filled star / score). */
    rating: C.rating,
    success: C.mint,
    /** Text/icon color on top of the brand gradient (theme-independent). */
    onPrimary: C.white,
    /** Secondary text/icons on the brand gradient (timestamps, delivery ticks) and its hairline/outline. */
    onPrimarySub: withAlpha(C.white, 0.7),
    onPrimaryDim: withAlpha(C.white, 0.35),
    /** Base color of drop shadows (theme-independent). */
    shadow: C.black,
  },
  /** Base colors for the Android blur fallback (tint → translucent fill). */
  blurTint: { dark: C.black, light: C.white },
  /** Fixed colors for text/icons over video/images (theme-independent). */
  onMedia: {
    text: C.white,
    textSub: withAlpha(C.white, 0.75),
    textMuted: withAlpha(C.white, 0.65),
    /** Base canvas behind video/images (reels feed, media thumbnails, lightbox). */
    canvas: C.black,
    icon: C.white,
    /** Solid light fill (pills / bubbles over media). */
    solid: C.white,
    /** Translucent light fills (glass chips, icon wells, decorative bubbles) and their hairline border. */
    fillFaint: withAlpha(C.white, 0.08),
    fill: withAlpha(C.white, 0.16),
    fillStrong: withAlpha(C.white, 0.3),
    border: withAlpha(C.white, 0.24),
  },
  /** Black scrims over media. Alpha-only variants of the same base. */
  scrim: {
    light: withAlpha(C.black, 0.35),
    medium: withAlpha(C.black, 0.55),
    strong: withAlpha(C.black, 0.75),
    /** Near-opaque backdrop for full-screen media viewers. */
    heavy: withAlpha(C.black, 0.95),
  },
  // Colores semánticos de ciclo de vida (órdenes, KYC) — fg + bg translúcido a juego.
  status: {
    pending:   { fg: C.warning, bg: withAlpha(C.warning, 0.14) },
    accepted:  { fg: C.info,    bg: withAlpha(C.info, 0.14) },
    progress:  { fg: C.progress, bg: withAlpha(C.progress, 0.14) },
    done:      { fg: C.mint,    bg: withAlpha(C.mint, 0.14) },
    cancelled: { fg: C.error,   bg: withAlpha(C.error, 0.14) },
  },
  radius: { sm: 12, md: 16, lg: 22, xl: 26, pill: 999 },
  shadow: {
    soft: { shadowColor: C.black, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 },
    card: {
      shadowColor: C.black,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08,
      shadowRadius: 24,
      elevation: 4,
    },
    // glow rosa, reemplaza la sombra negra genérica en botones/CTAs primarios
    glow: {
      shadowColor: C.signal,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 24,
      elevation: 6,
    },
    // Same glow as `glow`, as CSS boxShadow (Fabric). Android-safe for
    // translucent surfaces: an outset boxShadow is clipped under the element,
    // while `elevation` paints its shadow through glass backgrounds.
    glowBox: [
      { offsetX: 0, offsetY: 8, blurRadius: 24, color: withAlpha(C.signal, 0.4) },
    ],
    button: {
      shadowColor: C.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 12,
      elevation: 4,
    },
  },
  glass: { bg: withAlpha(C.white, 0.55) },
  text: { color: C.white, fontFamily: BRAND.fonts.heading },
};
