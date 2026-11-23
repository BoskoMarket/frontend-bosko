import { create } from 'zustand';
import type { Conversation } from '@/features/chat/services/chat.service';

interface ChatState {
  conversations: Conversation[];
  setConversations: (fn: Conversation[] | ((prev: Conversation[]) => Conversation[])) => void;
  updateLastMessage: (convId: string, content: string, senderId: string) => void;

  unreadTotal: number;
  setUnreadTotal: (n: number) => void;
  incrementUnread: () => void;
  clearConversationUnread: (convId: string) => void;

  socketReady: boolean;
  setSocketReady: (ready: boolean) => void;

  typingUsers: Record<string, boolean>;
  setTyping: (convId: string, isTyping: boolean) => void;

  reset: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  setConversations: (fn) =>
    set((state) => ({
      conversations: typeof fn === 'function' ? fn(state.conversations) : fn,
    })),

  updateLastMessage: (convId, content, senderId) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === convId
          ? { ...c, lastMessage: { content, senderId, createdAt: new Date().toISOString() } }
          : c,
      ),
    })),

  unreadTotal: 0,
  setUnreadTotal: (unreadTotal) => set({ unreadTotal }),
  incrementUnread: () => set((state) => ({ unreadTotal: state.unreadTotal + 1 })),
  clearConversationUnread: (convId) =>
    set((state) => {
      const cleared = state.conversations.find((c) => c.id === convId)?.unreadCount ?? 0;
      return {
        conversations: state.conversations.map((c) => (c.id === convId ? { ...c, unreadCount: 0 } : c)),
        unreadTotal: Math.max(0, state.unreadTotal - cleared),
      };
    }),

  socketReady: false,
  setSocketReady: (socketReady) => set({ socketReady }),

  typingUsers: {},
  setTyping: (convId, isTyping) =>
    set((state) => ({
      typingUsers: { ...state.typingUsers, [convId]: isTyping },
    })),

  reset: () =>
    set({ conversations: [], unreadTotal: 0, socketReady: false, typingUsers: {} }),
}));

export const useUnreadTotal = () => useChatStore((s) => s.unreadTotal);
export const useConversationsList = () => useChatStore((s) => s.conversations);
export const useSocketReady = () => useChatStore((s) => s.socketReady);
export const useIsTyping = (convId: string) =>
  useChatStore((s) => s.typingUsers[convId] ?? false);
