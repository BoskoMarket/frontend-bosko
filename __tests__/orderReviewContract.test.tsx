import React from 'react';
import { act, renderHook } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCreateReview } from '@/hooks/mutations/useReviewMutations';
import { QUERY_KEYS } from '@/core/query/queryKeys';

const mockCreateReview = jest.fn();
jest.mock('@/features/reviews/services/review.service', () => ({
  createReview: (...args: unknown[]) => mockCreateReview(...args),
}));
jest.mock('@/lib/reviewPrompt', () => ({ maybePromptReview: jest.fn() }));

let client: QueryClient;
const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
const payload = { orderId: 'o1', rating: 5, comment: 'Muy bueno' };

beforeEach(() => {
  mockCreateReview.mockReset();
  client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  client.setQueryData(QUERY_KEYS.orderById('o1'), { id: 'o1', review: null });
});

afterEach(() => client.clear());

it('invalidates the order requested by the client after a review succeeds', async () => {
  // The mutation response is not required to repeat the order id.
  mockCreateReview.mockResolvedValue({ providerId: 'p1' });
  const invalidate = jest.spyOn(client, 'invalidateQueries');
  const { result } = renderHook(() => useCreateReview(), { wrapper });
  await act(async () => { await result.current.mutateAsync(payload); });
  expect(invalidate).toHaveBeenCalledWith({ queryKey: QUERY_KEYS.orderById('o1') });
});

it('also refreshes the order after an already-reviewed conflict', async () => {
  mockCreateReview.mockRejectedValue(Object.assign(new Error('already reviewed'), {
    isAxiosError: true,
    response: { status: 409, data: { code: 'ALREADY_REVIEWED', statusCode: 409, message: 'Already reviewed' } },
  }));
  const invalidate = jest.spyOn(client, 'invalidateQueries');
  const { result } = renderHook(() => useCreateReview(), { wrapper });
  await act(async () => { await expect(result.current.mutateAsync(payload)).rejects.toThrow(); });
  expect(invalidate).toHaveBeenCalledWith({ queryKey: QUERY_KEYS.orderById('o1') });
});
