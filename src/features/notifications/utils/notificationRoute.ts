import type { Href } from 'expo-router';
import type { Notification } from '../services/notifications.service';

export const CHAT_LIST_ROUTE = '/(tabs)/chat' as const;

const chatRoute = (orderId: string): Href => ({ pathname: '/chat/[id]', params: { id: orderId } });

const CHAT_TYPES = new Set(['new_message', 'chat', 'message']);

/** Order lifecycle notifications added in v1: open the order, or the orders list when the id is missing. */
const ORDER_TYPES = new Set([
  'order_awaiting_confirmation',
  'order_cancelled',
  'order_expired',
  'order_auto_closed',
  'order_disputed',
]);

/** Types added in v1 with a fixed destination (also used by the push tap handler). */
export function isV1NotificationType(type: unknown): boolean {
  if (typeof type !== 'string') return false;
  const t = type.toLowerCase();
  return ORDER_TYPES.has(t) || t === 'post_hidden' || t === 'review_replied' || t === 'platform_news';
}

export const ORDERS_ROUTE = '/(tabs)/orders' as const;
const MY_WORKS_NOTIF_ROUTE = '/(tabs)/profile/my-works' as const;
export const MY_REVIEWS_ROUTE = '/(tabs)/profile/my-reviews' as const;

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
export function getNotificationRoute(item: Notification): Href | null {
  const type = typeof item.type === 'string' ? item.type.toLowerCase() : '';
  const orderId = item.data?.orderId;

  if (CHAT_TYPES.has(type)) {
    // Without an orderId we cannot open the thread: fall back to the chat list.
    return orderId ? chatRoute(String(orderId)) : CHAT_LIST_ROUTE;
  }
  if (ORDER_TYPES.has(type)) {
    return orderId ? { pathname: '/orders/[id]', params: { id: String(orderId) } } : ORDERS_ROUTE;
  }
  if (type === 'post_hidden') return MY_WORKS_NOTIF_ROUTE;
  if (type === 'review_replied') return MY_REVIEWS_ROUTE;
  if (type === 'platform_news') return null;
  if (orderId) return { pathname: '/orders/[id]', params: { id: String(orderId) } };
  if (type.startsWith('identity') || type === 'background_check') return '/(tabs)/profile/become-provider';
  if (type === 'payment_released') return '/(tabs)/orders';
  return null;
}

/** Resolves a conversation id to the id of its order, or null when unknown. */
export type OrderIdLookup = (conversationId: string) => Promise<string | null | undefined>;

/**
 * Same as `getNotificationRoute`, but a chat notification that carries only
 * `data.conversationId` (the backend's NEW_MESSAGE payload) is resolved to its order first.
 * Never throws: an unknown conversation or a failing lookup falls back to the chat list.
 */
export async function resolveNotificationRoute(item: Notification, lookup: OrderIdLookup): Promise<Href | null> {
  const route = getNotificationRoute(item);
  if (route !== CHAT_LIST_ROUTE || !isChatNotificationType(item.type)) return route;
  const conversationId = item.data?.conversationId;
  if (!conversationId || item.data?.orderId) return route;
  try {
    const orderId = await lookup(String(conversationId));
    return orderId ? chatRoute(String(orderId)) : CHAT_LIST_ROUTE;
  } catch {
    return CHAT_LIST_ROUTE;
  }
}
