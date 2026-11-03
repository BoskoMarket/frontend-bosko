import React from 'react';
import { render } from '@testing-library/react-native';
import WelcomeVideoScreen from '@/features/auth/screens/WelcomeVideoScreen';

const mockUseAuth = jest.fn();
jest.mock('@/features/auth/state/AuthContext', () => ({ useAuth: () => mockUseAuth() }));
jest.mock('expo-video', () => ({
  useVideoPlayer: () => ({ addListener: () => ({ remove: jest.fn() }) }),
  VideoView: () => null,
}));
jest.mock('expo-router', () => ({
  Redirect: ({ href }: { href: string }) => {
    const { Text } = require('react-native');
    return <Text>redirect:{href}</Text>;
  },
  router: { replace: jest.fn() },
}));

describe('WelcomeVideoScreen session guard', () => {
  it('renders nothing while auth is loading', () => {
    mockUseAuth.mockReturnValue({ authLoaded: false, isAuthenticated: false });
    const { toJSON } = render(<WelcomeVideoScreen />);
    expect(toJSON()).toBeNull();
  });

  it('redirects to /login without a session', () => {
    mockUseAuth.mockReturnValue({ authLoaded: true, isAuthenticated: false });
    const { getByText } = render(<WelcomeVideoScreen />);
    expect(getByText('redirect:/login')).toBeTruthy();
  });

  it('plays the video with a session', () => {
    mockUseAuth.mockReturnValue({ authLoaded: true, isAuthenticated: true });
    const { getByText, queryByText } = render(<WelcomeVideoScreen />);
    expect(getByText('Saltar')).toBeTruthy();
    expect(queryByText('redirect:/login')).toBeNull();
  });
});
