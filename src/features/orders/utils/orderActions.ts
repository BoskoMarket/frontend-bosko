import type { Order } from '../types/orders.types';
import { formatOrderDeadline } from './formatOrderDeadline';

export type OrderRole = 'client' | 'provider';

export type OrderActionId =
  | 'accept'
  | 'reject'
  | 'start'
  | 'cancel'
  | 'markDone'
  | 'confirm'
  | 'dispute'
  | 'reportProblem'
  | 'review'
  | 'quoteOther';

export type OrderInfoKey =
  | 'clientAwaitingResponse'
  | 'providerRespondBefore'
  | 'clientAwaitingConfirmation'
  | 'providerAwaitingConfirmation'
  | 'clientSystemCancelled'
  | 'providerExpired';

export interface OrderActionsPlan {
  actions: OrderActionId[];
  info: OrderInfoKey | null;
}

type OrderForActions = Pick<Order, 'status' | 'review' | 'cancelledBy' | 'cancellationReason'>;

const NO_RESPONSE = 'NO_RESPONSE';

/** The order was cancelled by the expiry job (nobody answered in time). */
export function isSystemCancelled(order: Pick<Order, 'status' | 'cancelledBy' | 'cancellationReason'>): boolean {
  return order.status === 'cancelled' && (order.cancelledBy === 'system' || order.cancellationReason === NO_RESPONSE);
}

/**
 * Which actions and which info line each role gets for an order. Pure: the screen only renders it.
 * Cancelling is only possible until the work starts; in progress, the way out is a dispute.
 */
export function getOrderActions(order: OrderForActions, role: OrderRole | null): OrderActionsPlan {
  if (!role) return { actions: [], info: null };
  const client = role === 'client';

  switch (order.status) {
    case 'pending':
      return client
        ? { actions: ['cancel'], info: 'clientAwaitingResponse' }
        : { actions: ['accept', 'reject'], info: 'providerRespondBefore' };
    case 'accepted':
      return client ? { actions: ['cancel'], info: null } : { actions: ['start', 'cancel'], info: null };
    case 'in_progress':
      return client ? { actions: ['dispute'], info: null } : { actions: ['markDone', 'dispute'], info: null };
    case 'awaiting_confirmation':
      // Open product decision: the provider cannot dispute from here yet.
      return client
        ? { actions: ['confirm', 'reportProblem'], info: 'clientAwaitingConfirmation' }
        : { actions: [], info: 'providerAwaitingConfirmation' };
    case 'completed':
      return { actions: client && !order.review ? ['review'] : [], info: null };
    case 'cancelled':
      if (!isSystemCancelled(order)) return { actions: [], info: null };
      return client
        ? { actions: ['quoteOther'], info: 'clientSystemCancelled' }
        : { actions: [], info: 'providerExpired' };
    default:
      return { actions: [], info: null };
  }
}

/** Info line for a plan, with the deadline when the order carries a valid one. */
export function getOrderInfoText(
  info: OrderInfoKey | null,
  order: Pick<Order, 'expiresAt' | 'autoCloseAt'>,
): string | null {
  switch (info) {
    case 'clientAwaitingResponse': {
      const date = formatOrderDeadline(order.expiresAt);
      return date ? `Esperando respuesta. Vence el ${date}` : 'Esperando respuesta del proveedor';
    }
    case 'providerRespondBefore': {
      const date = formatOrderDeadline(order.expiresAt);
      return date ? `Responde antes de ${date}` : null;
    }
    case 'clientAwaitingConfirmation': {
      const date = formatOrderDeadline(order.autoCloseAt);
      return date ? `Se cierra solo el ${date}` : null;
    }
    case 'providerAwaitingConfirmation': {
      const date = formatOrderDeadline(order.autoCloseAt);
      return date
        ? `Esperando la confirmación del cliente. Se cierra solo el ${date}`
        : 'Esperando la confirmación del cliente';
    }
    case 'clientSystemCancelled':
      return 'Cancelada por falta de respuesta del proveedor';
    case 'providerExpired':
      return 'Esta solicitud venció';
    default:
      return null;
  }
}

/** Orders the client still has to confirm. */
export function countAwaitingConfirmation(orders: readonly Pick<Order, 'status'>[]): number {
  return orders.filter(order => order.status === 'awaiting_confirmation').length;
}
