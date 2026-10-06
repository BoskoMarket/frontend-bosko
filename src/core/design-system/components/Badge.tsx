import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TOKENS } from '../tokens';
import { SPACING } from '../spacing';
import { Text } from './Text';
import { useThemeColors } from '@/stores/theme.store';

/** Lifecycle statuses map 1:1 to `TOKENS.status`; `brand` / `neutral` are non-lifecycle tones. */
export type BadgeTone = keyof typeof TOKENS.status | 'brand' | 'neutral';

export interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

/** Status pill: translucent bg + matching fg (order/KYC status, counters, "Verificado"). */
export function Badge({ label, tone = 'neutral', icon, size = 'md', style }: BadgeProps) {
  const tc = useThemeColors();
  const palette =
    tone === 'brand'
      ? { fg: TOKENS.color.signal, bg: tc.accent }
      : tone === 'neutral'
        ? { fg: tc.textSub, bg: tc.surface2 }
        : TOKENS.status[tone];
  const isSmall = size === 'sm';

  return (
    <View
      accessible
      accessibilityLabel={label}
      style={[styles.base, isSmall ? styles.sm : styles.md, { backgroundColor: palette.bg }, style]}
    >
      {icon ? <Ionicons name={icon} size={isSmall ? 11 : 13} color={palette.fg} /> : null}
      <Text variant={isSmall ? 'meta' : 'caption'} color={palette.fg} weight="700">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', borderRadius: TOKENS.radius.pill, gap: SPACING.xs },
  sm: { paddingHorizontal: SPACING.sm, paddingVertical: 2 },
  md: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs + 1 },
});
