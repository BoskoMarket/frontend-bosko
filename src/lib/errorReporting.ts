import { captureError } from '@/core/monitoring/sentry';
import { getClientRequestId } from '@/core/api/requestId';
import { extractApiError, isCancelledError } from './errors';

/**
 * Only the first segment of a query/mutation key is safe to send to Sentry: the rest
 * carries user data (search text, emails, ids).
 */
export function keyScope(key: readonly unknown[] | undefined): string | undefined {
  const head = key?.[0];
  return typeof head === 'string' ? head : undefined;
}

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
  captureError(error, { ...context, code, statusCode, requestId, clientRequestId: getClientRequestId(error) });
}
