import { useChatStore } from '@/stores/chat.store';
import { fetchConversations } from '@/features/chat/services/chat.service';
import type { OrderIdLookup } from './notificationRoute';

const LOOKUP_TIMEOUT_MS = 4000;

/**
 * conversationId -> orderId: cached conversations (chat store) first, then one fetch of the
 * list. The fetch is bounded so a slow network never delays the navigation (null => list fallback).
 */
export const lookupOrderIdByConversation: OrderIdLookup = async (conversationId) => {
  const cached = useChatStore.getState().conversations.find((c) => c.id === conversationId);
  if (cached?.orderId) return cached.orderId;

  const list = await Promise.race<Awaited<ReturnType<typeof fetchConversations>> | null>([
    fetchConversations(),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), LOOKUP_TIMEOUT_MS)),
  ]);
  return list?.find((c) => c.id === conversationId)?.orderId ?? null;
};
