import { useInfiniteQuery, useQuery, useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { nextCollectionPage } from '@/core/api/collections';
import type { PaginatedNotifications } from '@/features/notifications/services/notifications.service';
import { QUERY_KEYS } from '@/core/query/queryKeys';
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from '@/features/notifications/services/notifications.service';

export function useNotificationsQuery() {
  return useInfiniteQuery({
    queryKey: QUERY_KEYS.notifications(1),
    queryFn: ({ pageParam }) => fetchNotifications(pageParam),
    initialPageParam: 1,
    getNextPageParam: nextCollectionPage,
  });
}

export function useUnreadNotificationsCount() {
  return useQuery({
    queryKey: QUERY_KEYS.unreadCount,
    queryFn: fetchUnreadCount,
    refetchInterval: 60_000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onMutate: async (id) => {
      qc.setQueryData<InfiniteData<PaginatedNotifications>>(QUERY_KEYS.notifications(1), (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map(page => ({
            ...page,
            data: page.data.map(n => n.id === id ? { ...n, read: true } : n),
          })),
        };
      });
      qc.setQueryData(QUERY_KEYS.unreadCount, (old: number) =>
        Math.max(0, (old ?? 0) - 1),
      );
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.unreadCount });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      qc.setQueryData(QUERY_KEYS.unreadCount, 0);
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.notifications()[0]] });
    },
  });
}

export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteNotification(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.notifications()[0]] });
    },
  });
}
