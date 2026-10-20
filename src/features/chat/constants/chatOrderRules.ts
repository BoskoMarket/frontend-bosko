import type { OrderStatus } from '@/features/orders/types/orders.types';
import { ORDER_STATUS, type OrderStatusTone } from '@/features/orders/constants/orderStatus';

/**
 * Single source of truth for how an order status affects its chat (G68).
 * - completed / cancelled: chat is read-only (composer hidden, banner shown).
 * - disputed: chat stays open, with an informative banner.
 * - pending / accepted / in_progress (or unknown while loading): unchanged.
 */
export type ChatNoticeKind = 'readOnly' | 'info';

export interface ChatOrderNotice {
  kind: ChatNoticeKind;
  message: string;
}

const READ_ONLY_STATUSES: ReadonlySet<OrderStatus> = new Set<OrderStatus>(['completed', 'cancelled']);

export function isChatReadOnly(status: OrderStatus | undefined | null): boolean {
  return !!status && READ_ONLY_STATUSES.has(status);
}

/** A closed conversation snapshot must not be overridden by a stale open order query. */
export function resolveChatOrderStatus(
  conversationStatus: OrderStatus | undefined | null,
  orderStatus: OrderStatus | undefined | null,
): OrderStatus | undefined | null {
  return isChatReadOnly(conversationStatus) ? conversationStatus : orderStatus ?? conversationStatus;
}

export const CHAT_CLOSED_FALLBACK_NOTICE = 'La orden está cerrada. El chat queda en modo lectura.';

/**
 * `closedByServer` means the backend rejected our send as ORDER_CLOSED. When the resolved status
 * is not (yet) terminal we show a generic read-only notice instead of relabeling the order.
 */
export function chatNoticeFor(
  status: OrderStatus | undefined | null,
  closedByServer = false,
): ChatOrderNotice | null {
  if (closedByServer && !isChatReadOnly(status)) {
    return { kind: 'readOnly', message: CHAT_CLOSED_FALLBACK_NOTICE };
  }
  switch (status) {
    case 'completed':
      return { kind: 'readOnly', message: 'Orden finalizada. El chat queda en modo lectura.' };
    case 'cancelled':
      return { kind: 'readOnly', message: 'Orden cancelada. El chat queda en modo lectura.' };
    case 'disputed':
      return { kind: 'info', message: 'Orden en disputa: el equipo de Bosko está revisando.' };
    default:
      return null;
  }
}

export const CHAT_ORDER_CLOSED_TOAST = 'No podés enviar mensajes en una orden finalizada.';

/**
 * Only the backend's explicit error code denotes a closed order. Other 409s
 * are not evidence that the composer must switch to read-only.
 */
export function isOrderClosedError(err: unknown): boolean {
  const response = (err as { response?: { status?: number; data?: { code?: string } } } | null)?.response;
  if (response?.status !== 409) return false;
  const code = response.data?.code;
  return code === 'ORDER_CLOSED';
}

/**
 * The backend emits socket `error` as `{code, message}` with no conversation id, so it cannot be
 * attributed to the open chat. It is only a hint to resync the order/conversation, never a lock.
 */
export function isOrderClosedSocketError(error: { code: string }): boolean {
  return error.code === 'ORDER_CLOSED';
}

/** Small badge for the conversations list; null when the status needs no marker. */
export function chatStatusBadge(
  status: OrderStatus | undefined | null,
): { label: string; tone: OrderStatusTone } | null {
  if (status === 'completed') return { label: 'Finalizada', tone: ORDER_STATUS.completed.tone };
  if (status === 'cancelled') return { label: 'Cancelada', tone: ORDER_STATUS.cancelled.tone };
  if (status === 'disputed') return { label: 'En disputa', tone: ORDER_STATUS.disputed.tone };
  return null;
}
