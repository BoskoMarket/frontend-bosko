import { getUserErrorMessage } from '@/lib/errors';

/** Statuses that mean "the banner endpoint is not deployed yet" (BR01 pending). */
const NOT_DEPLOYED = new Set([404, 405, 501]);

/**
 * Maps a banner upload/remove failure to a user-facing message.
 * Never throws: unknown shapes fall back to the generic error copy.
 */
export function getBannerErrorMessage(err: unknown): string {
  const status = (err as { response?: { status?: number } } | null)?.response?.status;
  if (status !== undefined && NOT_DEPLOYED.has(status)) return 'La portada todavía no está disponible.';
  if (status === 413) return 'La imagen es demasiado grande. El máximo es 5 MB.';
  if (status === 400 || status === 415) return 'Formato no válido. Usá una imagen JPG, PNG o WebP.';
  try {
    return getUserErrorMessage(err);
  } catch {
    return 'No se pudo actualizar la portada. Intentá de nuevo.';
  }
}
