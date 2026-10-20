import { getUserErrorMessage } from '@/lib/errors';

/**
 * Maps a banner upload/remove failure to a user-facing message.
 * Never throws: unknown shapes fall back to the generic error copy.
 */
export function getBannerErrorMessage(err: unknown): string {
  const status = (err as { response?: { status?: number } } | null)?.response?.status;
  if (status === 404 || status === 405 || status === 501) return 'No pudimos actualizar la portada. Intentá de nuevo más tarde.';
  if (status === 413) return 'La imagen es demasiado grande. El máximo es 5 MB.';
  if (status === 400 || status === 415) return 'Formato no válido. Usá una imagen JPG, PNG o WebP.';
  try {
    return getUserErrorMessage(err);
  } catch {
    return 'No se pudo actualizar la portada. Intentá de nuevo.';
  }
}
