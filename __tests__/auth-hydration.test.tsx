import React from 'react';
import { Text } from 'react-native';
import { render, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/features/auth/state/AuthContext';
import { tokenStorage } from '@/core/auth/tokenStorage';
import api from '@/core/api/axiosinstance';
import { socketService } from '@/features/chat/services/socket.service';
import { useChatStore } from '@/stores/chat.store';

jest.mock('expo-secure-store', () => ({ getItemAsync: jest.fn(), setItemAsync: jest.fn(), deleteItemAsync: jest.fn() }));
jest.mock('@/core/api/axiosinstance', () => ({ __esModule: true, default: { get: jest.fn() } }));
jest.mock('@/features/chat/services/socket.service', () => ({ socketService: { connect: jest.fn(), disconnect: jest.fn() } }));
jest.mock('@/stores/theme.store', () => ({ useThemeColors: () => ({ bg: '#fff', text: '#000' }) }));
jest.mock('@/stores/favorites.store', () => ({ useFavoritesStore: { getState: () => ({ setAccount: jest.fn(async () => {}) }) } }));
function State() {
  const auth = useAuth();
  return <Text>{auth.isAuthenticated ? `Cuenta:${auth.authState.user?.id}` : 'Sin sesión'}</Text>;
}
let hydrate: jest.SpyInstance;
beforeEach(async () => {
  jest.clearAllMocks();
  await tokenStorage.clear();
  await tokenStorage.save('access', 'refresh', 'a@example.test');
  hydrate = jest.spyOn(tokenStorage, 'hydrate').mockResolvedValue(undefined);
});
afterEach(() => { hydrate.mockRestore(); });
function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><AuthProvider><State /></AuthProvider></QueryClientProvider>);
}
test('no muestra contenido autenticado hasta validar /users/me', async () => {
  let resolve!: (value: any) => void;
  jest.mocked(api.get).mockImplementationOnce(() => new Promise(done => { resolve = done; }));
  const ui = mount();
  expect(ui.queryByText('Cuenta:a')).toBeNull();
  await waitFor(() => expect(api.get).toHaveBeenCalledWith('/users/me'));
  await act(async () => { resolve({ data: { id: 'a', email: 'a@example.test' } }); });
  expect(await ui.findByText('Cuenta:a')).toBeTruthy();
  expect(socketService.connect).toHaveBeenCalledWith('access');
});
test('sin red conserva las credenciales y ofrece reintentar sin abrir las pantallas privadas', async () => {
  jest.mocked(api.get).mockRejectedValueOnce(new Error('Sin conexión'));
  const ui = mount();
  expect(await ui.findByText('Reintentar conexión')).toBeTruthy();
  expect(ui.queryByText('Cuenta:a')).toBeNull();
  expect(tokenStorage.getRefreshToken()).toBe('refresh');
});
test('revocación limpia conversaciones y desconecta socket', async () => {
  jest.mocked(api.get).mockResolvedValueOnce({ data: { id: 'a', email: 'a@example.test' } });
  const ui = mount();
  await ui.findByText('Cuenta:a');
  useChatStore.getState().setUnreadTotal(8);
  await act(async () => { tokenStorage.triggerForceLogout(); await tokenStorage.clear(); });
  expect(await ui.findByText('Sin sesión')).toBeTruthy();
  expect(socketService.disconnect).toHaveBeenCalled();
  await waitFor(() => expect(useChatStore.getState().unreadTotal).toBe(0)); // purge runs after the logout transition
});
