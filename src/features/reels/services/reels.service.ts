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
