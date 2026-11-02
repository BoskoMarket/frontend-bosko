import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockGet = jest.fn();
const mockPatch = jest.fn();
jest.mock('@/core/api/axiosinstance', () => ({
  __esModule: true,
  default: { get: (...a: any[]) => mockGet(...a), patch: (...a: any[]) => mockPatch(...a) },
}));

import { useAdminReports, useReviewReport } from '@/hooks/queries/useAdminReportsQuery';
import { QUERY_KEYS } from '@/core/query/queryKeys';

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } });
  const wrapper = ({ children }: any) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  return { qc, wrapper };
}

beforeEach(() => jest.clearAllMocks());

describe('useAdminReports', () => {
  it('sends the status filter and paginates until total is reached', async () => {
    mockGet
      .mockResolvedValueOnce({ data: { data: [{ id: 'a' }], total: 2, page: 1, limit: 1 } })
      .mockResolvedValueOnce({ data: { data: [{ id: 'b' }], total: 2, page: 2, limit: 1 } });
    const { wrapper } = setup();
    const { result } = renderHook(() => useAdminReports('pending'), { wrapper });

    await waitFor(() => expect(result.current.data).toEqual([{ id: 'a' }]));
    expect(mockGet).toHaveBeenCalledWith('/admin/reports', { params: { page: 1, limit: 20, status: 'pending' } });
    expect(result.current.hasNextPage).toBe(true);

    await act(async () => { await result.current.fetchNextPage(); });
    expect(mockGet).toHaveBeenLastCalledWith('/admin/reports', { params: { page: 2, limit: 20, status: 'pending' } });
    await waitFor(() => expect(result.current.data).toEqual([{ id: 'a' }, { id: 'b' }]));
    expect(result.current.hasNextPage).toBe(false);
  });

  it('omits status for "all" and rejects a malformed page', async () => {
    mockGet.mockResolvedValueOnce({ data: { items: [] } });
    const { wrapper } = setup();
    const { result } = renderHook(() => useAdminReports(undefined), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockGet).toHaveBeenCalledWith('/admin/reports', { params: { page: 1, limit: 20 } });
  });
});

describe('useReviewReport', () => {
  it('PATCHes status + trimmed notes and invalidates the queue', async () => {
    mockPatch.mockResolvedValue({ data: { id: 'r1', status: 'reviewed' } });
    const { qc, wrapper } = setup();
    const spy = jest.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useReviewReport(), { wrapper });

    await act(async () => { await result.current.mutateAsync({ id: 'r1', status: 'reviewed', notes: '  ok  ' }); });
    expect(mockPatch).toHaveBeenCalledWith('/admin/reports/r1', { status: 'reviewed', notes: 'ok' });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['admin', 'reports'] });
    expect(QUERY_KEYS.adminReports('pending').slice(0, 2)).toEqual(['admin', 'reports']);
  });

  it('omits empty notes', async () => {
    mockPatch.mockResolvedValue({ data: { id: 'r1', status: 'dismissed' } });
    const { wrapper } = setup();
    const { result } = renderHook(() => useReviewReport(), { wrapper });
    await act(async () => { await result.current.mutateAsync({ id: 'r1', status: 'dismissed', notes: '   ' }); });
    expect(mockPatch).toHaveBeenCalledWith('/admin/reports/r1', { status: 'dismissed' });
  });
});
