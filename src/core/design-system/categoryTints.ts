// Category tints for promo cards. Raw colors live in BRAND.colors.categoryTints;
// this derives the semantic roles a card needs and follows the theme.
import { BRAND } from './brand/brand';
import { withAlpha } from './color';
import { useIsDark } from '@/stores/theme.store';

const T = BRAND.colors.categoryTints;

export interface CategoryTint {
  /** Card surface. */
  bg: string;
  /** Primary text / icon. */
  text: string;
  /** Secondary text. */
  textSub: string;
  /** CTA pill fill. */
  ctaBg: string;
  /** Text/icon on the CTA pill. */
  ctaText: string;
  /** Translucent circle behind the icon / eyebrow pills. */
  iconBg: string;
}

export const CATEGORY_TINT_COUNT = T.light.length;

function buildTint(t: { bg: string; ink: string; cta: string }, isDark: boolean): CategoryTint {
  return {
    bg: t.bg,
    text: t.ink,
    textSub: withAlpha(t.ink, 0.7),
    ctaBg: t.cta,
    // CTA fill is the dark ink in light and the pastel in dark: its label is the card surface.
    ctaText: t.bg,
    iconBg: withAlpha(BRAND.colors.white, isDark ? 0.1 : 0.55),
  };
}

// Built once at module load; lookups just index into it.
const TINTS = {
  light: T.light.map((t) => buildTint(t, false)),
  dark: T.dark.map((t) => buildTint(t, true)),
};

/** Tint for a list position; cycles through the six tints. Non-finite index counts as 0. */
export function getCategoryTint(index: number, isDark: boolean): CategoryTint {
  const list = isDark ? TINTS.dark : TINTS.light;
  const n = Number.isFinite(index) ? Math.trunc(index) : 0;
  return list[((n % list.length) + list.length) % list.length];
}

export function useCategoryTint(index: number): CategoryTint {
  return getCategoryTint(index, useIsDark());
}
