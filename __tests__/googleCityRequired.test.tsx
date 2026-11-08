import { renderHook, act } from '@testing-library/react-native';
import { router } from 'expo-router';
import { pendingGoogleSignup } from '@/features/auth/state/pendingGoogleSignup';

const mockLoginWithGoogle = jest.fn();
const mockClearError = jest.fn();
jest.mock('@/features/auth/state/AuthContext', () => ({
  useAuth: () => ({ loginWithGoogle: mockLoginWithGoogle, clearError: mockClearError }),
}));
jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn() } }));
jest.mock('@/core/config/env', () => ({ GOOGLE_WEB_CLIENT_ID: 'web-client' }));
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn().mockResolvedValue(true),
    signIn: jest.fn().mockResolvedValue({ data: { idToken: 'google-id-token' } }),
  },
  isSuccessResponse: () => true,
  isCancelledResponse: () => false,
}), { virtual: true });
jest.mock('@react-native-firebase/auth', () => {
  const auth: any = () => ({
    signInWithCredential: jest.fn().mockResolvedValue({ user: { getIdToken: () => Promise.resolve('firebase-token') } }),
  });
  auth.GoogleAuthProvider = { credential: jest.fn() };
  return { __esModule: true, default: auth };
}, { virtual: true });

import { useGoogleSignIn } from '@/features/auth/hooks/useGoogleSignIn';

describe('useGoogleSignIn with a new user without city', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    pendingGoogleSignup.clear();
  });

  it('keeps the token in memory and navigates to select-city on 422 CITY_REQUIRED', async () => {
    mockLoginWithGoogle.mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 422, data: { code: 'CITY_REQUIRED', message: 'x' } },
    });
    const { result } = renderHook(() => useGoogleSignIn());
    let signedIn: boolean | undefined;
    await act(async () => { signedIn = await result.current.signInWithGoogle(); });

    expect(signedIn).toBe(false);
    expect(pendingGoogleSignup.get()).toBe('firebase-token');
    expect(router.push).toHaveBeenCalledWith('/auth/select-city');
    expect(mockClearError).toHaveBeenCalled();
  });

  it('rethrows any other error and stores nothing', async () => {
    mockLoginWithGoogle.mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 500, data: { code: 'INTERNAL_ERROR', message: 'x' } },
    });
    const { result } = renderHook(() => useGoogleSignIn());
    await act(async () => {
      await expect(result.current.signInWithGoogle()).rejects.toBeTruthy();
    });
    expect(pendingGoogleSignup.get()).toBeNull();
    expect(router.push).not.toHaveBeenCalled();
  });

  it('returns true on a normal login', async () => {
    mockLoginWithGoogle.mockResolvedValueOnce({});
    const { result } = renderHook(() => useGoogleSignIn());
    let signedIn: boolean | undefined;
    await act(async () => { signedIn = await result.current.signInWithGoogle(); });
    expect(signedIn).toBe(true);
    expect(pendingGoogleSignup.get()).toBeNull();
  });
});
