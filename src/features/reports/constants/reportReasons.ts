import type { ReportSheetReason } from '@/core/design-system';

/** Stable machine codes accepted by the backend (BR03). Never rename: they are stored server-side. */
export type ReportReasonCode =
  | 'spam'
  | 'inappropriate'
  | 'harassment'
  | 'fraud'
  | 'impersonation'
  | 'other';

export const REPORT_OTHER_CODE: ReportReasonCode = 'other';
export const REPORT_DETAILS_MAX_LENGTH = 500;

export const REPORT_REASONS: ReadonlyArray<ReportSheetReason & { code: ReportReasonCode }> = [
  { code: 'spam', label: 'Spam o publicidad' },
  { code: 'inappropriate', label: 'Contenido inapropiado' },
  { code: 'harassment', label: 'Acoso o lenguaje ofensivo' },
  { code: 'fraud', label: 'Fraude o estafa' },
  { code: 'impersonation', label: 'Suplantación de identidad' },
  { code: 'other', label: 'Otro' },
];

export const REPORT_SENT_TITLE = 'Reporte enviado';
export const REPORT_SENT_MESSAGE = 'El equipo de Bosko lo va a revisar.';
export const REPORT_UNAVAILABLE_MESSAGE = 'Los reportes todavía no están disponibles.';
export const REPORT_ALREADY_REPORTED_MESSAGE = 'Ya reportaste esto.';
export const REPORT_FAILED_TITLE = 'No se pudo enviar el reporte';
export const REPORT_FAILED_MESSAGE = 'Intentá de nuevo en unos segundos.';
