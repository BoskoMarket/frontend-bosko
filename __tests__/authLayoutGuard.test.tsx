import React from 'react';
import { render } from '@testing-library/react-native';
import AuthModalLayout from '../app/auth/_layout';

const mockUseAuth = jest.fn();
jest.mock('@/features/auth/state/AuthContext', () => ({ useAuth: () => mockUseAuth() }));
const mockSegments = jest.fn(() => ['auth', 'verify-email']);
jest.mock('expo-router', () => {
  const { Text } = require('react-native');
  const Stack = () => <Text>stack</Text>;
  Stack.Screen = () => null;
  return {
    Redirect: ({ href }: { href: string }) => <Text>redirect:{href}</Text>,
    Stack,
    useSegments: () => mockSegments(),
  };
});

describe('/auth layout inverse guard', () => {
  it('renders nothing while auth is loading', () => {
    mockUseAuth.mockReturnValue({ authLoaded: false, isAuthenticated: true });
    expect(render(<AuthModalLayout />).toJSON()).toBeNull();
  });

  it('redirects a user who arrives already authenticated to the tabs', () => {
    mockUseAuth.mockReturnValue({ authLoaded: true, isAuthenticated: true });
    expect(render(<AuthModalLayout />).getByText('redirect:/(tabs)')).toBeTruthy();
  });

  it('does not redirect an authenticated user sent to select-city (account without a city)', () => {
    mockSegments.mockReturnValueOnce(['auth', 'select-city']);
    mockUseAuth.mockReturnValue({ authLoaded: true, isAuthenticated: true });
    expect(render(<AuthModalLayout />).getByText('stack')).toBeTruthy();
  });

  it('lets anonymous users through', () => {
    mockUseAuth.mockReturnValue({ authLoaded: true, isAuthenticated: false });
    expect(render(<AuthModalLayout />).getByText('stack')).toBeTruthy();
  });

  it('does not redirect when the session starts while on the screen (verify-email OTP)', () => {
    mockUseAuth.mockReturnValue({ authLoaded: true, isAuthenticated: false });
    const ui = render(<AuthModalLayout />);
    mockUseAuth.mockReturnValue({ authLoaded: true, isAuthenticated: true });
    ui.rerender(<AuthModalLayout />);
    expect(ui.queryByText(/redirect:/)).toBeNull();
    expect(ui.getByText('stack')).toBeTruthy();
  });
});
