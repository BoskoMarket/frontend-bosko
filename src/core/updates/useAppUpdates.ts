import { useEffect, useState } from 'react';
import * as Updates from 'expo-updates';

/**
 * Chequea actualizaciones OTA al montar. Sin esto, expo-updates las baja en
 * background igual, pero recién se aplican en el próximo cold-start "de
 * casualidad" — sin aviso al usuario.
 */
export function useAppUpdates() {
  const [updateReady, setUpdateReady] = useState(false);

  useEffect(() => {
    if (__DEV__ || !Updates.isEnabled) return;

    (async () => {
      try {
        const check = await Updates.checkForUpdateAsync();
        if (!check.isAvailable) return;
        await Updates.fetchUpdateAsync();
        setUpdateReady(true);
      } catch {
        // Sin conexión o build no publicado vía EAS Update — ignorar en silencio.
      }
    })();
  }, []);

  const applyUpdate = () => {
    Updates.reloadAsync().catch(() => {});
  };

  return { updateReady, applyUpdate };
}
