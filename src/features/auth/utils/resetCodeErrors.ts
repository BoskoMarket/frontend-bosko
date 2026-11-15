import { extractApiError, getUserErrorMessage, isCancelledError } from '@/lib/errors';

const EMAIL_NOT_REGISTERED = 'Ese email no está registrado.';

/**
 * Message for a failed "send reset code" request, or `null` when the request
 * was cancelled (nothing to show). The email-not-registered case keeps its
 * dedicated copy; every other failure comes from the shared catalog.
 */
export function getForgotPasswordErrorMessage(error: unknown): string | null {
  if (isCancelledError(error)) return null;
  const { code } = extractApiError(error);
  if (code === 'NOT_FOUND' || code === 'USER_NOT_FOUND') return EMAIL_NOT_REGISTERED;
  return getUserErrorMessage(error);
}

/** Message for a failed code resend, or `null` when cancelled. */
export function getResendCodeErrorMessage(error: unknown): string | null {
  return isCancelledError(error) ? null : getUserErrorMessage(error);
}
