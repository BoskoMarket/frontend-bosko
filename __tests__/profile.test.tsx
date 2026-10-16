import React from 'react';
import * as fs from 'fs';
import * as path from 'path';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { useThemeStore } from '@/stores/theme.store';
import { dialog } from '@/core/design-system';

const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockLogout = jest.fn(async () => {});
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
jest.mock('@/features/payments/state/PaymentContext', () => ({ usePayments: () => mockPayments }));
jest.mock('@/features/profile/state/ProfileContext', () => ({
  useProfile: () => ({
    ...mockProfileState,
    updateProfile: mockUpdateProfile,
    refreshProfile: mockRefreshProfile,
  }),
}));
jest.mock('@/hooks/queries/useProfileQuery', () => ({
  useUploadAvatar: () => ({ mutateAsync: jest.fn() }),
  useUploadBanner: () => ({ mutateAsync: jest.fn() }),
  useRemoveBanner: () => ({ mutateAsync: jest.fn() }),
}));
jest.mock('expo-image-picker', () => ({}));
jest.mock('expo-location', () => ({}));

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
      const alertSpy = jest.spyOn(dialog, 'fromAlert').mockImplementation(() => {});
      const { getByLabelText } = render(<EditProfileScreen />);
      fireEvent.press(getByLabelText('Volver'));
      expect(alertSpy).not.toHaveBeenCalled();
      expect(mockBack).toHaveBeenCalledTimes(1);
      alertSpy.mockRestore();
    });

    it('asks before discarding unsaved changes', () => {
      mockProfileState = { profile, isLoading: false, error: null };
      const alertSpy = jest.spyOn(dialog, 'fromAlert').mockImplementation(() => {});
      const { getByLabelText, getByPlaceholderText } = render(<EditProfileScreen />);
      fireEvent.changeText(getByPlaceholderText('Tu nombre'), 'Ana María');
      fireEvent.press(getByLabelText('Volver'));
      expect(alertSpy).toHaveBeenCalledWith('Descartar cambios', expect.any(String), expect.any(Array));
      expect(mockBack).not.toHaveBeenCalled();
      alertSpy.mockRestore();
    });

    it('renders the Portada section; "Quitar" only when a banner exists', () => {
      mockProfileState = { profile, isLoading: false, error: null };
      const first = render(<EditProfileScreen />);
      expect(first.getByText('Portada')).toBeTruthy();
      expect(first.getByLabelText('Cambiar portada')).toBeTruthy();
      expect(first.queryByLabelText('Quitar portada')).toBeNull();
      first.unmount();

      mockProfileState = { profile: { ...profile, bannerUrl: 'https://cdn.test/b.jpg' }, isLoading: false, error: null };
      const second = render(<EditProfileScreen />);
      expect(second.getByLabelText('Quitar portada')).toBeTruthy();
    });

    it('asks for confirmation before removing the banner', () => {
      mockProfileState = { profile: { ...profile, bannerUrl: 'https://cdn.test/b.jpg' }, isLoading: false, error: null };
      const alertSpy = jest.spyOn(dialog, 'fromAlert').mockImplementation(() => {});
      const { getByLabelText } = render(<EditProfileScreen />);
      fireEvent.press(getByLabelText('Quitar portada'));
      expect(alertSpy).toHaveBeenCalledWith('Quitar portada', expect.any(String), expect.any(Array));
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

describe('profile editing is consolidated in EditProfileScreen', () => {
  const repo = path.resolve(__dirname, '..');
  const profileScreen = fs.readFileSync(path.join(repo, 'src/features/profile/ProfileScreen.tsx'), 'utf8');

  it('removes the EditProfileModal', () => {
    expect(fs.existsSync(path.join(repo, 'src/features/profile/components/EditProfileModal.tsx'))).toBe(false);
    expect(profileScreen).not.toContain('EditProfileModal');
  });

  it('routes every ProfileScreen edit entry to the EditProfile route', () => {
    expect(profileScreen).toContain("router.push('/(tabs)/profile/EditProfile')");
    expect(fs.existsSync(path.join(repo, 'app/(tabs)/profile/EditProfile.tsx'))).toBe(true);
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
