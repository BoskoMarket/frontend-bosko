
import api from "@/core/api/axiosinstance";
import { Id } from "../interfaces/common";
import { UpdateUserDto, User } from "../interfaces/user";

export async function listUsers(params?: Record<string, any>): Promise<User[]> {
  const { data } = await api.get<User[]>("/user", { params });
  return data;
}

export async function getUser(id: Id): Promise<User> {
  const { data } = await api.get<User>(`/user/${id}`);
  return data;
}

export async function updateUser(
  id: Id,
  payload: UpdateUserDto
): Promise<User> {
  const { data } = await api.patch<User>(`/user/${id}`, payload);
  return data;
}

export async function deleteUser(id: Id): Promise<void> {
  await api.delete(`/user/${id}`);
}

export async function listUserReviewsWritten(id: Id) {
  const { data } = await api.get(`/user/${id}/reviews-written`);
  return data;
}

export async function listUserReviewsReceived(id: Id) {
  const { data } = await api.get(`/user/${id}/reviews-received`);
  return data;
}
