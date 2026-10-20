const VIDEO_EXTENSION = /\.(mp4|mov|avi|webm)$/i;

/**
 * True when the media URL points to a video file.
 * Signed storage URLs carry the signature in the query string
 * (`video.mp4?X-Amz-Signature=...`), so only the pathname is checked.
 */
export function isVideoUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const pathname = url.split(/[?#]/)[0];
  return VIDEO_EXTENSION.test(pathname);
}
