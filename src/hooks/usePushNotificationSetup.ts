import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import { usePushPreference } from '@/hooks/queries/usePushPreference';
import { registerDeviceForPush } from '@/features/notifications/services/push-preferences';
import { captureError } from '@/core/monitoring/sentry';

export function usePushNotificationSetup() {
  const { query, accountId, isAuthenticated } = usePushPreference();
  useEffect(() => {
    if (!isAuthenticated || !accountId || query.data !== true || !Device.isDevice || Platform.OS === 'web') return;
    registerDeviceForPush().catch(error => captureError(error, { operation: 'registerPush' }));
  }, [isAuthenticated, accountId, query.data]);
}
