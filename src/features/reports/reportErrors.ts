import { extractApiError } from '@/lib/errors';
import {
  REPORT_ALREADY_REPORTED_MESSAGE,
  REPORT_FAILED_MESSAGE,
  REPORT_FAILED_TITLE,
  REPORT_UNAVAILABLE_MESSAGE,
} from './constants/reportReasons';

export interface ReportErrorFeedback {
  title: string;
  message?: string;
}

/** Maps a failed report request to the toast copy (BR03). Never throws. */
export function reportErrorFeedback(err: unknown): ReportErrorFeedback {
  const { statusCode, code } = extractApiError(err);
  if (statusCode === 404 || statusCode === 405 || statusCode === 501) {
    return { title: REPORT_UNAVAILABLE_MESSAGE };
  }
  if (statusCode === 409 || code === 'ALREADY_REPORTED') {
    return { title: REPORT_ALREADY_REPORTED_MESSAGE };
  }
  return { title: REPORT_FAILED_TITLE, message: REPORT_FAILED_MESSAGE };
}
