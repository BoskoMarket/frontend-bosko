import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Image, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FONT_FAMILY, TYPE_SCALE } from '../typography';
import { GRADIENTS } from '../gradients';
import { MOTION } from '../motion';
import { TOKENS } from '../tokens';
import { withAlpha } from '../color';

// Same asset the native splash uses (app.json), so the first frame matches it exactly.
const LOGO = require('../../../../assets/images/bosko-logo.png');

const LOGO_SIZE = TOKENS.splash.logoSize;
const HALO_SIZE = LOGO_SIZE * 2.6;
const BAR_WIDTH = 132;
const BAR_SEGMENT = 52;
const EXIT_MS = 420;
const EXIT_REDUCED_MS = 150;

export interface BootSplashProps {
  /** When true the splash plays its exit (logo swells, everything fades) and then calls `onHidden`. */
  ready: boolean;
  /** Called once, after the exit animation finished. The parent should unmount the splash. */
  onHidden?: () => void;
  /** Called once, when the splash has been laid out. Hide the native splash here. */
  onFirstLayout?: () => void;
}

const loop = (value: Animated.Value, half: number, easing = Easing.inOut(Easing.sin)) =>
  Animated.loop(
    Animated.sequence([
      Animated.timing(value, { toValue: 1, duration: half, easing, useNativeDriver: true }),
      Animated.timing(value, { toValue: 0, duration: half, easing, useNativeDriver: true }),
    ]),
  );

/**
 * Branded boot splash ("Señal Nocturna"). Full-screen overlay on brand wine.
 *
 * Frame 0 is the native splash: same wine background and the same logo, same
 * size, centered — nothing moves until the hand-off has happened. Then:
 *  - a signal-pink halo breathes behind the mark and the mark breathes with it,
 *  - two signal rings radiate out of the mark ("señal"),
 *  - the wordmark and the tagline slide/fade in,
 *  - a thin indeterminate comet runs along the bottom.
 * On `ready` the mark swells slightly while the whole splash fades out, then
 * `onHidden` fires. With reduced motion everything is static and the exit is a
 * short cross-fade.
 */
export function BootSplash({ ready, onHidden, onFirstLayout }: BootSplashProps) {
  const [reduced, setReduced] = useState<boolean | null>(null);
  const exiting = useRef(false);
  const laidOut = useRef(false);

  const halo = useRef(new Animated.Value(0)).current;
  const breathe = useRef(new Animated.Value(0)).current;
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
  const word = useRef(new Animated.Value(0)).current;
  const tagline = useRef(new Animated.Value(0)).current;
  const bar = useRef(new Animated.Value(0)).current;
  const barIn = useRef(new Animated.Value(0)).current;
  const exit = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let active = true;
    Promise.resolve(AccessibilityInfo.isReduceMotionEnabled?.())
      .then((value) => active && setReduced(!!value))
      .catch(() => active && setReduced(false));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (reduced === null) return;
    if (reduced) {
      halo.setValue(0.5);
      word.setValue(1);
      tagline.setValue(1);
      barIn.setValue(1);
      bar.setValue(0.5);
      return;
    }
    const animations = [
      loop(halo, 1400),
      loop(breathe, 1400),
      Animated.sequence([Animated.delay(250), loop(ring1, 1200, Easing.out(Easing.quad))]),
      Animated.sequence([Animated.delay(1450), loop(ring2, 1200, Easing.out(Easing.quad))]),
      Animated.timing(word, { toValue: 1, delay: 350, ...MOTION.fadeUp, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(tagline, { toValue: 1, delay: 560, ...MOTION.fadeUp, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(barIn, { toValue: 1, delay: 500, duration: 400, useNativeDriver: true }),
      Animated.loop(Animated.timing(bar, { toValue: 1, duration: 1300, easing: Easing.inOut(Easing.cubic), useNativeDriver: true })),
    ];
    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, [reduced, halo, breathe, ring1, ring2, word, tagline, bar, barIn]);

  useEffect(() => {
    if (!ready || exiting.current) return;
    exiting.current = true;
    const quick = reduced === true;
    Animated.parallel([
      Animated.timing(exit, { toValue: quick ? 0 : 1, duration: EXIT_MS, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.timing(fade, { toValue: 0, duration: quick ? EXIT_REDUCED_MS : EXIT_MS, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) onHidden?.();
    });
  }, [ready, reduced, exit, fade, onHidden]);

  const handleLayout = () => {
    if (laidOut.current) return;
    laidOut.current = true;
    onFirstLayout?.();
  };

  const ringStyle = (value: Animated.Value) => ({
    opacity: value.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] }),
    transform: [{ scale: value.interpolate({ inputRange: [0, 1], outputRange: [0.78, 2.1] }) }],
  });

  const logoScale = Animated.multiply(
    breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.045] }),
    exit.interpolate({ inputRange: [0, 1], outputRange: [1, 1.14] }),
  );

  const reveal = (value: Animated.Value) => ({
    opacity: value,
    transform: [{ translateY: value.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
  });

  return (
    <Animated.View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Cargando Bosko"
      style={[styles.root, { opacity: fade }]}
      onLayout={handleLayout}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.halo,
          {
            experimental_backgroundImage: GRADIENTS.haloRadial,
            opacity: halo.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }),
            transform: [{ scale: halo.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.08] }) }],
          },
        ]}
      />
      {!reduced && (
        <>
          <Animated.View pointerEvents="none" style={[styles.ring, ringStyle(ring1)]} />
          <Animated.View pointerEvents="none" style={[styles.ring, ringStyle(ring2)]} />
        </>
      )}

      <Animated.View style={{ transform: [{ scale: logoScale }] }}>
        <Image source={LOGO} style={styles.logo} resizeMode="contain" />
      </Animated.View>

      <View pointerEvents="none" style={styles.copy}>
        <Animated.Text style={[styles.wordmark, reveal(word)]}>bosko</Animated.Text>
        <Animated.Text style={[styles.tagline, reveal(tagline)]}>Servicios en red · ARG</Animated.Text>
      </View>

      <Animated.View pointerEvents="none" style={[styles.barTrack, { opacity: barIn }]}>
        <Animated.View
          style={[
            styles.barSegment,
            {
              transform: [
                { translateX: bar.interpolate({ inputRange: [0, 1], outputRange: [-BAR_SEGMENT, BAR_WIDTH] }) },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={[withAlpha(TOKENS.color.signal, 0), TOKENS.color.signal, TOKENS.color.onPrimary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: TOKENS.splash.bg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  halo: {
    position: 'absolute',
    width: HALO_SIZE,
    height: HALO_SIZE,
    borderRadius: HALO_SIZE / 2,
  },
  ring: {
    position: 'absolute',
    width: LOGO_SIZE * 0.6,
    height: LOGO_SIZE * 0.6,
    borderRadius: LOGO_SIZE * 0.3,
    borderWidth: 1.5,
    borderColor: TOKENS.color.signal,
  },
  logo: { width: LOGO_SIZE, height: LOGO_SIZE },
  copy: {
    position: 'absolute',
    top: '50%',
    marginTop: LOGO_SIZE * 0.36,
    alignItems: 'center',
    gap: 6,
  },
  wordmark: {
    fontFamily: FONT_FAMILY.display,
    fontSize: 44,
    lineHeight: 50,
    letterSpacing: -1,
    textTransform: 'lowercase',
    color: TOKENS.color.onPrimary,
  },
  tagline: {
    ...TYPE_SCALE.meta,
    letterSpacing: 2.4,
    color: TOKENS.color.onPrimarySub,
  },
  barTrack: {
    position: 'absolute',
    bottom: '14%',
    width: BAR_WIDTH,
    height: 2,
    borderRadius: 1,
    overflow: 'hidden',
    backgroundColor: TOKENS.color.onPrimaryDim,
  },
  barSegment: { position: 'absolute', top: 0, bottom: 0, width: BAR_SEGMENT },
});
