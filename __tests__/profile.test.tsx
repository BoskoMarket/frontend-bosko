import React from 'react';
import * as fs from 'fs';
import * as path from 'path';
import { Alert } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { useThemeStore } from '@/stores/theme.store';

const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockLogout = jest.fn(async () => {});
const mockDeleteAccount = jest.fn();
const mockUpdateProfile = jest.fn(async () => {});
const mockRefreshProfile = jest.fn(async () => {});
const mockLoadHistory = jest.fn(async () => {});
let mockPayments: any = { history: [], loading: false, error: '', loadHistory: mockLoadHistory };
let mockProfileState: any = { profile: null, isLoading: false, error: null };

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('expo-router', () => ({ router: { replace: (...a: any[]) => mockReplace(...a), push: jest.fn(), back: jest.fn() } }));
jest.mock('@/core/navigation/safeBack', () => ({ safeBack: (...a: any[]) => mockBack(...a) }));
jest.mock('@/components/AnimatedBackground', () => ({ AnimatedBackground: () => null }));
jest.mock('@/features/auth/state/AuthContext', () => ({
  useAuth: () => ({ logout: mockLogout, authState: { user: { email: 'a@b.c' } } }),
}));
jest.mock('@/features/profile/services/profile', () => ({
  deleteAccountService: (...a: any[]) => mockDeleteAccount(...a),
}));
jest.mock('@/features/payments/state/PaymentContext', () => ({ usePayments: () => mockPayments }));
jest.mock('@/features/profile/state/ProfileContext', () => ({
  useProfile: () => ({
    ...mockProfileState,
    updateProfile: mockUpdateProfile,
    refreshProfile: mockRefreshProfile,
  }),
}));
jest.mock('@/hooks/queries/useProfileQuery', () => ({ useUploadAvatar: () => ({ mutateAsync: jest.fn() }) }));
jest.mock('expo-image-picker', () => ({}));
jest.mock('expo-location', () => ({}));

import DeleteAccountScreen from '@/features/profile/screens/DeleteAccountScreen';
import VerifyPhoneScreen from '@/features/profile/screens/VerifyPhoneScreen';
import EditPayments from '@/features/users/components/edit/EditPayments';
import EditProfileScreen from '@/features/users/screens/EditProfileScreen';

const setMode = (mode: 'dark' | 'light') => act(() => { useThemeStore.getState().setMode(mode); });

describe.each(['dark', 'light'] as const)('profile screens (%s)', (mode) => {
  beforeEach(() => {
    jest.clearAllMocks();
    setMode(mode);
    mockPayments = { history: [], loading: false, error: '', loadHistory: mockLoadHistory };
    mockProfileState = { profile: null, isLoading: false, error: null };
  });
  afterAll(() => setMode('dark'));

  describe('EditPayments', () => {
    it('shows an error with retry when the history fails to load', () => {
      mockPayments = { ...mockPayments, error: 'boom' };
      const { getByText } = render(<EditPayments />);
      expect(getByText('No pudimos cargar tus pagos')).toBeTruthy();
      mockLoadHistory.mockClear();
      fireEvent.press(getByText('Reintentar'));
      expect(mockLoadHistory).toHaveBeenCalledTimes(1);
    });

    it('shows the empty state when there are no payments', () => {
      const { getByText } = render(<EditPayments />);
      expect(getByText('Sin pagos registrados')).toBeTruthy();
    });

    it('lists payments with a status badge', () => {
      mockPayments = {
        ...mockPayments,
        history: [{ id: 'p1', orderId: 'order-12345678', amount: 1000, currency: 'ARS', status: 'released', createdAt: '2026-01-05T10:00:00Z' }],
      };
      const { getByText } = render(<EditPayments />);
      expect(getByText('Liberado')).toBeTruthy();
      expect(getByText('Orden order-12')).toBeTruthy();
    });
  });

  describe('DeleteAccountScreen', () => {
    it('keeps Continue disabled until the confirmation word is typed', () => {
      const { getByText, getByLabelText, queryByText } = render(<DeleteAccountScreen />);
      expect(getByText('Si eliminás tu cuenta:')).toBeTruthy();
      fireEvent.press(getByText('Continuar'));
      expect(queryByText('Confirmar identidad')).toBeNull();
      fireEvent.changeText(getByLabelText('Escribí ELIMINAR para continuar'), 'ELIMINAR');
      fireEvent.press(getByText('Continuar'));
      expect(getByText('Confirmar identidad')).toBeTruthy();
    });

    it('asks for a final confirmation and shows the API error inline', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => {
        buttons?.find((b) => b.style === 'destructive')?.onPress?.();
      });
      mockDeleteAccount.mockRejectedValueOnce({ response: { status: 401 } });
      const { getByText, getByLabelText, getByPlaceholderText } = render(<DeleteAccountScreen />);
      fireEvent.changeText(getByLabelText('Escribí ELIMINAR para continuar'), 'ELIMINAR');
      fireEvent.press(getByText('Continuar'));
      fireEvent.changeText(getByPlaceholderText('••••••••'), 'secret1');
      fireEvent.press(getByText('Eliminar mi cuenta'));
      expect(alertSpy).toHaveBeenCalledWith('Última confirmación', expect.any(String), expect.any(Array));
      await waitFor(() => expect(getByText('Contraseña incorrecta. Verificá e intentá de nuevo.')).toBeTruthy());
      expect(mockLogout).not.toHaveBeenCalled();
      alertSpy.mockRestore();
    });

    it('logs out and goes to login after a successful deletion', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => {
        buttons?.find((b) => b.style === 'destructive')?.onPress?.();
      });
      mockDeleteAccount.mockResolvedValueOnce(undefined);
      const { getByText, getByLabelText, getByPlaceholderText } = render(<DeleteAccountScreen />);
      fireEvent.changeText(getByLabelText('Escribí ELIMINAR para continuar'), 'ELIMINAR');
      fireEvent.press(getByText('Continuar'));
      fireEvent.changeText(getByPlaceholderText('••••••••'), 'secret1');
      fireEvent.press(getByText('Eliminar mi cuenta'));
      await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/login'));
      expect(mockLogout).toHaveBeenCalledTimes(1);
      alertSpy.mockRestore();
    });
  });

  describe('VerifyPhoneScreen', () => {
    it('rejects a malformed number inline before calling the SMS provider', () => {
      const { getByPlaceholderText, getByText } = render(<VerifyPhoneScreen />);
      fireEvent.changeText(getByPlaceholderText('+54 9 11 1234-5678'), '12ab');
      fireEvent.press(getByText('Enviar código'));
      expect(getByText(/Ingresá el número con código de país/)).toBeTruthy();
    });

    it('asks for a number when the field is empty', () => {
      const { getByText } = render(<VerifyPhoneScreen />);
      fireEvent.press(getByText('Enviar código'));
      expect(getByText('Ingresá un número de teléfono')).toBeTruthy();
    });
  });

  describe('EditProfileScreen', () => {
    const profile = { id: 'u1', firstName: 'Ana', lastName: 'Paz', phone: '', bio: '', email: 'a@b.c', isVerified: false };

    it('shows an error with retry when the profile could not be loaded', () => {
      const { getByText } = render(<EditProfileScreen />);
      expect(getByText('No pudimos cargar tu perfil')).toBeTruthy();
      fireEvent.press(getByText('Reintentar'));
      expect(mockRefreshProfile).toHaveBeenCalledTimes(1);
    });

    it('leaves without prompting when nothing changed', () => {
      mockProfileState = { profile, isLoading: false, error: null };
      const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
      const { getByLabelText } = render(<EditProfileScreen />);
      fireEvent.press(getByLabelText('Volver'));
      expect(alertSpy).not.toHaveBeenCalled();
      expect(mockBack).toHaveBeenCalledTimes(1);
      alertSpy.mockRestore();
    });

    it('asks before discarding unsaved changes', () => {
      mockProfileState = { profile, isLoading: false, error: null };
      const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
      const { getByLabelText, getByPlaceholderText } = render(<EditProfileScreen />);
      fireEvent.changeText(getByPlaceholderText('Tu nombre'), 'Ana María');
      fireEvent.press(getByLabelText('Volver'));
      expect(alertSpy).toHaveBeenCalledWith('Descartar cambios', expect.any(String), expect.any(Array));
      expect(mockBack).not.toHaveBeenCalled();
      alertSpy.mockRestore();
    });

    it('does not allow saving an empty first name', () => {
      mockProfileState = { profile, isLoading: false, error: null };
      const { getByPlaceholderText, getByText } = render(<EditProfileScreen />);
      fireEvent.changeText(getByPlaceholderText('Tu nombre'), '   ');
      expect(getByText('El nombre es obligatorio')).toBeTruthy();
      fireEvent.press(getByText('Guardar Cambios'));
      expect(mockUpdateProfile).not.toHaveBeenCalled();
    });
  });
});

describe('profile and users have no hard-coded design literals', () => {
  const repo = path.resolve(__dirname, '..');
  const raw = /#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|fontFamily\s*:\s*['"`]/;
  const named = /[cC]olor\s*[:=]\s*\{?\s*['"](?!transparent['"])[a-z]+['"]|tint\s*[:=]\s*\{?\s*['"][a-z]+['"]/;
  const stripComments = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

  const walk = (dir: string): string[] =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const p = path.join(dir, e.name);
      return e.isDirectory() ? walk(p) : /\.tsx?$/.test(e.name) ? [p] : [];
    });

  const files = [
    ...walk(path.join(repo, 'src/features/profile')),
    ...walk(path.join(repo, 'src/features/users')),
    ...walk(path.join(repo, 'app/(tabs)/profile/edit')),
    path.join(repo, 'app/(tabs)/profile/index.tsx'),
    path.join(repo, 'app/(tabs)/profile/EditProfile.tsx'),
    path.join(repo, 'app/(tabs)/profile/verify-phone.tsx'),
    path.join(repo, 'app/(tabs)/profile/delete-account.tsx'),
  ];

  it('finds the files', () => {
    expect(files.length).toBeGreaterThan(14);
  });

  it.each(files.map((f) => [path.relative(repo, f).replace(/\\/g, '/'), f]))('%s', (rel, abs) => {
    const src = stripComments(fs.readFileSync(abs, 'utf8'));
    expect({ file: rel, raw: raw.exec(src)?.[0] ?? null }).toEqual({ file: rel, raw: null });
    expect({ file: rel, named: named.exec(src)?.[0] ?? null }).toEqual({ file: rel, named: null });
  });
});
