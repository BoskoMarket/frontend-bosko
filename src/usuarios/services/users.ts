
/**
 * User related API calls.
 *
 * Although most user-specific actions live in the auth module, you
 * may need endpoints to fetch other users (e.g. for chat) or to
 * update profile details independent of the authentication flow.
 */

import api from "@/src/shared/utils/axiosinstance";

export interface User {
  id?: string;
  name: string;
  email: string;
  avatarUrl?: string;
  roles?: string[];
  description?: string;
  services?: any[];
}

/**
 * fetchUsers
 *
 * GET `/users`
 *
 * Retrieve all users. Optionally filter via query parameters such
 * as role or search term.
 */
export async function fetchUsers(params?: Record<string, any>): Promise<User[]> {
  const { data } = await api.get<User[]>('/users', { params });
  return data;
}

/**
 * fetchUserById
 *
 * GET `/users/{id}`
 */
export async function fetchUserById(id: string): Promise<User> {
  const { data } = await api.get<User>(`/users/${id}`);
  return data;
}

/**
 * updateUser
 *
 * PUT `/users/{id}`
 *
 * Update user profile details. This can include name, description
 * or other metadata. The backend may restrict which fields can be
 * changed.
 */
export async function updateUser(id: string, payload: Partial<User>): Promise<User> {
  const { data } = await api.put<User>(`/users/${id}`, payload);
  return data;
}
