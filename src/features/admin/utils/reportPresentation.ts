import { REPORT_REASONS } from '@/features/reports/constants/reportReasons';
import type {
  AdminReport,
  AdminReportFilter,
  AdminReportStatus,
  AdminReportTargetType,
  AdminReportUser,
} from '@/features/admin/services/reports.service';
import type { BadgeTone } from '@/core/design-system';

export const REPORT_FILTERS: ReadonlyArray<{ key: string; label: string; status: AdminReportFilter }> = [
  { key: 'pending', label: 'Pendientes', status: 'pending' },
  { key: 'reviewed', label: 'Revisadas', status: 'reviewed' },
  { key: 'dismissed', label: 'Descartadas', status: 'dismissed' },
  { key: 'all', label: 'Todas', status: undefined },
];

export const STATUS_BADGE: Record<AdminReportStatus, { label: string; tone: BadgeTone }> = {
  pending: { label: 'Pendiente', tone: 'pending' },
  reviewed: { label: 'Revisada', tone: 'done' },
  dismissed: { label: 'Descartada', tone: 'neutral' },
};

const TARGET_LABELS: Record<AdminReportTargetType, string> = {
  user: 'Usuario',
  review: 'Reseña',
  reel: 'Reel',
};

export function targetLabel(type?: string): string {
  return TARGET_LABELS[type as AdminReportTargetType] ?? 'Contenido';
}

export function reasonLabel(code?: string): string {
  return REPORT_REASONS.find((r) => r.code === code)?.label ?? code ?? 'Sin motivo';
}

/** Display name for a user object or a bare id; null when nothing usable came back. */
export function personName(person?: AdminReportUser | string | null): string | null {
  if (!person) return null;
  if (typeof person === 'string') return person;
  const full = [person.firstName, person.lastName].filter(Boolean).join(' ');
  return person.name || full || person.email || person.id || null;
}

/** "Perfil" / "Chat de la orden #abc123" / null. */
export function contextLabel(report: AdminReport): string | null {
  const ctx = report.context;
  const type = typeof ctx === 'string' ? ctx : ctx?.type;
  const orderId = report.orderId ?? (typeof ctx === 'object' && ctx ? ctx.orderId : undefined);
  if (orderId) return `Chat de la orden #${orderId.slice(0, 8)}`;
  if (type === 'profile') return 'Perfil';
  if (type === 'chat') return 'Chat';
  return type ?? null;
}

export function formatReportDate(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
}
