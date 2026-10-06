import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { TOKENS } from '../tokens';
import { GRADIENTS } from '../gradients';
import { FONT_FAMILY } from '../typography';
import { Text } from './Text';
import { useThemeColors } from '@/stores/theme.store';

export interface AvatarProps {
  /** Remote image. Falls back to the initial of `name` when missing. */
  uri?: string | null;
  name?: string | null;
  size?: number;
  /** Mint presence dot (online / unread). */
  online?: boolean;
  style?: ViewStyle;
}

/** Circular avatar: image, or brand-gradient initial when there is no photo. */
export function Avatar({ uri, name, size = 52, online = false, style }: AvatarProps) {
  const tc = useThemeColors();
  const initial = (name?.trim().charAt(0) || 'U').toUpperCase();
  const circle = { width: size, height: size, borderRadius: size / 2 };
  const dot = Math.max(8, Math.round(size * 0.24));

  return (
    <View style={[circle, style]} accessible accessibilityRole="image" accessibilityLabel={name ? `Avatar de ${name}` : 'Avatar'}>
      {uri ? (
        <Image source={{ uri }} style={[circle, { backgroundColor: tc.surface2 }]} contentFit="cover" />
      ) : (
        <LinearGradient colors={GRADIENTS.brand} style={[circle, styles.center]}>
          <Text
            variant="title"
            color={TOKENS.color.onPrimary}
            style={{ fontFamily: FONT_FAMILY.display, fontSize: Math.round(size * 0.4), lineHeight: Math.round(size * 0.5) }}
          >
            {initial}
          </Text>
        </LinearGradient>
      )}
      {online ? (
        <View
          style={[styles.dot, { width: dot, height: dot, borderRadius: dot / 2, backgroundColor: tc.mint, borderColor: tc.bg }]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  dot: { position: 'absolute', bottom: 0, right: 0, borderWidth: 2 },
});
