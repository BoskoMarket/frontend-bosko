import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_PREFIX } from '@/core/config/storage';

interface AppLockState {
  biometricEnabled: boolean;
  setBiometricEnabled: (enabled: boolean) => void;
}

export const useAppLockStore = create<AppLockState>()(
  persist(
    (set) => ({
      biometricEnabled: true,
      setBiometricEnabled: (biometricEnabled) => set({ biometricEnabled }),
    }),
    {
      name: `${STORAGE_PREFIX}_APP_LOCK_v1`,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ biometricEnabled: state.biometricEnabled }),
    },
  ),
);

export const useBiometricEnabled = () => useAppLockStore((s) => s.biometricEnabled);
export const useSetBiometricEnabled = () => useAppLockStore((s) => s.setBiometricEnabled);
