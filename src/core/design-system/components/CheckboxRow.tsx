import React from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TOKENS } from '../tokens';
import { SPACING } from '../spacing';
import { Text } from './Text';
import { useThemeColors } from '@/stores/theme.store';

export interface CheckboxRowProps {
  checked: boolean;
  onToggle: (next: boolean) => void;
  /** Row content. A string is rendered as body text; a node (e.g. text with a link) is rendered as is. */
  children: React.ReactNode;
  /** Field-level error shown under the row. */
  error?: string;
  disabled?: boolean;
  /** Screen-reader label; defaults to the text when `children` is a string. */
  accessibilityLabel?: string;
  style?: ViewStyle;
}

/** Checkbox + label row (consent, terms). Only the box toggles, so links inside the label stay tappable. */
export function CheckboxRow({ checked, onToggle, children, error, disabled, accessibilityLabel, style }: CheckboxRowProps) {
  const tc = useThemeColors();
  const label = accessibilityLabel ?? (typeof children === 'string' ? children : undefined);

  return (
    <View style={style}>
      <View style={styles.row}>
        <Pressable
          onPress={() => onToggle(!checked)}
          disabled={disabled}
          hitSlop={8}
          accessibilityRole="checkbox"
          accessibilityLabel={label}
          accessibilityState={{ checked, disabled: !!disabled }}
          style={[
            styles.box,
            { borderColor: error ? TOKENS.color.error : checked ? TOKENS.color.signal : tc.border, backgroundColor: checked ? TOKENS.color.signal : 'transparent' },
            disabled && styles.disabled,
          ]}
        >
          {checked ? <Ionicons name="checkmark" size={16} color={TOKENS.color.onPrimary} /> : null}
        </Pressable>
        <View style={styles.label}>
          {typeof children === 'string' ? <Text variant="bodySmall" color={tc.text}>{children}</Text> : children}
        </View>
      </View>
      {error ? <Text variant="caption" color={TOKENS.color.error} style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md },
  box: { width: 22, height: 22, borderRadius: TOKENS.radius.sm / 2, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  label: { flex: 1 },
  error: { marginTop: SPACING.xs, marginLeft: 22 + SPACING.md },
  disabled: { opacity: 0.5 },
});
