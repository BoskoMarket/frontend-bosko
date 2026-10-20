import React, { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { clearAllNotifications } from '../services/notifications.service';
import { QUERY_KEYS } from '@/core/query/queryKeys';
import { useQueryClient } from '@tanstack/react-query';
import {
  useNotificationsQuery,
  useUnreadNotificationsCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
} from '@/hooks/queries/useNotificationsQuery';
import { getUserErrorMessage } from '@/lib/errors';

const isExpoGo = Constants.appOwnership === 'expo';

if (!isExpoGo) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    } as Notifications.NotificationBehavior),
  });
}

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function useNotifications() {
  const qc = useQueryClient();
  const notifQ = useNotificationsQuery();
  const unreadQ = useUnreadNotificationsCount();
  const markReadM = useMarkNotificationRead();
  const markAllM = useMarkAllNotificationsRead();
  const deleteM = useDeleteNotification();
  const listenerRef = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    if (isExpoGo) return;
    listenerRef.current = Notifications.addNotificationReceivedListener(() => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.unreadCount });
    });
    return () => listenerRef.current?.remove();
  }, [qc]);

  return {
    notifications: notifQ.data?.pages.flatMap(page => page.data) ?? [],
    hasMore: notifQ.hasNextPage,
    loadingMore: notifQ.isFetchingNextPage,
    fetching: notifQ.isFetching,
    moreError: notifQ.isFetchNextPageError,
    loadMore: () => notifQ.fetchNextPage(),
    unreadCount: unreadQ.data ?? 0,
    loading: notifQ.isLoading,
    error: notifQ.error ? getUserErrorMessage(notifQ.error) : '',
    load: async () => { await notifQ.refetch(); },
    markRead: (id: string) => markReadM.mutateAsync(id),
    markAllRead: () => markAllM.mutateAsync(),
    remove: (id: string) => deleteM.mutateAsync(id),
    clearAll: async () => {
      await clearAllNotifications();
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
    clearError: () => {},
  };
}
