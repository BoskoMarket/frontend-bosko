import { useInfiniteQuery, useMutation, useQueries, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/core/query/queryKeys';
import {
  createWork,
  deleteWork,
  fetchServiceWorks,
  fetchWorksFeed,
  reportWork,
  updateWork,
} from '@/features/works/services/works.service';
import type { WorkFeedItem, WorkImageFile, WorksFeedPage } from '@/features/works/types';

export function getNextWorksCursor(last: WorksFeedPage): string | undefined {
  return last.nextCursor ?? undefined;
}

/** Public feed of finished jobs, optionally narrowed to one category. */
export function useWorksFeed(categoryId: string | null) {
  return useInfiniteQuery({
    queryKey: QUERY_KEYS.worksFeed(categoryId),
    queryFn: ({ pageParam }) => fetchWorksFeed({ cursor: pageParam, categoryId }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: getNextWorksCursor,
  });
}

/** Flattens feed pages; a cursor feed should not repeat ids, but the first occurrence wins anyway. */
export function flattenWorksPages(pages: ReadonlyArray<WorksFeedPage> | undefined): WorkFeedItem[] {
  const seen = new Set<string>();
  const out: WorkFeedItem[] = [];
  for (const page of pages ?? []) {
    for (const item of page.data) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      out.push(item);
    }
  }
  return out;
}

/** Photos of several services at once (Mis trabajos), in the same order as `serviceIds`. */
export function useServicesWorks(serviceIds: string[]) {
  return useQueries({
    queries: serviceIds.map((id) => ({
      queryKey: QUERY_KEYS.servicePosts(id),
      queryFn: () => fetchServiceWorks(id),
    })),
  });
}

/** Looks a feed item up in the cached feed pages (there is no single-post endpoint). */
export function useWorkFromCache(id: string | undefined): WorkFeedItem | undefined {
  const qc = useQueryClient();
  if (!id) return undefined;
  const feeds = qc.getQueriesData<InfiniteData<WorksFeedPage>>({ queryKey: QUERY_KEYS.worksFeedAll });
  for (const [, data] of feeds) {
    for (const page of data?.pages ?? []) {
      const hit = page.data.find((w) => w.id === id);
      if (hit) return hit;
    }
  }
  return undefined;
}

function useInvalidateWorks() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: QUERY_KEYS.worksFeedAll });
    qc.invalidateQueries({ queryKey: QUERY_KEYS.servicePostsAll });
  };
}

export function useCreateWork() {
  const invalidate = useInvalidateWorks();
  return useMutation({
    mutationFn: ({ serviceId, file, description }: { serviceId: string; file: WorkImageFile; description?: string }) =>
      createWork(serviceId, { file, description }),
    onSuccess: invalidate,
  });
}

export function useUpdateWork() {
  const invalidate = useInvalidateWorks();
  return useMutation({
    mutationFn: ({ postId, description }: { postId: string; description: string }) => updateWork(postId, description),
    onSuccess: invalidate,
  });
}

export function useDeleteWork() {
  const invalidate = useInvalidateWorks();
  return useMutation({
    mutationFn: (postId: string) => deleteWork(postId),
    onSuccess: invalidate,
  });
}

export function useReportWork() {
  return useMutation({
    mutationFn: ({ postId, reason, details }: { postId: string; reason: string; details?: string }) =>
      reportWork(postId, reason, details),
  });
}
