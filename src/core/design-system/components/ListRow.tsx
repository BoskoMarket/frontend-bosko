import React from 'react';
import { View, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TOKENS } from '../tokens';
import { SPACING } from '../spacing';
import { Text } from './Text';
import { useThemeColors } from '@/stores/theme.store';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export interface ListRowProps {
  label: string;
  subtitle?: string;
  /** Leading icon inside a rounded tinted tile. */
  icon?: IconName;
  /** Replaces the trailing chevron (badge, switch, value text...). */
  right?: React.ReactNode;
  /** Destructive row (logout, delete): error-colored label, no chevron. */
  danger?: boolean;
  /** Hide the trailing chevron on a pressable row. */
  hideChevron?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

/** Settings / list row: icon tile + label (+ subtitle) + trailing slot / chevron. */
export function ListRow({ label, subtitle, icon, right, danger = false, hideChevron = false, onPress, style }: ListRowProps) {
  const tc = useThemeColors();
  const accent = danger ? TOKENS.color.error : TOKENS.color.signal;

  const body = (
    <>
      {icon ? (
        <View style={[styles.tile, { backgroundColor: danger ? TOKENS.status.cancelled.bg : tc.accent }]}>
          <Ionicons name={icon} size={18} color={accent} />
        </View>
      ) : null}
      <View style={styles.texts}>
        <Text variant="subtitle" color={danger ? TOKENS.color.error : tc.text} numberOfLines={1}>{label}</Text>
        {subtitle ? <Text variant="caption" color={tc.textSub} numberOfLines={2}>{subtitle}</Text> : null}
      </View>
      {right ?? (onPress && !danger && !hideChevron ? <Ionicons name="chevron-forward" size={16} color={tc.textMuted} /> : null)}
    </>
  );

  if (!onPress) return <View style={[styles.row, style]}>{body}</View>;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={subtitle ? `${label}. ${subtitle}` : label}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: tc.surface2 }, style]}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg, borderRadius: TOKENS.radius.sm },
  tile: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  texts: { flex: 1, gap: 2 },
});
