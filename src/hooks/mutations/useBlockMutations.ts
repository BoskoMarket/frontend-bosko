import { useMutation, useQueryClient, type InfiniteData, type QueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/core/query/queryKeys';
import type { PaginatedCollection } from '@/core/api/collections';
import type { Conversation } from '@/features/chat/services/chat.service';
import { blockUser, unblockUser, type BlockedUser } from '@/features/users/services/users';

type Snapshot = Array<[readonly unknown[], unknown]>;
type BlockedPages = InfiniteData<PaginatedCollection<BlockedUser>>;

function patchConversation(c: Conversation, userId: string, blockedByMe: boolean): Conversation {
  return c?.otherParty?.id === userId ? { ...c, blockedByMe } : c;
}

/**
 * Mirrors the block flag on every cached conversation (list and per-order). No cancelQueries: it
 * would abort in-flight fetches; rollback restores the exact snapshots taken before the write.
 */
function applyToConversations(qc: QueryClient, userId: string, blockedByMe: boolean): Snapshot {
  const previous = qc.getQueriesData({ queryKey: QUERY_KEYS.conversations }) as Snapshot;
  qc.setQueriesData({ queryKey: QUERY_KEYS.conversations }, (old: unknown) => {
    if (Array.isArray(old)) return old.map((c) => patchConversation(c as Conversation, userId, blockedByMe));
    if (old && typeof old === 'object') return patchConversation(old as Conversation, userId, blockedByMe);
    return old;
  });
  return previous;
}

function restore(qc: QueryClient, snapshot: Snapshot | undefined) {
  snapshot?.forEach(([key, data]) => qc.setQueryData(key, data));
}

/** Removes one user from the cached list and returns it, so a failure can put back only that row. */
function removeFromBlockedList(qc: QueryClient, userId: string): BlockedUser | undefined {
  const previous = qc.getQueryData<BlockedPages>(QUERY_KEYS.blockedUsers);
  if (!previous) return undefined;
  let removed: BlockedUser | undefined;
  qc.setQueryData<BlockedPages>(QUERY_KEYS.blockedUsers, {
    ...previous,
    pages: previous.pages.map((p) => {
      const hit = p.data.find((u) => u.id === userId);
      if (hit) removed = hit;
      return hit ? { ...p, data: p.data.filter((u) => u.id !== userId), total: Math.max(0, p.total - 1) } : p;
    }),
  });
  return removed;
}

function reinsertIntoBlockedList(qc: QueryClient, user: BlockedUser) {
  qc.setQueryData<BlockedPages>(QUERY_KEYS.blockedUsers, (old) => {
    if (!old || old.pages.some((p) => p.data.some((u) => u.id === user.id))) return old;
    const [first, ...rest] = old.pages;
    return { ...old, pages: [{ ...first, data: [user, ...first.data], total: first.total + 1 }, ...rest] };
  });
}

/** The server is the source of truth for the final state of both lists. */
function useSettle() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: QUERY_KEYS.blockedUsers });
    void qc.invalidateQueries({ queryKey: QUERY_KEYS.conversations });
  };
}

interface Ctx {
  conversations?: Snapshot;
  removed?: BlockedUser;
}

export function useBlockUser() {
  const qc = useQueryClient();
  const settle = useSettle();
  return useMutation<void, unknown, string, Ctx>({
    mutationFn: (userId) => blockUser(userId),
    onMutate: (userId) => ({ conversations: applyToConversations(qc, userId, true) }),
    onError: (_e, _userId, ctx) => restore(qc, ctx?.conversations),
    onSettled: settle,
  });
}

export function useUnblockUser() {
  const qc = useQueryClient();
  const settle = useSettle();
  return useMutation<void, unknown, string, Ctx>({
    mutationFn: (userId) => unblockUser(userId),
    onMutate: (userId) => ({
      conversations: applyToConversations(qc, userId, false),
      removed: removeFromBlockedList(qc, userId),
    }),
    onError: (_e, _userId, ctx) => {
      restore(qc, ctx?.conversations);
      if (ctx?.removed) reinsertIntoBlockedList(qc, ctx.removed);
    },
    onSettled: settle,
  });
}
