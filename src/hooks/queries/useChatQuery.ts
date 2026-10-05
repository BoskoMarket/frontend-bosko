import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/core/query/queryKeys';
import {
  fetchConversations,
  fetchConversationByOrder,
  fetchMessages,
  sendMessage,
  markAsRead,
} from '@/features/chat/services/chat.service';
import { useChatStore } from '@/stores/chat.store';
import { useAuth } from '@/features/auth/state/AuthContext';

export function useConversationsQuery() {
  const { isAuthenticated } = useAuth();
  const setConversations = useChatStore((s) => s.setConversations);

  return useQuery({
    queryKey: QUERY_KEYS.conversations,
    queryFn: async () => {
      const data = await fetchConversations();
      setConversations(data);
      useChatStore.getState().setUnreadTotal(data.reduce((total, row) => total + row.unreadCount, 0));
      return data;
    },
    staleTime: 30_000,
    enabled: isAuthenticated,
  });
}

export function useConversationByOrder(orderId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.conversationByOrder(orderId!),
    queryFn: () => fetchConversationByOrder(orderId!),
    enabled: !!orderId,
  });
}

export function useMessages(conversationId: string | undefined, page = 1) {
  return useQuery({
    queryKey: QUERY_KEYS.messages(conversationId!, page),
    queryFn: () => fetchMessages(conversationId!, { page, limit: 50 }),
    enabled: !!conversationId,
    staleTime: 0,
  });
}

export function useSendMessage(conversationId: string) {
  const qc = useQueryClient();
  const updateLastMessage = useChatStore((s) => s.updateLastMessage);

  return useMutation({
    mutationFn: (content: string) => sendMessage(conversationId, content),
    onSuccess: (message) => {
      qc.setQueryData(
        QUERY_KEYS.messages(conversationId, 1),
        (old: any) =>
          old
            ? { ...old, messages: [...old.messages, message] }
            : { messages: [message], total: 1, hasMore: false },
      );
      updateLastMessage(conversationId, message.content, message.senderId);
    },
  });
}

export function useMarkAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) => markAsRead(conversationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.conversations });
    },
  });
}
