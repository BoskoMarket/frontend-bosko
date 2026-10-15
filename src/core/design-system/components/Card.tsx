import React from 'react';
import { View, ViewProps, ViewStyle, Pressable } from 'react-native';
import { BlurView } from '@/core/components/BlurView';
import { useIsDark, useThemeColors } from '@/stores/theme.store';
import { TOKENS } from '../tokens';
import { SPACING, SpacingKey } from '../spacing';

export interface CardProps extends ViewProps {
  padding?: SpacingKey;
  radius?: keyof typeof TOKENS.radius;
  bordered?: boolean;
  elevated?: boolean;
  onPress?: () => void;
  /** Layout styles for the inner surface (gap, flexDirection, alignItems…). `style` targets the outer wrapper. */
  contentStyle?: ViewStyle;
}

/**
 * Surface — "Señal Nocturna": vidrio translúcido (`tc.card`) con `BlurView`
 * detrás (tint según el tema), en vez de un panel sólido. `elevated`
 * ahora usa el glow rosa (`TOKENS.shadow.glow`) en vez de la sombra negra
 * genérica — reservalo para cards que "flotan" (listing, modal), no para
 * filas de lista comunes (esas van solo con `bordered`).
 */
export function Card({
  padding = 'lg',
  radius = 'md',
  bordered = true,
  elevated = false,
  onPress,
  style,
  contentStyle,
  children,
  ...rest
}: CardProps) {
  const tc = useThemeColors();
  const isDark = useIsDark();
  const radiusValue = TOKENS.radius[radius];
  const outerStyle: ViewStyle = {
    borderRadius: radiusValue,
    overflow: 'visible',
    ...(elevated ? TOKENS.shadow.glow : null),
  };

  const surfaceStyle: ViewStyle = {
    borderRadius: radiusValue,
    padding: SPACING[padding],
    overflow: 'hidden',
    backgroundColor: tc.card,
    ...(bordered ? { borderWidth: 1, borderColor: tc.cardBorder } : null),
    ...contentStyle,
  };

  const surface = (
    <BlurView intensity={16} tint={isDark ? 'dark' : 'light'} style={surfaceStyle}>
      {children}
    </BlurView>
  );

  if (onPress) return <Pressable onPress={onPress} style={[outerStyle, style]} {...rest}>{surface}</Pressable>;

  return <View style={[outerStyle, style]} {...rest}>{surface}</View>;
}
