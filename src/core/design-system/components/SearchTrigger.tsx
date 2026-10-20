import React from 'react';
import { Pressable, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TOKENS } from '../tokens';
import { SPACING } from '../spacing';
import { Text } from './Text';
import { useThemeColors } from '@/stores/theme.store';

export interface SearchTriggerProps {
  placeholder?: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

/** Standalone pill search bar. A pressable trigger (not an input): it opens the search screen. */
export function SearchTrigger({ placeholder = 'Buscar servicios', onPress, style }: SearchTriggerProps) {
  const tc = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="search"
      accessibilityLabel={placeholder}
      style={({ pressed }) => [
        styles.pill,
        TOKENS.shadow.soft,
        { backgroundColor: tc.surface, borderColor: tc.border },
        pressed && styles.pressed,
        style,
      ]}
    >
      <Ionicons name="search-outline" size={20} color={tc.textSub} />
      <Text variant="body" color={tc.textSub} numberOfLines={1} style={styles.label}>
        {placeholder}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    minHeight: 52,
    paddingHorizontal: SPACING.xl,
    borderRadius: TOKENS.radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  label: { flex: 1 },
  pressed: { opacity: 0.85 },
});
