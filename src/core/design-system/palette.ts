// Fuente única de la paleta dark/light — "Señal Nocturna".
// Todo derivado de BRAND.colors (sin literales): un rebrand edita brand/brand.ts.
import { BRAND } from './brand/brand';
import { withAlpha } from './color';

const C = BRAND.colors;

export const PALETTE = {
  dark: {
    // Fondos
    bg:           C.dark.bg,
    bgGlow:       withAlpha(C.signal, 0.18),
    bgGlowFade:   withAlpha(C.signal, 0),
    surface:      C.dark.surface,
    surface2:     withAlpha(C.white, 0.06),  // vidrio
    card:         withAlpha(C.white, 0.045), // vidrio + blur
    cardBorder:   withAlpha(C.white, 0.09),

    // Texto
    text:         C.dark.text,
    textSub:      withAlpha(C.dark.text, 0.55),
    textMuted:    withAlpha(C.dark.text, 0.30),

    // UI
    border:       withAlpha(C.white, 0.10),
    divider:      withAlpha(C.white, 0.06),
    overlay:      withAlpha(C.dark.overlayBase, 0.78),
    accent:       withAlpha(C.signal, 0.14),

    // Brand
    primary:      C.primary,
    primaryLight: C.signal,
    signal:       C.signal,
    mint:         C.mint,
  },
  light: {
    bg:           C.light.bg,
    bgGlow:       withAlpha(C.signal, 0.08),
    bgGlowFade:   withAlpha(C.signal, 0),
    surface:      C.light.surface,
    surface2:     C.light.surface2,
    card:         C.light.surface,
    cardBorder:   withAlpha(C.light.ink, 0.08),

    text:         C.light.text,
    textSub:      withAlpha(C.light.text, 0.55),
    textMuted:    withAlpha(C.light.text, 0.32),

    border:       withAlpha(C.light.ink, 0.10),
    divider:      withAlpha(C.light.ink, 0.06),
    overlay:      withAlpha(C.light.ink, 0.45),
    accent:       withAlpha(C.signal, 0.10),

    primary:      C.primary,
    primaryLight: C.signal,
    signal:       C.signal,
    mint:         C.mint,
  },
};

export type PaletteColors = typeof PALETTE.dark;
