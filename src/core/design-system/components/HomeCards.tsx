import React from 'react';
import { Pressable, StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TOKENS } from '../tokens';
import { SPACING } from '../spacing';
import { FONT_FAMILY } from '../typography';
import { Text } from './Text';
import { useThemeColors } from '@/stores/theme.store';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

function IconTile({ name, tone = 'brand', size = 36 }: { name: IconName; tone?: 'brand' | 'mint'; size?: number }) {
  const tc = useThemeColors();
  const isMint = tone === 'mint';
  return (
    <View
      style={[
        styles.tile,
        { width: size, height: size, backgroundColor: isMint ? TOKENS.status.done.bg : tc.accent },
      ]}
    >
      <Ionicons name={name} size={Math.round(size * 0.5)} color={isMint ? TOKENS.color.mint : TOKENS.color.signal} />
    </View>
  );
}

// ---------------------------------------------------------------------------

export interface PathCardProps {
  icon: IconName;
  title: string;
  description: string;
  /** Link-style label at the bottom, e.g. "Buscar servicios →". */
  linkLabel: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

/** PathCard — one of the two entry paths of the home (hire / offer). */
export function PathCard({ icon, title, description, linkLabel, onPress, style }: PathCardProps) {
  const tc = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${description}`}
      style={({ pressed }) => [
        styles.path,
        { backgroundColor: tc.card, borderColor: tc.cardBorder },
        pressed && styles.pressed,
        style,
      ]}
    >
      <IconTile name={icon} />
      <Text variant="title" style={styles.pathTitle}>{title}</Text>
      <Text variant="caption" color={tc.textSub}>{description}</Text>
      <Text variant="label" color={TOKENS.color.signal} style={styles.link}>{linkLabel}</Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------

export interface StepCardProps {
  /** Step number as shown, e.g. "01". */
  number: string;
  title: string;
  caption: string;
  style?: StyleProp<ViewStyle>;
}

/** StepCard — compact "how it works" step: mono number, title, caption. */
export function StepCard({ number, title, caption, style }: StepCardProps) {
  const tc = useThemeColors();
  return (
    <View
      accessible
      accessibilityLabel={`Paso ${number}. ${title}. ${caption}`}
      style={[styles.step, { backgroundColor: tc.surface2, borderColor: tc.border }, style]}
    >
      <Text variant="caption" color={TOKENS.color.signal} style={styles.mono}>{number}</Text>
      <Text variant="label" style={styles.stepTitle}>{title}</Text>
      <Text variant="caption" color={tc.textSub} style={styles.stepCaption}>{caption}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------

export interface TrustRowProps {
  icon: IconName;
  title: string;
  caption: string;
  style?: StyleProp<ViewStyle>;
}

/** TrustRow — trust signal: mint icon tile + title + caption. */
export function TrustRow({ icon, title, caption, style }: TrustRowProps) {
  const tc = useThemeColors();
  return (
    <View
      accessible
      accessibilityLabel={`${title}. ${caption}`}
      style={[styles.trust, { backgroundColor: tc.card, borderColor: tc.cardBorder }, style]}
    >
      <IconTile name={icon} tone="mint" size={34} />
      <View style={styles.trustText}>
        <Text variant="label">{title}</Text>
        <Text variant="caption" color={tc.textSub}>{caption}</Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------

export interface StatTileProps {
  value: string;
  label: string;
  style?: StyleProp<ViewStyle>;
}

/** StatTile — one metric: mono value over a caption label. */
export function StatTile({ value, label, style }: StatTileProps) {
  const tc = useThemeColors();
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value}`}
      style={[styles.stat, { backgroundColor: tc.card, borderColor: tc.cardBorder }, style]}
    >
      <Text variant="h3" style={styles.mono} numberOfLines={1}>{value}</Text>
      <Text variant="caption" color={tc.textSub}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { borderRadius: TOKENS.radius.sm - 1, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.9 },
  mono: { fontFamily: FONT_FAMILY.mono },

  path: { flex: 1, borderRadius: TOKENS.radius.lg, borderWidth: 1, padding: SPACING.lg - 2, gap: SPACING.sm },
  pathTitle: { fontSize: 15, lineHeight: 20 },
  link: { marginTop: SPACING.xs / 2 },

  step: { flex: 1, borderRadius: TOKENS.radius.md, borderWidth: 1, paddingVertical: SPACING.md, paddingHorizontal: SPACING.md - 2, gap: SPACING.xs + 2 },
  stepTitle: { lineHeight: 16 },
  stepCaption: { fontSize: 11, lineHeight: 15 },

  trust: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.md, borderRadius: TOKENS.radius.md, borderWidth: 1 },
  trustText: { flex: 1, gap: 2 },

  category: { flex: 1, borderRadius: TOKENS.radius.md, alignItems: 'center', gap: SPACING.sm - 2, paddingTop: SPACING.md, paddingBottom: SPACING.sm + 2, paddingHorizontal: SPACING.xs },
  categoryLabel: { fontSize: 11, lineHeight: 14, alignSelf: 'stretch' },

  stat: { flex: 1, borderRadius: TOKENS.radius.md, borderWidth: 1, padding: SPACING.md, gap: 2 },
});

// ---------------------------------------------------------------------------

export interface CategoryTileProps {
  icon: IconName;
  label: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

/** CategoryTile — compact tinted tile (icon over label) for category grids. */
export function CategoryTile({ icon, label, onPress, style }: CategoryTileProps) {
  const tc = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.category, { backgroundColor: tc.accent }, pressed && styles.pressed, style]}
    >
      <Ionicons name={icon} size={22} color={TOKENS.color.signal} />
      <Text variant="caption" center numberOfLines={1} style={styles.categoryLabel}>{label}</Text>
    </Pressable>
  );
}
