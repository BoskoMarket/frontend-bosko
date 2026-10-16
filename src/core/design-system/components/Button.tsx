import React, { useState } from 'react';
import { ActivityIndicator, Pressable, PressableProps, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TOKENS } from '../tokens';
import { SPACING } from '../spacing';
import { GRADIENTS } from '../gradients';
import { withAlpha } from '../color';
import { Text } from './Text';
import { useThemeColors } from '@/stores/theme.store';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  icon?: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

const SIZE_H = { sm: 38, md: 48, lg: 56 } as const;
const SIZE_PAD = { sm: SPACING.md, md: SPACING.lg, lg: SPACING.xl } as const;

/**
 * Botón — "Señal Nocturna". El primary lleva el glow rosa (`TOKENS.shadow.glow`)
 * en vez de una sombra negra genérica, y ese glow se INTENSIFICA al presionar
 * (RN no tiene :hover real en mobile, así que el estado de "encendido" vive en
 * el press: shadowRadius/shadowOpacity suben y el botón escala a 0.97).
 * Secondary/outline/ghost pasan a superficie de vidrio + borde rosa translúcido.
 */
export function Button({
  label,
  icon,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const tc = useThemeColors();
  const [pressed, setPressed] = useState(false);
  const isDisabled = disabled || loading;
  const height = SIZE_H[size];

  const shell: ViewStyle = {
    height,
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SIZE_PAD[size],
    borderRadius: TOKENS.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: isDisabled ? 0.5 : 1,
    ...(fullWidth ? { width: '100%' } : null),
  };

  const textColor = variant === 'outline' || variant === 'ghost' ? TOKENS.color.signal : TOKENS.color.onPrimary;

  const content = loading ? (
    <ActivityIndicator color={textColor} />
  ) : (
    <>
      {icon}
      <Text variant="button" color={textColor}>{label}</Text>
    </>
  );

  const press = { onPressIn: () => setPressed(true), onPressOut: () => setPressed(false) };

  if (variant === 'primary') {
    // Glow wrapper: shadowRadius/Opacity sube al presionar — es el reemplazo
    // de un :hover, ya que en touch no existe estado de hover real.
    const glowStyle: ViewStyle = {
      borderRadius: TOKENS.radius.md,
      // Android: elevation sin backgroundColor opaco dibuja una caja negra
      // detrás en vez de respetar el borderRadius — mismo fix que cards/inputs.
      backgroundColor: tc.bg,
      shadowColor: TOKENS.color.signal,
      shadowOffset: { width: 0, height: pressed ? 4 : 8 },
      shadowOpacity: pressed ? 0.55 : 0.4,
      shadowRadius: pressed ? 30 : 24,
      // Sin `elevation`: con newArchEnabled (Fabric) Android ya renderiza
      // shadowColor/shadowOffset/shadowRadius igual que iOS. Combinarlo con
      // elevation dibuja DOS sombras superpuestas — la silueta redondeada de
      // la sombra offset (shadowOffset) se veía como "un recuadro corrido
      // hacia abajo" además de la sombra nativa de elevation.
    };
    return (
      <View style={[glowStyle, fullWidth && { width: '100%' }]}>
        <Pressable
          disabled={isDisabled}
          {...press}
          {...rest}
          style={[styles.pressable, fullWidth && { width: '100%' }, { transform: [{ scale: pressed ? 0.97 : 1 }] }, style]}
        >
          <LinearGradient colors={GRADIENTS.brand} style={shell}>
            {content}
          </LinearGradient>
        </Pressable>
      </View>
    );
  }

  if (variant === 'danger') {
    return (
      <Pressable disabled={isDisabled} {...press} {...rest} style={[shell, { backgroundColor: TOKENS.color.error, transform: [{ scale: pressed ? 0.97 : 1 }] }, style]}>
        {content}
      </Pressable>
    );
  }

  if (variant === 'secondary') {
    // Vidrio: superficie translúcida + borde — antes backgroundColor sólido tc.surface2
    return (
      <Pressable
        disabled={isDisabled}
        {...press}
        {...rest}
        style={[shell, {
          backgroundColor: pressed ? tc.border : tc.surface2,
          borderWidth: 1,
          borderColor: tc.border,
        }, style]}
      >
        {loading ? <ActivityIndicator color={tc.text} /> : <>{icon}<Text variant="button" color={tc.text}>{label}</Text></>}
      </Pressable>
    );
  }

  if (variant === 'outline') {
    return (
      <Pressable
        disabled={isDisabled}
        {...press}
        {...rest}
        style={[shell, {
          backgroundColor: pressed ? tc.accent : 'transparent',
          borderWidth: 1.5,
          borderColor: withAlpha(TOKENS.color.signal, 0.5),
        }, style]}
      >
        {content}
      </Pressable>
    );
  }

  // ghost
  return (
    <Pressable
      disabled={isDisabled}
      {...press}
      {...rest}
      style={[shell, { backgroundColor: pressed ? tc.accent : 'transparent' }, style]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: { borderRadius: TOKENS.radius.md, overflow: 'hidden' },
});
