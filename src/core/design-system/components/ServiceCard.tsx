import React, { useState } from 'react';
import { ImageSourcePropType, Pressable, StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { TOKENS } from '../tokens';
import { SPACING } from '../spacing';
import { GRADIENTS } from '../gradients';
import { Text } from './Text';
import { useThemeColors } from '@/stores/theme.store';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export interface ServiceCardRate {
  amount?: number | null;
  currency?: string | null;
}

/** "$18.500" / "US$40" / "Consultar" when there is no usable amount. */
export function formatServicePrice(rate?: ServiceCardRate | null): string {
  if (!rate || !rate.amount) return 'Consultar';
  const currency = rate.currency ?? 'ARS';
  const symbol = currency === 'ARS' ? '$' : currency === 'USD' ? 'US$' : `${currency} `;
  return `${symbol}${Number(rate.amount).toLocaleString('es-AR')}`;
}

export interface ServiceCardProps {
  title: string;
  /** Remote image. Without it (or while it is missing) a brand panel with `fallbackIcon` is shown. */
  imageUri?: string;
  fallbackIcon?: IconName;
  /** Local photo shown (cover) when there is no `imageUri` or it fails to load; replaces the brand panel. */
  fallbackImage?: ImageSourcePropType;
  /** Mono meta line, e.g. "Electricidad". Joined with `location` by " · ". */
  category?: string;
  location?: string;
  /** Average rating (0-5). Hidden together with the count when missing or 0. */
  rating?: number | null;
  reviewsCount?: number | null;
  /** Pre-formatted price (see `formatServicePrice`). */
  price?: string;
  /** Shows the "Disponible hoy" pill over the image. */
  isAvailable?: boolean;
  /** Renders the heart button when provided. */
  onToggleFavorite?: () => void;
  isFavorite?: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * ServiceCard — "Ficha" marketplace card: 4:3 image (brand panel + icon when
 * there is no photo) with an availability pill, then mono category · location,
 * title, rating and price. One component so the card style changes in one place.
 */
export function ServiceCard({
  title,
  imageUri,
  fallbackIcon = 'construct-outline',
  fallbackImage,
  category,
  location,
  rating,
  reviewsCount,
  price,
  isAvailable,
  onToggleFavorite,
  isFavorite,
  onPress,
  style,
}: ServiceCardProps) {
  const tc = useThemeColors();
  // Compared against the current uri so a new uri never shows a stale failure.
  const [failedUri, setFailedUri] = useState<string | undefined>();
  const showRemote = Boolean(imageUri) && failedUri !== imageUri;
  const meta = [category, location].filter(Boolean).join(' · ');
  const hasRating = typeof rating === 'number' && rating > 0;
  const a11y = [title, meta, hasRating ? `${rating.toFixed(1)} estrellas` : null, price, isAvailable ? 'Disponible hoy' : null]
    .filter(Boolean)
    .join('. ');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: tc.card, borderColor: tc.cardBorder },
        pressed && styles.pressed,
        style,
      ]}
    >
      <View style={styles.media}>
        {showRemote ? (
          <Image
            testID="service-card-remote-image"
            source={{ uri: imageUri }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            onError={() => setFailedUri(imageUri)}
          />
        ) : fallbackImage ? (
          <Image testID="service-card-fallback-image" source={fallbackImage} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <LinearGradient colors={GRADIENTS.brandDeep} style={[StyleSheet.absoluteFill, styles.fallback]}>
            <Ionicons name={fallbackIcon} size={34} color={TOKENS.onMedia.icon} />
          </LinearGradient>
        )}

        {isAvailable ? (
          <View style={styles.pill}>
            <View style={styles.pillDot} />
            <Text variant="caption" color={TOKENS.onMedia.text} weight="700" style={styles.pillText}>Disponible hoy</Text>
          </View>
        ) : null}

        {onToggleFavorite ? (
          <Pressable
            onPress={onToggleFavorite}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
            style={styles.heart}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={14}
              color={isFavorite ? TOKENS.color.signal : TOKENS.onMedia.icon}
            />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.body}>
        {meta ? <Text variant="meta" color={tc.textSub} numberOfLines={1} style={styles.meta}>{meta}</Text> : null}
        <Text variant="subtitle" numberOfLines={2} style={styles.title}>{title}</Text>
        <View style={styles.row}>
          {hasRating ? (
            <View style={styles.rating}>
              <Ionicons name="star" size={12} color={TOKENS.color.rating} />
              <Text variant="caption" color={tc.textSub}>
                {rating.toFixed(1)}{reviewsCount ? ` (${reviewsCount})` : ''}
              </Text>
            </View>
          ) : <View />}
          {price ? <Text variant="meta" style={styles.price} numberOfLines={1}>{price}</Text> : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: TOKENS.radius.lg, borderWidth: 1, overflow: 'hidden' },
  pressed: { opacity: 0.9 },
  media: { aspectRatio: 4 / 3, overflow: 'hidden' },
  fallback: { alignItems: 'center', justifyContent: 'center' },
  pill: {
    position: 'absolute',
    left: SPACING.sm,
    bottom: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs + 1,
    paddingHorizontal: SPACING.sm - 1,
    paddingVertical: SPACING.xs,
    borderRadius: TOKENS.radius.pill,
    backgroundColor: TOKENS.scrim.medium,
  },
  pillDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: TOKENS.color.mint },
  pillText: { fontSize: 10, lineHeight: 12 },
  heart: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: TOKENS.scrim.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { paddingHorizontal: SPACING.md, paddingTop: SPACING.sm + 2, paddingBottom: SPACING.md, gap: SPACING.xs },
  meta: { fontSize: 10, lineHeight: 13, letterSpacing: 0.8 },
  title: { fontSize: 14, lineHeight: 18 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACING.sm, marginTop: SPACING.xs },
  rating: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  price: { letterSpacing: 0, textTransform: 'none', fontSize: 12, flexShrink: 1 },
});
