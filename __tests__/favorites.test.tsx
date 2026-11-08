import React from 'react';
import { Pressable, Text as RNText } from 'react-native';
import { act, fireEvent, render, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockGet = jest.fn();
const mockPut = jest.fn();
const mockDelete = jest.fn();
jest.mock('@/core/api/axiosinstance', () => ({
  __esModule: true,
  default: {
    get: (...a: unknown[]) => mockGet(...a),
    put: (...a: unknown[]) => mockPut(...a),
    delete: (...a: unknown[]) => mockDelete(...a),
  },
}));
jest.mock('@/features/auth/state/AuthContext', () => ({ useAuth: () => ({ isAuthenticated: true }) }));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
const mockPush = jest.fn();
jest.mock('expo-router', () => ({ router: { push: (...a: unknown[]) => mockPush(...a), back: jest.fn(), replace: jest.fn() } }));
jest.mock('@/core/navigation/safeBack', () => ({ safeBack: jest.fn() }));
jest.mock('@/components/AnimatedBackground', () => ({ AnimatedBackground: () => null }));
const mockToastError = jest.fn();
jest.mock('@/core/design-system/components/Toast', () => ({
  ...jest.requireActual('@/core/design-system/components/Toast'),
  toast: { error: (...a: unknown[]) => mockToastError(...a), success: jest.fn(), warning: jest.fn() },
}));

import { QUERY_KEYS } from '@/core/query/queryKeys';
import { addFavorite, fetchFavorites, removeFavorite } from '@/features/favorites/services/favorites.service';
import { useFavorites } from '@/features/favorites/state/FavoritesContext';
import { FavoritesScreen } from '@/features/favorites/screens/FavoritesScreen';
import { useFavoriteIds, useFavoriteMutation, useIsFavorite } from '@/hooks/queries/useFavoritesQuery';
import type { ServiceSummary } from '@/types/services';

const dto = (id: string) => ({
  id,
  title: `Servicio ${id}`,
  category: { id: 'c1' },
  provider: { id: 'p1', firstName: 'Ana', lastName: 'Lopez' },
  price: { amount: '100', currency: 'ARS' },
});
const page = (ids: string[], over = {}) => ({ data: ids.map(dto), total: ids.length, page: 1, limit: 20, ...over });
const svc = (id: string): ServiceSummary => ({
  id, categoryId: 'c1', providerId: 'p1', name: 'Ana', title: `Servicio ${id}`, summary: '', location: '',
  rate: { amount: 100, currency: 'ARS', unit: 'hour' }, averageRating: 0, reviewsCount: 0,
});

let client: QueryClient;
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={client}>{children}</QueryClientProvider>
);

beforeEach(() => {
  jest.clearAllMocks();
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } } });
  mockPut.mockResolvedValue({ data: undefined });
  mockDelete.mockResolvedValue({ data: undefined });
});

describe('favorites.service', () => {
  it('GET /favorites paginates and maps services', async () => {
    mockGet.mockResolvedValueOnce({ data: page(['s1']) });
    const res = await fetchFavorites(2, 10);
    expect(mockGet).toHaveBeenCalledWith('/favorites', { params: { page: 2, limit: 10 } });
    expect(res.data[0]).toMatchObject({ id: 's1', providerId: 'p1', name: 'Ana Lopez' });
    expect(res.total).toBe(1);
  });

  it('PUT and DELETE target /favorites/:serviceId', async () => {
    await addFavorite('s1');
    await removeFavorite('s2');
    expect(mockPut).toHaveBeenCalledWith('/favorites/s1');
    expect(mockDelete).toHaveBeenCalledWith('/favorites/s2');
  });
});

describe('useIsFavorite', () => {
  it('reflects the cached id set', async () => {
    mockGet.mockResolvedValue({ data: page(['s1', 's2']) });
    const { result } = renderHook(() => [useIsFavorite('s1'), useIsFavorite('s9')], { wrapper });
    expect(result.current).toEqual([false, false]);
    await waitFor(() => expect(result.current).toEqual([true, false]));
  });

  it('hydrates ids across pages', async () => {
    mockGet
      .mockResolvedValueOnce({ data: { ...page(['s1']), total: 150, limit: 100 } })
      .mockResolvedValueOnce({ data: { ...page(['s2']), total: 150, page: 2, limit: 100 } });
    const { result } = renderHook(() => useFavoriteIds(), { wrapper });
    await waitFor(() => expect(result.current).toEqual(['s1', 's2']));
    expect(mockGet).toHaveBeenLastCalledWith('/favorites', { params: { page: 2, limit: 100 } });
  });
});

describe('optimistic toggle', () => {
  const seed = () => {
    client.setQueryData(QUERY_KEYS.favoriteIds, ['s1']);
    client.setQueryData(QUERY_KEYS.favorites, { pages: [page(['s1'])], pageParams: [1] });
    mockGet.mockResolvedValue({ data: page(['s1']) });
  };

  it('adds right away and calls PUT', async () => {
    seed();
    const { result } = renderHook(() => useFavoriteMutation(), { wrapper });
    await act(async () => { result.current.mutate({ service: svc('s2'), favorite: true }); });
    expect(client.getQueryData<string[]>(QUERY_KEYS.favoriteIds)).toEqual(['s2', 's1']);
    expect(mockPut).toHaveBeenCalledWith('/favorites/s2');
  });

  it('removes right away from ids and list and calls DELETE', async () => {
    seed();
    mockGet.mockResolvedValue({ data: page([]) });
    const { result } = renderHook(() => useFavoriteMutation(), { wrapper });
    await act(async () => { result.current.mutate({ service: svc('s1'), favorite: false }); });
    expect(mockDelete).toHaveBeenCalledWith('/favorites/s1');
    expect(client.getQueryData<string[]>(QUERY_KEYS.favoriteIds)).toEqual([]);
  });

  it('rolls back and shows a toast when the server fails', async () => {
    seed();
    mockPut.mockRejectedValueOnce({ response: { status: 404, data: { code: 'SERVICE_NOT_FOUND' } } });
    const { result } = renderHook(() => useFavoriteMutation(), { wrapper });
    await act(async () => { result.current.mutate({ service: svc('s2'), favorite: true }); });
    await waitFor(() => expect(mockToastError).toHaveBeenCalled());
    expect(client.getQueryData<string[]>(QUERY_KEYS.favoriteIds)).toEqual(['s1']);
    const pages = client.getQueryData<any>(QUERY_KEYS.favorites);
    expect(pages.pages[0].data.map((s: any) => s.id)).toEqual(['s1']);
  });
});

describe('consumer (card heart)', () => {
  function Heart({ item }: { item: ServiceSummary }) {
    const { isFavorite, toggle } = useFavorites();
    return (
      <Pressable accessibilityLabel="corazon" onPress={() => toggle(item)}>
        <RNText>{isFavorite(item.id) ? 'lleno' : 'vacio'}</RNText>
      </Pressable>
    );
  }

  it('toggles on and off through the server', async () => {
    mockGet.mockResolvedValue({ data: page([]) });
    const { getByLabelText, findByText } = render(<Heart item={svc('s1')} />, { wrapper });
    await findByText('vacio');
    mockGet.mockResolvedValue({ data: page(['s1']) });
    await act(async () => { fireEvent.press(getByLabelText('corazon')); });
    await findByText('lleno');
    expect(mockPut).toHaveBeenCalledWith('/favorites/s1');
    mockGet.mockResolvedValue({ data: page([]) });
    await act(async () => { fireEvent.press(getByLabelText('corazon')); });
    await findByText('vacio');
    expect(mockDelete).toHaveBeenCalledWith('/favorites/s1');
  });
});

describe('FavoritesScreen', () => {
  it('shows the empty state with a CTA to search', async () => {
    mockGet.mockResolvedValue({ data: page([]) });
    const { findByText } = render(<FavoritesScreen />, { wrapper });
    fireEvent.press(await findByText('Explorar servicios'));
    expect(mockPush).toHaveBeenCalledWith('/search');
  });

  it('shows an error state and retries', async () => {
    mockGet.mockRejectedValueOnce(new Error('boom'));
    const { findByText } = render(<FavoritesScreen />, { wrapper });
    const retry = await findByText('Reintentar');
    mockGet.mockResolvedValue({ data: page(['s1']) });
    await act(async () => { fireEvent.press(retry); });
    expect(await findByText('Servicio s1')).toBeTruthy();
  });

  it('removes with undo, which re-adds the service', async () => {
    mockGet.mockResolvedValue({ data: page(['s1']) });
    const { findByLabelText, findByText } = render(<FavoritesScreen />, { wrapper });
    fireEvent.press(await findByLabelText('Quitar Servicio s1 de favoritos'));
    await waitFor(() => expect(mockDelete).toHaveBeenCalledWith('/favorites/s1'));
    fireEvent.press(await findByText('Deshacer'));
    await waitFor(() => expect(mockPut).toHaveBeenCalledWith('/favorites/s1'));
  });
});
