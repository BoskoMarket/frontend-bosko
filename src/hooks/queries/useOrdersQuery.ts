import { useQuery, useInfiniteQuery, useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { flattenUniqueById, nextCollectionPage } from '@/core/api/collections';
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
  PaginatedResponse,
} from '@/features/orders/types/orders.types';
import { toast } from '@/core/components/Toast';
import { getUserErrorMessage } from '@/lib/errors';

type OrdersPages = InfiniteData<PaginatedResponse<Order>, number>;
const selectOrders = (data: OrdersPages): Order[] => flattenUniqueById(data.pages);

export function useClientOrders() {
  return useInfiniteQuery({
    queryKey: QUERY_KEYS.clientOrders,
    queryFn: ({ pageParam }) => fetchOrdersAsClient({ page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: nextCollectionPage,
    select: selectOrders,
  });
}

export function useProviderOrders() {
  return useInfiniteQuery({
    queryKey: QUERY_KEYS.providerOrders,
    queryFn: ({ pageParam }) => fetchOrdersAsProvider({ page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: nextCollectionPage,
    select: selectOrders,
  });
}

/**
 * Number of provider orders still waiting for a response (status "pending").
 * The API has no filtered count. Read every page so the badge never mistakes
 * the first page for the full pending total.
 */
export function usePendingProviderRequestsQuery(enabled: boolean) {
  const qc = useQueryClient();
  return useQuery({
    queryKey: [...QUERY_KEYS.providerOrders, 'pending-count'],
    queryFn: async () => {
      const listState = qc.getQueryState<InfiniteData<PaginatedResponse<Order>, number>>(QUERY_KEYS.providerOrders);
      const cachedPages = listState && !listState.isInvalidated && listState.fetchStatus === 'idle' &&
        Date.now() - listState.dataUpdatedAt < 60_000
        ? listState.data?.pages : undefined;
      let page = cachedPages?.length ? cachedPages[cachedPages.length - 1] : await fetchOrdersAsProvider({ page: 1 });
      const pages: PaginatedResponse<Order>[] = cachedPages?.length ? [...cachedPages] : [page];
      while (nextCollectionPage(page)) {
        page = await fetchOrdersAsProvider({ page: nextCollectionPage(page) });
        pages.push(page);
      }
      return flattenUniqueById(pages).filter(order => order.status === 'pending').length;
    },
    enabled,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

export function usePendingProviderRequestsCount(enabled: boolean) {
  const { data } = usePendingProviderRequestsQuery(enabled);
  return enabled ? data ?? 0 : 0;
}

function patchOrders(old: InfiniteData<PaginatedResponse<Order>, number> | undefined, id: string, status: OrderStatus) {
  return old && {
    ...old,
    pages: old.pages.map(page => ({
      ...page,
      data: page.data.map(order => order.id === id ? { ...order, status } : order),
    })),
  };
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
      const prevList  = qc.getQueryData<InfiniteData<PaginatedResponse<Order>, number>>(QUERY_KEYS.providerOrders);
      const prevOrder = qc.getQueryData<Order>(QUERY_KEYS.orderById(id));
      qc.setQueryData<InfiniteData<PaginatedResponse<Order>, number>>(QUERY_KEYS.providerOrders, old => patchOrders(old, id, 'accepted'));
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
      const prevList  = qc.getQueryData<InfiniteData<PaginatedResponse<Order>, number>>(QUERY_KEYS.providerOrders);
      const prevOrder = qc.getQueryData<Order>(QUERY_KEYS.orderById(id));
      qc.setQueryData<InfiniteData<PaginatedResponse<Order>, number>>(QUERY_KEYS.providerOrders, old => patchOrders(old, id, 'cancelled'));
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
      const prevList  = qc.getQueryData<InfiniteData<PaginatedResponse<Order>, number>>(QUERY_KEYS.providerOrders);
      const prevOrder = qc.getQueryData<Order>(QUERY_KEYS.orderById(id));
      qc.setQueryData<InfiniteData<PaginatedResponse<Order>, number>>(QUERY_KEYS.providerOrders, old => patchOrders(old, id, 'in_progress'));
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
      const prevClient  = qc.getQueryData<InfiniteData<PaginatedResponse<Order>, number>>(QUERY_KEYS.clientOrders);
      const prevProvider = qc.getQueryData<InfiniteData<PaginatedResponse<Order>, number>>(QUERY_KEYS.providerOrders);
      const prevOrder   = qc.getQueryData<Order>(QUERY_KEYS.orderById(id));
      qc.setQueryData<InfiniteData<PaginatedResponse<Order>, number>>(QUERY_KEYS.clientOrders, old => patchOrders(old, id, 'completed'));
      qc.setQueryData<InfiniteData<PaginatedResponse<Order>, number>>(QUERY_KEYS.providerOrders, old => patchOrders(old, id, 'completed'));
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
      const prevClient   = qc.getQueryData<InfiniteData<PaginatedResponse<Order>, number>>(QUERY_KEYS.clientOrders);
      const prevProvider = qc.getQueryData<InfiniteData<PaginatedResponse<Order>, number>>(QUERY_KEYS.providerOrders);
      const prevOrder    = qc.getQueryData<Order>(QUERY_KEYS.orderById(id));
      qc.setQueryData<InfiniteData<PaginatedResponse<Order>, number>>(QUERY_KEYS.clientOrders, old => patchOrders(old, id, 'cancelled'));
      qc.setQueryData<InfiniteData<PaginatedResponse<Order>, number>>(QUERY_KEYS.providerOrders, old => patchOrders(old, id, 'cancelled'));
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
