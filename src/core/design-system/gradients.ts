import { TOKENS } from './tokens';
import { withAlpha } from './color';

// El único gradiente de marca ahora es la rampa "señal": rosa → bordo (→ profundo).
// Se usa en CTAs primarios, hero, burbuja activa del tab bar, burbuja propia del chat.
export const GRADIENTS = {
  // 2-stop — botones, chips activos, burbuja de tab
  brand: [TOKENS.color.signal, TOKENS.color.primary] as const,

  // Éxito — verificado / pago OK
  success: [TOKENS.color.mint, TOKENS.color.mintDeep] as const,

  // 3-stop — hero, splash, banners grandes
  brandDeep: [TOKENS.color.signal, TOKENS.color.primary, TOKENS.color.primaryDark] as const,

  // Overlays sobre imagen/video (reels, hero) — derivados de TOKENS.scrim
  overlayFadeDown: ['transparent', TOKENS.scrim.strong] as const,
  overlayFadeUp: [TOKENS.scrim.light, 'transparent'] as const,

  // Resplandor señal que se desvanece (usar con locations [0, 0.55, 1]) — backdrop de auth/splash/onboarding
  glow: [withAlpha(TOKENS.color.signal, 0.24), withAlpha(TOKENS.color.signal, 0.1), withAlpha(TOKENS.color.signal, 0)] as const,
  glowFaint: [withAlpha(TOKENS.color.signal, 0.16), withAlpha(TOKENS.color.signal, 0.07), withAlpha(TOKENS.color.signal, 0)] as const,

  // Fondo de auth/onboarding: bg → tinte vino → bg. Theme-aware (pasar `tc` o `PALETTE.dark`).
  backdrop: (tc: { bg: string; bgWine: string }) => [tc.bg, tc.bgWine, tc.bg] as const,
} as const;

export function wash(tc: { bg: string; surface2: string }): readonly [string, string, string] {
  return [tc.bg, tc.surface2, tc.bg] as const;
}
