import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/state/AuthContext';
import { readPushPreference, savePushPreference, registerDeviceForPush } from '@/features/notifications/services/push-preferences';
import { deletePushToken } from '@/features/notifications/services/notifications.service';

export function usePushPreference() {
  const { authState, isAuthenticated } = useAuth();
  const accountId = authState.user?.id ?? authState.userEmail;
  const qc = useQueryClient();
  const queryKey = ['pushPreference', accountId];
  const query = useQuery({ queryKey, queryFn: () => readPushPreference(accountId!), enabled: isAuthenticated && !!accountId });
  const mutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!accountId) throw new Error('Iniciá sesión para cambiar tus preferencias.');
      if (enabled) await registerDeviceForPush();
      else await deletePushToken();
      await savePushPreference(accountId, enabled);
      return enabled;
    },
    onSuccess: enabled => qc.setQueryData(queryKey, enabled),
  });
  return { query, mutation, accountId, isAuthenticated };
}
