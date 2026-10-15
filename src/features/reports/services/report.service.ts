import api from '@/core/api/axiosinstance';
import type { ReportReasonCode } from '../constants/reportReasons';

export interface ReportPayload {
  reason: ReportReasonCode | string;
  /** Free text, only sent with the "other" reason. */
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
 * proposed — BR03 (not in the backend yet; a 404/405/501 is shown as "reports not available").
 */
export async function reportUser(userId: string, payload: UserReportPayload): Promise<void> {
  await api.post(`/users/${userId}/report`, payload);
}
