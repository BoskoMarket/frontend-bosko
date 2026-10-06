import React from 'react';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { View, Text, StyleSheet } from 'react-native';
import { FONT_FAMILY, TOKENS, useThemeColors } from '@/core/design-system';

type Props = {
  /** 'lockup' = insignia + wordmark (default), 'mark' = solo insignia, 'wordmark' = solo texto */
  variant?: 'lockup' | 'mark' | 'wordmark';
  /** Alto de la insignia en px; el wordmark escala a partir de esto */
  size?: number;
  /** Versión de una sola tinta (para fondos de color no estándar) */
  mono?: boolean;
  /** Color de tinta de la "b" y el wordmark (default: `tc.text`, sigue el tema) */
  color?: string;
  /** Muestra "SERVICIOS EN RED · ARG" debajo del wordmark */
  tagline?: boolean;
};

/**
 * Insignia "bo" de Bosko — una b y una o minúsculas entrelazadas como
 * eslabones (cliente + proveedor). La b va sólida en color de tinta;
 * la o SIEMPRE lleva el degradado bordo→rosa y queda mayormente detrás
 * de la b (solo asoma una media luna) — nunca al revés, nunca en color plano.
 */
export function BrandMark({ variant = 'lockup', size = 56, mono = false, color, tagline = false }: Props) {
  const tc = useThemeColors();
  const ink = color ?? tc.text;
  const width = size * (118 / 120);

  const Mark = (
    <Svg width={width} height={size} viewBox="0 0 118 120">
      {!mono && (
        <Defs>
          <LinearGradient id="bkO" x1="0" y1="1" x2="1" y2="0">
            <Stop offset="0" stopColor={TOKENS.color.primary} />
            <Stop offset="1" stopColor={TOKENS.color.signal} />
          </LinearGradient>
        </Defs>
      )}
      {/* o — detrás, degradado, solo asoma una media luna a la derecha */}
      <Circle cx="78" cy="78" r="27" fill="none" stroke={mono ? ink : 'url(#bkO)'} strokeWidth={19} strokeLinecap="round" />
      {/* b — stem + bowl, sólida, siempre por encima */}
      <Path d="M10 14V78" fill="none" stroke={ink} strokeWidth={19} strokeLinecap="round" />
      <Circle cx="38" cy="78" r="28" fill="none" stroke={ink} strokeWidth={19} strokeLinecap="round" />
    </Svg>
  );

  if (variant === 'mark') return Mark;

  const Word = (
    <View style={{ gap: size * 0.08, alignItems: 'center' }}>
      <Text style={{ fontFamily: FONT_FAMILY.display, fontSize: size * 0.5, color: ink, textTransform: 'lowercase', letterSpacing: -0.5, textAlign: 'center' }}>
        bosko
      </Text>
      {tagline && (
        <Text style={{ fontFamily: FONT_FAMILY.mono, fontSize: 10, letterSpacing: 2.4, textTransform: 'uppercase', color: tc.textSub, textAlign: 'center' }}>
          Servicios en red · ARG
        </Text>
      )}
    </View>
  );

  if (variant === 'wordmark') return Word;

  return (
    <View style={[styles.row, { gap: size * 0.3 }]}>
      {Mark}
      {Word}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
});
