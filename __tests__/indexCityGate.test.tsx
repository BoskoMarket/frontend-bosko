import React from 'react';
import { render } from '@testing-library/react-native';

const mockAuth = jest.fn();
const mockProfile = jest.fn();
jest.mock('@/features/auth/state/AuthContext', () => ({ useAuth: () => mockAuth() }));
jest.mock('@/hooks/queries/useProfileQuery', () => ({ useProfile: () => mockProfile() }));
jest.mock('@/features/auth/screens/OnBoarding', () => () => null);
jest.mock('expo-router', () => {
  const { Text } = require('react-native');
  return {
    Redirect: ({ href }: { href: string }) => <Text>redirect:{href}</Text>,
    Stack: { Screen: () => null },
  };
});

import IndexScreen from '../app/index';

const signedIn = (userCity?: unknown) => ({
  authLoaded: true,
  isAuthenticated: true,
  authState: { user: { id: 'u1', city: userCity } },
});

describe('app/index city gate', () => {
  it('sends a signed-in account whose profile says city === null to select-city', () => {
    mockAuth.mockReturnValue(signedIn());
    mockProfile.mockReturnValue({ data: { city: null } });
    expect(render(<IndexScreen />).getByText('redirect:/auth/select-city')).toBeTruthy();
  });

  it('does nothing when the API does not send the field (undefined = old backend)', () => {
    mockAuth.mockReturnValue(signedIn());
    mockProfile.mockReturnValue({ data: { id: 'u1' } });
    expect(render(<IndexScreen />).getByText('redirect:/(tabs)')).toBeTruthy();
  });

  it('does nothing while the profile is unknown', () => {
    mockAuth.mockReturnValue(signedIn());
    mockProfile.mockReturnValue({ data: undefined });
    expect(render(<IndexScreen />).getByText('redirect:/(tabs)')).toBeTruthy();
  });

  it('goes to the tabs when the account has a city', () => {
    mockAuth.mockReturnValue(signedIn());
    mockProfile.mockReturnValue({ data: { city: { id: 'tandil', name: 'Tandil', currency: 'ARS' } } });
    expect(render(<IndexScreen />).getByText('redirect:/(tabs)')).toBeTruthy();
  });

  it('falls back to the login payload city when the profile has not loaded', () => {
    mockAuth.mockReturnValue(signedIn(null));
    mockProfile.mockReturnValue({ data: undefined });
    expect(render(<IndexScreen />).getByText('redirect:/auth/select-city')).toBeTruthy();
  });
});
