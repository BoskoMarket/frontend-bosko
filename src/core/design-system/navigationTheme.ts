import { useMemo } from 'react';
import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';
import { useIsDark, useThemeColors } from '@/stores/theme.store';

/**
 * React Navigation theme derived from the DS palette. Without it, expo-router
 * falls back to DefaultTheme (near-white scene background) and every screen
 * transition flashes white, ignoring dark mode.
 */
export function useNavigationTheme(): Theme {
  const tc = useThemeColors();
  const isDark = useIsDark();

  return useMemo(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      dark: isDark,
      colors: {
        ...base.colors,
        primary: tc.primary,
        background: tc.bg,
        card: tc.bg,
        text: tc.text,
        border: tc.border,
        notification: tc.signal,
      },
    };
  }, [tc, isDark]);
}
