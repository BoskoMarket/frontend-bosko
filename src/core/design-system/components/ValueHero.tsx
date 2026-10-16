import React from 'react';
import { Pressable, StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TOKENS } from '../tokens';
import { SPACING } from '../spacing';
import { BRAND_RADIAL_FILL } from '../gradients';
import { withAlpha } from '../color';
import { Text } from './Text';

export interface ValueHeroProps {
  /** Small mono line above the title. */
  eyebrow?: string;
  title: string;
  body?: string;
  /** Placeholder of the search trigger row. Rendered only with `onSearchPress`. */
  searchPlaceholder?: string;
  onSearchPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * ValueHero — radial brand surface that states the value proposition, with a
 * search trigger (a pressable row, not an input) as the primary action.
 * Theme-independent: always light text over the brand fill.
 */
export function ValueHero({
  eyebrow,
  title,
  body,
  searchPlaceholder = 'Buscar',
  onSearchPress,
  style,
}: ValueHeroProps) {
  return (
    // The glow lives on an opaque wrapper: overflow:hidden would clip the iOS shadow.
    <View style={[styles.shadow, TOKENS.shadow.glow, style]}>
      <View style={[styles.surface, BRAND_RADIAL_FILL]}>
        <View style={styles.ring} pointerEvents="none" />
        {eyebrow ? <Text variant="meta" color={TOKENS.onMedia.textSub}>{eyebrow}</Text> : null}
        <Text variant="h2" color={TOKENS.onMedia.text} accessibilityRole="header">{title}</Text>
        {body ? <Text variant="body" color={TOKENS.onMedia.textSub}>{body}</Text> : null}
        {onSearchPress ? (
          <Pressable
            onPress={onSearchPress}
            accessibilityRole="search"
            accessibilityLabel={searchPlaceholder}
            style={({ pressed }) => [styles.search, pressed && styles.pressed]}
          >
            <Ionicons name="search" size={18} color={TOKENS.color.primary} />
            <Text variant="body" color={withAlpha(TOKENS.color.primaryDark, 0.7)} numberOfLines={1} style={styles.placeholder}>
              {searchPlaceholder}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: { borderRadius: TOKENS.radius.xl, backgroundColor: TOKENS.color.primary },
  surface: {
    borderRadius: TOKENS.radius.xl,
    overflow: 'hidden',
    paddingHorizontal: SPACING.lg + 2,
    paddingTop: SPACING.xl + 2,
    paddingBottom: SPACING.lg + 2,
    gap: SPACING.md,
  },
  ring: {
    position: 'absolute',
    width: 220,
    height: 220,
    right: -70,
    top: -90,
    borderRadius: 110,
    borderWidth: 2,
    borderColor: TOKENS.onMedia.fill,
    backgroundColor: TOKENS.onMedia.fillFaint,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md - 2,
    backgroundColor: TOKENS.onMedia.solid,
    borderRadius: TOKENS.radius.md,
    paddingHorizontal: SPACING.lg - 2,
    paddingVertical: SPACING.md + 1,
  },
  pressed: { opacity: 0.9 },
  placeholder: { flex: 1 },
});
