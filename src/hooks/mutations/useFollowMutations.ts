import { useMutation, useQueryClient } from '@tanstack/react-query';
import { followUser, unfollowUser } from '@/features/users/services/users';
import { REELS_FEED_KEY } from '@/hooks/queries/useReelsQuery';
import { applyFollowToFeed } from '@/features/reels/utils/reelFollow';

/** Optimistically mirrors the follow state onto every cached reels feed ("for you" + "following"). */
function useReelFollowSync() {
  const qc = useQueryClient();
  return {
    onMutate: async (userId: string, isFollowing: boolean) => {
      await qc.cancelQueries({ queryKey: REELS_FEED_KEY });
      const previous = qc.getQueriesData({ queryKey: REELS_FEED_KEY });
      qc.setQueriesData({ queryKey: REELS_FEED_KEY }, (old: any) =>
        applyFollowToFeed(old, userId, isFollowing),
      );
      return { previous };
    },
    rollback: (previous?: ReturnType<typeof qc.getQueriesData>) => {
      previous?.forEach(([key, data]) => qc.setQueryData(key, data));
    },
  };
}

export function useFollowUser() {
  const sync = useReelFollowSync();
  return useMutation({
    mutationFn: (userId: string) => followUser(userId),
    onMutate: (userId) => sync.onMutate(userId, true),
    onError: (_e, _id, ctx) => sync.rollback(ctx?.previous),
  });
}

export function useUnfollowUser() {
  const sync = useReelFollowSync();
  return useMutation({
    mutationFn: (userId: string) => unfollowUser(userId),
    onMutate: (userId) => sync.onMutate(userId, false),
    onError: (_e, _id, ctx) => sync.rollback(ctx?.previous),
  });
}
