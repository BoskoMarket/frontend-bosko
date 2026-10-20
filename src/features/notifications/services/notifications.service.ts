/**
 * notifications.service.ts — Servicio de notificaciones.
 * Conectado a /notifications/* y registro de push tokens.
 */

import api from '@/core/api/axiosinstance';
import { readPaginatedCollection, type PaginatedCollection } from '@/core/api/collections';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: string;
}

export type PaginatedNotifications = PaginatedCollection<Notification>;

/** Listar notificaciones — GET /notifications */
export async function fetchNotifications(page = 1, limit = 20): Promise<PaginatedNotifications> {
  const { data } = await api.get<PaginatedNotifications>('/notifications', {
    params: { page, limit },
  });
  return readPaginatedCollection<Notification>(data);
}

/** Contador de no leídas — GET /notifications/unread-count */
export async function fetchUnreadCount(): Promise<number> {
  const { data } = await api.get<{ count: number }>('/notifications/unread-count');
  return data.count;
}

/** Marcar notificación como leída — PATCH /notifications/:id/read */
export async function markNotificationRead(id: string): Promise<void> {
  await api.patch(`/notifications/${id}/read`);
}

/** Registrar push token — POST /notifications/token */
export async function registerPushToken(token: string, platform: 'ios' | 'android'): Promise<void> {
  await api.post('/notifications/token', { token, platform });
}

/** Marcar todas como leídas — PATCH /notifications/read-all */
export async function markAllNotificationsRead(): Promise<void> {
  await api.patch('/notifications/read-all');
}

/** Eliminar una notificación — DELETE /notifications/:id */
export async function deleteNotification(id: string): Promise<void> {
  await api.delete(`/notifications/${id}`);
}

/** Limpiar todas las notificaciones — DELETE /notifications */
export async function clearAllNotifications(): Promise<void> {
  await api.delete('/notifications');
}

/** Eliminar push token — DELETE /notifications/token */
export async function deletePushToken(): Promise<void> {
  await api.delete('/notifications/token');
}
