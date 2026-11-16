import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';

const mockReset = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() },
  useLocalSearchParams: () => ({ email: 'a@b.co', code: '123456' }),
}));
jest.mock('@/features/auth/services/auth', () => ({
  resetPasswordService: (...a: unknown[]) => mockReset(...a),
}));
jest.mock('@/components/AnimatedBackground', () => ({ AnimatedBackground: () => null }));

import ResetPasswordScreen from '@/features/auth/screens/ResetPasswordScreen';

const validation = (details: { field: string; message: string }[]) => ({
  isAxiosError: true,
  message: 'x',
  response: { status: 400, headers: {}, data: { code: 'VALIDATION_ERROR', statusCode: 400, message: 'x', details } },
});

async function submit(err: unknown) {
  mockReset.mockRejectedValueOnce(err);
  const utils = render(<ResetPasswordScreen />);
  fireEvent.changeText(utils.getByPlaceholderText('Nueva contraseña'), 'Password1!');
  fireEvent.changeText(utils.getByPlaceholderText('Confirmar contraseña'), 'Password1!');
  await act(async () => {
    fireEvent.press(utils.getByText('Restablecer contraseña'));
  });
  return utils;
}

describe('ResetPasswordScreen validation errors', () => {
  it('maps details on `code` to friendly invalid/expired-code copy, never raw field names', async () => {
    const { getByText, queryByText } = await submit(validation([{ field: 'code', message: 'must be 6 digits' }]));
    expect(getByText('Código incorrecto o expirado. Vuelve a solicitarlo.')).toBeTruthy();
    expect(queryByText(/code:/)).toBeNull();
  });

  it('keeps newPassword details inline', async () => {
    const { getByText, queryByText } = await submit(validation([{ field: 'newPassword', message: 'Muy corta' }]));
    expect(getByText('Muy corta')).toBeTruthy();
    expect(queryByText(/Código incorrecto/)).toBeNull();
  });
});
