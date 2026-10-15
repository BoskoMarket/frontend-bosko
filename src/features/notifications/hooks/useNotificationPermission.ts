import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

const isExpoGo = Constants.appOwnership === 'expo';

/**
 * `true` cuando el usuario denegó el permiso de notificaciones del sistema.
 * Se vuelve a leer al regresar a la app (por si lo activó desde Ajustes).
 * Nunca pide el permiso: solo informa. En Expo Go no aplica.
 */
export function useNotificationsDenied(): boolean {
  const [denied, setDenied] = useState(false);

  const check = useCallback(async () => {
    if (isExpoGo) return;
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setDenied(status === 'denied');
    } catch {
      setDenied(false);
    }
  }, []);

  useEffect(() => {
    check();
    const sub = AppState.addEventListener('change', (s) => { if (s === 'active') check(); });
    return () => sub.remove();
  }, [check]);

  return denied;
}
