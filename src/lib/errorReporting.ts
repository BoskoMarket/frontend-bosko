import { captureError } from '@/core/monitoring/sentry';
import { extractApiError, isCancelledError } from './errors';

/**
 * Reports unexpected failures (5xx and unknown) with the traceability fields from the
 * backend envelope. Cancellations, offline and 4xx are expected noise and are skipped.
 */
export function reportApiError(error: unknown, context?: Record<string, unknown>): void {
  if (isCancelledError(error)) return;
  const { code, statusCode, requestId } = extractApiError(error);
  const isServer = statusCode >= 500;
  const isUnknown = code === 'UNKNOWN_ERROR';
  if (!isServer && !isUnknown) return;
  captureError(error, { ...context, code, statusCode, requestId });
}
