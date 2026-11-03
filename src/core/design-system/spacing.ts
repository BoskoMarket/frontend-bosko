export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  giant: 64,
} as const;

export type SpacingKey = keyof typeof SPACING;

/** Bottom space screens inside the tab navigator reserve so content clears the floating tab bar. */
export const TAB_BAR_CLEARANCE = 110;
