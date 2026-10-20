import type { Notification } from '../services/notifications.service';

const CHAT_TYPES = new Set(['new_message', 'chat', 'message']);

/** Chat notification types, case-insensitive (the backend sends NEW_MESSAGE). */
export function isChatNotificationType(type: unknown): boolean {
  return typeof type === 'string' && CHAT_TYPES.has(type.toLowerCase());
}

/**
 * Destination for a tapped notification, or null when it has none.
 *
 * `/chat/[id]` expects the ORDER id (same as the push handler in `app/_layout.tsx`),
 * so chat notifications must be resolved before the generic orderId branch and must
 * never use `data.conversationId` as the route param.
 */
export function getNotificationRoute(item: Notification): string | null {
  const type = item.type.toLowerCase();
  const orderId = item.data?.orderId;

  if (CHAT_TYPES.has(type)) {
    // Without an orderId we cannot open the thread: fall back to the chat list.
    return orderId ? `/chat/${orderId}` : '/(tabs)/chat';
  }
  if (orderId) return `/orders/${orderId}`;
  if (type.startsWith('identity') || type === 'background_check') return '/(tabs)/profile/become-provider';
  if (type === 'payment_released') return '/(tabs)/orders';
  return null;
}

export const CHAT_LIST_ROUTE = '/(tabs)/chat';

/** Resolves a conversation id to the id of its order, or null when unknown. */
export type OrderIdLookup = (conversationId: string) => Promise<string | null | undefined>;

/**
 * Same as `getNotificationRoute`, but a chat notification that carries only
 * `data.conversationId` (the backend's NEW_MESSAGE payload) is resolved to its order first.
 * Never throws: an unknown conversation or a failing lookup falls back to the chat list.
 */
export async function resolveNotificationRoute(item: Notification, lookup: OrderIdLookup): Promise<string | null> {
  const route = getNotificationRoute(item);
  if (route !== CHAT_LIST_ROUTE || !CHAT_TYPES.has(item.type.toLowerCase())) return route;
  const conversationId = item.data?.conversationId;
  if (!conversationId || item.data?.orderId) return route;
  try {
    const orderId = await lookup(String(conversationId));
    return orderId ? `/chat/${orderId}` : CHAT_LIST_ROUTE;
  } catch {
    return CHAT_LIST_ROUTE;
  }
}
