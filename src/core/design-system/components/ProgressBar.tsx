import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GRADIENTS } from '../gradients';
import { TOKENS } from '../tokens';
import { useThemeColors } from '@/stores/theme.store';

export interface ProgressBarProps {
  /** Progress from 0 to 1 (values outside the range are clamped). */
  value: number;
  accessibilityLabel?: string;
  style?: ViewStyle;
}

/** Determinate progress bar (uploads). Brand-gradient fill over a theme-aware track. */
export function ProgressBar({ value, accessibilityLabel, style }: ProgressBarProps) {
  const tc = useThemeColors();
  const clamped = Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
      style={[styles.track, { backgroundColor: tc.border }, style]}
    >
      <LinearGradient
        colors={GRADIENTS.brand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.fill, { width: `${clamped * 100}%` }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 8, borderRadius: TOKENS.radius.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: TOKENS.radius.pill },
});
