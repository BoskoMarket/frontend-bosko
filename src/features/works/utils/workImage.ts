import { resolveImageMime } from '@/core/media/imageMime';
import { resolveFileSize } from '@/features/reels/constants/reelUploadRules';
import { WORK_IMAGE_MAX_BYTES } from '../constants';
import type { WorkImageFile } from '../types';

type PickerAsset = { uri: string; fileName?: string | null; mimeType?: string | null; fileSize?: number | null };

export type WorkImageCheck =
  | { ok: true; file: WorkImageFile }
  | { ok: false; title: string; message: string };

/** Client-side preflight: JPEG/PNG/WebP and at most 10 MiB (the server re-validates). */
export function checkWorkImage(asset: PickerAsset): WorkImageCheck {
  const mime = resolveImageMime(asset);
  if (mime !== 'image/jpeg' && mime !== 'image/png' && mime !== 'image/webp') {
    return { ok: false, title: 'Formato no válido', message: 'Elegí una foto JPG, PNG o WebP.' };
  }
  const size = resolveFileSize({ uri: asset.uri, fileSize: asset.fileSize });
  if (size != null && size > WORK_IMAGE_MAX_BYTES) {
    return { ok: false, title: 'Imagen demasiado grande', message: 'El máximo es 10 MB.' };
  }
  return { ok: true, file: { uri: asset.uri, mimeType: mime } };
}
