import React from 'react';
import { ActivityIndicator, StyleSheet, View, ViewStyle } from 'react-native';
import { SPACING } from '../spacing';
import { TOKENS } from '../tokens';
import { AuthBackdrop } from './AuthBackdrop';
import { Text } from './Text';
import { useThemeColors } from '@/stores/theme.store';

export interface ScreenLoaderProps {
  /** Short copy under the spinner. Also used as the accessibility label. */
  label?: string;
  /**
   * `backdrop` (default): AuthBackdrop surface, identical to the login/onboarding screens — use it
   * for transition frames between auth screens. `plain`: flat theme background — use it inside content screens.
   */
  variant?: 'backdrop' | 'plain';
  style?: ViewStyle;
}

/**
 * Full-screen themed loader for waits that block a whole screen (auth transitions, a detail
 * screen fetching its first data). Never a bare spinner on an unthemed background.
 */
export function ScreenLoader({ label, variant = 'backdrop', style }: ScreenLoaderProps) {
  const tc = useThemeColors();
  const body = (
    <View style={styles.center} accessible accessibilityRole="progressbar" accessibilityLabel={label ?? 'Cargando'}>
      <ActivityIndicator color={TOKENS.color.signal} size="large" />
      {label ? <Text variant="caption" color={tc.textSub}>{label}</Text> : null}
    </View>
  );

  if (variant === 'plain') {
    return <View style={[styles.fill, { backgroundColor: tc.bg }, style]}>{body}</View>;
  }
  return <AuthBackdrop style={style}>{body}</AuthBackdrop>;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.md },
});
