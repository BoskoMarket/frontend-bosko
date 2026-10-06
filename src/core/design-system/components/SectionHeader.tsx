import React from 'react';
import { View, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { Text } from './Text';
import { TOKENS } from '../tokens';

export interface SectionHeaderProps {
  title: string;
  /** Link label on the right (e.g. "Ver todo"). Rendered only with `onActionPress`. */
  actionLabel?: string;
  onActionPress?: () => void;
  style?: ViewStyle;
}

/** Section title row: `title` text + optional signal-colored action link. */
export function SectionHeader({ title, actionLabel = 'Ver todo', onActionPress, style }: SectionHeaderProps) {
  return (
    <View style={[styles.row, style]}>
      <Text variant="title" accessibilityRole="header" style={styles.title}>{title}</Text>
      {onActionPress ? (
        <Pressable onPress={onActionPress} hitSlop={8} accessibilityRole="link" accessibilityLabel={`${actionLabel}: ${title}`}>
          <Text variant="label" color={TOKENS.color.signal}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { letterSpacing: -0.2, flexShrink: 1 },
});
