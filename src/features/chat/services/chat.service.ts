/**
 * Servicio de chat.
 * Encapsula las llamadas al backend para el módulo de mensajería.
 * Endpoints documentados en endpoints.md sección 5.
 * El chat siempre está ligado a una orden — no hay mensajes directos libres.
 */

import api from '@/core/api/axiosinstance';
import type { OrderStatus } from '@/features/orders/types/orders.types';

export interface ChatParticipant {
  id: string;
  firstName: string;
  lastName?: string;
  avatarUrl?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  mediaUrl?: string;
  messageType: 'text' | 'image' | 'audio' | 'file' | 'system_event';
  isDelivered: boolean;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  sender?: ChatParticipant;
}

export interface OtherParty {
  id: string;
  firstName: string;
  lastName?: string;
  avatarUrl?: string | null;
  role: string;
  isVerified: boolean;
  rating?: number | null;
  reviewsCount?: number;
}

export interface Conversation {
  id: string;
  orderId: string;
  otherParty: OtherParty;
  lastMessage?: { content: string; senderId: string; createdAt: string | Date } | null;
  unreadCount: number;
  /** Order status. Not returned by the backend yet (BR02); the list badge renders only when present. */
  orderStatus?: OrderStatus;
  createdAt: string | Date;
}

/** Listar todas las conversaciones del usuario autenticado */
export async function fetchConversations(): Promise<Conversation[]> {
  const { data } = await api.get<Conversation[]>('/conversations');
  return data;
}

/** Obtener la conversación asociada a una orden */
export async function fetchConversationByOrder(orderId: string): Promise<Conversation> {
  const { data } = await api.get<Conversation>(`/conversations/${orderId}`);
  return data;
}

/** Obtener mensajes de una conversación (paginados, orden DESC) */
export async function fetchMessages(
  conversationId: string,
  params?: { page?: number; limit?: number },
): Promise<{ messages: Message[]; total: number; hasMore: boolean }> {
  const limit = params?.limit ?? 50;
  const { data } = await api.get<any>(`/conversations/${conversationId}/messages`, { params: { ...params, limit } });
  const messages: Message[] = (data as any)?.data ?? (Array.isArray(data) ? data : []);
  const total: number = (data as any)?.total ?? messages.length;
  return { messages, total, hasMore: messages.length === limit };
}

/** Enviar un mensaje de texto */
export async function sendMessage(conversationId: string, content: string): Promise<Message> {
  const { data } = await api.post<Message>(`/conversations/${conversationId}/messages`, {
    content,
    type: 'text',
  });
  return data;
}

/** Marcar conversación como leída */
export async function markAsRead(conversationId: string): Promise<void> {
  await api.patch(`/conversations/${conversationId}/read`);
}

/** Enviar un archivo/imagen/video */
export async function sendMedia(conversationId: string, fileUri: string, mimeType = 'image/jpeg'): Promise<Message> {
  const ext = mimeType.startsWith('video/') ? 'mp4' : mimeType === 'image/png' ? 'png' : 'jpg';
  const formData = new FormData();
  formData.append('file', { uri: fileUri, type: mimeType, name: `media.${ext}` } as any);

  const { data } = await api.post<Message>(`/conversations/${conversationId}/media`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

/** Enviar un mensaje de audio */
export async function sendAudio(conversationId: string, fileUri: string): Promise<Message> {
  const formData = new FormData();
  formData.append('file', { uri: fileUri, type: 'audio/aac', name: 'audio.aac' } as any);

  const { data } = await api.post<Message>(`/conversations/${conversationId}/media`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}
