import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/core/query/queryKeys';
import { fetchCities } from '@/features/markets/services/cities.service';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Public list of cities. Static data: cached for a day, available before sign-in. */
export function useCitiesQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.cities,
    queryFn: fetchCities,
    staleTime: DAY_MS,
    gcTime: 2 * DAY_MS,
  });
}
