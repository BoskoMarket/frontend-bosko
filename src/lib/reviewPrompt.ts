/**
 * Prompt nativo de rating (App Store / Play Store) en momentos de alta
 * satisfacción — se llama después de una reseña enviada o una orden
 * completada. Nunca más de una vez cada 90 días, y expo-store-review ya
 * respeta el límite anual que impone cada store por su cuenta.
 */
import * as StoreReview from 'expo-store-review';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'BOSKO_LAST_REVIEW_PROMPT_v1';
const MIN_INTERVAL_MS = 90 * 24 * 60 * 60 * 1000;

export async function maybePromptReview(): Promise<void> {
  try {
    const available = await StoreReview.isAvailableAsync();
    if (!available) return;

    const lastRaw = await AsyncStorage.getItem(STORAGE_KEY);
    const last = lastRaw ? Number(lastRaw) : 0;
    if (Date.now() - last < MIN_INTERVAL_MS) return;

    await AsyncStorage.setItem(STORAGE_KEY, String(Date.now()));
    await StoreReview.requestReview();
  } catch {
    // Nunca debe romper el flujo que lo dispara.
  }
}
