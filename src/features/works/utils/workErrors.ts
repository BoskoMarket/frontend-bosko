import { extractApiError, getUserErrorMessage } from '@/lib/errors';
import { WORKS_LIMIT_PER_PROVIDER, WORK_DESCRIPTION_MAX } from '../constants';

export const WORK_LIMIT_MESSAGE = `Llegaste al máximo de ${WORKS_LIMIT_PER_PROVIDER} fotos. Borra alguna para subir otra.`;

/**
 * Maps a failed upload / edit / delete request to Spanish toast copy. Never throws.
 * `upload` selects the copy for a dropped connection while the photo is being sent.
 */
export function getWorkErrorMessage(err: unknown, opts: { upload?: boolean } = {}): string {
  const { statusCode, code } = extractApiError(err);
  if (code === 'NETWORK_ERROR' && opts.upload) return 'Se cortó la subida, revisa tu conexión e intenta de nuevo.';
  if (code === 'VALIDATION_ERROR') {
    return `La descripción no es válida. Puede tener hasta ${WORK_DESCRIPTION_MAX} caracteres.`;
  }
  if (code === 'POST_LIMIT_REACHED') {
    return WORK_LIMIT_MESSAGE;
  }
  if (code === 'UPLOAD_BUSY') return 'Estamos procesando otra foto. Prueba de nuevo en unos segundos.';
  if (code === 'RATE_LIMITED' || statusCode === 429) {
    return 'Subiste muchas fotos en poco tiempo. Espera un minuto y prueba de nuevo.';
  }
  if (code === 'INVALID_UPLOAD' || code === 'INVALID_MEDIA') {
    return 'No pudimos leer esa imagen. Usa una foto JPG, PNG o WebP.';
  }
  if (statusCode === 413 || code === 'PAYLOAD_TOO_LARGE') return 'La imagen es demasiado grande. El máximo es 10 MB.';
  if (code === 'FORBIDDEN' || statusCode === 403) return 'Solo puedes gestionar las fotos de tus propios servicios.';
  if (code === 'POST_NOT_FOUND' || code === 'SERVICE_NOT_FOUND' || statusCode === 404) {
    return 'Esta foto o servicio ya no existe.';
  }
  try {
    return getUserErrorMessage(err);
  } catch {
    return 'No pudimos completar la acción. Intenta de nuevo.';
  }
}
