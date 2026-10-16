import React from 'react';
import { View, ViewStyle, StyleSheet, useWindowDimensions } from 'react-native';
import { BlurView } from '@/core/components/BlurView';
import { TOKENS } from '../tokens';
import { SPACING } from '../spacing';
import { useIsDark, useThemeColors } from '@/stores/theme.store';

export interface AuthCardProps {
  children: React.ReactNode;
  /** Inner padding (default 30, the login/register card). */
  padding?: number;
  style?: ViewStyle;
}

/**
 * Glass card for auth flows: blurred translucent surface with a signal-pink drop
 * glow and a faint white halo. Both glows live on opaque (`tc.bg`) wrappers:
 * shadow* on a translucent view breaks on Android (square shadow).
 * Width = screen width minus the 24px gutters, like the auth screens did by hand.
 */
export function AuthCard({ children, padding = 30, style }: AuthCardProps) {
  const tc = useThemeColors();
  const isDark = useIsDark();
  const { width } = useWindowDimensions();

  return (
    <View style={[styles.halo, { backgroundColor: tc.bg, shadowColor: TOKENS.color.onPrimary }, style]}>
      <View style={[styles.glow, { backgroundColor: tc.bg, shadowColor: TOKENS.color.signal }]}>
        <BlurView
          intensity={30}
          tint={isDark ? 'dark' : 'light'}
          style={[
            styles.card,
            { width: width - SPACING.xxl * 2, padding, backgroundColor: tc.card, borderColor: tc.border },
          ]}
        >
          {children}
        </BlurView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  halo: {
    borderRadius: TOKENS.radius.xl,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
  },
  glow: {
    borderRadius: TOKENS.radius.xl,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.28,
    shadowRadius: 34,
    elevation: 12,
  },
  card: { borderRadius: TOKENS.radius.xl, overflow: 'hidden', borderWidth: 1 },
});
