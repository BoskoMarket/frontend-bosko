import { useMutation, useQueryClient } from '@tanstack/react-query';
import { followUser, unfollowUser } from '@/features/users/services/users';
import { QUERY_KEYS } from '@/core/query/queryKeys';
import { applyFollowToFeed } from '@/features/reels/utils/reelFollow';

/**
 * Optimistically mirrors the follow state onto every cached reels feed ("for you" + "following").
 * No cancelQueries: it would abort an in-flight fetchNextPage. Rollback applies the inverse flag
 * instead of restoring snapshots, so concurrent optimistic updates (likes) survive.
 */
function useReelFollowSync() {
  const qc = useQueryClient();
  const apply = (userId: string, isFollowing: boolean) =>
    qc.setQueriesData({ queryKey: QUERY_KEYS.reelsFeedAll }, (old: any) =>
      applyFollowToFeed(old, userId, isFollowing),
    );
  return {
    onMutate: (userId: string, isFollowing: boolean) => apply(userId, isFollowing),
    rollback: (userId: string, isFollowing: boolean) => apply(userId, !isFollowing),
    // Membership of the "following" feed changed: refetch it.
    onSettled: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.reelsFeed('following') }),
  };
}

export function useFollowUser() {
  const sync = useReelFollowSync();
  return useMutation({
    mutationFn: (userId: string) => followUser(userId),
    onMutate: (userId) => sync.onMutate(userId, true),
    onError: (_e, userId) => sync.rollback(userId, true),
    onSettled: sync.onSettled,
  });
}

export function useUnfollowUser() {
  const sync = useReelFollowSync();
  return useMutation({
    mutationFn: (userId: string) => unfollowUser(userId),
    onMutate: (userId) => sync.onMutate(userId, false),
    onError: (_e, userId) => sync.rollback(userId, false),
    onSettled: sync.onSettled,
  });
}
