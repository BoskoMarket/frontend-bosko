import type { QueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/core/query/queryKeys';

/**
 * Refreshes everything a push can change: unread badge, order lists (client/provider, which also
 * covers the provider pending count), the order detail and conversations.
 * `data.orderId` is optional: without it every cached order detail is invalidated.
 */
export function invalidateOnPush(qc: QueryClient, data?: Record<string, unknown> | null): void {
  const orderId = data?.orderId;
  qc.invalidateQueries({ queryKey: QUERY_KEYS.unreadCount });
  qc.invalidateQueries({ queryKey: QUERY_KEYS.clientOrders });
  qc.invalidateQueries({ queryKey: QUERY_KEYS.providerOrders });
  qc.invalidateQueries({
    queryKey: typeof orderId === 'string' && orderId ? QUERY_KEYS.orderById(orderId) : ['orders'],
  });
  qc.invalidateQueries({ queryKey: QUERY_KEYS.conversations });
}
