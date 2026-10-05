import { TOKENS } from './tokens';

// El único gradiente de marca ahora es la rampa "señal": rosa → bordo (→ profundo).
// Se usa en CTAs primarios, hero, burbuja activa del tab bar, burbuja propia del chat.
export const GRADIENTS = {
  // 2-stop — botones, chips activos, burbuja de tab
  brand: [TOKENS.color.signal, TOKENS.color.primary] as const,

  // 3-stop — hero, splash, banners grandes
  brandDeep: [TOKENS.color.signal, TOKENS.color.primary, TOKENS.color.primaryDark] as const,

  // Overlays sobre imagen/video (reels, hero) — derivados de TOKENS.scrim
  overlayFadeDown: ['transparent', TOKENS.scrim.strong] as const,
  overlayFadeUp: [TOKENS.scrim.light, 'transparent'] as const,
} as const;

export function wash(tc: { bg: string; surface2: string }): readonly [string, string, string] {
  return [tc.bg, tc.surface2, tc.bg] as const;
}
