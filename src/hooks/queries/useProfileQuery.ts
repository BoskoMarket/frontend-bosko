import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/core/query/queryKeys';
import {
  getCurrentUserProfile,
  updateUserProfile,
  uploadAvatar,
  toggleAvailabilityService,
  getUserStats,
  type UpdateProfilePayload,
} from '@/features/profile/services/profile';
import { useAuth } from '@/features/auth/state/AuthContext';

export function useProfile() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: QUERY_KEYS.profile,
    queryFn: getCurrentUserProfile,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Selector granular: true solo si el usuario ya es prestador activo (backend).
 * Usar para mostrar/ocultar UI exclusiva de prestadores en vez de destructurar
 * `profile?.isProvider` a mano en cada pantalla.
 */
export function useIsProvider(): boolean {
  const { isAuthenticated } = useAuth();
  const { data } = useQuery({
    queryKey: QUERY_KEYS.profile,
    queryFn: getCurrentUserProfile,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    select: (profile) => profile.isProvider === true,
  });
  return data ?? false;
}

export function useProfileStats() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: QUERY_KEYS.profileStats,
    queryFn: getUserStats,
    enabled: isAuthenticated,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => updateUserProfile(payload),
    onSuccess: (updated) => {
      qc.setQueryData(QUERY_KEYS.profile, updated);
      qc.invalidateQueries({ queryKey: QUERY_KEYS.profile });
    },
  });
}

export function useToggleAvailability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (isAvailable: boolean) => toggleAvailabilityService(isAvailable),
    onMutate: async (isAvailable) => {
      await qc.cancelQueries({ queryKey: QUERY_KEYS.profile });
      const previous = qc.getQueryData(QUERY_KEYS.profile);
      qc.setQueryData(QUERY_KEYS.profile, (old: any) =>
        old ? { ...old, isAvailable } : old,
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      qc.setQueryData(QUERY_KEYS.profile, context?.previous);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.profile });
    },
  });
}

export function useUploadAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (fileUri: string) => uploadAvatar(fileUri),
    onSuccess: ({ avatarUrl }) => {
      qc.setQueryData(QUERY_KEYS.profile, (old: any) =>
        old ? { ...old, avatarUrl } : old,
      );
    },
  });
}

export function usePublicUser(userId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.publicUser(userId!),
    queryFn: () =>
      import('@/features/users/services/users').then((m) => m.fetchUserById(userId!)),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000,
  });
}
