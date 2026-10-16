import React from 'react';
import { View, ViewStyle } from 'react-native';
import { TOKENS } from '@/core/design-system/tokens';
import { withAlpha } from '@/core/design-system/color';

interface BlurViewProps {
  intensity?: number;
  tint?: string;
  style?: ViewStyle | any;
  children?: React.ReactNode;
  [key: string]: any;
}

export function BlurView({ intensity = 20, tint = 'light', style, children, ...props }: BlurViewProps) {
  const bg = tint === 'dark'
    ? withAlpha(TOKENS.blurTint.dark, Math.min(intensity / 100, 0.6))
    : withAlpha(TOKENS.blurTint.light, Math.min(intensity / 100, 0.85));

  return (
    <View style={[style, { backgroundColor: bg }]} {...props}>
      {children}
    </View>
  );
}
