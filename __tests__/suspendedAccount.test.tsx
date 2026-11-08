import React from 'react';
import { Text } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/features/auth/state/AuthContext';
import { tokenStorage } from '@/core/auth/tokenStorage';
import api from '@/core/api/axiosinstance';
import { useChatStore } from '@/stores/chat.store';
import { socketService } from '@/features/chat/services/socket.service';

const mockReplace = jest.fn();
jest.mock('expo-router', () => {
  const { Text: T } = require('react-native');
  return {
    router: { replace: (...args: unknown[]) => mockReplace(...args) },
    Redirect: ({ href }: { href: string }) => <T>redirect:{href}</T>,
    Stack: Object.assign(() => null, { Screen: () => null }),
  };
});
jest.mock('expo-secure-store', () => ({ getItemAsync: jest.fn(), setItemAsync: jest.fn(), deleteItemAsync: jest.fn() }));
jest.mock('@/core/api/axiosinstance', () => ({ __esModule: true, default: { get: jest.fn() } }));
jest.mock('@/features/chat/services/socket.service', () => ({ socketService: { connect: jest.fn(), disconnect: jest.fn() } }));
jest.mock('@/stores/favorites.store', () => ({ useFavoritesStore: { getState: () => ({ setAccount: jest.fn(async () => {}) }) } }));
const mockFetchConfig = jest.fn();
jest.mock('@/features/appConfig/services/appConfig.service', () => ({ fetchAppConfig: () => mockFetchConfig() }));
jest.mock('expo-application', () => ({ nativeApplicationVersion: '1.0.0' }));
jest.mock('@/features/auth/screens/OnBoarding', () => () => null);

import SuspendedAccountScreen from '@/features/auth/screens/SuspendedAccountScreen';
import IndexScreen from '../app/index';

function State() {
  const auth = useAuth();
  return <Text>{`${auth.isAuthenticated ? 'in' : 'out'}|${auth.suspended ? 'suspended' : 'ok'}`}</Text>;
}
function mount(children: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><AuthProvider>{children}</AuthProvider></QueryClientProvider>);
}
let hydrate: jest.SpyInstance;
beforeEach(async () => {
  jest.clearAllMocks();
  mockFetchConfig.mockResolvedValue({ supportWhatsapp: '5492494000000' });
  await tokenStorage.clear();
  await tokenStorage.save('access', 'refresh', 'a@example.test');
  hydrate = jest.spyOn(tokenStorage, 'hydrate').mockResolvedValue(undefined);
  jest.mocked(api.get).mockResolvedValue({ data: { id: 'a', email: 'a@example.test' } });
});
afterEach(() => { hydrate.mockRestore(); });

const suspend = () => act(async () => { tokenStorage.triggerForceLogout('suspended'); await tokenStorage.clear(); });

test('el logout forzado con motivo suspended limpia la sesión, marca el flag y navega a /suspended', async () => {
  const ui = mount(<State />);
  await ui.findByText('in|ok');
  useChatStore.getState().setUnreadTotal(5);
  await suspend();
  expect(await ui.findByText('out|suspended')).toBeTruthy();
  expect(mockReplace).toHaveBeenCalledWith('/suspended');
  expect(socketService.disconnect).toHaveBeenCalled();
  await waitFor(() => expect(useChatStore.getState().unreadTotal).toBe(0));
});

test('el logout forzado sin motivo no marca la suspensión ni navega', async () => {
  const ui = mount(<State />);
  await ui.findByText('in|ok');
  await act(async () => { tokenStorage.triggerForceLogout(); await tokenStorage.clear(); });
  expect(await ui.findByText('out|ok')).toBeTruthy();
  expect(mockReplace).not.toHaveBeenCalled();
});

describe('SuspendedAccountScreen', () => {
  it('muestra el aviso y el botón de soporte cuando hay número', async () => {
    const ui = mount(<SuspendedAccountScreen />);
    expect(ui.getByText('Tu cuenta está suspendida')).toBeTruthy();
    expect(await ui.findByText('Contactar a soporte')).toBeTruthy();
  });

  it('oculta el botón de soporte sin número', async () => {
    mockFetchConfig.mockResolvedValue({ minVersion: '0.0.0' });
    const ui = mount(<SuspendedAccountScreen />);
    await waitFor(() => expect(mockFetchConfig).toHaveBeenCalled());
    expect(ui.queryByText('Contactar a soporte')).toBeNull();
    expect(ui.getByText('Volver al inicio de sesión')).toBeTruthy();
  });

  it('volver al inicio de sesión limpia el flag y va a /login', async () => {
    const ui = mount(<><State /><SuspendedAccountScreen /></>);
    await ui.findByText('in|ok');
    await suspend();
    await ui.findByText('out|suspended');
    mockReplace.mockClear();
    fireEvent.press(ui.getByText('Volver al inicio de sesión'));
    expect(await ui.findByText('out|ok')).toBeTruthy();
    expect(mockReplace).toHaveBeenCalledWith('/login');
  });
});

describe('guard de app/index', () => {
  it('manda a /suspended a una cuenta suspendida en vez de mostrar onboarding o las tabs', async () => {
    const ui = mount(<><State /><IndexScreen /></>);
    await ui.findByText('in|ok');
    await suspend();
    expect(await ui.findByText('redirect:/suspended')).toBeTruthy();
  });
});
