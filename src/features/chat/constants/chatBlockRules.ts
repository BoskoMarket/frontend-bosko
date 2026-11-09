import type { Conversation } from '../services/chat.service';

/** How a block (either direction) affects a chat: history stays readable, sending is disabled. */
export type ChatBlockState = 'byMe' | 'byOther' | null;

export const CHAT_BLOCKED_BY_ME_NOTICE = 'Bloqueaste a este usuario. Desbloquéalo para volver a escribirle.';
export const CHAT_BLOCKED_ME_NOTICE = 'No puedes enviar mensajes a este usuario.';
export const CHAT_BLOCKED_TOAST = 'No puedes enviar mensajes a este usuario.';

/** Flags are optional (the backend may not send them yet): absent means not blocked. */
export function chatBlockState(
  conversation: Pick<Conversation, 'blockedByMe' | 'blockedMe'> | null | undefined,
): ChatBlockState {
  if (conversation?.blockedByMe) return 'byMe';
  if (conversation?.blockedMe) return 'byOther';
  return null;
}

export function chatBlockNotice(state: ChatBlockState): string | null {
  if (state === 'byMe') return CHAT_BLOCKED_BY_ME_NOTICE;
  if (state === 'byOther') return CHAT_BLOCKED_ME_NOTICE;
  return null;
}

/** Only the backend's explicit code (403 USER_BLOCKED) denotes a block. */
export function isUserBlockedError(err: unknown): boolean {
  const response = (err as { response?: { status?: number; data?: { code?: string } } } | null)?.response;
  return response?.status === 403 && response.data?.code === 'USER_BLOCKED';
}

/** Socket `error` is `{code, message}` without a conversation id: a hint to resync, never a lock. */
export function isUserBlockedSocketError(error: { code: string }): boolean {
  return error.code === 'USER_BLOCKED';
}
