import React, { useCallback } from 'react';
import { fetchOrderById } from '../services/orders.service';
import type { CreateOrderPayload, RejectOrderPayload, DisputeOrderPayload, Order } from '../types/orders.types';
import {
  useClientOrders as useClientOrdersQuery,
  useProviderOrders as useProviderOrdersQuery,
  useCreateOrder,
  useAcceptOrder,
  useRejectOrder,
  useStartOrder,
  useCompleteOrder,
  useCancelOrder,
  useDisputeOrder,
} from '@/hooks/queries/useOrdersQuery';
import { getUserErrorMessage } from '@/lib/errors';

export const OrdersProvider = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
);

export const useOrders = () => {
  const clientQ = useClientOrdersQuery();
  const providerQ = useProviderOrdersQuery();
  const createM = useCreateOrder();
  const acceptM = useAcceptOrder();
  const rejectM = useRejectOrder();
  const startM = useStartOrder();
  const completeM = useCompleteOrder();
  const cancelM = useCancelOrder();
  const disputeM = useDisputeOrder();
  const loadClientOrders = useCallback(async () => { await clientQ.refetch(); }, [clientQ.refetch]);
  const loadProviderOrders = useCallback(async () => { await providerQ.refetch(); }, [providerQ.refetch]);

  return {
    clientOrders: clientQ.data ?? [],
    providerOrders: providerQ.data ?? [],
    clientHasMore: clientQ.hasNextPage,
    providerHasMore: providerQ.hasNextPage,
    clientLoadingMore: clientQ.isFetchingNextPage,
    providerLoadingMore: providerQ.isFetchingNextPage,
    clientFetching: clientQ.isFetching,
    providerFetching: providerQ.isFetching,
    clientMoreError: clientQ.isFetchNextPageError,
    providerMoreError: providerQ.isFetchNextPageError,
    loadMoreClientOrders: clientQ.fetchNextPage,
    loadMoreProviderOrders: providerQ.fetchNextPage,
    loading: clientQ.isLoading || providerQ.isLoading,
    error: clientQ.error
      ? getUserErrorMessage(clientQ.error)
      : providerQ.error
        ? getUserErrorMessage(providerQ.error)
        : null,

    loadClientOrders,
    loadProviderOrders,
    getOrder: (id: string): Promise<Order | undefined> =>
      fetchOrderById(id).catch(() => undefined),
    addOrder: (payload: CreateOrderPayload): Promise<Order> =>
      createM.mutateAsync(payload),

    acceptOrder: (id: string) => acceptM.mutateAsync(id).then(() => {}),
    rejectOrder: (id: string, payload: RejectOrderPayload) =>
      rejectM.mutateAsync({ id, payload }).then(() => {}),
    startOrder: (id: string) => startM.mutateAsync(id).then(() => {}),
    completeOrder: (id: string) => completeM.mutateAsync(id).then(() => {}),
    cancelOrder: (id: string, payload: RejectOrderPayload) =>
      cancelM.mutateAsync({ id, payload }).then(() => {}),
    disputeOrder: (id: string, payload: DisputeOrderPayload) =>
      disputeM.mutateAsync({ id, payload }).then(() => {}),

    clearError: () => {},
  };
};
