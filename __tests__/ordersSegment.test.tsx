import { resolveOrdersSegment } from '@/features/orders/screens/OrdersListScreen';

describe('resolveOrdersSegment', () => {
  it('opens on received orders for providers', () => {
    expect(resolveOrdersSegment(undefined, true)).toBe('provider');
  });

  it('opens on hired orders for clients', () => {
    expect(resolveOrdersSegment(undefined, false)).toBe('client');
  });

  it('respects an explicit ?tab= param over the role default', () => {
    expect(resolveOrdersSegment('client', true)).toBe('client');
    expect(resolveOrdersSegment('provider', false)).toBe('provider');
  });

  it('ignores unknown param values', () => {
    expect(resolveOrdersSegment('weird', true)).toBe('provider');
    expect(resolveOrdersSegment('weird', false)).toBe('client');
  });
});
