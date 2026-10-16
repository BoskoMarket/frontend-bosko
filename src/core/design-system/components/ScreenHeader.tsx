import React from 'react';
import { View, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Text } from './Text';
import { FONT_FAMILY } from '../typography';
import { TOKENS } from '../tokens';
import { safeBack } from '../../navigation/safeBack';
import { useThemeColors } from '@/stores/theme.store';

export interface ScreenHeaderProps {
  title: string;
  /**
   * `center` (default): back chevron + centered title (pushed screens).
   * `large`: left-aligned display title, optional `subtitle`, back chevron only when `onBack` is given
   * (tab roots and list screens).
   */
  variant?: 'center' | 'large';
  /** `onBrand` renders icon and text in the on-brand color — use over a brand-gradient banner. */
  tone?: 'default' | 'onBrand';
  /** Second line under a `large` title. */
  subtitle?: string;
  /** `center`: back handler (defaults to safeBack to the tabs). `large`: shows the back chevron when provided. */
  onBack?: () => void;
  /** Right slot — badge, counter, action. In `center` the default is a 22px spacer that balances the chevron. */
  right?: React.ReactNode;
  /** Outer row style: paddings / safe-area offset are the screen's responsibility. */
  style?: ViewStyle;
}

/**
 * Header de pantalla — un único patrón para toda la app.
 *  - `center` (default): `chevron-back` desnudo + título centrado + spacer de 22px que iguala el ancho del
 *    ícono para que el título quede realmente centrado, no solo "flex:1 + textAlign:center".
 *  - `large`: título display alineado a la izquierda (+ subtítulo opcional) para raíces de tab y listas.
 */
export function ScreenHeader({ title, variant = 'center', tone = 'default', subtitle, onBack, right, style }: ScreenHeaderProps) {
  const tc = useThemeColors();
  const ink = tone === 'onBrand' ? TOKENS.color.onPrimary : tc.text;
  const inkSub = tone === 'onBrand' ? TOKENS.color.onPrimarySub : tc.textSub;

  if (variant === 'large') {
    return (
      <View style={[styles.row, style]}>
        {onBack ? (
          <Pressable onPress={onBack} hitSlop={12} style={styles.largeBack} accessibilityRole="button" accessibilityLabel="Volver">
            <Ionicons name="chevron-back" size={22} color={ink} />
          </Pressable>
        ) : null}
        <View style={styles.largeText}>
          <Text variant="h3" color={ink} style={styles.largeTitle} numberOfLines={1} accessibilityRole="header">
            {title}
          </Text>
          {subtitle ? <Text variant="bodySmall" color={inkSub}>{subtitle}</Text> : null}
        </View>
        {right}
      </View>
    );
  }

  return (
    <View style={[styles.row, styles.between, style]}>
      <Pressable onPress={onBack ?? (() => safeBack(router, '/(tabs)'))} hitSlop={12} style={styles.side} accessibilityRole="button" accessibilityLabel="Volver">
        <Ionicons name="chevron-back" size={22} color={ink} />
      </Pressable>
      <Text variant="title" color={ink} style={styles.title} numberOfLines={1} accessibilityRole="header">
        {title}
      </Text>
      <View style={[styles.side, styles.right]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  between: { justifyContent: 'space-between' },
  side: { width: 22, alignItems: 'flex-start', justifyContent: 'center' },
  right: { alignItems: 'flex-end', width: undefined, minWidth: 22 },
  title: { flex: 1, textAlign: 'center' },
  largeBack: { marginRight: 8, justifyContent: 'center' },
  largeText: { flex: 1 },
  largeTitle: { fontFamily: FONT_FAMILY.display, fontSize: 28, lineHeight: 32, letterSpacing: -0.4 },
});
