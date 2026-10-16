import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, DimensionValue } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MOTION } from '../motion';
import { TOKENS } from '../tokens';
import { withAlpha } from '../color';
import { useThemeColors } from '@/stores/theme.store';

export interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  radius?: number;
}

/**
 * Bloque skeleton con shimmer rosa translúcido en loop — solo para la cola
 * "cargando más" de una lista (Favoritos, Mis reseñas, Pagos, panel Admin),
 * nunca para reemplazar la lista entera.
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

const styles = StyleSheet.create({
  block: { overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  lines: { flex: 1, gap: 6 },
});
