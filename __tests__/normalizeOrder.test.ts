import { normalizeOrder } from '@/features/orders/services/normalizeOrder';

describe('normalizeOrder', () => {
  it('lowercases the status and derives flat ids from nested participants', () => {
    const order = normalizeOrder({
      id: 'o1',
      status: 'IN_PROGRESS',
      title: 'Fix sink',
      client: { id: 'c1', firstName: 'Ana' },
      provider: { id: 'p1', firstName: 'Leo' },
      service: { id: 's1', title: 'Plumbing' },
    });
    expect(order.status).toBe('in_progress');
    expect(order.clientId).toBe('c1');
    expect(order.providerId).toBe('p1');
    expect(order.serviceId).toBe('s1');
    expect(order.client?.firstName).toBe('Ana');
  });

  it('keeps an already-normalized detail unchanged', () => {
    const detail = {
      id: 'o1',
      status: 'pending',
      clientId: 'c1',
      providerId: 'p1',
      serviceId: 's1',
      client: { id: 'other', firstName: 'X' },
    };
    expect(normalizeOrder(detail)).toEqual(detail);
  });
});
