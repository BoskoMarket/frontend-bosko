import { extractApiError, getUserErrorMessage } from '@/lib/errors';

export const WRONG_CURRENT_PASSWORD_MESSAGE = 'La contraseña actual es incorrecta';

/**
 * True when PATCH /users/me/password rejected the *current* password. The backend does not
 * document one code for it, so accept the known codes, a 401, or a 400 that is not a
 * field-validation error (those carry details about the new password instead).
 */
export function isWrongCurrentPassword(error: unknown): boolean {
  const { code, statusCode } = extractApiError(error);
  if (code === 'INVALID_PASSWORD' || code === 'INVALID_CREDENTIALS') return true;
  if (statusCode === 401) return true;
  return statusCode === 400 && code !== 'VALIDATION_ERROR';
}

export function getChangePasswordErrorMessage(error: unknown): string {
  return isWrongCurrentPassword(error) ? WRONG_CURRENT_PASSWORD_MESSAGE : getUserErrorMessage(error);
}
