import { getNotificationRoute, resolveNotificationRoute } from '@/features/notifications/utils/notificationRoute';

describe('getNotificationRoute (G72)', () => {
  const base = { id: 'n', userId: 'u', title: 't', body: 'b', read: false, createdAt: '' };

  it('opens the chat by order id for message notifications', () => {
    expect(getNotificationRoute({ ...base, type: 'new_message', data: { orderId: 'o1', conversationId: 'c1' } })).toBe('/chat/o1');
    expect(getNotificationRoute({ ...base, type: 'chat', data: { orderId: 'o1' } })).toBe('/chat/o1');
  });
  it('never uses the conversation id as the chat route param', () => {
    expect(getNotificationRoute({ ...base, type: 'new_message', data: { conversationId: 'c1' } })).toBe('/(tabs)/chat');
  });
  it('keeps order notifications going to the order', () => {
    expect(getNotificationRoute({ ...base, type: 'order_accepted', data: { orderId: 'o1' } })).toBe('/orders/o1');
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
    await expect(resolveNotificationRoute(msg, lookup)).resolves.toBe('/chat/o9');
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
    await expect(resolveNotificationRoute({ ...msg, data: { orderId: 'o1', conversationId: 'c1' } }, lookup)).resolves.toBe('/chat/o1');
    await expect(resolveNotificationRoute({ ...base, type: 'order_accepted', data: { orderId: 'o1' } }, lookup)).resolves.toBe('/orders/o1');
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
