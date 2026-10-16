import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { router } from 'expo-router';
import ProviderHome from '@/features/servicesUser/screens/ProviderHome';
import { useThemeStore } from '@/stores/theme.store';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('@/components/BrandMark', () => ({ BrandMark: () => null }));
jest.mock('@/features/profile/state/ProfileContext', () => ({ useProfile: () => ({ profile: { firstName: 'Martín' } }) }));
jest.mock('@/features/notifications/state/NotificationsContext', () => ({ useNotifications: () => ({ unreadCount: 0 }) }));
jest.mock('@/stores/notificationsUI.store', () => ({ openNotifications: jest.fn() }));

const mockOrders = jest.fn();
const mockStats = jest.fn();
jest.mock('@/hooks/queries/useOrdersQuery', () => ({ useProviderOrders: () => mockOrders() }));
jest.mock('@/hooks/queries/useProfileQuery', () => ({ useProfileStats: () => mockStats() }));

const ok = (data: unknown) => ({ data, isLoading: false, isError: false, refetch: jest.fn() });

const order = (id: string, status: string, name: string, createdAt: string) => ({
  id, status, title: 'Trabajo', createdAt, address: 'Palermo',
  otherParty: { id: `u-${id}`, firstName: name, lastName: 'P.' },
  service: { id: 's', title: 'Instalación de tomas' },
});

beforeEach(() => {
  jest.clearAllMocks();
  useThemeStore.setState({ mode: 'dark' });
  mockOrders.mockReturnValue(ok([
    order('1', 'pending', 'Laura', '2026-10-01T10:00:00Z'),
    order('2', 'pending', 'Diego', '2026-10-03T10:00:00Z'),
    order('3', 'completed', 'Ana', '2026-10-02T10:00:00Z'),
  ]));
  mockStats.mockReturnValue(ok({ servicesCount: 3, reviewsCount: 10, averageRating: 4.8, completedOrders: 128 }));
});

describe('ProviderHome', () => {
  it('summarizes pending requests, lists them newest first and links to the provider orders tab', () => {
    const { getByText, queryByText } = render(<ProviderHome />);
    expect(getByText('Hola, Martín')).toBeTruthy();
    expect(getByText('Tenés 2 solicitudes nuevas')).toBeTruthy();
    expect(queryByText(/Ana/)).toBeNull();

    fireEvent.press(getByText('Ver solicitudes'));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/(tabs)/orders', params: { tab: 'provider' } });

    fireEvent.press(getByText(/Diego P\. · Instalación de tomas/));
    expect(router.push).toHaveBeenLastCalledWith({ pathname: '/orders/[id]', params: { id: '2' } });
  });

  it('shows real stats and hides rating when there are no ratings', () => {
    const { getByText, queryByText, rerender } = render(<ProviderHome />);
    expect(getByText('4.8')).toBeTruthy();
    expect(getByText('128')).toBeTruthy();
    mockStats.mockReturnValue(ok({ servicesCount: 1, reviewsCount: 0, averageRating: 0, completedOrders: 0 }));
    rerender(<ProviderHome />);
    expect(queryByText('Rating')).toBeNull();
  });

  it('hides stats when the endpoint failed', () => {
    mockStats.mockReturnValue({ data: undefined, isLoading: false, isError: true, refetch: jest.fn() });
    const { queryByText } = render(<ProviderHome />);
    expect(queryByText('Trabajos')).toBeNull();
  });

  it('routes the quick actions', () => {
    const { getByText } = render(<ProviderHome />);
    fireEvent.press(getByText('Publicar servicio'));
    expect(router.push).toHaveBeenLastCalledWith('/service-form');
    fireEvent.press(getByText('Mis servicios'));
    expect(router.push).toHaveBeenLastCalledWith('/(tabs)/profile/Services');
    fireEvent.press(getByText('Subir reel'));
    expect(router.push).toHaveBeenLastCalledWith('/(tabs)/profile/upload-reel');
  });

  it('shows the empty state without pending requests', () => {
    mockOrders.mockReturnValue(ok([order('3', 'completed', 'Ana', '2026-10-02T10:00:00Z')]));
    const { getByText } = render(<ProviderHome />);
    expect(getByText('No tenés solicitudes nuevas')).toBeTruthy();
    expect(getByText('Sin solicitudes nuevas')).toBeTruthy();
  });

  it('shows an error with retry when requests fail', () => {
    const refetch = jest.fn();
    mockOrders.mockReturnValue({ data: undefined, isLoading: false, isError: true, refetch });
    const { getByText, queryByText } = render(<ProviderHome />);
    expect(queryByText(/solicitudes nuevas/)).toBeNull();
    fireEvent.press(getByText('Reintentar'));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('does not flash empty/error states while loading', () => {
    mockOrders.mockReturnValue({ data: undefined, isLoading: true, isError: false, refetch: jest.fn() });
    const { queryByText } = render(<ProviderHome />);
    expect(queryByText('Sin solicitudes nuevas')).toBeNull();
    expect(queryByText('Reintentar')).toBeNull();
  });
});
