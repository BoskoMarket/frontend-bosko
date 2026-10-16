import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, DimensionValue, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MOTION } from '../motion';
import { SPACING } from '../spacing';
import { TOKENS } from '../tokens';
import { withAlpha } from '../color';
import { useThemeColors } from '@/stores/theme.store';

export interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  radius?: number;
}

/**
 * Bloque skeleton con shimmer rosa translúcido en loop. Para la cola "cargando más"
 * de una lista usar `SkeletonRow`; para la carga inicial de una pantalla de lista
 * usar `SkeletonList`.
 */
export function Skeleton({ width = '100%', height = 14, radius = 8 }: SkeletonProps) {
  const tc = useThemeColors();
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(shimmer, { toValue: 1, duration: MOTION.shimmer.duration, easing: Easing.linear, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const translateX = shimmer.interpolate({ inputRange: [0, 1], outputRange: [-200, 200] });

  return (
    <View style={[styles.block, { width, height, borderRadius: radius, backgroundColor: tc.surface2 }]}>
      <Animated.View style={[StyleSheet.absoluteFillObject, { transform: [{ translateX }] }]}>
        <LinearGradient
          colors={['transparent', withAlpha(TOKENS.color.signal, 0.18), 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>
    </View>
  );
}

/** Fila skeleton — avatar + 2 líneas. La composición exacta usada al pie de listas remotas. */
export function SkeletonRow() {
  return (
    <View style={styles.row}>
      <Skeleton width={46} height={46} radius={23} />
      <View style={styles.lines}>
        <Skeleton width="60%" height={12} radius={6} />
        <Skeleton width="35%" height={9} radius={6} />
      </View>
    </View>
  );
}

export interface SkeletonListProps {
  /** `row`: avatar + 2 lines (chats, notifications). `card`: bordered surface card (orders, payments, plans, reviews). */
  variant?: 'row' | 'card';
  /** Number of placeholder items. */
  count?: number;
  style?: ViewStyle;
}

function SkeletonCard() {
  const tc = useThemeColors();
  return (
    <View style={[styles.card, { backgroundColor: tc.surface, borderColor: tc.border }]}>
      <View style={styles.cardHead}>
        <Skeleton width="48%" height={14} radius={7} />
        <Skeleton width={64} height={20} radius={TOKENS.radius.pill} />
      </View>
      <Skeleton width="86%" height={10} radius={5} />
      <Skeleton width="58%" height={10} radius={5} />
    </View>
  );
}

/**
 * Initial-load placeholder for a whole list screen: `count` skeleton items shaped like the
 * real list items, so content replaces them without a layout jump. Replaces full-screen spinners.
 */
export function SkeletonList({ variant = 'row', count = 6, style }: SkeletonListProps) {
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Cargando"
      style={[styles.list, variant === 'card' && styles.listCards, style]}
    >
      {Array.from({ length: count }, (_, i) => (variant === 'card' ? <SkeletonCard key={i} /> : <SkeletonRow key={i} />))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, gap: SPACING.xl },
  listCards: { gap: SPACING.md },
  card: { borderWidth: StyleSheet.hairlineWidth, borderRadius: TOKENS.radius.md, padding: SPACING.lg, gap: SPACING.sm },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.xs },
  block: { overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  lines: { flex: 1, gap: 6 },
});
