import api from '@/core/api/axiosinstance';
import { readCollection } from '@/core/api/collections';
import { extractApiError } from '@/lib/errors';
import { extensionForMime } from '@/core/media/imageMime';
import { WORKS_FEED_PAGE_SIZE, WORK_UPLOAD_TIMEOUT_MS } from '../constants';
import type { WorkFeedItem, WorkImageFile, WorkPhoto, WorksFeedPage } from '../types';

/** GET /posts/feed — public, newest first, cursor pagination. */
export async function fetchWorksFeed(params: {
  cursor?: string;
  categoryId?: string | null;
  limit?: number;
}): Promise<WorksFeedPage> {
  const { data } = await api.get<WorksFeedPage>('/posts/feed', {
    params: {
      limit: params.limit ?? WORKS_FEED_PAGE_SIZE,
      ...(params.categoryId ? { categoryId: params.categoryId } : {}),
      ...(params.cursor ? { cursor: params.cursor } : {}),
    },
  });
  return { data: data?.data ?? [], nextCursor: data?.nextCursor ?? null };
}

/** GET /services/:id/posts — public photos of one service. */
export async function fetchServiceWorks(serviceId: string): Promise<WorkPhoto[]> {
  const { data } = await api.get<unknown>(`/services/${serviceId}/posts`);
  return readCollection<WorkPhoto>(data);
}

/** POST /services/:id/posts — multipart `image` + optional `description`. */
export async function createWork(
  serviceId: string,
  payload: { file: WorkImageFile; description?: string },
): Promise<WorkFeedItem> {
  const form = new FormData();
  form.append('image', {
    uri: payload.file.uri,
    type: payload.file.mimeType,
    name: `work-${Date.now()}.${extensionForMime(payload.file.mimeType)}`,
  } as any);
  const description = payload.description?.trim();
  if (description) form.append('description', description);
  const { data } = await api.post<WorkFeedItem>(`/services/${serviceId}/posts`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    // Uploads over mobile data can be slow; the default timeout is too short for them.
    timeout: WORK_UPLOAD_TIMEOUT_MS,
  });
  return data;
}

/** PATCH /posts/:id — an empty description clears it. */
export async function updateWork(postId: string, description: string): Promise<WorkFeedItem> {
  const { data } = await api.patch<WorkFeedItem>(`/posts/${postId}`, { description });
  return data;
}

/** DELETE /posts/:id — 204. An already-deleted post (404 POST_NOT_FOUND) counts as deleted. */
export async function deleteWork(postId: string): Promise<void> {
  try {
    await api.delete(`/posts/${postId}`);
  } catch (err) {
    if (extractApiError(err).code === 'POST_NOT_FOUND') return;
    throw err;
  }
}

/** POST /posts/:id/report — 204. */
export async function reportWork(postId: string, reason: string, details?: string): Promise<void> {
  await api.post(`/posts/${postId}/report`, { reason, ...(details ? { details } : {}) });
}
