import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { TOKENS } from '../tokens';
import { GRADIENTS, BRAND_RADIAL_FILL } from '../gradients';
import { MOTION } from '../motion';
import { withAlpha } from '../color';
import { useThemeColors } from '@/stores/theme.store';

export type IconCircleVariant = 'neutral' | 'brand' | 'success' | 'danger';

export interface IconCircleProps {
  name: React.ComponentProps<typeof Ionicons>['name'];
  variant?: IconCircleVariant;
  /** Diámetro del círculo. Rango usado en el sistema: 68–106px. */
  size?: number;
  /** Default: ~42% del diámetro, como en el resto de las pantallas. */
  iconSize?: number;
  iconColor?: string;
  style?: ViewStyle;
}

/**
 * Círculo con ícono — hero / estado / éxito. Cuatro variantes fijas:
 * - `neutral`: accent bg + ícono signal. Intro, cambiar contraseña, verificar teléfono.
 * - `brand`: brand-gradient + glow. CTA fuerte, reseña, calificación.
 * - `success`: gradiente menta + ringPop de entrada. Pago exitoso, email verificado.
 * - `danger`: status-cancelled-bg + borde. Eliminar cuenta, rechazos.
 */
export function IconCircle({ name, variant = 'neutral', size = 80, iconSize, iconColor, style }: IconCircleProps) {
  const tc = useThemeColors();
  const pop = useRef(new Animated.Value(variant === 'success' ? 0.4 : 1)).current;
  const resolvedIconSize = iconSize ?? Math.round(size * 0.42);

  useEffect(() => {
    if (variant === 'success') {
      Animated.spring(pop, { toValue: 1, ...MOTION.ringPop, useNativeDriver: true }).start();
    }
  }, [variant]);

  const shell: ViewStyle = { width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' };

  if (variant === 'brand') {
    // Glow vive en un wrapper opaco separado — elevation de Android sobre un
    // fondo transparente dibuja una caja negra detrás (mismo fix que Button/Card).
    return (
      <View style={[shell, { backgroundColor: tc.bg }, TOKENS.shadow.glow, style]}>
        <View style={[shell, BRAND_RADIAL_FILL]}>
          <Ionicons name={name} size={resolvedIconSize} color={iconColor ?? TOKENS.color.onPrimary} />
        </View>
      </View>
    );
  }

  if (variant === 'success') {
    return (
      <Animated.View
        style={[shell, { backgroundColor: tc.bg }, styles.successShadow, { opacity: pop, transform: [{ scale: pop }] }, style]}
      >
        <LinearGradient colors={GRADIENTS.success} style={shell}>
          <Ionicons name={name} size={resolvedIconSize} color={iconColor ?? TOKENS.color.onPrimary} />
        </LinearGradient>
      </Animated.View>
    );
  }

  if (variant === 'danger') {
    return (
      <View style={[shell, styles.dangerCircle, style]}>
        <Ionicons name={name} size={resolvedIconSize} color={iconColor ?? TOKENS.color.error} />
      </View>
    );
  }

  // neutral
  return (
    <View style={[shell, { backgroundColor: tc.accent }, style]}>
      <Ionicons name={name} size={resolvedIconSize} color={iconColor ?? TOKENS.color.signal} />
    </View>
  );
}

const styles = StyleSheet.create({
  dangerCircle: {
    backgroundColor: TOKENS.status.cancelled.bg,
    borderWidth: 2,
    borderColor: withAlpha(TOKENS.color.error, 0.35),
  },
  successShadow: {
    shadowColor: TOKENS.color.mint,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 8,
  },
});
