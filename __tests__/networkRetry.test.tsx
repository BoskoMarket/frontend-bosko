import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { dialog, toast } from '@/core/design-system';
import { NETWORK_ERROR_MESSAGE, getUserErrorMessage, isNetworkError } from '@/lib/errors';
import { runWithRetry } from '@/lib/runWithRetry';

const mockAddOrder = jest.fn();
const mockStart = jest.fn();
const mockRefetch = jest.fn();
let mockOrder: Record<string, unknown> = {};

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() },
  useLocalSearchParams: () => ({ id: 'o1', serviceId: 's1', serviceTitle: 'Plomería' }),
  useFocusEffect: (effect: () => void) => { require('react').useEffect(effect, []); },
}));
jest.mock('@/core/navigation/safeBack', () => ({ safeBack: jest.fn() }));
jest.mock('@/components/AnimatedBackground', () => ({ AnimatedBackground: () => null }));
jest.mock('@/features/orders/state/OrdersContext', () => ({
  useOrders: () => ({ addOrder: mockAddOrder, startOrder: mockStart }),
}));
jest.mock('@/features/profile/state/ProfileContext', () => ({ useProfile: () => ({ profile: { id: 'provider' } }) }));
jest.mock('@/hooks/queries/useOrdersQuery', () => ({
  useOrder: () => ({ data: mockOrder, isLoading: false, refetch: mockRefetch }),
}));

import QuoteRequestScreen from '@/features/orders/screens/QuoteRequestScreen';
import OrderDetailScreen from '@/features/orders/screens/OrderDetailScreen';

const networkError = () => ({ isAxiosError: true, code: 'ERR_NETWORK', message: 'Network Error' });
const serverError = () => ({
  isAxiosError: true,
  message: 'x',
  response: { status: 400, data: { success: false, statusCode: 400, code: 'VALIDATION_ERROR', message: 'bad', details: [{ field: 'message', message: 'too short' }] } },
});

describe('isNetworkError', () => {
  it('detects requests that never reached the server', () => {
    expect(isNetworkError(networkError())).toBe(true);
    expect(isNetworkError({ isAxiosError: true, code: 'ECONNABORTED', message: 'timeout of 15000ms exceeded' })).toBe(true);
    expect(isNetworkError({ isAxiosError: true, message: 'offline' })).toBe(true);
  });
  it('ignores server responses and non-axios errors', () => {
    expect(isNetworkError(serverError())).toBe(false);
    expect(isNetworkError({ isAxiosError: true, message: 'x', response: { status: 502 } })).toBe(false);
    expect(isNetworkError(new Error('boom'))).toBe(false);
    expect(isNetworkError(undefined)).toBe(false);
  });
  it('maps to a clear message', () => {
    expect(getUserErrorMessage(networkError())).toBe(NETWORK_ERROR_MESSAGE);
    expect(NETWORK_ERROR_MESSAGE).toMatch(/No hay conexión con el servidor/);
  });
});

describe('runWithRetry', () => {
  afterEach(() => jest.restoreAllMocks());

  it('re-runs the same action after a network failure when the user taps Reintentar', async () => {
    const confirm = jest.spyOn(dialog, 'confirm').mockResolvedValue(true);
    const action = jest.fn().mockRejectedValueOnce(networkError()).mockResolvedValueOnce('ok');
    const result = await runWithRetry(action, { title: 'No se pudo enviar' });
    expect(result).toEqual({ ok: true, value: 'ok' });
    expect(action).toHaveBeenCalledTimes(2);
    expect(confirm).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'No se pudo enviar', confirmLabel: 'Reintentar', message: NETWORK_ERROR_MESSAGE }),
    );
  });

  it('stops without retrying when the user cancels', async () => {
    jest.spyOn(dialog, 'confirm').mockResolvedValue(false);
    const action = jest.fn().mockRejectedValue(networkError());
    const result = await runWithRetry(action, { title: 'x' });
    expect(result.ok).toBe(false);
    expect(action).toHaveBeenCalledTimes(1);
  });

  it('does not offer retry for server errors and delegates to onError', async () => {
    const confirm = jest.spyOn(dialog, 'confirm');
    const onError = jest.fn();
    const result = await runWithRetry(() => Promise.reject(serverError()), { title: 'x', onError });
    expect(result.ok).toBe(false);
    expect(confirm).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('shows an error toast by default for server errors', async () => {
    const t = jest.spyOn(toast, 'error').mockImplementation(() => {});
    await runWithRetry(() => Promise.reject(serverError()), { title: 'No se pudo' });
    expect(t).toHaveBeenCalledWith('No se pudo', expect.any(String));
  });
});

describe('QuoteRequestScreen network failure', () => {
  afterEach(() => { jest.restoreAllMocks(); jest.clearAllMocks(); });

  it('keeps the typed text and resends the same request on Reintentar', async () => {
    const confirm = jest.spyOn(dialog, 'confirm').mockResolvedValue(true);
    jest.spyOn(dialog, 'fromAlert').mockImplementation(() => {});
    mockAddOrder.mockRejectedValueOnce(networkError()).mockResolvedValueOnce({ id: 'o9' });
    const { getByPlaceholderText, getByText } = render(<QuoteRequestScreen />);
    fireEvent.changeText(getByPlaceholderText(/Necesito una instalación eléctrica/), 'Cambiar tres tomas');
    fireEvent.press(getByText('Enviar solicitud'));
    await waitFor(() => expect(mockAddOrder).toHaveBeenCalledTimes(2));
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(mockAddOrder.mock.calls[1][0]).toEqual(mockAddOrder.mock.calls[0][0]);
    expect(mockAddOrder.mock.calls[1][0]).toMatchObject({ serviceId: 's1', message: 'Cambiar tres tomas' });
    expect(getByPlaceholderText(/Necesito una instalación eléctrica/).props.value).toBe('Cambiar tres tomas');
  });

  it('keeps the text when the user cancels the retry', async () => {
    jest.spyOn(dialog, 'confirm').mockResolvedValue(false);
    mockAddOrder.mockRejectedValue(networkError());
    const { getByPlaceholderText, getByText } = render(<QuoteRequestScreen />);
    fireEvent.changeText(getByPlaceholderText(/Necesito una instalación eléctrica/), 'Pintar sala');
    fireEvent.press(getByText('Enviar solicitud'));
    await waitFor(() => expect(mockAddOrder).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(getByText('Enviar solicitud')).toBeTruthy());
    expect(getByPlaceholderText(/Necesito una instalación eléctrica/).props.value).toBe('Pintar sala');
  });
});

describe('OrderDetailScreen network failure', () => {
  afterEach(() => { jest.restoreAllMocks(); jest.clearAllMocks(); });

  it('offers Reintentar for an order action and re-runs it', async () => {
    mockOrder = {
      id: 'o1', clientId: 'client', providerId: 'provider', status: 'accepted', paymentStatus: 'pending',
      createdAt: '2026-11-01T10:00:00Z', clientMessage: 'Hola', review: null,
    };
    const confirm = jest.spyOn(dialog, 'confirm').mockResolvedValue(true);
    mockStart.mockRejectedValueOnce(networkError()).mockResolvedValueOnce(undefined);
    const { getByText } = render(<OrderDetailScreen />);
    fireEvent.press(getByText('Iniciar trabajo'));
    await waitFor(() => expect(mockStart).toHaveBeenCalledTimes(2));
    expect(mockStart).toHaveBeenNthCalledWith(1, 'o1');
    expect(mockStart).toHaveBeenNthCalledWith(2, 'o1');
    expect(confirm).toHaveBeenCalledWith(expect.objectContaining({ confirmLabel: 'Reintentar' }));
    await waitFor(() => expect(mockRefetch).toHaveBeenCalled());
  });
});
