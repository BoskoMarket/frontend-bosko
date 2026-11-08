import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import OrderDetailScreen from '@/features/orders/screens/OrderDetailScreen';

const mockRefetch = jest.fn();
const mockConfirm = jest.fn().mockResolvedValue(undefined);
const mockDispute = jest.fn().mockResolvedValue(undefined);
let mockProfileId = 'client';
let mockOrder: Record<string, unknown> = {};

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn() },
  useLocalSearchParams: () => ({ id: 'o1' }),
  useFocusEffect: (effect: () => void) => { require('react').useEffect(effect, []); },
}));
jest.mock('@/components/AnimatedBackground', () => ({ AnimatedBackground: () => null }));
jest.mock('@/features/orders/state/OrdersContext', () => ({
  useOrders: () => ({ confirmOrder: mockConfirm, disputeOrder: mockDispute }),
}));
jest.mock('@/features/profile/state/ProfileContext', () => ({ useProfile: () => ({ profile: { id: mockProfileId } }) }));
jest.mock('@/hooks/queries/useOrdersQuery', () => ({
  useOrder: () => ({ data: mockOrder, isLoading: false, refetch: mockRefetch }),
}));

const order = (extra: Record<string, unknown>) => ({
  id: 'o1', clientId: 'client', providerId: 'provider', paymentStatus: 'pending',
  createdAt: '2026-11-01T10:00:00Z', clientMessage: 'Hola', review: null, ...extra,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockProfileId = 'client';
});

describe('awaiting_confirmation', () => {
  beforeEach(() => {
    mockOrder = order({ status: 'awaiting_confirmation', autoCloseAt: new Date(2026, 10, 13, 18, 0).toISOString() });
  });

  it('client sees confirm + report a problem + the auto-close date', () => {
    const { getByText, queryByText } = render(<OrderDetailScreen />);
    expect(getByText('Confirmar trabajo')).toBeTruthy();
    expect(getByText('Reportar un problema')).toBeTruthy();
    expect(getByText('Se cierra solo el 13 nov, 18:00')).toBeTruthy();
    expect(queryByText('Cancelar orden')).toBeNull();
    expect(queryByText('Abrir disputa')).toBeNull();
  });

  it('confirming calls confirmOrder with the order id and refetches', async () => {
    const { getByText } = render(<OrderDetailScreen />);
    fireEvent.press(getByText('Confirmar trabajo'));
    await waitFor(() => expect(mockConfirm).toHaveBeenCalledWith('o1'));
    await waitFor(() => expect(mockRefetch).toHaveBeenCalled());
  });

  it('reporting a problem requires a reason of at least 5 characters', async () => {
    const { getByText, getByLabelText, getAllByText } = render(<OrderDetailScreen />);
    fireEvent.press(getByText('Reportar un problema'));
    const input = getByLabelText('Motivo');
    fireEvent.changeText(input, 'mal');
    fireEvent.press(getAllByText('Abrir disputa').slice(-1)[0]);
    expect(mockDispute).not.toHaveBeenCalled();
    fireEvent.changeText(input, 'El trabajo quedó incompleto');
    fireEvent.press(getAllByText('Abrir disputa').slice(-1)[0]);
    await waitFor(() => expect(mockDispute).toHaveBeenCalledWith('o1', { reason: 'El trabajo quedó incompleto' }));
  });

  it('provider only sees the informational line', () => {
    mockProfileId = 'provider';
    const { getByText, queryByText } = render(<OrderDetailScreen />);
    expect(getByText('Esperando la confirmación del cliente. Se cierra solo el 13 nov, 18:00')).toBeTruthy();
    expect(queryByText('Confirmar trabajo')).toBeNull();
    expect(queryByText('Reportar un problema')).toBeNull();
  });

  it('does not crash without autoCloseAt (old backend)', () => {
    mockOrder = order({ status: 'awaiting_confirmation' });
    const { getByText, queryByText } = render(<OrderDetailScreen />);
    expect(getByText('Confirmar trabajo')).toBeTruthy();
    expect(queryByText(/Se cierra solo/)).toBeNull();
  });
});

describe('cancelled by the system', () => {
  beforeEach(() => {
    mockOrder = order({ status: 'cancelled', cancelledBy: 'system', cancellationReason: 'NO_RESPONSE' });
  });

  it('client sees the reason and can quote another provider', () => {
    const { getByText } = render(<OrderDetailScreen />);
    expect(getByText('Cancelada por falta de respuesta del proveedor')).toBeTruthy();
    fireEvent.press(getByText('Cotizar a otro proveedor'));
    expect(router.push).toHaveBeenCalledWith('/search');
  });

  it('provider sees that the request expired', () => {
    mockProfileId = 'provider';
    const { getByText, queryByText } = render(<OrderDetailScreen />);
    expect(getByText('Esta solicitud venció')).toBeTruthy();
    expect(queryByText('Cotizar a otro proveedor')).toBeNull();
  });
});

it('in progress: provider can mark done but nobody can cancel', () => {
  mockOrder = order({ status: 'in_progress' });
  mockProfileId = 'provider';
  const { getByText, queryByText } = render(<OrderDetailScreen />);
  expect(getByText('Marcar como terminado')).toBeTruthy();
  expect(getByText('Abrir disputa')).toBeTruthy();
  expect(queryByText('Cancelar orden')).toBeNull();
});
