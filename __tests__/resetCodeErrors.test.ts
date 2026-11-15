import {
  getForgotPasswordErrorMessage,
  getResendCodeErrorMessage,
} from '@/features/auth/utils/resetCodeErrors';

const apiError = (code: string, status = 400) => ({
  isAxiosError: true,
  response: { status, data: { success: false, code, message: 'raw server text' } },
});
const cancelled = { code: 'ERR_CANCELED', name: 'CanceledError', message: 'canceled' };

describe('resetCodeErrors', () => {
  it('keeps the dedicated copy for an unregistered email', () => {
    expect(getForgotPasswordErrorMessage(apiError('NOT_FOUND', 404))).toBe('Ese email no está registrado.');
    expect(getForgotPasswordErrorMessage(apiError('USER_NOT_FOUND', 404))).toBe('Ese email no está registrado.');
  });

  it('maps other failures through the catalog, never raw server text', () => {
    const msg = getForgotPasswordErrorMessage(apiError('RATE_LIMITED', 429));
    expect(msg).toBeTruthy();
    expect(msg).not.toContain('raw server text');
  });

  it('shows a network message when offline', () => {
    expect(getResendCodeErrorMessage({ isAxiosError: true, request: {} })).toMatch(/conexi/i);
  });

  it('ignores cancellations', () => {
    expect(getForgotPasswordErrorMessage(cancelled)).toBeNull();
    expect(getResendCodeErrorMessage(cancelled)).toBeNull();
  });
});
