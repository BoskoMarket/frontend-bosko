import React from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { TOKENS } from '../tokens';
import { SPACING } from '../spacing';
import { GRADIENTS } from '../gradients';
import { Text } from './Text';
import { useThemeColors } from '@/stores/theme.store';

export interface ChipProps {
  label: string;
  selected?: boolean;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}

/** Filter / category chip. Selected = brand gradient + `onPrimary` text; idle = glass surface + border. */
export function Chip({ label, selected = false, icon, onPress, disabled, style }: ChipProps) {
  const tc = useThemeColors();
  const fg = selected ? TOKENS.color.onPrimary : tc.text;

  const content = (
    <>
      {icon ? <Ionicons name={icon} size={14} color={fg} /> : null}
      <Text variant="label" color={fg}>{label}</Text>
    </>
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled: !!disabled }}
      accessibilityLabel={label}
      style={[styles.base, !selected && { backgroundColor: tc.surface2, borderColor: tc.border }, disabled && styles.disabled, style]}
    >
      {selected ? (
        <LinearGradient colors={GRADIENTS.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.inner}>
          {content}
        </LinearGradient>
      ) : (
        <View style={styles.inner}>{content}</View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: TOKENS.radius.pill, overflow: 'hidden', alignSelf: 'flex-start', borderWidth: 1, borderColor: 'transparent' },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs + 2,
    paddingHorizontal: SPACING.md + 2,
    paddingVertical: SPACING.sm,
  },
  disabled: { opacity: 0.5 },
});
