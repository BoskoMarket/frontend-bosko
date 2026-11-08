import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/core/query/queryKeys';
import { setMyCity } from '@/features/profile/services/profile';

/** Sets the city of an authenticated account that has none (`PATCH /users/me/city`). */
export function useSetCity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (cityId: string) => setMyCity(cityId),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.profile }),
  });
}
