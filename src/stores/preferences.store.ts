import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

/** When reels start playing on their own. */
export type ReelsAutoplay = 'always' | 'wifi';

interface PreferencesState {
  reelsAutoplay: ReelsAutoplay;
  setReelsAutoplay: (value: ReelsAutoplay) => void;
}

/** User app preferences (client-only, persisted locally). */
export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      reelsAutoplay: 'always',
      setReelsAutoplay: (reelsAutoplay) => set({ reelsAutoplay }),
    }),
    {
      name: 'BOSKO_PREFERENCES_v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ reelsAutoplay: state.reelsAutoplay }),
    },
  ),
);

export const useReelsAutoplay = () => usePreferencesStore((s) => s.reelsAutoplay);
export const useSetReelsAutoplay = () => usePreferencesStore((s) => s.setReelsAutoplay);
