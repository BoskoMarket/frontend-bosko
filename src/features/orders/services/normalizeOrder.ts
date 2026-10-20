import type { Order, OrderStatus } from '../types/orders.types';

/**
 * Order responses differ by endpoint: create/action mutations return domain
 * (UPPERCASE) statuses and nested participants, while GET /orders/:id returns
 * lowercase statuses with flat ids. This adapter maps both to the `Order` shape.
 */
export function normalizeOrder(raw: any): Order {
  if (!raw || typeof raw !== 'object') return raw as Order;
  return {
    ...raw,
    status:
      typeof raw.status === 'string' ? (raw.status.toLowerCase() as OrderStatus) : raw.status,
    clientId: raw.clientId ?? raw.client?.id,
    providerId: raw.providerId ?? raw.provider?.id,
    serviceId: raw.serviceId ?? raw.service?.id,
  } as Order;
}
