// Tipografía "Señal Nocturna": Archivo (ancho variable) para toda la interfaz —
// Expanded 118%/800/mayúscula solo en h1/h2 — más JetBrains Mono para
// metadatos técnicos (ratings, timestamps, IDs, estados en vivo).
import { BRAND } from './brand/brand';

// Reemplaza Space Grotesk. Instalar:
//   npx expo install @expo-google-fonts/archivo @expo-google-fonts/jetbrains-mono
// Family names live in BRAND.fonts (brand/brand.ts).
export const FONT_FAMILY = {
  display: BRAND.fonts.display,         // h1/h2 — usar junto a letterSpacing negativo + textTransform uppercase
  heading: BRAND.fonts.heading,         // h3/title
  headingMedium: BRAND.fonts.headingMedium, // subtitle/label
  mono: BRAND.fonts.mono,               // meta: ratings, counts, timestamps, IDs, "EN VIVO"
  body: BRAND.fonts.body,               // body/bodySmall
  bodyMedium: BRAND.fonts.bodyMedium,   // caption
} as const;

type FontWeight = '400' | '500' | '600' | '700' | '800';

// Each loaded static face is its own family and the weight lives in its name.
// Never pair these families with `fontWeight`: on Android expo-font registers
// every face as Typeface.NORMAL, and RN maps fontWeight >= 700 to BOLD, so the
// lookup misses and falls back to Roboto. Change weight by switching family.
export const FONT_FAMILY_BY_WEIGHT: Record<FontWeight, string> = {
  '400': FONT_FAMILY.body,
  '500': FONT_FAMILY.bodyMedium,
  '600': FONT_FAMILY.headingMedium,
  '700': FONT_FAMILY.heading,
  '800': FONT_FAMILY.display,
};

type TypeStyle = {
  fontSize: number;
  lineHeight: number;
  letterSpacing?: number;
  fontFamily: string;
  textTransform?: 'uppercase';
};

export const TYPE_SCALE: Record<
  'h1' | 'h2' | 'h3' | 'title' | 'subtitle' | 'body' | 'bodySmall' | 'caption' | 'label' | 'button' | 'meta',
  TypeStyle
> = {
  h1:       { fontSize: 30, lineHeight: 32, letterSpacing: -0.4, fontFamily: FONT_FAMILY.display, textTransform: 'uppercase' },
  h2:       { fontSize: 24, lineHeight: 27, letterSpacing: -0.4, fontFamily: FONT_FAMILY.display, textTransform: 'uppercase' },
  h3:       { fontSize: 20, lineHeight: 25, fontFamily: FONT_FAMILY.heading },
  title:    { fontSize: 17, lineHeight: 23, fontFamily: FONT_FAMILY.heading },
  subtitle: { fontSize: 16, lineHeight: 22, fontFamily: FONT_FAMILY.headingMedium },
  body:     { fontSize: 14, lineHeight: 20, fontFamily: FONT_FAMILY.body },
  bodySmall:{ fontSize: 13, lineHeight: 18, fontFamily: FONT_FAMILY.body },
  caption:  { fontSize: 12, lineHeight: 16, fontFamily: FONT_FAMILY.bodyMedium },
  label:    { fontSize: 13, lineHeight: 18, letterSpacing: 0.1, fontFamily: FONT_FAMILY.headingMedium },
  button:   { fontSize: 15, lineHeight: 20, fontFamily: FONT_FAMILY.heading },
  // NUEVO — mono uppercase, tracking amplio: "4.8 ★ / 32", "EN VIVO", "#ORD-2841"
  meta:     { fontSize: 11, lineHeight: 14, letterSpacing: 1.3, fontFamily: FONT_FAMILY.mono, textTransform: 'uppercase' },
};
