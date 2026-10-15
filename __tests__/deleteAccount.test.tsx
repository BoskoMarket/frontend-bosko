import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { useThemeStore } from '@/stores/theme.store';
import { toast } from '@/core/design-system';
import type { Order } from '@/features/orders/types/orders.types';
import {
  BLOCKING_ORDER_STATUSES,
  blockingOrders,
  deactivationMessage,
  formatDeletionDate,
  mergeOrders,
} from '@/features/profile/utils/deleteAccountRules';

const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockLogout = jest.fn(async () => {});
const mockDeleteAccount = jest.fn();
const mockGetGoogleIdToken = jest.fn();
const mockRefetchClient = jest.fn();
const mockRefetchProvider = jest.fn();
let mockClientOrders: Order[] = [];
let mockProviderOrders: Order[] = [];
let mockPlan: any = null;
let mockProfile: any = { id: 'u1' };

jest.mock('expo-router', () => ({
  router: { replace: (...a: any[]) => mockReplace(...a), push: (...a: any[]) => mockPush(...a), back: jest.fn() },
}));
jest.mock('@/core/navigation/safeBack', () => ({ safeBack: (...a: any[]) => mockBack(...a) }));
jest.mock('@/components/AnimatedBackground', () => ({ AnimatedBackground: () => null }));
jest.mock('@/features/auth/state/AuthContext', () => ({ useAuth: () => ({ logout: mockLogout }) }));
jest.mock('@/features/auth/hooks/useGoogleSignIn', () => ({
  useGoogleReauth: () => ({ loading: false, getGoogleIdToken: (...a: any[]) => mockGetGoogleIdToken(...a) }),
}));
jest.mock('@/features/profile/state/ProfileContext', () => ({ useProfile: () => ({ profile: mockProfile }) }));
jest.mock('@/features/profile/services/profile', () => ({
  deleteAccountService: (...a: any[]) => mockDeleteAccount(...a),
}));
jest.mock('@/hooks/queries/useOrdersQuery', () => ({
  useClientOrders: () => ({ data: mockClientOrders, refetch: mockRefetchClient }),
  useProviderOrders: () => ({ data: mockProviderOrders, refetch: mockRefetchProvider }),
}));
jest.mock('@/hooks/queries/usePlansQuery', () => ({ useMyPlan: () => ({ data: mockPlan }) }));

import DeleteAccountScreen from '@/features/profile/screens/DeleteAccountScreen';

const order = (id: string, status: Order['status'], title = `Orden ${id}`): Order =>
  ({ id, status, title, clientId: 'c', providerId: 'p', serviceId: 's' }) as Order;

describe('deleteAccountRules', () => {
  it('blocks on pending, accepted, in_progress and disputed only', () => {
    const all: Order['status'][] = ['pending', 'accepted', 'in_progress', 'completed', 'cancelled', 'disputed'];
    const blocked = blockingOrders(all.map((s) => order(s, s))).map((o) => o.status);
    expect(blocked).toEqual(['pending', 'accepted', 'in_progress', 'disputed']);
    expect([...BLOCKING_ORDER_STATUSES]).toEqual(blocked);
    expect(blockingOrders([order('1', 'completed'), order('2', 'cancelled')])).toEqual([]);
  });

  it('merges client and provider orders without duplicates', () => {
    const merged = mergeOrders([order('1', 'pending')], [order('1', 'pending'), order('2', 'accepted')], undefined);
    expect(merged.map((o) => o.id)).toEqual(['1', '2']);
  });

  it('builds the deactivation message with and without a date', () => {
    expect(formatDeletionDate('not a date')).toBeNull();
    expect(formatDeletionDate(undefined)).toBeNull();
    const withDate = deactivationMessage('2026-11-13T12:00:00Z');
    expect(withDate).toMatch(/^Tu cuenta se desactivó\. Se eliminará definitivamente el .*2026\./);
    expect(withDate).toContain('Si volvés a iniciar sesión antes, se reactiva.');
    expect(deactivationMessage()).toBe(
      'Tu cuenta se desactivó. Se eliminará definitivamente en 30 días. Si volvés a iniciar sesión antes, se reactiva.',
    );
  });
});

const setMode = (mode: 'dark' | 'light') => act(() => { useThemeStore.getState().setMode(mode); });

const autoConfirm = () =>
  jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => {
    buttons?.find((b) => b.style === 'destructive')?.onPress?.();
  });

describe.each(['dark', 'light'] as const)('DeleteAccountScreen (%s)', (mode) => {
  let successSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    setMode(mode);
    mockClientOrders = [];
    mockProviderOrders = [];
    mockPlan = null;
    mockProfile = { id: 'u1' };
    successSpy = jest.spyOn(toast, 'success').mockImplementation(() => {});
    errorSpy = jest.spyOn(toast, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    successSpy.mockRestore();
    errorSpy.mockRestore();
  });
  afterAll(() => setMode('dark'));

  const goToStep2 = (utils: ReturnType<typeof render>) => {
    fireEvent.changeText(utils.getByLabelText('Escribí ELIMINAR para continuar'), 'ELIMINAR');
    fireEvent.press(utils.getByText('Continuar'));
  };

  it('explains the 30-day grace period before confirming', () => {
    const { getByText } = render(<DeleteAccountScreen />);
    expect(getByText('Si eliminás tu cuenta:')).toBeTruthy();
    expect(getByText(/Tenés 30 días para cambiar de idea/)).toBeTruthy();
    expect(getByText(/Pasados los 30 días, tu cuenta y tus datos se eliminan definitivamente/)).toBeTruthy();
  });

  it('keeps Continue disabled until the confirmation word is typed', () => {
    const utils = render(<DeleteAccountScreen />);
    fireEvent.press(utils.getByText('Continuar'));
    expect(utils.queryByText('Confirmar identidad')).toBeNull();
    goToStep2(utils);
    expect(utils.getByText('Confirmar identidad')).toBeTruthy();
  });

  it('blocks deletion and lists active orders from both roles, linking to the detail', () => {
    mockClientOrders = [order('o1', 'pending', 'Plomería'), order('o2', 'completed', 'Pintura')];
    mockProviderOrders = [order('o3', 'disputed', 'Electricidad'), order('o4', 'cancelled', 'Jardín')];
    const { getByText, queryByText } = render(<DeleteAccountScreen />);
    expect(getByText('No podés eliminar tu cuenta mientras tengas órdenes activas.')).toBeTruthy();
    expect(getByText('Plomería')).toBeTruthy();
    expect(getByText('Electricidad')).toBeTruthy();
    expect(getByText('Como cliente')).toBeTruthy();
    expect(getByText('Como proveedor')).toBeTruthy();
    expect(getByText('Pendiente')).toBeTruthy();
    expect(getByText('En disputa')).toBeTruthy();
    expect(queryByText('Pintura')).toBeNull();
    expect(queryByText('Jardín')).toBeNull();
    expect(queryByText('Continuar')).toBeNull();
    fireEvent.press(getByText('Plomería'));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/orders/[id]', params: { id: 'o1' } });
  });

  it('does not block with only completed or cancelled orders', () => {
    mockClientOrders = [order('o1', 'completed'), order('o2', 'cancelled')];
    const { getByText, queryByText } = render(<DeleteAccountScreen />);
    expect(queryByText('No podés eliminar tu cuenta mientras tengas órdenes activas.')).toBeNull();
    expect(getByText('Continuar')).toBeTruthy();
  });

  it('warns about losing Premium only for an active plan', () => {
    const premium = 'Vas a perder tu plan Premium sin reembolso del período restante.';
    const free = render(<DeleteAccountScreen />);
    expect(free.queryByText(premium)).toBeNull();
    free.unmount();
    mockPlan = { status: 'active', plan: { id: 'p' }, currentPeriodEnd: '2027-01-01' };
    const paid = render(<DeleteAccountScreen />);
    expect(paid.getByText(premium)).toBeTruthy();
  });

  it('handles a 409 ACTIVE_ORDERS reply by refetching and showing the block', async () => {
    autoConfirm();
    mockDeleteAccount.mockRejectedValueOnce({ response: { status: 409, data: { code: 'ACTIVE_ORDERS' } } });
    const utils = render(<DeleteAccountScreen />);
    goToStep2(utils);
    fireEvent.changeText(utils.getByPlaceholderText('••••••••'), 'secret1');
    fireEvent.press(utils.getByText('Eliminar mi cuenta'));
    await waitFor(() =>
      expect(utils.getByText('No podés eliminar tu cuenta mientras tengas órdenes activas.')).toBeTruthy(),
    );
    expect(mockRefetchClient).toHaveBeenCalled();
    expect(mockRefetchProvider).toHaveBeenCalled();
    expect(mockLogout).not.toHaveBeenCalled();
  });

  it('shows the API error inline for a wrong password', async () => {
    autoConfirm();
    mockDeleteAccount.mockRejectedValueOnce({ response: { status: 401 } });
    const utils = render(<DeleteAccountScreen />);
    goToStep2(utils);
    fireEvent.changeText(utils.getByPlaceholderText('••••••••'), 'secret1');
    fireEvent.press(utils.getByText('Eliminar mi cuenta'));
    await waitFor(() => expect(utils.getByText('Contraseña incorrecta. Verificá e intentá de nuevo.')).toBeTruthy());
    expect(mockDeleteAccount).toHaveBeenCalledWith({ password: 'secret1' });
    expect(mockLogout).not.toHaveBeenCalled();
  });

  it('deactivates, announces the purge date and logs out (password)', async () => {
    autoConfirm();
    mockDeleteAccount.mockResolvedValueOnce({ deletionScheduledAt: '2026-11-13T12:00:00Z' });
    const utils = render(<DeleteAccountScreen />);
    goToStep2(utils);
    fireEvent.changeText(utils.getByPlaceholderText('••••••••'), 'secret1');
    fireEvent.press(utils.getByText('Eliminar mi cuenta'));
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/login'));
    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(successSpy).toHaveBeenCalledWith('Cuenta desactivada', expect.stringMatching(/definitivamente el .*2026/));
  });

  it('falls back to "en 30 días" when the backend sends no date', async () => {
    autoConfirm();
    mockDeleteAccount.mockResolvedValueOnce({});
    const utils = render(<DeleteAccountScreen />);
    goToStep2(utils);
    fireEvent.changeText(utils.getByPlaceholderText('••••••••'), 'secret1');
    fireEvent.press(utils.getByText('Eliminar mi cuenta'));
    await waitFor(() => expect(successSpy).toHaveBeenCalled());
    expect(successSpy).toHaveBeenCalledWith('Cuenta desactivada', expect.stringContaining('definitivamente en 30 días'));
  });

  describe('Google accounts', () => {
    beforeEach(() => { mockProfile = { id: 'u1', authProvider: 'google' }; });

    it('asks to confirm with Google instead of a password and sends the Google token', async () => {
      autoConfirm();
      mockGetGoogleIdToken.mockResolvedValueOnce('google-token');
      mockDeleteAccount.mockResolvedValueOnce({});
      const utils = render(<DeleteAccountScreen />);
      goToStep2(utils);
      expect(utils.queryByPlaceholderText('••••••••')).toBeNull();
      fireEvent.press(utils.getByText('Confirmar con Google'));
      await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/login'));
      expect(mockDeleteAccount).toHaveBeenCalledWith({ googleIdToken: 'google-token' });
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });

    it('stays on screen without errors when the Google prompt is cancelled', async () => {
      autoConfirm();
      mockGetGoogleIdToken.mockResolvedValueOnce(null);
      const utils = render(<DeleteAccountScreen />);
      goToStep2(utils);
      fireEvent.press(utils.getByText('Confirmar con Google'));
      await waitFor(() => expect(mockGetGoogleIdToken).toHaveBeenCalled());
      expect(mockDeleteAccount).not.toHaveBeenCalled();
      expect(errorSpy).not.toHaveBeenCalled();
      expect(mockLogout).not.toHaveBeenCalled();
      expect(utils.getByText('Confirmar con Google')).toBeTruthy();
    });

    it('shows an error toast and allows retry when Google fails', async () => {
      autoConfirm();
      mockGetGoogleIdToken.mockRejectedValueOnce(new Error('boom'));
      const utils = render(<DeleteAccountScreen />);
      goToStep2(utils);
      fireEvent.press(utils.getByText('Confirmar con Google'));
      await waitFor(() => expect(errorSpy).toHaveBeenCalledWith('No pudimos confirmar con Google', 'Intentá de nuevo.'));
      expect(mockDeleteAccount).not.toHaveBeenCalled();
      expect(utils.getByText('Confirmar con Google')).toBeTruthy();
    });

    it('maps REAUTH_FAILED to a Google-specific inline error', async () => {
      autoConfirm();
      mockGetGoogleIdToken.mockResolvedValueOnce('google-token');
      mockDeleteAccount.mockRejectedValueOnce({ response: { status: 401, data: { code: 'REAUTH_FAILED' } } });
      const utils = render(<DeleteAccountScreen />);
      goToStep2(utils);
      fireEvent.press(utils.getByText('Confirmar con Google'));
      await waitFor(() => expect(utils.getByText('No pudimos verificar tu cuenta de Google. Intentá de nuevo.')).toBeTruthy());
    });
  });
});
