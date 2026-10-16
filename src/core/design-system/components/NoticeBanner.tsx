import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TOKENS } from '../tokens';
import { withAlpha } from '../color';
import { useThemeColors } from '@/stores/theme.store';
import { Text } from './Text';

export type NoticeBannerVariant = 'info' | 'trust';

export interface NoticeBannerProps {
  variant?: NoticeBannerVariant;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  children: React.ReactNode;
  style?: ViewStyle;
}

const DEFAULT_ICON: Record<NoticeBannerVariant, React.ComponentProps<typeof Ionicons>['name']> = {
  info: 'information-circle-outline',
  trust: 'lock-closed-outline',
};

/**
 * Banner de aviso — dos variantes fijas:
 * - `info`: accent bg + ícono signal. QuoteRequest, KYCIntro, Términos.
 * - `trust`: status-done-bg + borde mint. Privacidad (KYCIntro), garantía (Checkout).
 */
export function NoticeBanner({ variant = 'info', icon, children, style }: NoticeBannerProps) {
  const tc = useThemeColors();
  const resolvedIcon = icon ?? DEFAULT_ICON[variant];

  return (
    <View style={[styles.base, variant === 'trust' ? styles.trust : [styles.info, { backgroundColor: tc.accent }], style]}>
      <Ionicons
        name={resolvedIcon}
        size={16}
        color={variant === 'trust' ? TOKENS.color.mint : TOKENS.color.signal}
      />
      <Text variant="bodySmall" color={tc.textSub} style={styles.text}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  info: { borderRadius: 12, padding: 12, gap: 8 },
  trust: {
    backgroundColor: TOKENS.status.done.bg,
    borderWidth: 1,
    borderColor: withAlpha(TOKENS.color.mint, 0.25),
    borderRadius: 14,
    padding: 14,
  },
  text: { flex: 1, lineHeight: 19 },
});
