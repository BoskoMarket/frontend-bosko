import type { Href } from 'expo-router';
import type { Notification } from '../services/notifications.service';
import {
  isChatNotificationType,
  isV1NotificationType,
  resolveNotificationRoute,
  type OrderIdLookup,
} from './notificationRoute';

/**
 * Destination for a tapped push, or null when the notifications list should open instead.
 * Delegates to `resolveNotificationRoute` (backend ORDER_* types, chat) and keeps the
 * legacy `order` / `review` types that carry an `orderId`.
 */
export async function resolvePushTapRoute(
  data: Record<string, unknown> | null | undefined,
  lookup: OrderIdLookup,
): Promise<Href | null> {
  if (!data) return null;
  const type = typeof data.type === 'string' ? data.type.toLowerCase() : '';
  const orderId = data.orderId ? String(data.orderId) : undefined;
  const conversationId = data.conversationId ? String(data.conversationId) : undefined;

  if ((type === 'order' || type === 'review') && orderId) {
    return { pathname: '/orders/[id]', params: { id: orderId } };
  }
  if (isChatNotificationType(type) && !orderId && !conversationId) return null;
  if (isChatNotificationType(type) || isV1NotificationType(type)) {
    const item = {
      id: '', userId: '', title: '', body: '', read: false, createdAt: '', type,
      data: { orderId, conversationId },
    } as unknown as Notification;
    return resolveNotificationRoute(item, lookup);
  }
  return null;
}
