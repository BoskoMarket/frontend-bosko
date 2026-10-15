import api from '@/core/api/axiosinstance';

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
  beforeImageUrl?: string;
  afterImageUrl?: string;
  user: ReelUser;
  description: string | null;
  tags: string[];
  music: string | null;
  likes: number;
  comments: number;
  isLiked: boolean;
  createdAt: string;
}

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

/** GET /reels?page=1&limit=10 */
export async function getReelsFeed(page = 1, limit = 10): Promise<Reel[]> {
  const res = await api.get<Reel[]>('/reels', { params: { page, limit } });
  return res.data;
}

/** GET /reels/me — reels propios del usuario autenticado */
export async function getMyReels(): Promise<Reel[]> {
  const res = await api.get<Reel[]>('/reels/me');
  return res.data;
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
 * POST /reels/:id/report
 * The backend only accepts `{ reason?: string }` (ReportReelDto), so the machine code goes in
 * `reason` and the optional free text is appended as `code: details` (BR03 asks for a `details` field).
 */
export async function reportReel(
  reelId: string,
  reason?: string,
  details?: string,
): Promise<void> {
  const composed = reason && details ? `${reason}: ${details}` : reason;
  await api.post(`/reels/${reelId}/report`, { reason: composed });
}

export interface ReelUploadResult {
  videoUrl: string;
  thumbnailUrl?: string;
  /** Duration in seconds, measured by the server. */
  duration: number;
}

export interface ReelUploadFile {
  uri: string;
  mimeType?: string | null;
}

/**
 * POST /reels/upload — proposed, BR04 (`odd/backend-requests.md`).
 * Multipart field `video` (mp4/mov, <= 100 MB, <= 60 s). Returns the stored URL, which is then
 * sent to `createReel`. Supports progress (0..1) and cancellation through an AbortSignal.
 */
export async function uploadReelVideo(
  file: ReelUploadFile,
  opts: { onProgress?: (fraction: number) => void; signal?: AbortSignal } = {},
): Promise<ReelUploadResult> {
  const mimeType = file.mimeType && file.mimeType.startsWith('video/') ? file.mimeType : 'video/mp4';
  const ext = mimeType === 'video/quicktime' ? 'mov' : 'mp4';
  const formData = new FormData();
  formData.append('video', { uri: file.uri, type: mimeType, name: `reel.${ext}` } as any);

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

export type ReelUploadErrorKind = 'cancelled' | 'unavailable' | 'tooLarge' | 'format' | 'network' | 'other';

/** Classifies an upload failure so the screen can pick the right copy and offer retry. */
export function classifyReelUploadError(error: unknown): ReelUploadErrorKind {
  const e = error as { code?: string; response?: { status?: number }; message?: string; name?: string } | null;
  if (e?.code === 'ERR_CANCELED' || e?.name === 'CanceledError' || e?.name === 'AbortError') return 'cancelled';
  const status = e?.response?.status;
  if (status === 404 || status === 405 || status === 501) return 'unavailable';
  if (status === 413) return 'tooLarge';
  if (status === 415 || status === 400) return 'format';
  if (!status && (e?.code === 'ERR_NETWORK' || e?.code === 'ECONNABORTED' || /network|timeout/i.test(e?.message ?? ''))) return 'network';
  return 'other';
}

export const REEL_UPLOAD_ERROR_MESSAGES: Record<Exclude<ReelUploadErrorKind, 'cancelled' | 'other'>, string> = {
  unavailable: 'La subida de videos todavía no está disponible.',
  tooLarge: 'El video es demasiado pesado. El máximo es de 100 MB.',
  format: 'No pudimos procesar el video. Usá un archivo MP4 o MOV de hasta 60 segundos.',
  network: 'Se cortó la conexión mientras subíamos el video. Revisá tu internet e intentá de nuevo.',
};
