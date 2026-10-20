import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import VerifyEmailScreen from '@/features/auth/screens/VerifyEmailScreen';

const mockResend = jest.fn();
const mockClearError = jest.fn();

jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), back: jest.fn() },
  useLocalSearchParams: () => ({ email: 'user@example.com' }),
}));
jest.mock('@/features/auth/state/AuthContext', () => ({
  useAuth: () => ({ clearError: mockClearError, verifyEmail: jest.fn(), logout: jest.fn() }),
}));
jest.mock('@/features/auth/services/auth', () => ({
  resendVerificationService: (...args: unknown[]) => mockResend(...args),
}));
jest.mock('@/components/AnimatedBackground', () => ({ AnimatedBackground: () => null }));

beforeEach(() => { jest.clearAllMocks(); });

it('requests a new code once and shows a generic response with a 60-second wait', async () => {
  mockResend.mockResolvedValue(undefined);
  const { getByLabelText, getByText, findByText } = render(<VerifyEmailScreen />);
  fireEvent.press(getByLabelText('Reenviar código de verificación'));
  await findByText(/Si la cuenta necesita verificación/);
  expect(mockResend).toHaveBeenCalledTimes(1);
  expect(mockResend).toHaveBeenCalledWith('user@example.com');
  expect(getByText('Reenviar en 60s')).toBeTruthy();
  fireEvent.press(getByLabelText('Reenviar código de verificación'));
  expect(mockResend).toHaveBeenCalledTimes(1);
});

it('does not reveal account existence on a server error and keeps the cooldown', async () => {
  mockResend.mockRejectedValue(new Error('server error'));
  const { getByLabelText, findByText, getByText } = render(<VerifyEmailScreen />);
  await act(async () => { fireEvent.press(getByLabelText('Reenviar código de verificación')); });
  expect(await findByText(/No pudimos solicitar el código/)).toBeTruthy();
  expect(getByText('Reenviar en 60s')).toBeTruthy();
});
