import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/core/query/queryKeys';
import {
  fetchOrdersAsClient,
  fetchOrdersAsProvider,
  fetchOrderById,
  createOrder,
  acceptOrder,
  rejectOrder,
  startOrder,
  completeOrder,
  cancelOrder,
  disputeOrder,
} from '@/features/orders/services/orders.service';
import type {
  CreateOrderPayload,
  RejectOrderPayload,
  DisputeOrderPayload,
  Order,
  OrderStatus,
} from '@/features/orders/types/orders.types';
import { toast } from '@/core/components/Toast';
import { getUserErrorMessage } from '@/lib/errors';

export function useClientOrders() {
  return useQuery({
    queryKey: QUERY_KEYS.clientOrders,
    queryFn: () => fetchOrdersAsClient(),
  });
}

export function useProviderOrders() {
  return useQuery({
    queryKey: QUERY_KEYS.providerOrders,
    queryFn: () => fetchOrdersAsProvider(),
  });
}

/**
 * Number of provider orders still waiting for a response (status "pending").
 * Shares the provider-orders cache entry (same key/fn) and only runs for
 * providers; `select` derives the count without an extra request.
 */
export function usePendingProviderRequestsCount(enabled: boolean) {
  const { data } = useQuery({
    queryKey: QUERY_KEYS.providerOrders,
    queryFn: () => fetchOrdersAsProvider(),
    enabled,
    select: (orders: Order[]) => orders.filter((o) => o.status === 'pending').length,
  });
  return enabled ? data ?? 0 : 0;
}

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.orderById(id!),
    queryFn: () => fetchOrderById(id!),
    enabled: !!id,
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateOrderPayload) => createOrder(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.clientOrders });
    },
  });
}

export function useAcceptOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => acceptOrder(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: QUERY_KEYS.providerOrders });
      await qc.cancelQueries({ queryKey: QUERY_KEYS.orderById(id) });
      const prevList  = qc.getQueryData<Order[]>(QUERY_KEYS.providerOrders);
      const prevOrder = qc.getQueryData<Order>(QUERY_KEYS.orderById(id));
      qc.setQueryData<Order[]>(QUERY_KEYS.providerOrders, old =>
        old?.map(o => o.id === id ? { ...o, status: 'accepted' as OrderStatus } : o)
      );
      if (prevOrder) {
        qc.setQueryData<Order>(QUERY_KEYS.orderById(id), { ...prevOrder, status: 'accepted' });
      }
      return { prevList, prevOrder };
    },
    onError: (err, id, ctx) => {
      if (ctx?.prevList)  qc.setQueryData(QUERY_KEYS.providerOrders, ctx.prevList);
      if (ctx?.prevOrder) qc.setQueryData(QUERY_KEYS.orderById(id), ctx.prevOrder);
      toast.error('No se pudo aceptar la orden', getUserErrorMessage(err));
    },
    onSettled: (_data, _err, id) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.providerOrders });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.orderById(id) });
    },
  });
}

export function useRejectOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: RejectOrderPayload }) =>
      rejectOrder(id, payload),
    onMutate: async ({ id }) => {
      await qc.cancelQueries({ queryKey: QUERY_KEYS.providerOrders });
      await qc.cancelQueries({ queryKey: QUERY_KEYS.orderById(id) });
      const prevList  = qc.getQueryData<Order[]>(QUERY_KEYS.providerOrders);
      const prevOrder = qc.getQueryData<Order>(QUERY_KEYS.orderById(id));
      qc.setQueryData<Order[]>(QUERY_KEYS.providerOrders, old =>
        old?.map(o => o.id === id ? { ...o, status: 'cancelled' as OrderStatus } : o)
      );
      if (prevOrder) {
        qc.setQueryData<Order>(QUERY_KEYS.orderById(id), { ...prevOrder, status: 'cancelled' });
      }
      return { prevList, prevOrder };
    },
    onError: (err, { id }, ctx) => {
      if (ctx?.prevList)  qc.setQueryData(QUERY_KEYS.providerOrders, ctx.prevList);
      if (ctx?.prevOrder) qc.setQueryData(QUERY_KEYS.orderById(id), ctx.prevOrder);
      toast.error('No se pudo rechazar la orden', getUserErrorMessage(err));
    },
    onSettled: (_data, _err, { id }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.providerOrders });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.orderById(id) });
    },
  });
}

export function useStartOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => startOrder(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: QUERY_KEYS.providerOrders });
      await qc.cancelQueries({ queryKey: QUERY_KEYS.orderById(id) });
      const prevList  = qc.getQueryData<Order[]>(QUERY_KEYS.providerOrders);
      const prevOrder = qc.getQueryData<Order>(QUERY_KEYS.orderById(id));
      qc.setQueryData<Order[]>(QUERY_KEYS.providerOrders, old =>
        old?.map(o => o.id === id ? { ...o, status: 'in_progress' as OrderStatus } : o)
      );
      if (prevOrder) {
        qc.setQueryData<Order>(QUERY_KEYS.orderById(id), { ...prevOrder, status: 'in_progress' });
      }
      return { prevList, prevOrder };
    },
    onError: (err, id, ctx) => {
      if (ctx?.prevList)  qc.setQueryData(QUERY_KEYS.providerOrders, ctx.prevList);
      if (ctx?.prevOrder) qc.setQueryData(QUERY_KEYS.orderById(id), ctx.prevOrder);
      toast.error('No se pudo iniciar la orden', getUserErrorMessage(err));
    },
    onSettled: (_data, _err, id) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.providerOrders });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.orderById(id) });
    },
  });
}

export function useCompleteOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => completeOrder(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: QUERY_KEYS.clientOrders });
      await qc.cancelQueries({ queryKey: QUERY_KEYS.providerOrders });
      await qc.cancelQueries({ queryKey: QUERY_KEYS.orderById(id) });
      const prevClient  = qc.getQueryData<Order[]>(QUERY_KEYS.clientOrders);
      const prevProvider = qc.getQueryData<Order[]>(QUERY_KEYS.providerOrders);
      const prevOrder   = qc.getQueryData<Order>(QUERY_KEYS.orderById(id));
      const patch = (old?: Order[]) =>
        old?.map(o => o.id === id ? { ...o, status: 'completed' as OrderStatus } : o);
      qc.setQueryData<Order[]>(QUERY_KEYS.clientOrders, patch);
      qc.setQueryData<Order[]>(QUERY_KEYS.providerOrders, patch);
      if (prevOrder) {
        qc.setQueryData<Order>(QUERY_KEYS.orderById(id), { ...prevOrder, status: 'completed' });
      }
      return { prevClient, prevProvider, prevOrder };
    },
    onError: (err, id, ctx) => {
      if (ctx?.prevClient)   qc.setQueryData(QUERY_KEYS.clientOrders, ctx.prevClient);
      if (ctx?.prevProvider) qc.setQueryData(QUERY_KEYS.providerOrders, ctx.prevProvider);
      if (ctx?.prevOrder)    qc.setQueryData(QUERY_KEYS.orderById(id), ctx.prevOrder);
      toast.error('No se pudo completar la orden', getUserErrorMessage(err));
    },
    onSettled: (_data, _err, id) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.clientOrders });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.providerOrders });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.orderById(id) });
    },
  });
}

export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: RejectOrderPayload }) =>
      cancelOrder(id, payload),
    onMutate: async ({ id }) => {
      await qc.cancelQueries({ queryKey: QUERY_KEYS.clientOrders });
      await qc.cancelQueries({ queryKey: QUERY_KEYS.providerOrders });
      await qc.cancelQueries({ queryKey: QUERY_KEYS.orderById(id) });
      const prevClient   = qc.getQueryData<Order[]>(QUERY_KEYS.clientOrders);
      const prevProvider = qc.getQueryData<Order[]>(QUERY_KEYS.providerOrders);
      const prevOrder    = qc.getQueryData<Order>(QUERY_KEYS.orderById(id));
      const patch = (old?: Order[]) =>
        old?.map(o => o.id === id ? { ...o, status: 'cancelled' as OrderStatus } : o);
      qc.setQueryData<Order[]>(QUERY_KEYS.clientOrders, patch);
      qc.setQueryData<Order[]>(QUERY_KEYS.providerOrders, patch);
      if (prevOrder) {
        qc.setQueryData<Order>(QUERY_KEYS.orderById(id), { ...prevOrder, status: 'cancelled' });
      }
      return { prevClient, prevProvider, prevOrder };
    },
    onError: (err, { id }, ctx) => {
      if (ctx?.prevClient)   qc.setQueryData(QUERY_KEYS.clientOrders, ctx.prevClient);
      if (ctx?.prevProvider) qc.setQueryData(QUERY_KEYS.providerOrders, ctx.prevProvider);
      if (ctx?.prevOrder)    qc.setQueryData(QUERY_KEYS.orderById(id), ctx.prevOrder);
      toast.error('No se pudo cancelar la orden', getUserErrorMessage(err));
    },
    onSettled: (_data, _err, { id }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.clientOrders });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.providerOrders });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.orderById(id) });
    },
  });
}

export function useDisputeOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: DisputeOrderPayload }) =>
      disputeOrder(id, payload),
    onMutate: async ({ id }) => {
      await qc.cancelQueries({ queryKey: QUERY_KEYS.orderById(id) });
      const prevOrder = qc.getQueryData<Order>(QUERY_KEYS.orderById(id));
      if (prevOrder) {
        qc.setQueryData<Order>(QUERY_KEYS.orderById(id), { ...prevOrder, status: 'disputed' });
      }
      return { prevOrder };
    },
    onError: (err, { id }, ctx) => {
      if (ctx?.prevOrder) qc.setQueryData(QUERY_KEYS.orderById(id), ctx.prevOrder);
      toast.error('No se pudo abrir la disputa', getUserErrorMessage(err));
    },
    onSettled: (_data, _err, { id }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.orderById(id) });
    },
  });
}
