import type { Order, OrderStatus } from '@/features/orders/types/orders.types';

/** Days the account stays deactivated (and recoverable) before it is purged. */
export const DELETION_GRACE_DAYS = 30;

/** Order statuses that block account deletion (an open dispute must be resolved first). */
export const BLOCKING_ORDER_STATUSES: readonly OrderStatus[] = ['pending', 'accepted', 'in_progress', 'awaiting_confirmation', 'disputed'];

/** Orders that stop the user from deleting the account; completed/cancelled never block. */
export function blockingOrders(orders: readonly Order[]): Order[] {
  return orders.filter((o) => BLOCKING_ORDER_STATUSES.includes(o.status));
}

/** Merges client and provider orders, dropping duplicates by id (first occurrence wins). */
export function mergeOrders(...lists: ReadonlyArray<readonly Order[] | undefined>): Order[] {
  const seen = new Set<string>();
  const out: Order[] = [];
  for (const list of lists) {
    for (const o of list ?? []) {
      if (seen.has(o.id)) continue;
      seen.add(o.id);
      out.push(o);
    }
  }
  return out;
}

/** "5 de noviembre de 2026", or null when the value is missing or not a valid date. */
export function formatDeletionDate(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** What happens to shared history; reused by every piece of delete-account copy. */
export const SHARED_HISTORY_NOTE =
  'Las órdenes, los chats y las reseñas compartidos con otras personas se conservan sin tu identidad.';

/** Final message once the account was deactivated; falls back to "30 días" for an old backend. */
export function deactivationMessage(deletionScheduledAt?: string | null): string {
  const date = formatDeletionDate(deletionScheduledAt);
  const until = date ? `hasta el ${date}` : `durante ${DELETION_GRACE_DAYS} días`;
  return `Tu cuenta se desactivó. Puedes recuperarla iniciando sesión ${until}. Después, los datos de tu cuenta se anonimizan y se eliminan.`;
}
