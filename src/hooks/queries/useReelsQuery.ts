import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/core/query/queryKeys';
import { nextCollectionPage } from '@/core/api/collections';
import {
  getReelsFeed,
  toggleLikeReel,
  createReel,
  deleteReel,
  getReelComments,
  deleteReelComment,
  reportReel,
  getMyReels,
  updateReel,
  type ReelsFeedType,
  type CreateReelPayload,
  type UpdateReelPayload,
} from '@/features/reels/services/reels.service';

const REELS_KEY = ['reels'] as const;
export const REELS_FEED_KEY = QUERY_KEYS.reelsFeedAll;
const reelsFeedKey = (feed?: ReelsFeedType) => QUERY_KEYS.reelsFeed(feed ?? 'foryou');
const MY_REELS_KEY = ['reels', 'me'] as const;
const reelCommentsKey = (reelId: string) => ['reels', reelId, 'comments'] as const;

export function useReelsFeed(feed?: ReelsFeedType) {
  return useInfiniteQuery({
    queryKey: reelsFeedKey(feed),
    queryFn: ({ pageParam = 1 }) => getReelsFeed(pageParam as number, 10, feed),
    initialPageParam: 1,
    getNextPageParam: (lastPage: any[], allPages) =>
      lastPage.length === 10 ? allPages.length + 1 : undefined,
  });
}

export function useToggleLikeReel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reelId: string) => toggleLikeReel(reelId),
    onMutate: async (reelId) => {
      await qc.cancelQueries({ queryKey: REELS_FEED_KEY });
      const previous = qc.getQueriesData({ queryKey: REELS_FEED_KEY });
      qc.setQueriesData({ queryKey: REELS_FEED_KEY }, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any[]) =>
            page.map((reel: any) =>
              reel.id === reelId
                ? { ...reel, isLiked: !reel.isLiked, likes: reel.isLiked ? reel.likes - 1 : reel.likes + 1 }
                : reel,
            ),
          ),
        };
      });
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.previous.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: REELS_KEY });
    },
  });
}

export function useCreateReel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateReelPayload) => createReel(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: REELS_KEY });
    },
  });
}

export function useDeleteReel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reelId: string) => deleteReel(reelId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: REELS_KEY });
      qc.invalidateQueries({ queryKey: MY_REELS_KEY });
    },
  });
}

export function useMyReels() {
  return useInfiniteQuery({
    queryKey: MY_REELS_KEY,
    queryFn: ({ pageParam }) => getMyReels(pageParam),
    initialPageParam: 1,
    getNextPageParam: nextCollectionPage,
  });
}

export function useUpdateReel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ reelId, payload }: { reelId: string; payload: UpdateReelPayload }) =>
      updateReel(reelId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: REELS_KEY });
      qc.invalidateQueries({ queryKey: MY_REELS_KEY });
    },
  });
}

export function useReelComments(reelId: string) {
  return useQuery({
    queryKey: reelCommentsKey(reelId),
    queryFn: () => getReelComments(reelId),
    enabled: !!reelId,
  });
}

export function useDeleteReelComment(reelId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => deleteReelComment(reelId, commentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: reelCommentsKey(reelId) });
      qc.invalidateQueries({ queryKey: REELS_KEY });
    },
  });
}

export function useReportReel() {
  return useMutation({
    mutationFn: ({ reelId, reason, details }: { reelId: string; reason: string; details?: string }) =>
      reportReel(reelId, reason, details),
  });
}
