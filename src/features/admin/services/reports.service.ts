/**
 * reports.service.ts — Moderation queue (admin only).
 * GET /admin/reports, PATCH /admin/reports/:id (docs/frontend-media-reports.md § "Moderación").
 */
import api from '@/core/api/axiosinstance';
import { readPaginatedCollection, type PaginatedCollection } from '@/core/api/collections';

export type AdminReportStatus = 'pending' | 'reviewed' | 'dismissed';
/** `undefined` = every status (the param is omitted). */
export type AdminReportFilter = AdminReportStatus | undefined;
export type AdminReportTargetType = 'user' | 'review' | 'reel';
export type AdminReportDecision = Exclude<AdminReportStatus, 'pending'>;

export const ADMIN_REPORTS_PAGE_SIZE = 20;
export const ADMIN_REPORT_NOTES_MAX_LENGTH = 2000;

/** Person referenced by a report. The backend may send a full object or only the id. */
export interface AdminReportUser {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
}

/**
 * Item field names are not documented in the contract, so everything except `id` is
 * optional and the UI renders tolerantly.
 */
export interface AdminReport {
  id: string;
  status?: AdminReportStatus;
  targetType?: AdminReportTargetType;
  targetId?: string;
  reason?: string;
  details?: string | null;
  context?: string | { type?: string; orderId?: string } | null;
  orderId?: string | null;
  notes?: string | null;
  owner?: AdminReportUser | string | null;
  reporter?: AdminReportUser | string | null;
  createdAt?: string;
}

export type PaginatedAdminReports = PaginatedCollection<AdminReport>;

export interface ReviewReportPayload {
  id: string;
  status: AdminReportDecision;
  notes?: string;
}

/** GET /admin/reports */
export async function fetchAdminReports(
  status: AdminReportFilter,
  page = 1,
  limit = ADMIN_REPORTS_PAGE_SIZE,
): Promise<PaginatedAdminReports> {
  const { data } = await api.get<PaginatedAdminReports>('/admin/reports', {
    params: status ? { page, limit, status } : { page, limit },
  });
  return readPaginatedCollection<AdminReport>(data);
}

/** PATCH /admin/reports/:id — empty notes are not sent. */
export async function reviewAdminReport({ id, status, notes }: ReviewReportPayload): Promise<AdminReport> {
  const trimmed = notes?.trim();
  const { data } = await api.patch<AdminReport>(`/admin/reports/${id}`, trimmed ? { status, notes: trimmed } : { status });
  return data;
}
