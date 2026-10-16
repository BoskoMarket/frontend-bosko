import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { router } from 'expo-router';
import ClientHome from '@/features/servicesUser/screens/ClientHome';
import { useThemeStore } from '@/stores/theme.store';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue('true'),
  setItem: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('@/components/BrandMark', () => ({ BrandMark: () => null }));
jest.mock('@/features/profile/state/ProfileContext', () => ({ useProfile: () => ({ profile: { firstName: 'Ana', location: 'Palermo' } }) }));
jest.mock('@/features/notifications/state/NotificationsContext', () => ({ useNotifications: () => ({ unreadCount: 2 }) }));
jest.mock('@/features/favorites/state/FavoritesContext', () => ({ useFavorites: () => ({ isFavorite: () => false, toggle: jest.fn() }) }));
jest.mock('@/stores/notificationsUI.store', () => ({ openNotifications: jest.fn() }));

const mockCategories = jest.fn();
const mockServices = jest.fn();
jest.mock('@/hooks/queries/useMarketplaceQuery', () => ({
  useCategories: () => mockCategories(),
  useFeaturedServices: () => mockServices(),
}));

const ok = (data: unknown) => ({ data, isLoading: false, isError: false, refetch: jest.fn() });

const SERVICE = {
  id: 's1', categoryId: 'c1', providerId: 'p1', name: 'Tomas', title: 'Instalación de tomas', summary: '',
  location: 'Palermo', rate: { amount: 18500, currency: 'ARS', unit: 'visita' }, averageRating: 4.8, reviewsCount: 32, isAvailable: true,
};

beforeEach(() => {
  jest.clearAllMocks();
  useThemeStore.setState({ mode: 'dark' });
  mockCategories.mockReturnValue(ok([{ id: 'c1', name: 'Electricidad', icon: 'flash-outline', description: '', accent: '' }]));
  mockServices.mockReturnValue(ok([SERVICE]));
});

describe('ClientHome', () => {
  it('explains Bosko and routes the main actions', () => {
    const { getByText, getAllByText, getByLabelText } = render(<ClientHome />);
    expect(getByText('Encontrá quien lo haga. O hacelo vos.')).toBeTruthy();
    expect(getByText('Cómo funciona')).toBeTruthy();
    expect(getByText('Identidad verificada')).toBeTruthy();

    fireEvent.press(getByLabelText('¿Qué necesitás? Electricista, pintor…'));
    expect(router.push).toHaveBeenCalledWith('/search');

    fireEvent.press(getByText('Buscar servicios →'));
    expect(router.push).toHaveBeenCalledWith('/(tabs)/services');

    fireEvent.press(getByText('Empezar a ofrecer →'));
    expect(router.push).toHaveBeenCalledWith('/(tabs)/profile/become-provider');

    fireEvent.press(getAllByText('Ofrecer').at(-1)!);
    expect(router.push).toHaveBeenLastCalledWith('/(tabs)/profile/become-provider');
  });

  it('shows categories and popular services, keeping the provider route params', () => {
    const { getByText } = render(<ClientHome />);
    fireEvent.press(getByText('Electricidad'));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/(tabs)/services/category/[id]', params: { id: 'c1', from: 'home' } });

    expect(getByText('Disponible hoy')).toBeTruthy();
    expect(getByText('$18.500')).toBeTruthy();
    fireEvent.press(getByText('Instalación de tomas'));
    expect(router.push).toHaveBeenLastCalledWith({ pathname: '/(tabs)/services/provider/[id]', params: { id: 'p1', from: 'home' } });
  });

  it('shows an error with retry for popular services', () => {
    const refetch = jest.fn();
    mockServices.mockReturnValue({ data: undefined, isLoading: false, isError: true, refetch });
    const { getByText } = render(<ClientHome />);
    fireEvent.press(getByText('Reintentar'));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('shows the empty state when there are no services', () => {
    mockServices.mockReturnValue(ok([]));
    const { getByText } = render(<ClientHome />);
    expect(getByText('Todavía no hay servicios')).toBeTruthy();
  });

  it('does not show the empty/error state while loading', () => {
    mockServices.mockReturnValue({ data: undefined, isLoading: true, isError: false, refetch: jest.fn() });
    const { queryByText } = render(<ClientHome />);
    expect(queryByText('Todavía no hay servicios')).toBeNull();
    expect(queryByText('Reintentar')).toBeNull();
  });
});
