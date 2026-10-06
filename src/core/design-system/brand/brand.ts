// BRAND — the ONLY file to edit for a rebrand.
// Every raw color / font family name lives here. Everything else in the design
// system (palette, tokens, gradients, premium, typography) derives from it.
// Screens never import this directly: they consume semantic tokens/components.
export const BRAND = {
  name: 'Bosko',

  colors: {
    // Brand
    primary: '#850021',
    primaryDark: '#3C0014',
    primaryMid: '#A0032A',
    signal: '#FF2D6F',
    mint: '#00E5A0',
    mintDeep: '#00B382',

    // Status
    error: '#FF4D4D',
    warning: '#FFB020',
    info: '#4C9DFF',
    progress: '#B07CFF',

    // Absolute
    white: '#FFFFFF',
    black: '#000000',

    // Dark theme neutrals
    dark: {
      bg: '#0A0910',
      surface: '#131118',
      text: '#EDEAF5',
      overlayBase: '#050409',
    },

    // Light theme neutrals
    light: {
      bg: '#F7F5FB',
      surface: '#FFFFFF',
      surface2: '#F0EDF5',
      text: '#14111C',
      ink: '#0A0910',
    },

    // Legacy light-only values (kept for TOKENS.color.bg/text/sub, deprecated)
    legacy: {
      bg: '#FAFAFC',
      text: '#1E1E1E',
      sub: '#6B6B6B',
    },

    // Premium (gold-on-dark) treatment
    premium: {
      primary: '#850221',
      primaryDark: '#5c0117',
      background: '#0f0f0f',
      card: '#1e1e1e',
      gold: '#FFD700',
    },
  },

  fonts: {
    display: 'Archivo_800ExtraBold',
    heading: 'Archivo_700Bold',
    headingMedium: 'Archivo_600SemiBold',
    mono: 'JetBrainsMono_500Medium',
    body: undefined, // system font
  },
} as const;
