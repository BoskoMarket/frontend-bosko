/**
 * ThemeToggle — animated sun/moon toggle for dark/light mode.
 * Uses theme store + Ionicons.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  useThemeMode,
  useToggleTheme,
  useThemeColors,
  useIsDark,
} from '@/stores/theme.store';
import { TOKENS, withAlpha } from '@/core/design-system';

const TRACK_W = 52;
const TRACK_H = 28;
const THUMB_S = 22;
const THUMB_P = (TRACK_H - THUMB_S) / 2; // 3px padding
const THUMB_L = TRACK_W - THUMB_S - THUMB_P; // translateX for "on"

export function ThemeToggle() {
  const isDark = useIsDark();
  const toggle = useToggleTheme();
  const colors = useThemeColors();
  const translateX = useRef(new Animated.Value(isDark ? THUMB_L : THUMB_P)).current;

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: isDark ? THUMB_L : THUMB_P,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  }, [isDark]);

  const trackColor = colors.switchTrack;

  return (
    <Pressable
      onPress={toggle}
      accessibilityRole="switch"
      accessibilityState={{ checked: isDark }}
      hitSlop={10}
      style={styles.wrapper}
    >
      <View style={[styles.track, { backgroundColor: trackColor }]}>
        {/* Sun / moon icon inside track */}
        <View style={styles.iconWrap}>
          <Ionicons
            name={isDark ? 'moon' : 'sunny'}
            size={14}
            color={withAlpha(TOKENS.color.onPrimary, isDark ? 0.6 : 0.9)}
          />
        </View>
        <Animated.View
          style={[
            styles.thumb,
            { transform: [{ translateX }] },
          ]}
        >
          <Ionicons
            name={isDark ? 'moon' : 'sunny'}
            size={14}
            color={isDark ? TOKENS.status.progress.fg : TOKENS.color.warning}
          />
        </Animated.View>
      </View>
    </Pressable>
  );
}

/**
 * ThemeToggleRow — ready-to-use Settings row with icon, label, and toggle.
 */
export function ThemeToggleRow({
  iconBg,
  iconColor,
}: {
  iconBg?: string;
  iconColor?: string;
}) {
  const isDark = useIsDark();
  const colors = useThemeColors();

  return {
    icon: isDark ? 'moon-outline' : 'sunny-outline' as 'moon-outline' | 'sunny-outline',
    iconBg: iconBg ?? withAlpha(isDark ? TOKENS.status.progress.fg : TOKENS.color.warning, 0.12),
    iconColor: iconColor ?? (isDark ? TOKENS.status.progress.fg : TOKENS.color.warning),
    label: isDark ? 'Modo Oscuro' : 'Modo Claro',
    accessory: <ThemeToggle />,
    onPress: undefined as (() => void) | undefined,
  };
}

const styles = StyleSheet.create({
  wrapper: {
    padding: 4,
  },
  track: {
    width: TRACK_W,
    height: TRACK_H,
    borderRadius: TRACK_H / 2,
    justifyContent: 'center',
    paddingHorizontal: THUMB_P,
  },
  iconWrap: {
    position: 'absolute',
    right: THUMB_P + 2,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  thumb: {
    width: THUMB_S,
    height: THUMB_S,
    borderRadius: THUMB_S / 2,
    backgroundColor: TOKENS.color.onPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: TOKENS.color.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
});
