import React from 'react';
import {
  useProfile as useProfileQuery,
  useUpdateProfile,
  useToggleAvailability,
} from '@/hooks/queries/useProfileQuery';
import type { UpdateProfilePayload } from '@/features/profile/services/profile';
import { getUserErrorMessage } from '@/lib/errors';

export const ProfileProvider = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
);

export const useProfile = () => {
  const query = useProfileQuery();
  const updateMutation = useUpdateProfile();
  const toggleMutation = useToggleAvailability();

  return {
    profile: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error ? getUserErrorMessage(query.error) : null,
    refreshProfile: async () => { await query.refetch(); },
    updateProfile: async (payload: UpdateProfilePayload) => {
      await updateMutation.mutateAsync(payload);
    },
    toggleAvailability: async () => {
      await toggleMutation.mutateAsync(!(query.data?.isAvailable ?? true));
    },
    clearError: () => {},
  };
};
