import api from '@/core/api/axiosinstance';
import { confirmOrder, markOrderDone } from '@/features/orders/services/orders.service';
import * as service from '@/features/orders/services/orders.service';
import { normalizeOrder } from '@/features/orders/services/normalizeOrder';
import { getUserErrorMessage } from '@/lib/errors';

jest.mock('@/core/api/axiosinstance', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), patch: jest.fn() },
}));

beforeEach(() => jest.clearAllMocks());

describe('order lifecycle services', () => {
  it('markOrderDone patches /mark-done and normalizes the response', async () => {
    jest.mocked(api.patch).mockResolvedValue({ data: { id: 'o1', status: 'AWAITING_CONFIRMATION' } });
    const order = await markOrderDone('o1');
    expect(api.patch).toHaveBeenCalledWith('/orders/o1/mark-done');
    expect(order.status).toBe('awaiting_confirmation');
  });

  it('confirmOrder patches /confirm', async () => {
    jest.mocked(api.patch).mockResolvedValue({ data: { id: 'o1', status: 'COMPLETED' } });
    const order = await confirmOrder('o1');
    expect(api.patch).toHaveBeenCalledWith('/orders/o1/confirm');
    expect(order.status).toBe('completed');
  });

  it('no longer exposes the retired /complete call', () => {
    expect((service as Record<string, unknown>).completeOrder).toBeUndefined();
  });
});

describe('normalizeOrder lifecycle fields', () => {
  it('maps the new fields', () => {
    const order = normalizeOrder({
      id: 'o1', status: 'cancelled', expiresAt: '2026-11-12T10:00:00Z', doneAt: '2026-11-10T10:00:00Z',
      autoCloseAt: '2026-11-13T10:00:00Z', closedBy: 'SYSTEM', cancelledBy: 'system',
    });
    expect(order).toMatchObject({
      expiresAt: '2026-11-12T10:00:00Z', doneAt: '2026-11-10T10:00:00Z',
      autoCloseAt: '2026-11-13T10:00:00Z', closedBy: 'system', cancelledBy: 'system',
    });
  });

  it('accepts the awaiting_confirmation status in any casing', () => {
    expect(normalizeOrder({ status: 'AWAITING_CONFIRMATION' }).status).toBe('awaiting_confirmation');
  });

  it('does not crash and leaves fields undefined when the backend omits or garbles them', () => {
    const order = normalizeOrder({ id: 'o1', status: 'pending', closedBy: 'provider', cancelledBy: 5, expiresAt: null });
    expect(order.expiresAt).toBeUndefined();
    expect(order.doneAt).toBeUndefined();
    expect(order.autoCloseAt).toBeUndefined();
    expect(order.closedBy).toBeUndefined();
    expect(order.cancelledBy).toBeUndefined();
  });
});

it('maps INVALID_ORDER_TRANSITION to a neutral refresh message', () => {
  const err = {
    isAxiosError: true,
    message: 'x',
    response: { status: 409, data: { code: 'INVALID_ORDER_TRANSITION', message: 'x', statusCode: 409 } },
  };
  expect(getUserErrorMessage(err)).toBe('La orden cambió de estado. Actualizamos la vista.');
});
