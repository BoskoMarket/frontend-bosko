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

/** Repeats of the same (code, status, scope) inside this window are not reported again. */
export const REPORT_DEDUPE_WINDOW_MS = 60_000;
const MAX_TRACKED_SIGNATURES = 100;
const lastReportedAt = new Map<string, number>();

/** Returns true when this signature was already reported inside the window; otherwise records it. */
function isRecentDuplicate(signature: string, now: number): boolean {
  const last = lastReportedAt.get(signature);
  if (last !== undefined && now - last < REPORT_DEDUPE_WINDOW_MS) return true;
  lastReportedAt.delete(signature);
  lastReportedAt.set(signature, now);
  if (lastReportedAt.size > MAX_TRACKED_SIGNATURES) {
    // Maps iterate in insertion order: the first key is the oldest report.
    const oldest = lastReportedAt.keys().next().value;
    if (oldest !== undefined) lastReportedAt.delete(oldest);
  }
  return false;
}

/** Test helper: forget every recorded signature. */
export function resetErrorReportingDedupe(): void {
  lastReportedAt.clear();
}

/**
 * Reports unexpected failures (5xx and unknown) with the traceability fields from the
 * backend envelope. Cancellations, offline and 4xx are expected noise and are skipped, and
 * repeats of the same (code, statusCode, scope) within 60 s are dropped so a backend outage
 * does not flood Sentry.
 */
export function reportApiError(error: unknown, context?: Record<string, unknown>): void {
  if (isCancelledError(error)) return;
  const { code, statusCode, requestId } = extractApiError(error);
  const isServer = statusCode >= 500;
  const isUnknown = code === 'UNKNOWN_ERROR';
  if (!isServer && !isUnknown) return;
  const scope = String(context?.queryKey ?? context?.mutationKey ?? context?.source ?? '');
  if (isRecentDuplicate(`${code}|${statusCode}|${scope}`, Date.now())) return;
  captureError(error, { ...context, code, statusCode, requestId, clientRequestId: getClientRequestId(error) });
}
