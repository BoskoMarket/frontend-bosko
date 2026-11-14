import { getChangePasswordErrorMessage, WRONG_CURRENT_PASSWORD_MESSAGE } from '@/features/auth/utils/passwordErrors';

function apiError(status: number, code?: string) {
  return {
    isAxiosError: true,
    message: 'Request failed',
    response: { status, data: code ? { success: false, statusCode: status, code, message: 'x', timestamp: '' } : {} },
  };
}

describe('getChangePasswordErrorMessage', () => {
  it.each([
    [400, 'INVALID_PASSWORD'],
    [401, undefined],
    [401, 'INVALID_CREDENTIALS'],
  ])('maps a wrong current password (%s %s)', (status, code) => {
    expect(getChangePasswordErrorMessage(apiError(status, code))).toBe(WRONG_CURRENT_PASSWORD_MESSAGE);
  });

  it.each([
    [400, 'BAD_REQUEST'],
    [401, 'TOKEN_EXPIRED'],
  ])('does not blame the password for an unrelated %s %s', (status, code) => {
    expect(getChangePasswordErrorMessage(apiError(status, code))).not.toBe(WRONG_CURRENT_PASSWORD_MESSAGE);
  });

  it('keeps field validation errors for the new password', () => {
    const err = apiError(400, 'VALIDATION_ERROR');
    (err.response.data as any).details = [{ field: 'newPassword', message: 'too short' }];
    expect(getChangePasswordErrorMessage(err)).toContain('newPassword');
  });

  it('does not blame the password for a server failure', () => {
    expect(getChangePasswordErrorMessage(apiError(500, 'INTERNAL_ERROR'))).not.toBe(WRONG_CURRENT_PASSWORD_MESSAGE);
  });
});
