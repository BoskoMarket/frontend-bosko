import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';

const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
jest.mock('@/features/works/services/works.service', () => ({
  createWork: (...a: unknown[]) => mockCreate(...a),
  updateWork: (...a: unknown[]) => mockUpdate(...a),
  deleteWork: (...a: unknown[]) => mockDelete(...a),
  fetchServiceWorks: jest.fn(),
  fetchWorksFeed: jest.fn(),
  reportWork: jest.fn(),
}));

import { QUERY_KEYS } from '@/core/query/queryKeys';
import {
  useCreateWork,
  useDeleteWork,
  useUpdateWork,
  useWorkFromCache,
} from '@/hooks/queries/useWorksQuery';

const work = (id: string, description: string | null = null) =>
  ({ id, description, imageUrl: 'u', thumbnailUrl: null, width: null, height: null }) as any;

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  const spy = jest.spyOn(qc, 'invalidateQueries');
  const invalidatedKeys = () => spy.mock.calls.map((c) => (c[0] as any).queryKey);
  return { qc, wrapper, invalidatedKeys };
}

beforeEach(() => jest.clearAllMocks());

describe('works mutations invalidate the feed and the service posts', () => {
  it.each([
    ['create', () => useCreateWork(), () => mockCreate, { serviceId: 's1', file: { uri: 'f', mimeType: 'image/jpeg' } }],
    ['update', () => useUpdateWork(), () => mockUpdate, { postId: 'p1', description: 'x' }],
    ['delete', () => useDeleteWork(), () => mockDelete, 'p1'],
  ] as const)('%s', async (_name, hook, svc, vars) => {
    const { wrapper, invalidatedKeys } = setup();
    svc().mockResolvedValueOnce({});
    const { result } = renderHook(() => hook() as any, { wrapper });
    await act(async () => {
      await result.current.mutateAsync(vars);
    });
    expect(invalidatedKeys()).toEqual(
      expect.arrayContaining([QUERY_KEYS.worksFeedAll, QUERY_KEYS.servicePostsAll]),
    );
  });

  it('still refreshes after a failed write (it may have landed)', async () => {
    const { wrapper, invalidatedKeys } = setup();
    mockCreate.mockRejectedValueOnce(new Error('timeout'));
    const { result } = renderHook(() => useCreateWork(), { wrapper });
    await act(async () => {
      await result.current
        .mutateAsync({ serviceId: 's1', file: { uri: 'f', mimeType: 'image/jpeg' } })
        .catch(() => undefined);
    });
    expect(invalidatedKeys()).toEqual(
      expect.arrayContaining([QUERY_KEYS.worksFeedAll, QUERY_KEYS.servicePostsAll]),
    );
  });

  it('a delete of an already-removed post leaves the list consistent after refetch', async () => {
    const { qc, wrapper } = setup();
    qc.setQueryData(QUERY_KEYS.servicePosts('s1'), [work('p1'), work('p2')]);
    mockDelete.mockResolvedValueOnce(undefined); // the service maps 404 POST_NOT_FOUND to success
    // An active observer (the open Mis trabajos screen) is what makes the invalidation refetch.
    const { result } = renderHook(
      () => {
        useQuery({ queryKey: QUERY_KEYS.servicePosts('s1'), queryFn: async () => [work('p2')], staleTime: Infinity });
        return useDeleteWork();
      },
      { wrapper },
    );
    await act(async () => {
      await result.current.mutateAsync('p1');
    });
    await waitFor(() =>
      expect((qc.getQueryData(QUERY_KEYS.servicePosts('s1')) as any[]).map((w) => w.id)).toEqual(['p2']),
    );
  });
});

describe('useWorkFromCache', () => {
  const feed = (...ids: string[]) => ({
    pages: [{ data: ids.map((i) => work(i)), nextCursor: null }],
    pageParams: [undefined],
  });

  it('finds an item in any cached page and reacts to cache changes', () => {
    const { qc, wrapper } = setup();
    qc.setQueryData(QUERY_KEYS.worksFeed(null), {
      pages: [{ data: [work('a')], nextCursor: 'n' }, { data: [work('b', 'old')], nextCursor: null }],
      pageParams: [undefined, 'n'],
    });
    const { result } = renderHook(() => useWorkFromCache('b'), { wrapper });
    expect(result.current?.description).toBe('old');

    act(() => {
      qc.setQueryData(QUERY_KEYS.worksFeed(null), {
        pages: [{ data: [work('a')], nextCursor: 'n' }, { data: [work('b', 'new')], nextCursor: null }],
        pageParams: [undefined, 'n'],
      });
    });
    expect(result.current?.description).toBe('new');

    act(() => {
      qc.setQueryData(QUERY_KEYS.worksFeed(null), feed('a'));
    });
    expect(result.current).toBeUndefined();
  });

  it('is undefined for an unknown or missing id', () => {
    const { qc, wrapper } = setup();
    qc.setQueryData(QUERY_KEYS.worksFeed(null), feed('a'));
    expect(renderHook(() => useWorkFromCache('zzz'), { wrapper }).result.current).toBeUndefined();
    expect(renderHook(() => useWorkFromCache(undefined), { wrapper }).result.current).toBeUndefined();
  });
});

describe('query keys', () => {
  it('feed key differs per category and all share the feed prefix', () => {
    expect(QUERY_KEYS.worksFeed('c1')).not.toEqual(QUERY_KEYS.worksFeed('c2'));
    expect(QUERY_KEYS.worksFeed(null)).not.toEqual(QUERY_KEYS.worksFeed('c1'));
    expect(QUERY_KEYS.worksFeed('c1').slice(0, 2)).toEqual([...QUERY_KEYS.worksFeedAll]);
  });
});
