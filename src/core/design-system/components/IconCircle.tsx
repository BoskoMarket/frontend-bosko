import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { TOKENS } from '../tokens';
import { GRADIENTS } from '../gradients';
import { MOTION } from '../motion';

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
 * - `success`: gradiente menta + ringPop de entrada. Email verificado.
 * - `danger`: status-cancelled-bg + borde. Eliminar cuenta, rechazos.
 */
export function IconCircle({ name, variant = 'neutral', size = 80, iconSize, iconColor, style }: IconCircleProps) {
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
      <View style={[shell, styles.opaqueShadowBase, TOKENS.shadow.glow, style]}>
        <LinearGradient colors={GRADIENTS.brand} style={shell}>
          <Ionicons name={name} size={resolvedIconSize} color={iconColor ?? '#fff'} />
        </LinearGradient>
      </View>
    );
  }

  if (variant === 'success') {
    return (
      <Animated.View
        style={[shell, styles.opaqueShadowBase, styles.successShadow, { opacity: pop, transform: [{ scale: pop }] }, style]}
      >
        <LinearGradient colors={[TOKENS.color.mint, '#00b382']} style={shell}>
          <Ionicons name={name} size={resolvedIconSize} color={iconColor ?? '#fff'} />
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
    <View style={[shell, styles.neutralCircle, style]}>
      <Ionicons name={name} size={resolvedIconSize} color={iconColor ?? TOKENS.color.signal} />
    </View>
  );
}

const styles = StyleSheet.create({
  opaqueShadowBase: { backgroundColor: '#0A0910' },
  neutralCircle: { backgroundColor: 'rgba(255,45,111,0.14)' },
  dangerCircle: {
    backgroundColor: TOKENS.status.cancelled.bg,
    borderWidth: 2,
    borderColor: 'rgba(255,77,77,0.35)',
  },
  successShadow: {
    shadowColor: '#00E5A0',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 8,
  },
});
