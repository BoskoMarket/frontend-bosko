/**
 * Conecta TanStack Query con el ciclo de vida real de React Native:
 * - `onlineManager` ← NetInfo (conectividad real, no la del navegador)
 * - `focusManager` ← AppState (foreground/background, no window focus)
 *
 * Sin esto, `refetchOnWindowFocus`/`refetchOnReconnect` no tienen fuente de
 * verdad en RN y una query nunca se refresca al volver del background o al
 * recuperar señal — queda con datos stale hasta el próximo staleTime.
 */
import { onlineManager, focusManager } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';
import { AppState, type AppStateStatus } from 'react-native';

let initialized = false;

export function setupQueryNetworkFocus() {
  if (initialized) return;
  initialized = true;

  onlineManager.setEventListener((setOnline) => {
    return NetInfo.addEventListener((state) => {
      setOnline(!!state.isConnected && state.isInternetReachable !== false);
    });
  });

  const onAppStateChange = (status: AppStateStatus) => {
    focusManager.setFocused(status === 'active');
  };
  AppState.addEventListener('change', onAppStateChange);
}
