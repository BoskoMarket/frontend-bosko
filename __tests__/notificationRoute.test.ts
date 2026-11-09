import { getNotificationRoute, resolveNotificationRoute } from '@/features/notifications/utils/notificationRoute';

describe('getNotificationRoute (G72)', () => {
  const base = { id: 'n', userId: 'u', title: 't', body: 'b', read: false, createdAt: '' };

  it('opens the chat by order id for message notifications', () => {
    expect(getNotificationRoute({ ...base, type: 'new_message', data: { orderId: 'o1', conversationId: 'c1' } })).toEqual({ pathname: '/chat/[id]', params: { id: 'o1' } });
    expect(getNotificationRoute({ ...base, type: 'chat', data: { orderId: 'o1' } })).toEqual({ pathname: '/chat/[id]', params: { id: 'o1' } });
  });
  it('never uses the conversation id as the chat route param', () => {
    expect(getNotificationRoute({ ...base, type: 'new_message', data: { conversationId: 'c1' } })).toBe('/(tabs)/chat');
  });
  it('keeps order notifications going to the order', () => {
    expect(getNotificationRoute({ ...base, type: 'order_accepted', data: { orderId: 'o1' } })).toEqual({ pathname: '/orders/[id]', params: { id: 'o1' } });
  });
  it('keeps the other routes', () => {
    expect(getNotificationRoute({ ...base, type: 'identity_approved' })).toBe('/(tabs)/profile/become-provider');
    expect(getNotificationRoute({ ...base, type: 'payment_released' })).toBe('/(tabs)/orders');
    expect(getNotificationRoute({ ...base, type: 'whatever' })).toBeNull();
  });
});

describe('resolveNotificationRoute (C21)', () => {
  const base = { id: 'n', userId: 'u', title: 't', body: 'b', read: false, createdAt: '' };
  const msg = { ...base, type: 'new_message', data: { conversationId: 'c1' } };

  it('resolves conversationId to the order id when the lookup finds it', async () => {
    const lookup = jest.fn().mockResolvedValue('o9');
    await expect(resolveNotificationRoute(msg, lookup)).resolves.toEqual({ pathname: '/chat/[id]', params: { id: 'o9' } });
    expect(lookup).toHaveBeenCalledWith('c1');
  });
  it('never uses the conversation id as the route param', async () => {
    await expect(resolveNotificationRoute(msg, async () => null)).resolves.toBe('/(tabs)/chat');
    await expect(resolveNotificationRoute(msg, async () => undefined)).resolves.toBe('/(tabs)/chat');
  });
  it('falls back to the chat list when the lookup throws', async () => {
    await expect(resolveNotificationRoute(msg, async () => { throw new Error('offline'); })).resolves.toBe('/(tabs)/chat');
  });
  it('does not call the lookup when orderId is present or the type is not chat', async () => {
    const lookup = jest.fn();
    await expect(resolveNotificationRoute({ ...msg, data: { orderId: 'o1', conversationId: 'c1' } }, lookup)).resolves.toEqual({ pathname: '/chat/[id]', params: { id: 'o1' } });
    await expect(resolveNotificationRoute({ ...base, type: 'order_accepted', data: { orderId: 'o1' } }, lookup)).resolves.toEqual({ pathname: '/orders/[id]', params: { id: 'o1' } });
    await expect(resolveNotificationRoute({ ...msg, data: {} }, lookup)).resolves.toBe('/(tabs)/chat');
    expect(lookup).not.toHaveBeenCalled();
  });
});

describe('isChatNotificationType', () => {
  it('accepts the backend NEW_MESSAGE type case-insensitively', () => {
    const { isChatNotificationType } = require('@/features/notifications/utils/notificationRoute');
    expect(isChatNotificationType('NEW_MESSAGE')).toBe(true);
    expect(isChatNotificationType('chat')).toBe(true);
    expect(isChatNotificationType('order')).toBe(false);
    expect(isChatNotificationType(undefined)).toBe(false);
  });
});

describe('v1 notification types (F12)', () => {
  const base = { id: 'n', userId: 'u', title: 't', body: 'b', read: false, createdAt: '' };
  const orderTypes = ['ORDER_AWAITING_CONFIRMATION', 'ORDER_CANCELLED', 'ORDER_EXPIRED', 'ORDER_AUTO_CLOSED', 'ORDER_DISPUTED'];

  it.each(orderTypes)('%s opens the order when data.orderId is present', (type) => {
    expect(getNotificationRoute({ ...base, type, data: { orderId: 'o1' } })).toEqual({ pathname: '/orders/[id]', params: { id: 'o1' } });
  });
  it.each(orderTypes)('%s falls back to the orders list without data', (type) => {
    expect(getNotificationRoute({ ...base, type })).toBe('/(tabs)/orders');
    expect(getNotificationRoute({ ...base, type, data: {} })).toBe('/(tabs)/orders');
  });
  it('never uses a conversation id as an order id', () => {
    expect(getNotificationRoute({ ...base, type: 'ORDER_CANCELLED', data: { conversationId: 'c1' } })).toBe('/(tabs)/orders');
  });
  it('POST_HIDDEN goes to Mis trabajos, with or without data', () => {
    expect(getNotificationRoute({ ...base, type: 'POST_HIDDEN' })).toBe('/(tabs)/profile/my-works');
    expect(getNotificationRoute({ ...base, type: 'POST_HIDDEN', data: { postId: 'p1' } })).toBe('/(tabs)/profile/my-works');
  });
  it('REVIEW_REPLIED goes to Mis reseñas, with or without data', () => {
    expect(getNotificationRoute({ ...base, type: 'REVIEW_REPLIED' })).toBe('/(tabs)/profile/my-reviews');
    expect(getNotificationRoute({ ...base, type: 'REVIEW_REPLIED', data: { reviewId: 'r1' } })).toBe('/(tabs)/profile/my-reviews');
  });
  it('PLATFORM_NEWS has no navigation, even if it carries an orderId', () => {
    expect(getNotificationRoute({ ...base, type: 'PLATFORM_NEWS' })).toBeNull();
    expect(getNotificationRoute({ ...base, type: 'PLATFORM_NEWS', data: { orderId: 'o1' } })).toBeNull();
  });
  it('unknown or malformed types do not throw', () => {
    expect(getNotificationRoute({ ...base, type: 'SOMETHING_NEW' })).toBeNull();
    expect(getNotificationRoute({ ...base, type: undefined as any })).toBeNull();
    expect(getNotificationRoute({ ...base, type: '' })).toBeNull();
  });
  it('resolveNotificationRoute passes the new types through without calling the lookup', async () => {
    const lookup = jest.fn();
    await expect(resolveNotificationRoute({ ...base, type: 'POST_HIDDEN' }, lookup)).resolves.toBe('/(tabs)/profile/my-works');
    await expect(resolveNotificationRoute({ ...base, type: 'NOPE', data: { conversationId: 'c' } }, lookup)).resolves.toBeNull();
    expect(lookup).not.toHaveBeenCalled();
  });
  it('isV1NotificationType flags only the new types', () => {
    const { isV1NotificationType } = require('@/features/notifications/utils/notificationRoute');
    expect(isV1NotificationType('order_expired')).toBe(true);
    expect(isV1NotificationType('PLATFORM_NEWS')).toBe(true);
    expect(isV1NotificationType('new_message')).toBe(false);
    expect(isV1NotificationType(undefined)).toBe(false);
  });
});
