
/**
 * Posts (work feed) related API calls.
 *
 * Pros can showcase their previous work by uploading photos and
 * descriptions. Clients can like and comment on these posts, and
 * this content appears on the service detail page.
 */

import api from "@/src/shared/utils/axiosinstance";

export interface Post {
  id?: string;
  serviceId: string;
  imageUrl: string;
  description?: string;
  likes?: number;
  commentsCount?: number;
  createdAt?: string;
}

/**
 * fetchPostsByService
 *
 * GET `/services/{id}/posts`
 *
 * Retrieve all feed posts for a particular service.
 */
export async function fetchPostsByService(serviceId: string): Promise<Post[]> {
  const { data } = await api.get<Post[]>(`/services/${serviceId}/posts`);
  return data;
}

/**
 * createPost
 *
 * POST `/services/{id}/posts`
 *
 * Upload a new work post. The payload typically contains a URL to
 * an uploaded image and an optional description.
 */
export async function createPost(serviceId: string, payload: Omit<Post, 'id' | 'serviceId' | 'likes' | 'commentsCount' | 'createdAt'>): Promise<Post> {
  const { data } = await api.post<Post>(`/services/${serviceId}/posts`, payload);
  return data;
}

/**
 * likePost
 *
 * POST `/posts/{id}/like`
 *
 * Register a like on a post. Returns the updated like count.
 */
export async function likePost(postId: string): Promise<{ likes: number }> {
  const { data } = await api.post<{ likes: number }>(`/posts/${postId}/like`);
  return data;
}

/**
 * commentOnPost
 *
 * POST `/posts/{id}/comments`
 *
 * Add a comment to a specific post. The backend will attach the
 * current user ID from the auth token. Returns the updated
 * comments count or the new comment, depending on implementation.
 */
export async function commentOnPost(postId: string, comment: string): Promise<{ commentsCount: number }> {
  const { data } = await api.post<{ commentsCount: number }>(`/posts/${postId}/comments`, { comment });
  return data;
}
