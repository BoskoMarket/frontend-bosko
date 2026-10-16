import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { AuthBackdrop, TOKENS, useThemeColors, withAlpha } from '@/core/design-system';
import { BrandMark } from '@/components/BrandMark';

type Props = {
  /** Se llama cuando termina la secuencia (~2.2s) — navegar a onboarding/login/tabs acá */
  onDone: () => void;
};

/**
 * Splash animado "Señal Nocturna" — reemplaza el splash estático nativo una vez
 * que la app ya montó JS (el splash nativo de Expo sigue siendo la imagen fija
 * en app.json; este componente es la transición animada que se ve justo después).
 *
 * Secuencia: glow pulsante + 3 ondas expansivas → la insignia se dibuja (stroke
 * draw-in) → wordmark y tagline entran → barra de progreso llena en 2s → onDone().
 */
export function AnimatedSplashScreen({ onDone }: Props) {
  const tc = useThemeColors();
  const ripple1 = useRef(new Animated.Value(0)).current;
  const ripple2 = useRef(new Animated.Value(0)).current;
  const ripple3 = useRef(new Animated.Value(0)).current;
  const markIn = useRef(new Animated.Value(0)).current;
  const wordIn = useRef(new Animated.Value(0)).current;
  const bar = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const rippleLoop = (val: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, { toValue: 1, duration: 2400, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(val, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
      ).start();
    rippleLoop(ripple1, 0);
    rippleLoop(ripple2, 800);
    rippleLoop(ripple3, 1600);

    Animated.timing(markIn, { toValue: 1, duration: 900, delay: 120, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    Animated.timing(wordIn, { toValue: 1, duration: 500, delay: 650, useNativeDriver: true }).start();
    Animated.timing(bar, { toValue: 1, duration: 2000, delay: 200, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }).start();

    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, []);

  const rippleStyle = (val: Animated.Value) => ({
    transform: [{ scale: val.interpolate({ inputRange: [0, 1], outputRange: [0.6, 2.1] }) }],
    opacity: val.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] }),
  });

  return (
    <AuthBackdrop tilt={-10} duration={1300} style={styles.root}>
      <Animated.View style={[styles.ripple, rippleStyle(ripple1)]} />
      <Animated.View style={[styles.ripple, rippleStyle(ripple2)]} />
      <Animated.View style={[styles.ripple, rippleStyle(ripple3)]} />

      <Animated.View style={{ opacity: markIn, transform: [{ scale: markIn.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }] }}>
        <BrandMark variant="mark" size={104} />
      </Animated.View>

      <Animated.View style={{ opacity: wordIn, transform: [{ translateY: wordIn.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }], alignItems: 'center', marginTop: 22 }}>
        <BrandMark variant="wordmark" size={68} tagline />
      </Animated.View>

      <View style={[styles.barTrack, { backgroundColor: tc.border }]}>
        <Animated.View style={[styles.barFill, { transform: [{ scaleX: bar }] }]} />
      </View>
    </AuthBackdrop>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', justifyContent: 'center' },
  ripple: { position: 'absolute', width: 180, height: 180, borderRadius: 90, borderWidth: 1, borderColor: withAlpha(TOKENS.color.signal, 0.4) },
  barTrack: { position: 'absolute', bottom: 64, width: 132, height: 2, borderRadius: 2, overflow: 'hidden' },
  barFill: { height: '100%', width: '100%', backgroundColor: TOKENS.color.signal, transformOrigin: 'left' },
});
