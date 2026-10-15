/** Reel upload limits (product decision G87) and pure validation helpers. */
export const REEL_MAX_SECONDS = 60;
export const REEL_MAX_BYTES = 100 * 1024 * 1024;

export interface ReelVideoAsset {
  uri: string;
  /** Duration in milliseconds, as reported by expo-image-picker. */
  duration?: number | null;
  /** Size in bytes, when the picker or the file system can tell. */
  fileSize?: number | null;
  mimeType?: string | null;
}

/** Returns a Spanish error message, or null when the video is acceptable. Unknown values are not rejected. */
export function validateReelVideo(asset: ReelVideoAsset): string | null {
  if (typeof asset.duration === 'number' && asset.duration > REEL_MAX_SECONDS * 1000) {
    return `El video dura más de ${REEL_MAX_SECONDS} segundos. Elegí uno más corto.`;
  }
  if (typeof asset.fileSize === 'number' && asset.fileSize > REEL_MAX_BYTES) {
    return `El video pesa más de ${REEL_MAX_BYTES / (1024 * 1024)} MB. Elegí uno más liviano.`;
  }
  return null;
}

/** Best-effort file size: picker value first, then the file system. Returns null when unknown (the backend 413 covers it). */
export function resolveFileSize(asset: { uri: string; fileSize?: number | null }): number | null {
  if (typeof asset.fileSize === 'number') return asset.fileSize;
  try {
    const { File } = require('expo-file-system');
    const size = new File(asset.uri).size;
    return typeof size === 'number' ? size : null;
  } catch {
    return null;
  }
}
