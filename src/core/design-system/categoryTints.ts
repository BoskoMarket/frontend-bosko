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

/** Tint for a list position; cycles through the six tints. */
export function getCategoryTint(index: number, isDark: boolean): CategoryTint {
  const list = isDark ? T.dark : T.light;
  const i = ((Math.trunc(index) % list.length) + list.length) % list.length;
  const t = list[i];
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

export function useCategoryTint(index: number): CategoryTint {
  return getCategoryTint(index, useIsDark());
}
