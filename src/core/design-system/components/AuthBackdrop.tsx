import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GRADIENTS } from '../gradients';
import { useThemeColors } from '@/stores/theme.store';

export interface AuthBackdropProps {
  children?: React.ReactNode;
  /** Rotation (deg) of the glow band. Login/register use opposite tilts. */
  tilt?: number;
  /** Half-cycle (ms) of the pulsing glow. */
  duration?: number;
  style?: ViewStyle;
}

/**
 * Full-screen backdrop for auth flows / splash: bg → wine tint → bg gradient plus a
 * pulsing signal-pink glow band. Renders its children on top (it is the screen root).
 */
export function AuthBackdrop({ children, tilt = -8, duration = 2600, style }: AuthBackdropProps) {
  const tc = useThemeColors();
  const glow = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0.7, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [duration, glow]);

  return (
    <View style={[styles.root, { backgroundColor: tc.bg }, style]}>
      <LinearGradient colors={GRADIENTS.backdrop(tc)} style={StyleSheet.absoluteFill} />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.glow,
          {
            opacity: glow.interpolate({ inputRange: [0.7, 1], outputRange: [0.5, 1] }),
            transform: [
              { scale: glow.interpolate({ inputRange: [0.7, 1], outputRange: [1, 1.18] }) },
              { rotate: `${tilt}deg` },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={GRADIENTS.glow}
          locations={[0, 0.55, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  glow: { position: 'absolute', top: -180, left: -40, right: -40, height: 520, opacity: 0.9 },
});
