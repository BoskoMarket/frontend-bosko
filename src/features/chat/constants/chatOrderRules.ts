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

export function chatNoticeFor(status: OrderStatus | undefined | null): ChatOrderNotice | null {
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

/** An unscoped socket error cannot safely be attributed to the active chat. */
export function isClosedSocketErrorForConversation(
  error: { code: string; conversationId?: string },
  conversationId: string,
): boolean {
  // The backend emits `error` as `{code, message}` without a conversation id; when an id
  // is present it must match the open chat.
  if (error.code !== 'ORDER_CLOSED' || !conversationId) return false;
  return error.conversationId === undefined || error.conversationId === conversationId;
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
