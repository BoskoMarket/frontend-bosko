// Superficie única del design system — import { TOKENS, SPACING, ... } from '@/core/design-system'
export { BRAND } from './brand/brand';
export { FONT_ASSETS } from './brand/fonts';
export { withAlpha } from './color';
export { TOKENS } from './tokens';
export { PREMIUM_PALETTE, PREMIUM_SHADOWS } from './premium';
export type { PremiumColors } from './premium';
export { PALETTE } from './palette';
export type { PaletteColors } from './palette';
export { SPACING } from './spacing';
export type { SpacingKey } from './spacing';
export { TYPE_SCALE, FONT_FAMILY } from './typography';
export { GRADIENTS, wash } from './gradients';
export { MOTION } from './motion';

export { useThemeColors, useIsDark, useToggleTheme, useThemeMode, usePremiumColors, THEME_COLORS } from '@/stores/theme.store';
export type { ThemeColors, ThemeMode } from '@/stores/theme.store';

export * from './components';
