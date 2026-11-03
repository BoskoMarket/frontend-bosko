import { SaveFormat, manipulateAsync, type Action } from 'expo-image-manipulator';
import { resolveImageMime } from '@/core/media/imageMime';
import { resolveFileSize } from '@/features/reels/constants/reelUploadRules';
import { WORK_IMAGE_JPEG_QUALITY, WORK_IMAGE_MAX_BYTES, WORK_IMAGE_MAX_SIDE } from '../constants';
import type { WorkImageFile } from '../types';

type PickerAsset = {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  width?: number | null;
  height?: number | null;
};

const UNSUPPORTED: WorkImageCheck = {
  ok: false,
  title: 'Formato no compatible',
  message: 'Elegí una foto JPG, PNG o WebP.',
};

export type WorkImageCheck =
  | { ok: true; file: WorkImageFile }
  | { ok: false; title: string; message: string };

/** Client-side preflight: JPEG/PNG/WebP and at most 10 MiB (the server re-validates). */
export function checkWorkImage(asset: PickerAsset): WorkImageCheck {
  const mime = resolveImageMime(asset);
  if (mime !== 'image/jpeg' && mime !== 'image/png' && mime !== 'image/webp') {
    return UNSUPPORTED;
  }
  const size = resolveFileSize({ uri: asset.uri, fileSize: asset.fileSize });
  if (size != null && size > WORK_IMAGE_MAX_BYTES) {
    return { ok: false, title: 'Imagen demasiado grande', message: 'El máximo es 10 MB.' };
  }
  return { ok: true, file: { uri: asset.uri, mimeType: mime } };
}

/**
 * Resizes to at most 2048px on the long side and re-encodes as JPEG (this also converts HEIC),
 * then runs the preflight on the result. Anything the device cannot decode is "Formato no compatible".
 */
export async function prepareWorkImage(asset: PickerAsset): Promise<WorkImageCheck> {
  try {
    const w = asset.width ?? 0;
    const h = asset.height ?? 0;
    const actions: Action[] =
      Math.max(w, h) > WORK_IMAGE_MAX_SIDE ? [{ resize: w >= h ? { width: WORK_IMAGE_MAX_SIDE } : { height: WORK_IMAGE_MAX_SIDE } }] : [];
    const out = await manipulateAsync(asset.uri, actions, { compress: WORK_IMAGE_JPEG_QUALITY, format: SaveFormat.JPEG });
    return checkWorkImage({ uri: out.uri, mimeType: 'image/jpeg' });
  } catch {
    return UNSUPPORTED;
  }
}
