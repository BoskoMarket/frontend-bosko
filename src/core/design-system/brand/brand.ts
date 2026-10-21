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
    rating: '#F59E0B', // star ratings (filled star / score)

    // Decorative hero-banner ramps (white text on top, same in both themes)
    hero: {
      aurora: ['#2D1B69', '#11998E', '#38EF7D'], // indigo -> teal -> lime
      midnight: ['#1A1A2E', '#16213E', '#0F3460'], // deep navy
    },

    // Absolute
    white: '#FFFFFF',
    black: '#000000',

    // Dark theme neutrals
    dark: {
      bg: '#0A0910',
      surface: '#131118',
      text: '#EDEAF5',
      overlayBase: '#050409',
      wine: '#1A000D', // mid-stop of the auth/onboarding backdrop gradient
      track: '#2D2A3A', // theme-switch track
    },

    // Light theme neutrals
    light: {
      bg: '#F7F5FB',
      surface: '#FFFFFF',
      surface2: '#F0EDF5',
      text: '#14111C',
      ink: '#0A0910',
      wine: '#F4E6EE',
    },

    // Legacy light-only values (kept for TOKENS.color.bg/text/sub, deprecated)
    legacy: {
      bg: '#FAFAFC',
      text: '#1E1E1E',
      sub: '#6B6B6B',
    },

    // Pastel category tints for promo cards (pink, green, yellow, blue, lilac, peach).
    // bg = card surface, ink = text/icon on it, cta = CTA pill fill. Dark = deeper, muted surfaces.
    categoryTints: {
      light: [
        { bg: '#F9C6EE', ink: '#3A1233', cta: '#3A1233' }, // pink
        { bg: '#CDE8B8', ink: '#1F3318', cta: '#1F3318' }, // green
        { bg: '#F7E2A6', ink: '#3B2E08', cta: '#3B2E08' }, // yellow
        { bg: '#B9DCF8', ink: '#112A44', cta: '#112A44' }, // blue
        { bg: '#DCCDF3', ink: '#2A1A48', cta: '#2A1A48' }, // lilac
        { bg: '#F8D3BC', ink: '#40200E', cta: '#40200E' }, // peach
      ],
      dark: [
        { bg: '#4A2145', ink: '#FBE4F7', cta: '#F9C6EE' },
        { bg: '#243A22', ink: '#E6F5D9', cta: '#CDE8B8' },
        { bg: '#4A3D14', ink: '#FBF0CC', cta: '#F7E2A6' },
        { bg: '#1C3550', ink: '#DCEEFC', cta: '#B9DCF8' },
        { bg: '#392C57', ink: '#EEE6FB', cta: '#DCCDF3' },
        { bg: '#4D2E1C', ink: '#FCE8DB', cta: '#F8D3BC' },
      ],
    },

    // Premium (gold) treatment. Primary/primaryDark are the brand ones (the legacy
    // Colors.ts #850221/#5c0117 were a typo). Gold fills are theme-independent; the
    // theme-specific values drive PREMIUM_PALETTE.dark / .light.
    premium: {
      gold: '#FFD700', // bright gold: fills, and icons/text over dark or brand surfaces
      goldDeep: '#B8860B', // end stop of the gold gradient
      onGold: '#1A0505', // ink on gold fills
      dark: {
        background: '#0F0F0F',
        card: '#1E1E1E',
        cardEnd: '#1A1A1A',
        panel: '#1A0505', // deep wine panel (provider CTA)
        panelEnd: '#2D0A0A',
        goldText: '#FFD700',
      },
      light: {
        background: '#FBF8F1',
        card: '#FFFFFF',
        cardEnd: '#F6F0E2',
        panel: '#FFF3EE',
        panelEnd: '#F8E3E3',
        goldText: '#7A5800', // darker gold: >= 4.5:1 contrast on the light backgrounds
      },
    },
  },

  fonts: {
    display: 'Archivo_800ExtraBold',
    heading: 'Archivo_700Bold',
    headingMedium: 'Archivo_600SemiBold',
    mono: 'JetBrainsMono_500Medium',
    body: 'Archivo_400Regular',
    bodyMedium: 'Archivo_500Medium',
  },
} as const;
