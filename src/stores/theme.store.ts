import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PALETTE } from '@/core/design-system/palette';
import type { PaletteColors } from '@/core/design-system/palette';
import { PREMIUM_PALETTE } from '@/core/design-system/premium';

export type ThemeMode = 'dark' | 'light';

// Paleta real vive en design-system/palette.ts (fuente única de color).
// Este store solo agrega el toggle/persist encima.
export const THEME_COLORS = PALETTE;

export type ThemeColors = PaletteColors;

interface ThemeState {
  mode: ThemeMode;
  toggle: () => void;
  setMode: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'dark',
      toggle: () => set({ mode: get().mode === 'dark' ? 'light' : 'dark' }),
      setMode: (mode) => set({ mode }),
    }),
    {
      name: 'BOSKO_THEME_v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ mode: state.mode }),
    },
  ),
);

export const useThemeMode   = () => useThemeStore((s) => s.mode);
export const useThemeColors = () => THEME_COLORS[useThemeStore((s) => s.mode)];
export const useToggleTheme = () => useThemeStore((s) => s.toggle);
export const useIsDark      = () => useThemeStore((s) => s.mode === 'dark');
// Premium (gold) palette follows the same light/dark mode.
export const usePremiumColors = () => PREMIUM_PALETTE[useThemeStore((s) => s.mode)];
