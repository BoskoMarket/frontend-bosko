import React from 'react';
import { act, render } from '@testing-library/react-native';
import { useThemeStore } from '@/stores/theme.store';
import {
  chatNoticeFor,
  chatStatusBadge,
  isChatReadOnly,
  isOrderClosedError,
} from '@/features/chat/constants/chatOrderRules';
import { ChatOrderNotice } from '@/features/chat/components/ChatOrderNotice';
import type { OrderStatus } from '@/features/orders/types/orders.types';

const setMode = (mode: 'dark' | 'light') => act(() => { useThemeStore.getState().setMode(mode); });

describe('chat order rules (G68)', () => {
  it.each<[OrderStatus, boolean, string | null]>([
    ['pending', false, null],
    ['accepted', false, null],
    ['in_progress', false, null],
    ['completed', true, 'Orden finalizada. El chat queda en modo lectura.'],
    ['cancelled', true, 'Orden cancelada. El chat queda en modo lectura.'],
    ['disputed', false, 'Orden en disputa: el equipo de Bosko está revisando.'],
  ])('%s -> readOnly=%s', (status, readOnly, message) => {
    expect(isChatReadOnly(status)).toBe(readOnly);
    expect(chatNoticeFor(status)?.message ?? null).toBe(message);
  });

  it('keeps the composer enabled while the status is unknown', () => {
    expect(isChatReadOnly(undefined)).toBe(false);
    expect(chatNoticeFor(undefined)).toBeNull();
  });

  it('badges only closed or disputed orders', () => {
    expect(chatStatusBadge('completed')?.label).toBe('Finalizada');
    expect(chatStatusBadge('cancelled')?.label).toBe('Cancelada');
    expect(chatStatusBadge('disputed')?.label).toBe('En disputa');
    expect(chatStatusBadge('in_progress')).toBeNull();
    expect(chatStatusBadge(undefined)).toBeNull();
  });

  it('detects closed-order rejections', () => {
    expect(isOrderClosedError({ response: { status: 409 } })).toBe(true);
    expect(isOrderClosedError({ response: { status: 403 } })).toBe(true);
    expect(isOrderClosedError({ response: { status: 422 } })).toBe(true);
    expect(isOrderClosedError({ response: { status: 500 } })).toBe(false);
    expect(isOrderClosedError(new Error('network'))).toBe(false);
  });
});

describe.each(['dark', 'light'] as const)('ChatOrderNotice (%s)', (mode) => {
  beforeEach(() => setMode(mode));
  afterAll(() => setMode('dark'));

  it('renders the read-only notice for completed and cancelled', () => {
    expect(render(<ChatOrderNotice status="completed" />).getByText('Orden finalizada. El chat queda en modo lectura.')).toBeTruthy();
    expect(render(<ChatOrderNotice status="cancelled" />).getByText('Orden cancelada. El chat queda en modo lectura.')).toBeTruthy();
  });

  it('renders the dispute notice', () => {
    expect(render(<ChatOrderNotice status="disputed" />).getByText('Orden en disputa: el equipo de Bosko está revisando.')).toBeTruthy();
  });

  it('renders nothing for open statuses', () => {
    const { toJSON } = render(<ChatOrderNotice status="in_progress" />);
    expect(toJSON()).toBeNull();
  });
});
