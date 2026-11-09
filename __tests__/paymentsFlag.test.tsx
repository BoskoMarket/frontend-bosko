import React from 'react';
import { render } from '@testing-library/react-native';

let mockPayments = false;
jest.mock('@/core/config/features', () => ({
  FEATURES: {
    reels: false,
    get payments() { return mockPayments; },
  },
}));

const mockRedirect = jest.fn((_props: { href: string }) => null);
jest.mock('expo-router', () => ({ Redirect: (props: { href: string }) => mockRedirect(props) }));

jest.mock('@/features/orders/screens/CheckoutScreen', () => ({ CheckoutScreen: () => null }));
jest.mock('@/features/orders/screens/PaymentSuccessScreen', () => ({ PaymentSuccessScreen: () => null }));
jest.mock('@/features/plans/screens/PlansScreen', () => ({ __esModule: true, default: () => null }));

import CheckoutRoute from '../app/orders/checkout';
import PaymentSuccessRoute from '../app/orders/payment-success';
import PlansRoute from '../app/(tabs)/profile/plans';

describe('payments flag (v1: the client pays the provider outside the app)', () => {
  beforeEach(() => {
    mockRedirect.mockClear();
    mockPayments = false;
  });

  it.each([
    ['checkout', CheckoutRoute, '/(tabs)/orders'],
    ['payment-success', PaymentSuccessRoute, '/(tabs)/orders'],
    ['plans', PlansRoute, '/(tabs)/profile'],
  ])('redirects %s away while payments are off', (_name, Route, href) => {
    render(<Route />);
    expect(mockRedirect).toHaveBeenCalledWith({ href });
  });

  it('renders the screens when payments are re-enabled', () => {
    mockPayments = true;
    render(<CheckoutRoute />);
    render(<PaymentSuccessRoute />);
    render(<PlansRoute />);
    expect(mockRedirect).not.toHaveBeenCalled();
  });
});
