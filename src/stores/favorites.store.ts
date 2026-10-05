import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ServiceSummary } from '@/types/services';
import { toast } from '@/core/components/Toast';

interface FavoritesState {
  accountId: string | null;
  favorites: ServiceSummary[];
  ready: boolean;
  setAccount: (accountId: string | null) => Promise<void>;
  isFavorite: (id: string) => boolean;
  toggle: (service: ServiceSummary) => void;
}
let writes: Promise<unknown> = Promise.resolve();
let generation = 0;
const key = (id: string) => `BOSKO_FAVORITES_v3:${encodeURIComponent(id)}`;
export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  accountId: null, favorites: [], ready: false,
  setAccount: async accountId => {
    const version = ++generation;
    set({ accountId, favorites: [], ready: false });
    if (!accountId) return;
    try {
      await writes.catch(() => {});
      const raw = await AsyncStorage.getItem(key(accountId));
      const rows = raw ? JSON.parse(raw) : [];
      if (version === generation) set({ favorites: Array.isArray(rows) ? rows : [], ready: true });
    } catch {
      if (version === generation) { set({ ready: true }); toast.error('No se pudieron cargar tus favoritos'); }
    }
  },
  isFavorite: id => get().favorites.some(row => row.id === id),
  toggle: service => {
    const { accountId, favorites, ready } = get();
    if (!accountId || !ready) return;
    const version = generation;
    const next = favorites.some(row => row.id === service.id)
      ? favorites.filter(row => row.id !== service.id) : [service, ...favorites];
    set({ favorites: next });
    writes = writes.catch(() => {}).then(() => AsyncStorage.setItem(key(accountId), JSON.stringify(next))).catch(() => {
      if (version === generation) toast.error('No se pudieron guardar tus favoritos');
    });
  },
}));
export const useFavoritesList = () => useFavoritesStore(s => s.favorites);
export const useIsFavorite = (id: string) => useFavoritesStore(s => s.isFavorite(id));
export const useFavoritesCount = () => useFavoritesStore(s => s.favorites.length);
