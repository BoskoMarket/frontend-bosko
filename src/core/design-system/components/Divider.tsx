import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { SPACING, SpacingKey } from '../spacing';
import { useThemeColors } from '@/stores/theme.store';

export interface DividerProps {
  /** Vertical line (default: horizontal). */
  vertical?: boolean;
  /** Margin around the line, from the SPACING scale. */
  spacing?: SpacingKey;
  style?: ViewStyle;
}

/** Hairline separator in `tc.divider`. Replaces hand-rolled `height: 1` views. */
export function Divider({ vertical = false, spacing, style }: DividerProps) {
  const tc = useThemeColors();
  const margin = spacing ? SPACING[spacing] : 0;
  return (
    <View
      style={[
        vertical
          ? { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', marginHorizontal: margin }
          : { height: StyleSheet.hairlineWidth, alignSelf: 'stretch', marginVertical: margin },
        { backgroundColor: tc.divider },
        style,
      ]}
    />
  );
}
