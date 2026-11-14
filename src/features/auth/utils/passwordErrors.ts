import { extractApiError, getUserErrorMessage } from '@/lib/errors';

export const WRONG_CURRENT_PASSWORD_MESSAGE = 'La contraseña actual es incorrecta';

/**
 * True when PATCH /users/me/password rejected the *current* password. The backend does not
 * document one code for it, so accept the known codes or a 401 without any other code (an
 * expired session is refreshed by the axios interceptor before it reaches here). Any other
 * 400 keeps its own message instead of blaming the password.
 */
export function isWrongCurrentPassword(error: unknown): boolean {
  const { code, statusCode } = extractApiError(error);
  if (code === 'INVALID_PASSWORD' || code === 'INVALID_CREDENTIALS') return true;
  // extractApiError reports HTTP_ERROR when the response body carries no business code.
  return statusCode === 401 && code === 'HTTP_ERROR';
}

export function getChangePasswordErrorMessage(error: unknown): string {
  return isWrongCurrentPassword(error) ? WRONG_CURRENT_PASSWORD_MESSAGE : getUserErrorMessage(error);
}
