import { getNotificationRoute } from '@/features/notifications/utils/notificationRoute';

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
