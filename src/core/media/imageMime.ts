/** Shared image upload helpers (banner, reel thumbnail). */
export const IMAGE_UPLOAD_MAX_BYTES = 5 * 1024 * 1024;

export type ImageMime = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/heic' | 'image/heif';

const EXT_TO_MIME: Record<string, ImageMime> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
};

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
};

/**
 * Normalizes a picker asset to a canonical image MIME: `image/jpg` becomes `image/jpeg`
 * and a missing/unknown MIME falls back to the file extension. Returns undefined when unknown.
 */
export function resolveImageMime(asset: { uri: string; fileName?: string | null; mimeType?: string | null }): ImageMime | undefined {
  const raw = asset.mimeType?.toLowerCase().trim();
  if (raw) {
    const normalized = raw === 'image/jpg' || raw === 'image/pjpeg' ? 'image/jpeg' : raw;
    if (normalized in MIME_TO_EXT) return normalized as ImageMime;
  }
  const ext = (asset.fileName ?? asset.uri).split('?')[0].split('.').pop()?.toLowerCase();
  return ext ? EXT_TO_MIME[ext] : undefined;
}

/** File extension for an image MIME (defaults to `jpg`). */
export function extensionForMime(mime: string): string {
  return MIME_TO_EXT[mime] ?? 'jpg';
}
