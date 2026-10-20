import type { Reel } from '@/features/reels/services/reels.service';

/**
 * Follow flag of a reel. The backend returns `isFollowing` at the root of each
 * ReelDto; older payloads carried it under `user`.
 */
export function getReelIsFollowing(reel: Pick<Reel, 'isFollowing' | 'user'>): boolean {
  return reel.isFollowing ?? reel.user?.isFollowing ?? false;
}

/** Sets the follow flag on every cached reel authored by `userId` (infinite-query data shape). */
export function applyFollowToFeed<T extends { pages: Reel[][] }>(
  data: T | undefined,
  userId: string,
  isFollowing: boolean,
): T | undefined {
  if (!data) return data;
  return {
    ...data,
    pages: data.pages.map((page) =>
      page.map((reel) => (reel.user?.id === userId ? { ...reel, isFollowing } : reel)),
    ),
  };
}
