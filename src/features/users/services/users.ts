import api from "@/core/api/axiosinstance";
import { readPaginatedCollection, type PaginatedCollection } from "@/core/api/collections";

export interface PublicUser {
  id: string;
  firstName: string;
  lastName?: string;
  avatarUrl?: string;
  bio?: string;
  isVerified: boolean;
  role: string;
  rating?: number;
  reviewsCount?: number;
}

/** Perfil público de otro usuario — GET /users/:id/public */
export async function fetchUserById(id: string): Promise<PublicUser> {
  const { data } = await api.get<PublicUser>(`/users/${id}/public`);
  return data;
}

/** Seguir a un usuario — POST /users/:id/follow */
export async function followUser(id: string): Promise<void> {
  await api.post(`/users/${id}/follow`);
}

/** Dejar de seguir a un usuario — DELETE /users/:id/follow */
export async function unfollowUser(id: string): Promise<void> {
  await api.delete(`/users/${id}/follow`);
}

export interface BlockedUser {
  id: string;
  firstName: string;
  lastName?: string | null;
  avatarUrl?: string | null;
  blockedAt: string;
}

/** Bloquear a un usuario — POST /users/:id/block (204, idempotente) */
export async function blockUser(userId: string): Promise<void> {
  await api.post(`/users/${userId}/block`);
}

/** Desbloquear a un usuario — DELETE /users/:id/block (204, idempotente) */
export async function unblockUser(userId: string): Promise<void> {
  await api.delete(`/users/${userId}/block`);
}

/** Usuarios que bloqueé — GET /users/me/blocks?page&limit */
export async function fetchBlockedUsers(page = 1, limit = 20): Promise<PaginatedCollection<BlockedUser>> {
  const { data } = await api.get<unknown>('/users/me/blocks', { params: { page, limit } });
  return readPaginatedCollection<BlockedUser>(data);
}
