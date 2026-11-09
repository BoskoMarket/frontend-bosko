import type { Order, OrderActor, OrderStatus } from '../types/orders.types';

/**
 * Order responses differ by endpoint: create/action mutations return domain
 * (UPPERCASE) statuses and nested participants, while GET /orders/:id returns
 * lowercase statuses with flat ids. This adapter maps both to the `Order` shape.
 */
const KNOWN_STATUSES: ReadonlySet<string> = new Set<OrderStatus>([
  'pending', 'accepted', 'in_progress', 'awaiting_confirmation', 'completed', 'cancelled', 'disputed',
]);

/** Domain statuses without a client equivalent; a rejected order is closed like a cancelled one. */
const STATUS_ALIASES: Record<string, OrderStatus> = { rejected: 'cancelled' };

/**
 * Unknown non-empty statuses fall back to a closed state (no actions offered) instead of
 * leaking a value that `Record<OrderStatus, ...>` lookups don't handle. Missing stays missing.
 */
function normalizeStatus(status: unknown): OrderStatus | undefined {
  if (typeof status !== 'string' || status === '') return undefined;
  const value = status.toLowerCase();
  if (KNOWN_STATUSES.has(value)) return value as OrderStatus;
  return STATUS_ALIASES[value] ?? 'cancelled';
}

const ACTORS: ReadonlySet<string> = new Set<OrderActor>(['client', 'provider', 'system']);

/** Lifecycle actor (cancelledBy / closedBy). Missing or unknown values stay undefined, never throw. */
function normalizeActor(value: unknown): OrderActor | undefined {
  if (typeof value !== 'string') return undefined;
  const actor = value.toLowerCase();
  return ACTORS.has(actor) ? (actor as OrderActor) : undefined;
}

/** ISO date fields from the lifecycle: anything that is not a non-empty string is dropped. */
function normalizeDateField(value: unknown): string | undefined {
  return typeof value === 'string' && value !== '' ? value : undefined;
}

function closedByOf(value: unknown): 'client' | 'system' | undefined {
  const actor = normalizeActor(value);
  return actor === 'client' || actor === 'system' ? actor : undefined;
}

export function normalizeOrder(raw: any): Order {
  if (!raw || typeof raw !== 'object') return raw as Order;
  return {
    ...raw,
    status: normalizeStatus(raw.status),
    clientId: raw.clientId ?? raw.client?.id,
    providerId: raw.providerId ?? raw.provider?.id,
    serviceId: raw.serviceId ?? raw.service?.id,
    expiresAt: normalizeDateField(raw.expiresAt),
    doneAt: normalizeDateField(raw.doneAt),
    autoCloseAt: normalizeDateField(raw.autoCloseAt),
    closedBy: closedByOf(raw.closedBy),
    cancelledBy: normalizeActor(raw.cancelledBy),
  } as Order;
}
