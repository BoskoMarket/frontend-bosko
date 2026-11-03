import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

const mockPush = jest.fn();
const mockRouter = { push: (...a: unknown[]) => mockPush(...a), replace: jest.fn(), back: jest.fn() };
const mockParams = { id: 'c1' };
const mockCategories = { data: [{ id: 'c1', name: 'Hogar', description: '' }] };
const service = {
  id: 's1', categoryId: 'c1', providerId: 'prov1', name: 'Ana Gomez', title: 'Plomería', summary: '',
  location: 'CABA', rate: { amount: 1, currency: 'ARS', unit: 'h' }, averageRating: 4, reviewsCount: 1,
};

const mockServicesQuery = {
  data: { pages: [{ data: [service] }] },
  isLoading: false,
  isFetchingNextPage: false,
  hasNextPage: false,
  fetchNextPage: jest.fn(),
};

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('@/core/navigation/safeBack', () => ({ safeBack: jest.fn() }));
jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useRouter: () => mockRouter,
  useLocalSearchParams: () => mockParams,
}));
jest.mock('@/hooks/queries/useMarketplaceQuery', () => ({
  useCategories: () => mockCategories,
  useServicesByCategory: () => mockServicesQuery,
}));
jest.mock('@/features/favorites/state/FavoritesContext', () => ({
  useFavorites: () => ({ isFavorite: () => false, toggle: jest.fn() }),
}));

import CategoryServicesScreen from '@/features/servicesUser/screens/CategoryServicesScreen';

describe('CategoryServicesScreen quote CTA', () => {
  beforeEach(() => mockPush.mockClear());

  it('says "Cotizar" and quotes that service, not the provider profile', () => {
    const { getByText, queryByText } = render(<CategoryServicesScreen />);
    expect(queryByText('Cotizar por chat')).toBeNull();
    fireEvent.press(getByText('Cotizar'));
    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/orders/quote',
      params: { serviceId: 's1', providerName: 'Ana Gomez', serviceTitle: 'Plomería' },
    });
  });

  it('keeps the card tap going to the provider profile', () => {
    const { getByText } = render(<CategoryServicesScreen />);
    fireEvent.press(getByText('Plomería'));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/(tabs)/services/provider/[id]', params: { id: 'prov1' } });
  });
});
