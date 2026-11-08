import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

const mockPush = jest.fn();
let mockServices: Array<{ id: string; title: string; description?: string }> = [];

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('@/core/api/axiosinstance', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: (url: string) => {
      if (url.includes('/public')) {
        return Promise.resolve({ data: { id: 'prov1', firstName: 'Ana', lastName: 'Gomez', rating: 4, reviewsCount: 0 } });
      }
      if (url === '/services') return Promise.resolve({ data: { data: mockServices } });
      return Promise.resolve({ data: { data: [], total: 0, page: 1, limit: 10 } });
    },
  },
}));
jest.mock('@/hooks/queries/useProfileQuery', () => ({ useProfile: () => ({ data: { id: 'me' } }) }));
jest.mock('@/core/navigation/safeBack', () => ({ safeBack: jest.fn() }));
jest.mock('@/components/AnimatedBackground', () => ({ AnimatedBackground: () => null }));
jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useRouter: () => ({ push: (...a: unknown[]) => mockPush(...a), replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({ id: 'prov1' }),
}));
jest.mock('@/features/servicesUser/components/ServiceDetailModal', () => ({ ServiceDetailModal: () => null }));

import { OptionSheet } from '@/core/design-system';
import ProviderProfileScreen from '@/features/servicesUser/screens/ProviderProfileScreen';
import { quoteHref, resolveQuoteTarget } from '@/features/servicesUser/utils/quoteRoute';
import type { ServiceSummary } from '@/types/services';

const svc = (id: string, title: string) => ({ id, title }) as ServiceSummary;

describe('quote route helpers', () => {
  it('builds the typed quote href for one service', () => {
    expect(quoteHref(svc('s1', 'Plomería'), 'Ana Gomez')).toEqual({
      pathname: '/orders/quote',
      params: { serviceId: 's1', providerName: 'Ana Gomez', serviceTitle: 'Plomería' },
    });
  });

  it('quotes directly with exactly one service, asks with several, nothing with none', () => {
    expect(resolveQuoteTarget([])).toEqual({ kind: 'none' });
    const one = [svc('s1', 'A')];
    expect(resolveQuoteTarget(one)).toEqual({ kind: 'direct', service: one[0] });
    const many = [svc('s1', 'A'), svc('s2', 'B')];
    expect(resolveQuoteTarget(many)).toEqual({ kind: 'choose', services: many });
  });
});

describe('OptionSheet', () => {
  it('hands back the tapped option id and cancels', () => {
    const onSelect = jest.fn();
    const onCancel = jest.fn();
    const { getByLabelText, getByText } = render(
      <OptionSheet
        visible
        title="Elige"
        options={[{ id: 'a', label: 'Uno', description: 'Desc' }, { id: 'b', label: 'Dos' }]}
        onSelect={onSelect}
        onCancel={onCancel}
      />,
    );
    expect(getByText('Desc')).toBeTruthy();
    fireEvent.press(getByLabelText('Dos'));
    expect(onSelect).toHaveBeenCalledWith('b');
    fireEvent.press(getByText('Cancelar'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});

describe('ProviderProfileScreen "Solicitar servicio"', () => {
  beforeEach(() => mockPush.mockClear());

  it('goes straight to the quote when the provider has one service', async () => {
    mockServices = [{ id: 's1', title: 'Plomería' }];
    const { findByText } = render(<ProviderProfileScreen />);
    fireEvent.press(await findByText('Solicitar servicio'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/orders/quote',
      params: { serviceId: 's1', providerName: 'Ana Gomez', serviceTitle: 'Plomería' },
    });
  });

  it('opens a picker with several services and quotes the chosen one', async () => {
    mockServices = [{ id: 's1', title: 'Plomería' }, { id: 's2', title: 'Electricidad' }];
    const { findByText, getByLabelText } = render(<ProviderProfileScreen />);
    fireEvent.press(await findByText('Solicitar servicio'));
    expect(mockPush).not.toHaveBeenCalled();
    fireEvent.press(getByLabelText('Electricidad'));
    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/orders/quote',
        params: { serviceId: 's2', providerName: 'Ana Gomez', serviceTitle: 'Electricidad' },
      }),
    );
  });

  it('shows no quote button without services', async () => {
    mockServices = [];
    const { findByText, queryByText } = render(<ProviderProfileScreen />);
    await findByText('Ana Gomez');
    expect(queryByText('Solicitar servicio')).toBeNull();
  });
});
