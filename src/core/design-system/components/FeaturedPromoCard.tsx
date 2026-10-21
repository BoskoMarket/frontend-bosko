import React from 'react';
import { ImageSourcePropType, Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { TOKENS } from '../tokens';
import { SPACING } from '../spacing';
import { useCategoryTint } from '../categoryTints';
import { Text } from './Text';

export interface FeaturedPromoCardProps {
  eyebrow?: string;
  title: string;
  /** Small pill top-right, e.g. "Verificados". */
  badge?: string;
  ctaLabel: string;
  onPress: () => void;
  /** Position in the list; picks (and cycles) the pastel tint. */
  tintIndex: number;
  /** Large transparent cut-out of a professional filling the right side. */
  image?: ImageSourcePropType;
  style?: StyleProp<ViewStyle>;
}

const CARD_MIN_HEIGHT = 360;

/** Tall featured card: eyebrow + badge, big title, dark CTA pill and a person on the right. */
export function FeaturedPromoCard({ eyebrow, title, badge, ctaLabel, onPress, tintIndex, image, style }: FeaturedPromoCardProps) {
  const tint = useCategoryTint(tintIndex);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${ctaLabel}`}
      style={({ pressed }) => [styles.card, { backgroundColor: tint.bg }, pressed && styles.pressed, style]}
    >
      {image ? <Image source={image} style={styles.image} contentFit="contain" contentPosition="bottom right" /> : null}

      <View style={styles.top}>
        {eyebrow ? (
          <View style={[styles.pill, { backgroundColor: tint.iconBg }]}>
            <Text variant="caption" color={tint.text} numberOfLines={1}>
              {eyebrow}
            </Text>
          </View>
        ) : (
          <View />
        )}
        {badge ? (
          <View style={[styles.pill, { backgroundColor: tint.iconBg }]}>
            <Text variant="label" color={tint.text} numberOfLines={1}>
              {badge}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.bottom}>
        <Text variant="h3" color={tint.text} numberOfLines={3} style={styles.title}>
          {title}
        </Text>
        <View style={[styles.cta, { backgroundColor: tint.ctaBg }]}>
          <Ionicons name="arrow-forward" size={18} color={tint.ctaText} />
          <Text variant="button" color={tint.ctaText} numberOfLines={1}>
            {ctaLabel}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: CARD_MIN_HEIGHT,
    borderRadius: TOKENS.radius.xl,
    overflow: 'hidden',
    padding: SPACING.lg,
    justifyContent: 'space-between',
  },
  pressed: { opacity: 0.92 },
  image: { position: 'absolute', top: 0, right: 0, bottom: 0, width: '45%' },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACING.sm },
  pill: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: TOKENS.radius.pill,
  },
  bottom: { gap: SPACING.lg },
  title: { maxWidth: '55%' },
  cta: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: TOKENS.radius.pill,
  },
});
