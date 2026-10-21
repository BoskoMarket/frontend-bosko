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
  it('shows the headline and routes the main actions', () => {
    const { getByText, getAllByText, getByLabelText } = render(<ClientHome />);
    expect(getByText('Encontrá quien lo haga.')).toBeTruthy();
    expect(getByText('O hacelo vos.')).toBeTruthy();
    expect(getByText('Cómo funciona')).toBeTruthy();
    expect(getByText('Identidad verificada')).toBeTruthy();

    fireEvent.press(getByLabelText('¿Qué necesitás? Electricista, pintor…'));
    expect(router.push).toHaveBeenCalledWith('/search');

    fireEvent.press(getByText('Buscar ahora'));
    expect(router.push).toHaveBeenLastCalledWith('/search');

    fireEvent.press(getByText('Ver todas'));
    expect(router.push).toHaveBeenLastCalledWith('/(tabs)/services');

    fireEvent.press(getAllByText('Ofrecer').at(-1)!);
    expect(router.push).toHaveBeenLastCalledWith('/(tabs)/profile/become-provider');
  });

  it('routes category chips and category cards to the category screen', () => {
    const { getByLabelText, getByText } = render(<ClientHome />);
    const expected = { pathname: '/(tabs)/services/category/[id]', params: { id: 'c1', from: 'home' } };

    expect(getByText('Rubros')).toBeTruthy();
    expect(getByText('Instalaciones, tableros y arreglos con matriculados.')).toBeTruthy();

    fireEvent.press(getByLabelText('Electricidad')); // chip
    expect(router.push).toHaveBeenLastCalledWith(expected);

    fireEvent.press(getByText('Ver profesionales')); // card CTA
    expect(router.push).toHaveBeenLastCalledWith(expected);
  });

  it('limits the category cards to six, keeps every chip, and never renders an emoji icon', () => {
    const many = Array.from({ length: 8 }, (_, i) => ({
      id: `c${i}`, name: `Rubro ${i}`, icon: i === 0 ? '⚡' : 'flash-outline', description: '', accent: '',
    }));
    mockCategories.mockReturnValue(ok(many));
    const { getAllByText, getByLabelText, queryByText } = render(<ClientHome />);
    expect(getAllByText('Ver profesionales')).toHaveLength(6);
    expect(getByLabelText('Rubro 7')).toBeTruthy(); // chip for the 8th category still exists
    expect(queryByText('⚡')).toBeNull();
  });

  it('shows popular services, keeping the provider route params', () => {
    const { getByText } = render(<ClientHome />);
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
