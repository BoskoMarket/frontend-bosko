import React from 'react';
import { Text as RNText, TextProps, TextStyle } from 'react-native';
import { FONT_FAMILY, FONT_FAMILY_BY_WEIGHT, TYPE_SCALE } from '../typography';
import { useThemeColors } from '@/stores/theme.store';

type Variant = keyof typeof TYPE_SCALE;

export interface AppTextProps extends TextProps {
  variant?: Variant;
  color?: string;
  weight?: TextStyle['fontWeight'];
  center?: boolean;
}

// A weight override switches to the Archivo face of that weight (see
// FONT_FAMILY_BY_WEIGHT) without setting fontWeight, which breaks custom fonts
// on Android. Mono has a single face, so it ignores the override.
function weightStyle(weight: NonNullable<TextStyle['fontWeight']>, family: string): TextStyle | null {
  if (family === FONT_FAMILY.mono) return null;
  const key = weight === 'bold' ? '700' : weight === 'normal' ? '400' : String(weight);
  const face = FONT_FAMILY_BY_WEIGHT[key as keyof typeof FONT_FAMILY_BY_WEIGHT];
  return face ? { fontFamily: face } : null;
}

/**
 * Sin cambios de comportamiento respecto al archivo original — solo consume
 * el nuevo `TYPE_SCALE` (Archivo Expanded en h1/h2 con `textTransform:
 * 'uppercase'`, nuevo rol `meta` en JetBrains Mono para ratings/timestamps/IDs).
 */
export function Text({ variant = 'body', color, weight, center, style, ...rest }: AppTextProps) {
  const tc = useThemeColors();
  const preset = TYPE_SCALE[variant];

  return (
    <RNText
      style={[
        preset,
        { color: color ?? tc.text },
        weight ? weightStyle(weight, preset.fontFamily) : null,
        center ? { textAlign: 'center' } : null,
        style,
      ]}
      {...rest}
    />
  );
}
