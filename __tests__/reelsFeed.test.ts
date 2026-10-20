jest.mock('@/core/api/axiosinstance', () => ({ __esModule: true, default: { get: jest.fn() } }));
jest.mock('@react-native-async-storage/async-storage', () => ({ getItem: jest.fn(), setItem: jest.fn() }));
jest.mock('@/core/auth/tokenStorage', () => ({ tokenStorage: {} }));

import api from '@/core/api/axiosinstance';
import { getReelsFeed } from '@/features/reels/services/reels.service';
import { applyFollowToFeed, getReelIsFollowing } from '@/features/reels/utils/reelFollow';

describe('getReelsFeed', () => {
  beforeEach(() => {
    (api.get as jest.Mock).mockReset().mockResolvedValue({ data: [] });
  });

  it('omits the feed param for the default feed', async () => {
    await getReelsFeed(1, 10);
    expect(api.get).toHaveBeenCalledWith('/reels', { params: { page: 1, limit: 10 } });
  });

  it('sends feed=following only when requested', async () => {
    await getReelsFeed(2, 10, 'following');
    expect(api.get).toHaveBeenCalledWith('/reels', { params: { page: 2, limit: 10, feed: 'following' } });
  });
});

describe('getReelIsFollowing', () => {
  const user = { id: 'u1', name: 'A', username: 'a', avatar: null };

  it('prefers the root isFollowing', () => {
    expect(getReelIsFollowing({ isFollowing: true, user: { ...user, isFollowing: false } })).toBe(true);
    expect(getReelIsFollowing({ isFollowing: false, user: { ...user, isFollowing: true } })).toBe(false);
  });

  it('falls back to user.isFollowing, then false', () => {
    expect(getReelIsFollowing({ user: { ...user, isFollowing: true } })).toBe(true);
    expect(getReelIsFollowing({ user })).toBe(false);
  });
});

describe('applyFollowToFeed', () => {
  it('updates every cached reel of the author only', () => {
    const mk = (id: string, uid: string) => ({ id, user: { id: uid } } as any);
    const data = { pages: [[mk('r1', 'u1'), mk('r2', 'u2')], [mk('r3', 'u1')]] };
    const out = applyFollowToFeed(data, 'u1', true)!;
    expect(out.pages[0][0].isFollowing).toBe(true);
    expect(out.pages[0][1].isFollowing).toBeUndefined();
    expect(out.pages[1][0].isFollowing).toBe(true);
    expect(applyFollowToFeed(undefined, 'u1', true)).toBeUndefined();
  });
});
