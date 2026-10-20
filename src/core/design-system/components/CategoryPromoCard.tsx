import React from 'react';
import { ImageSourcePropType, Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { TOKENS } from '../tokens';
import { SPACING } from '../spacing';
import { useCategoryTint } from '../categoryTints';
import { Text } from './Text';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export interface CategoryPromoCardProps {
  title: string;
  subtitle?: string;
  ctaLabel: string;
  onPress: () => void;
  /** Position in the list; picks (and cycles) the pastel tint. */
  tintIndex: number;
  /** Ionicons name, or an emoji string. */
  icon?: IconName | string;
  /** Transparent cut-out of a professional, anchored bottom-right. */
  image?: ImageSourcePropType;
  style?: StyleProp<ViewStyle>;
}

const CARD_HEIGHT = 168;
const IMAGE_HEIGHT = 196;
const IMAGE_WIDTH = 150;
const ICON_SIZE = 40;

function isIonicon(name: string): name is IconName {
  return name in Ionicons.glyphMap;
}

function IconGlyph({ icon, size, color }: { icon: string; size: number; color: string }) {
  if (isIonicon(icon)) return <Ionicons name={icon} size={size} color={color} />;
  return <Text style={{ fontSize: Math.round(size * 0.9), lineHeight: Math.round(size * 1.15) }}>{icon}</Text>;
}

/** Tinted category card: icon + title, subtitle, CTA pill and a person cut-out on the right. */
export function CategoryPromoCard({ title, subtitle, ctaLabel, onPress, tintIndex, icon, image, style }: CategoryPromoCardProps) {
  const tint = useCategoryTint(tintIndex);
  const glyph = icon ?? 'construct-outline';

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
          <IconGlyph icon={glyph} size={44} color={tint.text} />
        </View>
      )}

      <View style={styles.textCol}>
        <View style={styles.titleRow}>
          <View style={[styles.iconCircle, { backgroundColor: tint.iconBg }]}>
            <IconGlyph icon={glyph} size={20} color={tint.text} />
          </View>
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
    right: 0,
    bottom: 0,
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
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
