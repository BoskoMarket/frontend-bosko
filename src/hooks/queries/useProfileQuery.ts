import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/core/query/queryKeys';
import {
  getCurrentUserProfile,
  updateUserProfile,
  uploadAvatar,
  uploadBanner,
  removeBanner,
  toggleAvailabilityService,
  getUserStats,
  type UpdateProfilePayload,
  type BannerFile,
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
/** Provider role plus whether it is still unknown (profile loading for a signed-in user). */
export function useProviderRole(): { isProvider: boolean; isResolving: boolean } {
  const { isAuthenticated } = useAuth();
  const { data, isPending } = useQuery({
    queryKey: QUERY_KEYS.profile,
    queryFn: getCurrentUserProfile,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    select: (profile) => profile.isProvider === true,
  });
  return { isProvider: data ?? false, isResolving: isAuthenticated && isPending };
}

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

/** Portada del perfil propio. */
export function useUploadBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: BannerFile) => uploadBanner(file),
    onSuccess: ({ bannerUrl }) => {
      qc.setQueryData(QUERY_KEYS.profile, (old: any) =>
        old ? { ...old, bannerUrl } : old,
      );
      qc.invalidateQueries({ queryKey: QUERY_KEYS.profile });
    },
  });
}

export function useRemoveBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => removeBanner(),
    onSuccess: ({ bannerUrl }) => {
      qc.setQueryData(QUERY_KEYS.profile, (old: any) =>
        old ? { ...old, bannerUrl } : old,
      );
      qc.invalidateQueries({ queryKey: QUERY_KEYS.profile });
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
