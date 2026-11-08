import {
  countAwaitingConfirmation,
  getOrderActions,
  getOrderInfoText,
  isSystemCancelled,
  type OrderRole,
} from '@/features/orders/utils/orderActions';
import { formatOrderDeadline } from '@/features/orders/utils/formatOrderDeadline';
import type { OrderStatus } from '@/features/orders/types/orders.types';

const base = { review: null, cancelledBy: undefined, cancellationReason: undefined };
const plan = (status: OrderStatus, role: OrderRole | null, extra: Record<string, unknown> = {}) =>
  getOrderActions({ ...base, status, ...extra } as any, role);

describe('getOrderActions matrix (status x role)', () => {
  it.each<[OrderStatus, OrderRole, string[], string | null]>([
    ['pending', 'client', ['cancel'], 'clientAwaitingResponse'],
    ['pending', 'provider', ['accept', 'reject'], 'providerRespondBefore'],
    ['accepted', 'client', ['cancel'], null],
    ['accepted', 'provider', ['start', 'cancel'], null],
    ['in_progress', 'client', ['dispute'], null],
    ['in_progress', 'provider', ['markDone', 'dispute'], null],
    ['awaiting_confirmation', 'client', ['confirm', 'reportProblem'], 'clientAwaitingConfirmation'],
    ['awaiting_confirmation', 'provider', [], 'providerAwaitingConfirmation'],
    ['completed', 'client', ['review'], null],
    ['completed', 'provider', [], null],
    ['cancelled', 'client', [], null],
    ['cancelled', 'provider', [], null],
    ['disputed', 'client', [], null],
    ['disputed', 'provider', [], null],
  ])('%s / %s', (status, role, actions, info) => {
    expect(plan(status, role)).toEqual({ actions, info });
  });

  it('never offers cancel while in progress or awaiting confirmation', () => {
    for (const status of ['in_progress', 'awaiting_confirmation'] as const) {
      for (const role of ['client', 'provider'] as const) {
        expect(plan(status, role).actions).not.toContain('cancel');
      }
    }
  });

  it('hides the review action once the client already reviewed', () => {
    expect(plan('completed', 'client', { review: { id: 'r', rating: 5, comment: '' } }).actions).toEqual([]);
  });

  it('offers nothing to a user that is not a participant', () => {
    expect(plan('pending', null)).toEqual({ actions: [], info: null });
  });

  it('system cancellation (cancelledBy or NO_RESPONSE) gets role specific outcomes', () => {
    for (const extra of [{ cancelledBy: 'system' }, { cancellationReason: 'NO_RESPONSE' }]) {
      expect(plan('cancelled', 'client', extra)).toEqual({ actions: ['quoteOther'], info: 'clientSystemCancelled' });
      expect(plan('cancelled', 'provider', extra)).toEqual({ actions: [], info: 'providerExpired' });
    }
    expect(isSystemCancelled({ status: 'cancelled', cancelledBy: 'client' })).toBe(false);
    expect(isSystemCancelled({ status: 'pending', cancelledBy: 'system' })).toBe(false);
  });
});

describe('getOrderInfoText', () => {
  const date = new Date(2026, 10, 12, 15, 30);
  const iso = date.toISOString();

  it('builds deadline lines from the order dates', () => {
    expect(getOrderInfoText('clientAwaitingResponse', { expiresAt: iso })).toBe('Esperando respuesta. Vence el 12 nov, 15:30');
    expect(getOrderInfoText('providerRespondBefore', { expiresAt: iso })).toBe('Responde antes de 12 nov, 15:30');
    expect(getOrderInfoText('clientAwaitingConfirmation', { autoCloseAt: iso })).toBe('Se cierra solo el 12 nov, 15:30');
    expect(getOrderInfoText('providerAwaitingConfirmation', { autoCloseAt: iso }))
      .toBe('Esperando la confirmación del cliente. Se cierra solo el 12 nov, 15:30');
  });

  it('hides or degrades the line when the date is missing or invalid', () => {
    expect(getOrderInfoText('providerRespondBefore', {})).toBeNull();
    expect(getOrderInfoText('clientAwaitingConfirmation', { autoCloseAt: 'nope' })).toBeNull();
    expect(getOrderInfoText('providerAwaitingConfirmation', {})).toBe('Esperando la confirmación del cliente');
    expect(getOrderInfoText(null, {})).toBeNull();
  });

  it('has fixed copy for system cancellation', () => {
    expect(getOrderInfoText('clientSystemCancelled', {})).toBe('Cancelada por falta de respuesta del proveedor');
    expect(getOrderInfoText('providerExpired', {})).toBe('Esta solicitud venció');
  });
});

describe('formatOrderDeadline', () => {
  it('formats day, short month and 24h time', () => {
    expect(formatOrderDeadline(new Date(2026, 10, 12, 15, 30).toISOString())).toBe('12 nov, 15:30');
    expect(formatOrderDeadline(new Date(2026, 0, 3, 9, 5).toISOString())).toBe('3 ene, 09:05');
  });

  it('returns null for missing or invalid input', () => {
    expect(formatOrderDeadline(undefined)).toBeNull();
    expect(formatOrderDeadline(null)).toBeNull();
    expect(formatOrderDeadline('')).toBeNull();
    expect(formatOrderDeadline('not a date')).toBeNull();
  });
});

it('counts orders waiting for confirmation', () => {
  expect(countAwaitingConfirmation([
    { status: 'awaiting_confirmation' }, { status: 'pending' }, { status: 'awaiting_confirmation' },
  ])).toBe(2);
  expect(countAwaitingConfirmation([])).toBe(0);
});
