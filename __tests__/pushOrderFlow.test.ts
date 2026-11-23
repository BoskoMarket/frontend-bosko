import { QueryClient } from '@tanstack/react-query';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { resolvePushTapRoute } from '@/features/notifications/utils/pushTapRoute';
import { invalidateOnPush } from '@/features/notifications/utils/refreshOnPush';
import { QUERY_KEYS } from '@/core/query/queryKeys';
import { useDisputeOrder } from '@/hooks/queries/useOrdersQuery';

jest.mock('@/features/orders/services/orders.service', () => ({
  disputeOrder: jest.fn().mockResolvedValue({}),
}));
jest.mock('@/core/components/Toast', () => ({ toast: { error: jest.fn() } }));

const noLookup = jest.fn().mockResolvedValue(null);
const orderRoute = (id: string) => ({ pathname: '/orders/[id]', params: { id } });

describe('resolvePushTapRoute', () => {
  it.each([
    'ORDER_AWAITING_CONFIRMATION', 'ORDER_CANCELLED', 'ORDER_EXPIRED', 'ORDER_AUTO_CLOSED', 'ORDER_DISPUTED',
  ])('%s opens the order from data.orderId', async (type) => {
    await expect(resolvePushTapRoute({ type, orderId: 'o9' }, noLookup)).resolves.toEqual(orderRoute('o9'));
  });

  it('keeps legacy order and review types', async () => {
    await expect(resolvePushTapRoute({ type: 'order', orderId: 'o1' }, noLookup)).resolves.toEqual(orderRoute('o1'));
    await expect(resolvePushTapRoute({ type: 'review', orderId: 'o2' }, noLookup)).resolves.toEqual(orderRoute('o2'));
  });

  it('chat with orderId opens the chat; with only conversationId resolves the order', async () => {
    await expect(resolvePushTapRoute({ type: 'NEW_MESSAGE', orderId: 'o3' }, noLookup))
      .resolves.toEqual({ pathname: '/chat/[id]', params: { id: 'o3' } });
    const lookup = jest.fn().mockResolvedValue('o7');
    await expect(resolvePushTapRoute({ type: 'NEW_MESSAGE', conversationId: 'c1' }, lookup))
      .resolves.toEqual({ pathname: '/chat/[id]', params: { id: 'o7' } });
    expect(lookup).toHaveBeenCalledWith('c1');
  });

  it('unknown types or missing data fall back to the notifications list (null)', async () => {
    await expect(resolvePushTapRoute({ type: 'whatever' }, noLookup)).resolves.toBeNull();
    await expect(resolvePushTapRoute({ type: 'NEW_MESSAGE' }, noLookup)).resolves.toBeNull();
    await expect(resolvePushTapRoute(undefined, noLookup)).resolves.toBeNull();
  });
});

describe('invalidateOnPush', () => {
  it('invalidates unread, order lists, the order detail and conversations', () => {
    const qc = new QueryClient();
    const spy = jest.spyOn(qc, 'invalidateQueries');
    invalidateOnPush(qc, { orderId: 'o5' });
    const keys = spy.mock.calls.map(c => (c[0] as { queryKey: unknown }).queryKey);
    expect(keys).toEqual(expect.arrayContaining([
      QUERY_KEYS.unreadCount, QUERY_KEYS.clientOrders, QUERY_KEYS.providerOrders,
      QUERY_KEYS.orderById('o5'), QUERY_KEYS.conversations,
    ]));
  });

  it('without orderId it invalidates every order detail', () => {
    const qc = new QueryClient();
    const spy = jest.spyOn(qc, 'invalidateQueries');
    invalidateOnPush(qc, {});
    expect(spy).toHaveBeenCalledWith({ queryKey: ['orders'] });
  });
});

describe('useDisputeOrder', () => {
  it('patches client and provider lists and the detail to disputed', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const list = { pageParams: [1], pages: [{ data: [{ id: 'o1', status: 'in_progress' }, { id: 'o2', status: 'pending' }] }] };
    qc.setQueryData(QUERY_KEYS.clientOrders, list);
    qc.setQueryData(QUERY_KEYS.providerOrders, list);
    qc.setQueryData(QUERY_KEYS.orderById('o1'), { id: 'o1', status: 'in_progress' });
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: qc }, children);
    const { result } = renderHook(() => useDisputeOrder(), { wrapper });
    // Keep the lists from refetching (no queryFn): inspect the optimistic state.
    const invalidate = jest.spyOn(qc, 'invalidateQueries').mockResolvedValue();
    await act(async () => { await result.current.mutateAsync({ id: 'o1', payload: { reason: 'Problema grave' } }); });
    for (const key of [QUERY_KEYS.clientOrders, QUERY_KEYS.providerOrders]) {
      const data = qc.getQueryData<typeof list>(key)!;
      expect(data.pages[0].data.map((o: { status: string }) => o.status)).toEqual(['disputed', 'pending']);
    }
    expect(qc.getQueryData<{ status: string }>(QUERY_KEYS.orderById('o1'))!.status).toBe('disputed');
    await waitFor(() => expect(invalidate).toHaveBeenCalledWith({ queryKey: QUERY_KEYS.clientOrders }));
    expect(invalidate).toHaveBeenCalledWith({ queryKey: QUERY_KEYS.providerOrders });
  });
});
