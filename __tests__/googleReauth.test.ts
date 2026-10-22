import { act, renderHook } from '@testing-library/react-native';

const mockSignIn = jest.fn();
const mockSignInWithCredential = jest.fn();
const mockCredential = jest.fn((idToken: string) => ({ providerId: 'google.com', token: idToken }));

jest.mock('@/core/config/env', () => ({ GOOGLE_WEB_CLIENT_ID: 'web-client-id', API_URL: 'http://test' }));
jest.mock('@/features/auth/state/AuthContext', () => ({ useAuth: () => ({ loginWithGoogle: jest.fn() }) }));
jest.mock(
  '@react-native-google-signin/google-signin',
  () => ({
    GoogleSignin: { configure: jest.fn(), hasPlayServices: jest.fn(async () => true), signIn: (...a: any[]) => mockSignIn(...a) },
    isSuccessResponse: (r: any) => r?.type === 'success',
    isCancelledResponse: (r: any) => r?.type === 'cancelled',
  }),
  { virtual: true },
);
jest.mock(
  '@react-native-firebase/auth',
  () => {
    const auth = () => ({ signInWithCredential: (...a: any[]) => mockSignInWithCredential(...a) });
    auth.GoogleAuthProvider = { credential: (t: string) => mockCredential(t) };
    return { __esModule: true, default: auth };
  },
  { virtual: true },
);

import { useGoogleReauth } from '@/features/auth/hooks/useGoogleSignIn';

beforeEach(() => jest.clearAllMocks());

test('returns a fresh Firebase ID token, not the raw Google token', async () => {
  mockSignIn.mockResolvedValueOnce({ type: 'success', data: { idToken: 'google-id-token' } });
  mockSignInWithCredential.mockResolvedValueOnce({ user: { getIdToken: async () => 'firebase-id-token' } });
  const { result } = renderHook(() => useGoogleReauth());
  let token: string | null = null;
  await act(async () => { token = await result.current.getGoogleIdToken(); });
  expect(mockCredential).toHaveBeenCalledWith('google-id-token');
  expect(token).toBe('firebase-id-token');
});

test('returns null when the Google picker is cancelled', async () => {
  mockSignIn.mockResolvedValueOnce({ type: 'cancelled' });
  const { result } = renderHook(() => useGoogleReauth());
  let token: string | null = 'x';
  await act(async () => { token = await result.current.getGoogleIdToken(); });
  expect(token).toBeNull();
  expect(mockSignInWithCredential).not.toHaveBeenCalled();
});
