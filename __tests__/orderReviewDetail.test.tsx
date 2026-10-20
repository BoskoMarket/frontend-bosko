import React from 'react';
import { act, render } from '@testing-library/react-native';
import OrderDetailScreen from '@/features/orders/screens/OrderDetailScreen';

const mockRefetch = jest.fn();
let mockFocus: (() => void) | null = null;
let mockProfileId = 'client';
let mockReview: { id: string; rating: number; comment: string } | null = null;

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn() },
  useLocalSearchParams: () => ({ id: 'o1' }),
  useFocusEffect: (effect: () => void) => { mockFocus = effect; require('react').useEffect(effect, []); },
}));
jest.mock('@/components/AnimatedBackground', () => ({ AnimatedBackground: () => null }));
jest.mock('@/features/orders/state/OrdersContext', () => ({ useOrders: () => ({}) }));
jest.mock('@/features/profile/state/ProfileContext', () => ({ useProfile: () => ({ profile: { id: mockProfileId } }) }));
jest.mock('@/hooks/queries/useOrdersQuery', () => ({
  useOrder: () => ({ data: {
    id: 'o1', clientId: 'client', providerId: 'provider', status: 'completed',
    paymentStatus: 'paid', createdAt: '2026-01-01', clientMessage: 'Gracias',
    review: mockReview,
  }, isLoading: false, refetch: mockRefetch }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockProfileId = 'client';
  mockReview = null;
});

it('offers a review to the client only while the completed order has no review', () => {
  const { getByText, rerender, queryByText } = render(<OrderDetailScreen />);
  expect(getByText('Calificar servicio')).toBeTruthy();
  mockReview = { id: 'r1', rating: 4, comment: 'Buen trabajo' };
  rerender(<OrderDetailScreen />);
  expect(queryByText('Calificar servicio')).toBeNull();
  expect(getByText('Ya calificaste este servicio (4/5)')).toBeTruthy();
  expect(queryByText('Ya calificaste este servicio.')).toBeNull();
});

it('shows the existing rating to the provider', () => {
  mockProfileId = 'provider';
  mockReview = { id: 'r1', rating: 5, comment: 'Excelente' };
  const { getByText, queryByText } = render(<OrderDetailScreen />);
  expect(getByText('Este servicio fue calificado (5/5)')).toBeTruthy();
  expect(queryByText('Calificar servicio')).toBeNull();
});

it('skips the first focus and refetches on later focuses', () => {
  render(<OrderDetailScreen />);
  expect(mockRefetch).not.toHaveBeenCalled();
  act(() => { mockFocus?.(); });
  expect(mockRefetch).toHaveBeenCalledTimes(1);
});
