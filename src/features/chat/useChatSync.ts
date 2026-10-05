import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AppState } from 'react-native';
import { useAuth } from '@/features/auth/state/AuthContext';
import { useConversationsQuery } from '@/hooks/queries/useChatQuery';
import { socketService } from './services/socket.service';
import { QUERY_KEYS } from '@/core/query/queryKeys';

export function useChatSync() {
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();
  useConversationsQuery();
  useEffect(() => {
    if (!isAuthenticated) return;
    const refresh = () => { void qc.invalidateQueries({ queryKey: QUERY_KEYS.conversations }); };
    const offNotification = socketService.onMessageNotification(refresh);
    const offMessage = socketService.onMessageReceived(refresh);
    const offRead = socketService.onMessagesRead(refresh);
    const offConnect = socketService.onConnectionChange(connected => { if (connected) refresh(); });
    const listener = AppState.addEventListener('change', state => { if (state === 'active') socketService.reconnect(); });
    return () => { offNotification(); offMessage(); offRead(); offConnect(); listener.remove(); };
  }, [isAuthenticated, qc]);
}
