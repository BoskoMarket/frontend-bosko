import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { RadialBlob } from '@/core/components/RadialBlob';
import { TOKENS } from '@/core/design-system';

export function AnimatedBackground({ variant = 'app' }: { variant?: 'app' | 'minimal' }) {
  const a = useRef(new Animated.Value(0)).current;
  const b = useRef(new Animated.Value(0)).current;
  const c = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = (val: Animated.Value, duration: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(val, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(val, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
      ).start();
    loop(a, 7000);
    loop(b, 8500);
    loop(c, 10000);
  }, []);

  const blobStyle = (val: Animated.Value, dx: number, dy: number) => ({
    transform: [
      { translateX: val.interpolate({ inputRange: [0, 1], outputRange: [0, dx] }) },
      { translateY: val.interpolate({ inputRange: [0, 1], outputRange: [0, dy] }) },
    ],
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View style={[styles.blobArea, styles.blob1, blobStyle(a, 24, 16)]}>
        <RadialBlob size={400} color={TOKENS.color.signal} opacity={0.16} />
      </Animated.View>

      <Animated.View style={[styles.blobArea, styles.blob2, blobStyle(b, -20, -14)]}>
        <RadialBlob size={360} color={TOKENS.color.primary} opacity={0.18} />
      </Animated.View>

      {variant === 'app' && (
        <Animated.View style={[styles.blobArea, styles.blob3, blobStyle(c, 10, -18)]}>
          <RadialBlob size={280} color={TOKENS.color.mint} opacity={0.06} />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  blobArea: { position: 'absolute' },
  blob1: { width: 400, height: 400, top: -80, left: -80 },
  blob2: { width: 360, height: 360, bottom: -80, right: -80 },
  blob3: { width: 280, height: 280, top: '38%', left: '50%' },
});
