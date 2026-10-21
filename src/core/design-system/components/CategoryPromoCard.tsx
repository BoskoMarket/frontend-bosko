import React from 'react';
import { ImageSourcePropType, Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { TOKENS } from '../tokens';
import { SPACING } from '../spacing';
import { useCategoryTint } from '../categoryTints';
import { resolveCategoryIcon } from '../categoryIcon';
import { Text } from './Text';

export interface CategoryPromoCardProps {
  title: string;
  subtitle?: string;
  ctaLabel: string;
  onPress: () => void;
  /** Position in the list; picks (and cycles) the pastel tint. */
  tintIndex: number;
  /** Ionicons name. Anything else (emoji, unknown) falls back to the default glyph. */
  icon?: string;
  /** Transparent cut-out of a professional, anchored bottom-right. */
  image?: ImageSourcePropType;
  style?: StyleProp<ViewStyle>;
}

const CARD_HEIGHT = 168;
const ICON_SIZE = 40;

/** Tinted category card: icon + title, subtitle, CTA pill and a person cut-out on the right. */
export function CategoryPromoCard({ title, subtitle, ctaLabel, onPress, tintIndex, icon, image, style }: CategoryPromoCardProps) {
  const tint = useCategoryTint(tintIndex);
  const glyph = resolveCategoryIcon(icon);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={subtitle ? `${title}. ${subtitle}. ${ctaLabel}` : `${title}. ${ctaLabel}`}
      style={({ pressed }) => [styles.card, { backgroundColor: tint.bg }, pressed && styles.pressed, style]}
    >
      {image ? (
        <Image source={image} style={styles.image} contentFit="contain" contentPosition="bottom right" />
      ) : (
        <View style={[styles.fallbackIcon, { backgroundColor: tint.iconBg }]}>
          <Ionicons name={glyph} size={44} color={tint.text} />
        </View>
      )}

      <View style={styles.textCol}>
        <View style={styles.titleRow}>
          {image ? (
            <View style={[styles.iconCircle, { backgroundColor: tint.iconBg }]}>
              <Ionicons name={glyph} size={20} color={tint.text} />
            </View>
          ) : null}
          <Text variant="title" color={tint.text} numberOfLines={2} style={styles.title}>
            {title}
          </Text>
        </View>
        {subtitle ? (
          <Text variant="bodySmall" color={tint.textSub} numberOfLines={2} style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : null}
        <View style={[styles.cta, { backgroundColor: tint.ctaBg }]}>
          <Text variant="label" color={tint.ctaText} numberOfLines={1}>
            {ctaLabel}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: CARD_HEIGHT,
    borderRadius: TOKENS.radius.xl,
    overflow: 'hidden',
    padding: SPACING.lg,
    justifyContent: 'center',
  },
  pressed: { opacity: 0.92 },
  textCol: { width: '58%', gap: SPACING.sm },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  iconCircle: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { flex: 1 },
  subtitle: { marginTop: SPACING.xs },
  cta: {
    alignSelf: 'flex-start',
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: TOKENS.radius.pill,
  },
  image: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '42%',
  },
  fallbackIcon: {
    position: 'absolute',
    right: SPACING.xl,
    top: SPACING.xl,
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
