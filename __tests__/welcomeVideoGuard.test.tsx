import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WelcomeVideoScreen from '@/features/auth/screens/WelcomeVideoScreen';
import { WELCOME_VIDEO_PENDING_KEY } from '@/features/auth/constants';

const mockUseAuth = jest.fn();
const mockReplace = jest.fn();
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
  router: { replace: (...a: unknown[]) => mockReplace(...a) },
}));

describe('WelcomeVideoScreen guards', () => {
  beforeEach(async () => {
    mockReplace.mockClear();
    await AsyncStorage.clear();
  });

  it('renders nothing while auth is loading', () => {
    mockUseAuth.mockReturnValue({ authLoaded: false, isAuthenticated: false });
    expect(render(<WelcomeVideoScreen />).toJSON()).toBeNull();
  });

  it('redirects to /login without a session', () => {
    mockUseAuth.mockReturnValue({ authLoaded: true, isAuthenticated: false });
    expect(render(<WelcomeVideoScreen />).getByText('redirect:/login')).toBeTruthy();
  });

  it('redirects to the tabs when the pending flag is not set', async () => {
    mockUseAuth.mockReturnValue({ authLoaded: true, isAuthenticated: true });
    const { findByText, queryByText } = render(<WelcomeVideoScreen />);
    expect(queryByText('Saltar')).toBeNull();
    expect(await findByText('redirect:/(tabs)')).toBeTruthy();
  });

  it('plays with a session and the flag, and clears the flag on skip', async () => {
    mockUseAuth.mockReturnValue({ authLoaded: true, isAuthenticated: true });
    await AsyncStorage.setItem(WELCOME_VIDEO_PENDING_KEY, 'true');
    const { findByText } = render(<WelcomeVideoScreen />);
    fireEvent.press(await findByText('Saltar'));
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/(tabs)'));
    expect(await AsyncStorage.getItem(WELCOME_VIDEO_PENDING_KEY)).toBeNull();
  });
});
