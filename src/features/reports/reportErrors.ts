import { extractApiError } from '@/lib/errors';
import {
  REPORT_ALREADY_REPORTED_MESSAGE,
  REPORT_FAILED_MESSAGE,
  REPORT_FAILED_TITLE,
  REPORT_UNAVAILABLE_MESSAGE,
  REPORT_TARGET_MISSING_MESSAGE,
  REPORT_INVALID_MESSAGE,
  REPORT_NOT_ALLOWED_MESSAGE,
  REPORT_CONTEXT_MESSAGE,
  REPORT_FORBIDDEN_MESSAGE,
  REPORT_RATE_LIMIT_MESSAGE,
} from './constants/reportReasons';

export interface ReportErrorFeedback {
  title: string;
  message?: string;
  close: boolean;
}

/** Maps a failed report request to the toast copy (BR03). Never throws. */
export function reportErrorFeedback(err: unknown): ReportErrorFeedback {
  const { statusCode, code } = extractApiError(err);
  if (code === 'ALREADY_REPORTED') return { title: REPORT_ALREADY_REPORTED_MESSAGE, close: true };
  if (code === 'USER_NOT_FOUND' || code === 'REEL_NOT_FOUND' || code === 'REVIEW_NOT_FOUND' || statusCode === 404) {
    return { title: REPORT_TARGET_MISSING_MESSAGE, close: true };
  }
  if (code === 'CANNOT_REPORT_SELF' || code === 'CANNOT_REPORT_OWN_REVIEW') {
    return { title: REPORT_NOT_ALLOWED_MESSAGE, close: true };
  }
  if (code === 'NOT_ORDER_PARTICIPANT') {
    return { title: REPORT_CONTEXT_MESSAGE, close: true };
  }
  if (code === 'FORBIDDEN') {
    return { title: REPORT_FORBIDDEN_MESSAGE, close: true };
  }
  if (code === 'INVALID_REPORT' || code === 'VALIDATION_ERROR') {
    return { title: REPORT_FAILED_TITLE, message: REPORT_INVALID_MESSAGE, close: false };
  }
  if (statusCode === 429 || code === 'RATE_LIMITED') {
    return { title: REPORT_FAILED_TITLE, message: REPORT_RATE_LIMIT_MESSAGE, close: false };
  }
  if (statusCode === 405 || statusCode === 501) return { title: REPORT_UNAVAILABLE_MESSAGE, close: false };
  return { title: REPORT_FAILED_TITLE, message: REPORT_FAILED_MESSAGE, close: false };
}
