import { useInfiniteQuery, useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { flattenUniqueById, nextCollectionPage } from '@/core/api/collections';
import { QUERY_KEYS } from '@/core/query/queryKeys';
import {
  fetchAdminReports,
  reviewAdminReport,
  type AdminReportFilter,
  type PaginatedAdminReports,
} from '@/features/admin/services/reports.service';

const selectReports = (data: InfiniteData<PaginatedAdminReports, number>) => flattenUniqueById(data.pages);

/** Moderation queue for one status filter (`undefined` = all). */
export function useAdminReports(status: AdminReportFilter) {
  return useInfiniteQuery({
    queryKey: QUERY_KEYS.adminReports(status),
    queryFn: ({ pageParam }) => fetchAdminReports(status, pageParam),
    initialPageParam: 1,
    getNextPageParam: nextCollectionPage,
    select: selectReports,
    retry: false,
  });
}

/** Marks a report as reviewed/dismissed and refreshes every queue tab. */
export function useReviewReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: reviewAdminReport,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'reports'] }),
  });
}
