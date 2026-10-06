import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TOKENS } from '../tokens';
import { SPACING } from '../spacing';
import { useThemeColors } from '@/stores/theme.store';

export interface BackButtonProps {
  onPress: () => void;
  style?: ViewStyle;
}

/** Glass square "chevron-back" button used on top of auth flow screens. */
export function BackButton({ onPress, style }: BackButtonProps) {
  const tc = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel="Volver"
      style={[styles.btn, { backgroundColor: tc.surface2, borderColor: tc.border }, style]}
    >
      <Ionicons name="chevron-back" size={22} color={tc.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    alignSelf: 'flex-start',
    padding: SPACING.sm,
    borderRadius: TOKENS.radius.sm,
    borderWidth: 1,
  },
});
