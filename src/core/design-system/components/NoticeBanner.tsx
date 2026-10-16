import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TOKENS } from '../tokens';
import { withAlpha } from '../color';
import { useThemeColors } from '@/stores/theme.store';
import { Text } from './Text';

export type NoticeBannerVariant = 'info' | 'trust' | 'error' | 'pending';

export interface NoticeBannerProps {
  variant?: NoticeBannerVariant;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  children: React.ReactNode;
  style?: ViewStyle;
}

const DEFAULT_ICON: Record<NoticeBannerVariant, React.ComponentProps<typeof Ionicons>['name']> = {
  info: 'information-circle-outline',
  trust: 'lock-closed-outline',
  error: 'alert-circle-outline',
  pending: 'time-outline',
};

const ICON_COLOR: Record<NoticeBannerVariant, string> = {
  info: TOKENS.color.signal,
  trust: TOKENS.color.mint,
  error: TOKENS.color.error,
  pending: TOKENS.status.pending.fg,
};

/**
 * Banner de aviso — tres variantes fijas:
 * - `info`: accent bg + ícono signal. QuoteRequest, KYCIntro, Términos.
 * - `trust`: status-done-bg + borde mint. Privacidad (KYCIntro), garantía (Checkout).
 * - `error`: status-cancelled-bg + ícono y texto en color de error. Errores de envío (KYC).
 * - `pending`: status-pending-bg + warning fg. Estado "en revisión" (antecedentes).
 */
export function NoticeBanner({ variant = 'info', icon, children, style }: NoticeBannerProps) {
  const tc = useThemeColors();
  const resolvedIcon = icon ?? DEFAULT_ICON[variant];

  return (
    <View
      style={[
        styles.base,
        variant === 'trust' ? styles.trust
          : variant === 'error' ? styles.error
          : variant === 'pending' ? styles.pending
          : [styles.info, { backgroundColor: tc.accent }],
        style,
      ]}
    >
      <Ionicons name={resolvedIcon} size={16} color={ICON_COLOR[variant]} />
      <Text variant="bodySmall" color={variant === 'error' ? TOKENS.color.error : variant === 'pending' ? TOKENS.status.pending.fg : tc.textSub} style={styles.text}>
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
  error: { backgroundColor: TOKENS.status.cancelled.bg, borderRadius: 12, padding: 12 },
  pending: { backgroundColor: TOKENS.status.pending.bg, borderRadius: 12, padding: 14 },
  text: { flex: 1, lineHeight: 19 },
});
