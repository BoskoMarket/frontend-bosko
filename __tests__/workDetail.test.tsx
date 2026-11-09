import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

const mockPush = jest.fn();
let mockWork: any;
let mockViewerId: string | undefined = 'viewer';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('expo-router', () => ({
  router: { push: (...a: unknown[]) => mockPush(...a), back: jest.fn(), replace: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => ({ id: 'w1' }),
}));
jest.mock('@/hooks/queries/useProfileQuery', () => ({
  useProfile: () => ({ data: mockViewerId ? { id: mockViewerId } : undefined }),
}));
jest.mock('@/hooks/queries/useWorksQuery', () => ({
  useWorkFromCache: () => mockWork,
  useReportWork: () => ({ mutateAsync: jest.fn() }),
}));

import WorkDetailScreen from '@/features/works/screens/WorkDetailScreen';

const baseWork = () => ({
  id: 'w1',
  imageUrl: 'https://cdn.test/w1.jpg',
  thumbnailUrl: null,
  width: null,
  height: null,
  description: 'Cambio de cañería',
  createdAt: '2026-11-03T12:00:00.000Z',
  likes: 0,
  service: { id: 's1', title: 'Plomería a domicilio', categoryId: 'c1', categoryName: 'Plomería' },
  provider: { id: 'prov', name: 'Ana Gómez', avatarUrl: null, rating: 4.8, isVerified: true },
});

beforeEach(() => {
  jest.clearAllMocks();
  mockWork = baseWork();
  mockViewerId = 'viewer';
});

describe('WorkDetailScreen', () => {
  it('shows description, service, provider and rating', () => {
    const { getByText } = render(<WorkDetailScreen />);
    expect(getByText('Plomería a domicilio')).toBeTruthy();
    expect(getByText('Cambio de cañería')).toBeTruthy();
    expect(getByText('Ana Gómez')).toBeTruthy();
    expect(getByText('4.8')).toBeTruthy();
    expect(getByText('Verificado')).toBeTruthy();
  });

  it('Cotizar opens the quote route of that service', () => {
    const { getByText } = render(<WorkDetailScreen />);
    fireEvent.press(getByText('Cotizar'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/orders/quote',
      params: { serviceId: 's1', providerName: 'Ana Gómez', serviceTitle: 'Plomería a domicilio' },
    });
  });

  it('the provider row opens the provider profile', () => {
    const { getByLabelText } = render(<WorkDetailScreen />);
    fireEvent.press(getByLabelText('Ver perfil de Ana Gómez'));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/(tabs)/services/provider/[id]', params: { id: 'prov' } });
  });

  it('offers to report photos from other providers', () => {
    const { getByLabelText } = render(<WorkDetailScreen />);
    expect(getByLabelText('Reportar foto')).toBeTruthy();
  });

  it('hides report (and Cotizar) on your own photo', () => {
    mockViewerId = 'prov';
    const { queryByLabelText, queryByText } = render(<WorkDetailScreen />);
    expect(queryByLabelText('Reportar foto')).toBeNull();
    expect(queryByText('Cotizar')).toBeNull();
  });

  it('hides report while the viewer is unknown', () => {
    mockViewerId = undefined;
    const { queryByLabelText } = render(<WorkDetailScreen />);
    expect(queryByLabelText('Reportar foto')).toBeNull();
  });

  it('falls back gracefully when the photo is not in the cache', () => {
    mockWork = undefined;
    const { getByText } = render(<WorkDetailScreen />);
    expect(getByText('Esta foto ya no está disponible')).toBeTruthy();
  });
});
