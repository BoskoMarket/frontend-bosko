import type { Order, OrderUser } from '../types/orders.types';
import type { OrderRole } from './orderActions';
import { isSystemCancelled } from './orderActions';
import { formatOrderDeadline } from './formatOrderDeadline';

export interface OrderPartyInfo { label: string; name: string }
export interface OrderClosureInfo { title: string; reason?: string; by?: string }

const fullName = (u?: OrderUser | null) => (u ? `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() : '');

/** The other participant, seen from the viewer's role (provider sees the client and vice versa). */
export function getOrderCounterparty(order: Order, role: OrderRole | null): OrderPartyInfo | null {
  const label = role === 'provider' ? 'Cliente' : 'Proveedor';
  const user = (role === 'provider' ? order.client : order.provider) ?? order.otherParty;
  const name = fullName(user);
  return name ? { label, name } : null;
}

/** Requested date ("Fecha solicitada"), or null when absent or invalid. */
export function getOrderScheduledText(order: Pick<Order, 'scheduledDate'>): string | null {
  return formatOrderDeadline(order.scheduledDate);
}

const ACTOR_LABEL = { client: 'el cliente', provider: 'el proveedor', system: 'el sistema' } as const;

/**
 * Why and by whom an order was cancelled, disputed or auto-closed. Independent of paymentStatus.
 * Returns null for orders that were not closed that way.
 */
export function getOrderClosureInfo(order: Order): OrderClosureInfo | null {
  if (order.status === 'cancelled') {
    const system = isSystemCancelled(order);
    const reason = system ? undefined : order.cancellationReason;
    const by = system ? ACTOR_LABEL.system : order.cancelledBy ? ACTOR_LABEL[order.cancelledBy] : undefined;
    return {
      title: system ? 'Vencida por falta de respuesta' : 'Motivo de la cancelación',
      reason,
      by: by && `Cancelada por ${by}`,
    };
  }
  if (order.status === 'disputed') {
    return { title: 'Motivo de la disputa', reason: order.disputeReason };
  }
  if (order.status === 'completed' && order.closedBy === 'system') {
    return { title: 'Cierre automático', by: 'Cerrada por el sistema tras el plazo de confirmación' };
  }
  return null;
}
