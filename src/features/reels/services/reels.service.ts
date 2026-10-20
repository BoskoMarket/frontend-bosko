import api from '@/core/api/axiosinstance';
import { readPaginatedCollection, type PaginatedCollection } from '@/core/api/collections';

export interface ReelUser {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
  isAvailable?: boolean;
  isFollowing?: boolean;
}

export interface Reel {
  id: string;
  type?: 'video' | 'before_after';
  videoUrl: string | null;
  thumbnailUrl?: string | null;
  duration?: number | null;
  beforeImageUrl?: string;
  afterImageUrl?: string;
  user: ReelUser;
  description: string | null;
  tags: string[];
  music: string | null;
  likes: number;
  comments: number;
  isLiked: boolean;
  /** Whether the current user follows the reel author (root of ReelDto). */
  isFollowing?: boolean;
  createdAt: string;
}

export type ReelsFeedType = 'following';

export interface ReelComment {
  id: string;
  reelId: string;
  userId: string;
  comment: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

export interface CreateReelPayload {
  videoUrl: string;
  description?: string;
  tags?: string[];
  music?: string;
}

export interface UpdateReelPayload {
  description?: string;
  tags?: string[];
}

/** GET /reels?page=1&limit=10[&feed=following] — omit `feed` for the default "for you" feed */
export async function getReelsFeed(page = 1, limit = 10, feed?: ReelsFeedType): Promise<Reel[]> {
  const params: Record<string, unknown> = { page, limit };
  if (feed === 'following') params.feed = 'following';
  const res = await api.get<Reel[]>('/reels', { params });
  return res.data;
}

/** GET /reels/me?page=1&limit=20 — reels propios del usuario autenticado (paginado) */
export async function getMyReels(page = 1, limit = 20): Promise<PaginatedCollection<Reel>> {
  const res = await api.get<unknown>('/reels/me', { params: { page, limit } });
  return readPaginatedCollection<Reel>(res.data);
}

/** PATCH /reels/:id */
export async function updateReel(reelId: string, payload: UpdateReelPayload): Promise<Reel> {
  const res = await api.patch<Reel>(`/reels/${reelId}`, payload);
  return res.data;
}

/** POST /reels */
export async function createReel(payload: CreateReelPayload): Promise<Reel> {
  const res = await api.post<Reel>('/reels', payload);
  return res.data;
}

/** DELETE /reels/:id */
export async function deleteReel(reelId: string): Promise<void> {
  await api.delete(`/reels/${reelId}`);
}

/** POST /reels/:id/like  → toggle */
export async function toggleLikeReel(
  reelId: string,
): Promise<{ likes: number; isLiked: boolean }> {
  const res = await api.post<{ likes: number; isLiked: boolean }>(`/reels/${reelId}/like`);
  return res.data;
}

/** GET /reels/:id/comments */
export async function getReelComments(
  reelId: string,
  page = 1,
  limit = 20,
): Promise<ReelComment[]> {
  const res = await api.get<ReelComment[]>(`/reels/${reelId}/comments`, {
    params: { page, limit },
  });
  return res.data;
}

/** POST /reels/:id/comments */
export async function commentOnReel(
  reelId: string,
  comment: string,
): Promise<{ commentsCount: number }> {
  const res = await api.post<{ commentsCount: number }>(`/reels/${reelId}/comments`, { comment });
  return res.data;
}

/** DELETE /reels/:id/comments/:commentId */
export async function deleteReelComment(
  reelId: string,
  commentId: string,
): Promise<void> {
  await api.delete(`/reels/${reelId}/comments/${commentId}`);
}

/**
 * POST /reels/:id/report — returns 204 No Content on success.
 */
export async function reportReel(
  reelId: string,
  reason: string,
  details?: string,
): Promise<void> {
  await api.post(`/reels/${reelId}/report`, { reason, ...(details ? { details } : {}) });
}

export interface ReelUploadResult {
  videoUrl: string;
  thumbnailUrl?: string | null;
  /** Duration in seconds, measured by the server. */
  duration: number;
}

export interface ReelUploadFile {
  uri: string;
  mimeType?: string | null;
}

export interface ReelThumbnailFile {
  uri: string;
  mimeType: 'image/jpeg' | 'image/png';
}

/**
 * POST /reels/upload. The optional thumbnail is sent under its own multipart field.
 * Returns the stored URL, which is then sent to `createReel`.
 */
export async function uploadReelVideo(
  file: ReelUploadFile,
  opts: { thumbnail?: ReelThumbnailFile; onProgress?: (fraction: number) => void; signal?: AbortSignal } = {},
): Promise<ReelUploadResult> {
  const mimeType = file.mimeType && file.mimeType.startsWith('video/') ? file.mimeType : 'video/mp4';
  const ext = mimeType === 'video/quicktime' ? 'mov' : 'mp4';
  const formData = new FormData();
  formData.append('video', { uri: file.uri, type: mimeType, name: `reel.${ext}` } as any);
  if (opts.thumbnail) {
    const ext = opts.thumbnail.mimeType === 'image/png' ? 'png' : 'jpg';
    formData.append('thumbnail', { uri: opts.thumbnail.uri, type: opts.thumbnail.mimeType, name: `thumbnail.${ext}` } as any);
  }

  const res = await api.post<ReelUploadResult>('/reels/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 5 * 60_000,
    signal: opts.signal,
    onUploadProgress: (event) => {
      if (opts.onProgress && event.total) opts.onProgress(event.loaded / event.total);
    },
  });
  return res.data;
}

export type ReelUploadErrorKind = 'cancelled' | 'unavailable' | 'tooLarge' | 'format' | 'network' | 'busy' | 'invalidUpload' | 'providerRequired' | 'other';

/** Classifies an upload failure so the screen can pick the right copy and offer retry. */
export function classifyReelUploadError(error: unknown): ReelUploadErrorKind {
  const e = error as { code?: string; response?: { status?: number; data?: { code?: string } }; message?: string; name?: string } | null;
  if (e?.code === 'ERR_CANCELED' || e?.name === 'CanceledError' || e?.name === 'AbortError') return 'cancelled';
  const status = e?.response?.status;
  const code = e?.response?.data?.code;
  if (code === 'INVALID_UPLOAD') return 'invalidUpload';
  if (code === 'PROVIDER_REQUIRED') return 'providerRequired';
  if (status === 429 || code === 'UPLOAD_BUSY' || code === 'RATE_LIMITED') return 'busy';
  if (status === 404 || status === 405 || status === 501) return 'unavailable';
  if (status === 413 || code === 'FILE_SIZE_EXCEEDED' || code === 'PAYLOAD_TOO_LARGE') return 'tooLarge';
  if (status === 415 || code === 'INVALID_MEDIA' || code === 'UNSUPPORTED_MEDIA_TYPE' || status === 400) return 'format';
  if (!status && (e?.code === 'ERR_NETWORK' || e?.code === 'ECONNABORTED' || /network|timeout/i.test(e?.message ?? ''))) return 'network';
  return 'other';
}

export const REEL_UPLOAD_ERROR_MESSAGES: Record<Exclude<ReelUploadErrorKind, 'cancelled' | 'other'>, string> = {
  unavailable: 'No pudimos subir el video. Intentá de nuevo más tarde.',
  tooLarge: 'Archivo demasiado grande. El video admite hasta 100 MB y la miniatura hasta 5 MB.',
  format: 'No pudimos procesar los archivos. Usá un video MP4 o MOV de hasta 60 segundos y una miniatura JPG o PNG.',
  network: 'Se cortó la conexión mientras subíamos el video. Revisá tu internet e intentá de nuevo.',
  busy: 'Hay demasiadas subidas en curso. Esperá un momento e intentá de nuevo.',
  invalidUpload: 'La subida ya no es válida para esta cuenta. Elegí el video y volvé a subirlo.',
  providerRequired: 'Solo los prestadores pueden publicar reels.',
};
