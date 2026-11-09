import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_PREFIX } from '@/core/config/storage';
import type { ServiceSummary } from '@/types/services';

const KEY = `${STORAGE_PREFIX}_FAVORITES_v1`;

export async function loadFavorites(): Promise<ServiceSummary[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveFavorites(items: ServiceSummary[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(items));
}

export async function addFavorite(service: ServiceSummary): Promise<ServiceSummary[]> {
  const current = await loadFavorites();
  if (current.find(s => s.id === service.id)) return current;
  const updated = [service, ...current];
  await saveFavorites(updated);
  return updated;
}

export async function removeFavorite(serviceId: string): Promise<ServiceSummary[]> {
  const current = await loadFavorites();
  const updated = current.filter(s => s.id !== serviceId);
  await saveFavorites(updated);
  return updated;
}
