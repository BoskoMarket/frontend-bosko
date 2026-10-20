import api from '@/core/api/axiosinstance';
import type { ReportReasonCode } from '../constants/reportReasons';

export interface ReportPayload {
  reason: ReportReasonCode | string;
  /** Optional free text, required when reason is "other". */
  details?: string;
}

export type UserReportContext =
  | { type: 'chat'; orderId: string }
  | { type: 'profile' };

export interface UserReportPayload extends ReportPayload {
  context: UserReportContext;
}

/**
 * Report a user — POST /users/:id/report
 * Requires a context for profile or chat reports.
 */
export async function reportUser(userId: string, payload: UserReportPayload): Promise<void> {
  await api.post(`/users/${userId}/report`, payload);
}
