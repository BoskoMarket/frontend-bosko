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
  body: BRAND.fonts.body,               // system font
} as const;

type TypeStyle = {
  fontSize: number;
  fontWeight: '400' | '500' | '600' | '700' | '800';
  lineHeight: number;
  letterSpacing?: number;
  fontFamily?: string;
  textTransform?: 'uppercase';
};

export const TYPE_SCALE: Record<
  'h1' | 'h2' | 'h3' | 'title' | 'subtitle' | 'body' | 'bodySmall' | 'caption' | 'label' | 'button' | 'meta',
  TypeStyle
> = {
  h1:       { fontSize: 30, fontWeight: '800', lineHeight: 32, letterSpacing: -0.4, fontFamily: FONT_FAMILY.display, textTransform: 'uppercase' },
  h2:       { fontSize: 24, fontWeight: '800', lineHeight: 27, letterSpacing: -0.4, fontFamily: FONT_FAMILY.display, textTransform: 'uppercase' },
  h3:       { fontSize: 20, fontWeight: '700', lineHeight: 25, fontFamily: FONT_FAMILY.heading },
  title:    { fontSize: 17, fontWeight: '700', lineHeight: 23, fontFamily: FONT_FAMILY.heading },
  subtitle: { fontSize: 16, fontWeight: '600', lineHeight: 22, fontFamily: FONT_FAMILY.headingMedium },
  body:     { fontSize: 14, fontWeight: '400', lineHeight: 20 },
  bodySmall:{ fontSize: 13, fontWeight: '400', lineHeight: 18 },
  caption:  { fontSize: 12, fontWeight: '500', lineHeight: 16 },
  label:    { fontSize: 13, fontWeight: '600', lineHeight: 18, letterSpacing: 0.1 },
  button:   { fontSize: 15, fontWeight: '600', lineHeight: 20, fontFamily: FONT_FAMILY.heading },
  // NUEVO — mono uppercase, tracking amplio: "4.8 ★ / 32", "EN VIVO", "#ORD-2841"
  meta:     { fontSize: 11, fontWeight: '500', lineHeight: 14, letterSpacing: 1.3, fontFamily: FONT_FAMILY.mono, textTransform: 'uppercase' },
};
