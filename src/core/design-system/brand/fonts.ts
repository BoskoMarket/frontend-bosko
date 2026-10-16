// Font assets passed to expo-font's useFonts() in app/_layout.tsx.
// Keys must match the family names in BRAND.fonts. A rebrand swaps the imports
// here together with BRAND.fonts in brand.ts.
import {
  Archivo_400Regular,
  Archivo_500Medium,
  Archivo_600SemiBold,
  Archivo_700Bold,
  Archivo_800ExtraBold,
} from '@expo-google-fonts/archivo';
import { JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono';
import { BRAND } from './brand';

export const FONT_ASSETS = {
  [BRAND.fonts.display]: Archivo_800ExtraBold,
  [BRAND.fonts.heading]: Archivo_700Bold,
  [BRAND.fonts.headingMedium]: Archivo_600SemiBold,
  [BRAND.fonts.mono]: JetBrainsMono_500Medium,
  [BRAND.fonts.body]: Archivo_400Regular,
  [BRAND.fonts.bodyMedium]: Archivo_500Medium,
};
