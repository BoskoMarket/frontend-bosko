import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/core/query/queryKeys';
import { fetchMyPlan } from '@/features/plans/services/plan.service';

/** Current subscription of the user (null when on the free tier). */
export function useMyPlan() {
  return useQuery({
    queryKey: QUERY_KEYS.myPlan,
    queryFn: () => fetchMyPlan(),
  });
}
