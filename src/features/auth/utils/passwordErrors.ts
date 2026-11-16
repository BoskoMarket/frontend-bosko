import { extractApiError, getFieldErrors, getFormErrors, getUserErrorMessage, type FormErrors } from '@/lib/errors';

export const WRONG_CURRENT_PASSWORD_MESSAGE = 'La contraseña actual es incorrecta';

/**
 * Heuristic list: PATCH /users/me/password has no documented code for a wrong current
 * password, so these codes (and a bare 401, see `isWrongCurrentPassword`) are treated as one.
 * Replace with the real code once the backend contract defines it.
 */
export const WRONG_CURRENT_PASSWORD_CODES: readonly string[] = ['INVALID_PASSWORD', 'INVALID_CREDENTIALS'];

/**
 * True when PATCH /users/me/password rejected the *current* password. The backend does not
 * document one code for it, so accept the known codes or a 401 without any other code (an
 * expired session is refreshed by the axios interceptor before it reaches here). Any other
 * 400 keeps its own message instead of blaming the password.
 */
export function isWrongCurrentPassword(error: unknown): boolean {
  const { code, statusCode } = extractApiError(error);
  if (WRONG_CURRENT_PASSWORD_CODES.includes(code)) return true;
  // extractApiError reports HTTP_ERROR when the response body carries no business code.
  return statusCode === 401 && code === 'HTTP_ERROR';
}

export function getChangePasswordErrorMessage(error: unknown): string {
  return isWrongCurrentPassword(error) ? WRONG_CURRENT_PASSWORD_MESSAGE : getUserErrorMessage(error);
}

export const CHANGE_PASSWORD_FIELDS = ['currentPassword', 'newPassword'] as const;
export type ChangePasswordField = (typeof CHANGE_PASSWORD_FIELDS)[number];

/**
 * Splits a change-password failure into per-input messages (VALIDATION_ERROR `details[]`)
 * and a general message. Non-validation failures keep the wrong-current-password heuristic.
 */
export function getChangePasswordFormErrors(error: unknown): FormErrors<ChangePasswordField> {
  if (getFieldErrors(error).length) return getFormErrors(error, CHANGE_PASSWORD_FIELDS);
  return { fields: {}, general: getChangePasswordErrorMessage(error) };
}
