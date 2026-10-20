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
export const REPORT_UNAVAILABLE_MESSAGE = 'No pudimos enviar el reporte. Intentá de nuevo más tarde.';
export const REPORT_TARGET_MISSING_MESSAGE = 'Este contenido ya no está disponible.';
export const REPORT_INVALID_MESSAGE = 'Revisá el motivo y los detalles antes de enviar.';
export const REPORT_NOT_ALLOWED_MESSAGE = 'No podés reportar este contenido.';
export const REPORT_CONTEXT_MESSAGE = 'No pudimos verificar tu participación en la orden.';
export const REPORT_RATE_LIMIT_MESSAGE = 'Hiciste demasiados intentos. Esperá un momento y probá de nuevo.';
export const REPORT_ALREADY_REPORTED_MESSAGE = 'Ya reportaste esto.';
export const REPORT_FAILED_TITLE = 'No se pudo enviar el reporte';
export const REPORT_FAILED_MESSAGE = 'Intentá de nuevo en unos segundos.';
