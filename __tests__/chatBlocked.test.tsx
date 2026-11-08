import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockFetchConversationByOrder = jest.fn();
const mockFetchMessages = jest.fn();
const mockSendMessage = jest.fn();
const mockPost = jest.fn();
const mockDelete = jest.fn();
let mockSocketError: ((e: { code: string }) => void) | null = null;

jest.mock('@/core/api/axiosinstance', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: (...a: unknown[]) => mockPost(...a),
    delete: (...a: unknown[]) => mockDelete(...a),
  },
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('expo-router', () => {
  const R = require('react');
  return {
    router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
    useFocusEffect: (cb: () => void) => { R.useEffect(() => { cb(); }, []); },
    useLocalSearchParams: () => ({ id: 'o1' }),
  };
});
jest.mock('@/core/navigation/safeBack', () => ({ safeBack: jest.fn() }));
jest.mock('@/components/AnimatedBackground', () => ({ AnimatedBackground: () => null }));
jest.mock('expo-image-picker', () => ({}));
jest.mock('expo-document-picker', () => ({}));
jest.mock('expo-image-manipulator', () => ({}));
jest.mock('expo-video', () => ({ VideoView: () => null, useVideoPlayer: () => ({}) }));
jest.mock('expo-audio', () => ({
  useAudioPlayer: () => ({}),
  useAudioPlayerStatus: () => ({}),
  useAudioRecorder: () => ({}),
  RecordingPresets: { HIGH_QUALITY: {} },
  requestRecordingPermissionsAsync: jest.fn(),
  setAudioModeAsync: jest.fn(),
}));
jest.mock('@/lib/permissionAlert', () => ({ alertPermissionDenied: jest.fn() }));
jest.mock('@/features/chat/services/chat.service', () => ({
  fetchConversationByOrder: (...a: unknown[]) => mockFetchConversationByOrder(...a),
  fetchMessages: (...a: unknown[]) => mockFetchMessages(...a),
  sendMessage: (...a: unknown[]) => mockSendMessage(...a),
  sendMedia: jest.fn(),
  sendAudio: jest.fn(),
  markAsRead: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@/features/chat/services/socket.service', () => ({
  socketService: {
    isConnected: false,
    joinConversation: jest.fn(),
    leaveConversation: jest.fn(),
    emitTyping: jest.fn(),
    onConnectionChange: () => () => {},
    onMessageNotification: () => () => {},
    onMessageReceived: () => () => {},
    onMessagesRead: () => () => {},
    onTypingIndicator: () => () => {},
    onError: (cb: (e: { code: string }) => void) => { mockSocketError = cb; return () => {}; },
  },
}));
jest.mock('@/features/auth/state/AuthContext', () => ({ useAuth: () => ({ authState: { token: 't' }, isAuthenticated: true }) }));
jest.mock('@/hooks/queries/useProfileQuery', () => ({ useProfile: () => ({ data: { id: 'me' } }) }));
jest.mock('@/hooks/queries/useOrdersQuery', () => ({
  useOrder: () => ({ data: { id: 'o1', status: 'in_progress' }, refetch: jest.fn() }),
}));
const mockToastError = jest.fn();
jest.mock('@/core/design-system/components/Toast', () => ({
  ...jest.requireActual('@/core/design-system/components/Toast'),
  toast: { error: (...a: unknown[]) => mockToastError(...a), success: jest.fn(), warning: jest.fn() },
}));

import ChatScreen from '@/features/chat/screens/ChatScreen';
import { CHAT_BLOCKED_BY_ME_NOTICE, CHAT_BLOCKED_ME_NOTICE } from '@/features/chat/constants/chatBlockRules';

const conv = (over = {}) => ({
  id: 'c1',
  orderId: 'o1',
  otherParty: { id: 'u2', firstName: 'Ana', lastName: 'Gómez', role: 'provider', isVerified: true },
  unreadCount: 0,
  orderStatus: 'in_progress',
  createdAt: '2026-11-01T10:00:00.000Z',
  ...over,
});

function renderChat() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <ChatScreen />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockSocketError = null;
  mockFetchMessages.mockResolvedValue({ messages: [], total: 0, hasMore: false });
});

describe('ChatScreen blocked state', () => {
  it('keeps the composer when nobody is blocked', async () => {
    mockFetchConversationByOrder.mockResolvedValue(conv());
    const { findByLabelText, queryByText } = renderChat();
    expect(await findByLabelText('Mensaje', {}, { timeout: 5000 })).toBeTruthy();
    expect(queryByText(CHAT_BLOCKED_BY_ME_NOTICE)).toBeNull();
    expect(queryByText(CHAT_BLOCKED_ME_NOTICE)).toBeNull();
  });

  it('blockedByMe: removes the composer and shows the unblock hint', async () => {
    mockFetchConversationByOrder.mockResolvedValue(conv({ blockedByMe: true }));
    const { findByText, queryByLabelText } = renderChat();
    expect(await findByText(CHAT_BLOCKED_BY_ME_NOTICE)).toBeTruthy();
    expect(queryByLabelText('Mensaje')).toBeNull();
    expect(queryByLabelText('Adjuntar archivo')).toBeNull();
  });

  it('blockedMe: removes the composer and shows the generic notice', async () => {
    mockFetchConversationByOrder.mockResolvedValue(conv({ blockedMe: true }));
    const { findByText, queryByLabelText } = renderChat();
    expect(await findByText(CHAT_BLOCKED_ME_NOTICE)).toBeTruthy();
    expect(queryByLabelText('Mensaje')).toBeNull();
  });

  it('a 403 USER_BLOCKED on send locks the chat and refreshes the conversation', async () => {
    mockFetchConversationByOrder.mockResolvedValue(conv());
    mockSendMessage.mockRejectedValue({ response: { status: 403, data: { code: 'USER_BLOCKED' } } });
    const { findByLabelText, findByText } = renderChat();
    fireEvent.changeText(await findByLabelText('Mensaje'), 'hola');
    mockFetchConversationByOrder.mockResolvedValue(conv({ blockedMe: true }));
    await act(async () => { fireEvent.press(await findByLabelText('Enviar mensaje')); });
    expect(await findByText(CHAT_BLOCKED_ME_NOTICE)).toBeTruthy();
    expect(mockToastError).toHaveBeenCalledWith(CHAT_BLOCKED_ME_NOTICE);
    await waitFor(() => expect(mockFetchConversationByOrder).toHaveBeenCalledTimes(2));
  });

  it('a socket USER_BLOCKED error resyncs the conversation', async () => {
    mockFetchConversationByOrder.mockResolvedValue(conv());
    const { findByLabelText, findByText } = renderChat();
    await findByLabelText('Mensaje');
    mockFetchConversationByOrder.mockResolvedValue(conv({ blockedByMe: true }));
    await act(async () => { mockSocketError?.({ code: 'USER_BLOCKED' }); });
    expect(await findByText(CHAT_BLOCKED_BY_ME_NOTICE)).toBeTruthy();
  });
});

describe('ChatScreen menu', () => {
  it('asks for confirmation before blocking, then blocks and locks the chat', async () => {
    mockFetchConversationByOrder.mockResolvedValue(conv());
    mockPost.mockResolvedValue({ data: undefined });
    const { findByLabelText, getByLabelText, getByText, findByText, queryByLabelText } = renderChat();
    fireEvent.press(await findByLabelText('Más opciones del chat'));
    expect(getByLabelText('Denunciar a Ana Gómez')).toBeTruthy();
    fireEvent.press(getByLabelText('Bloquear usuario'));
    expect(getByText('¿Bloquear a Ana Gómez?')).toBeTruthy();
    expect(mockPost).not.toHaveBeenCalled();
    fireEvent.press(getByText('Bloquear'));
    expect(await findByText(CHAT_BLOCKED_BY_ME_NOTICE)).toBeTruthy();
    expect(mockPost).toHaveBeenCalledWith('/users/u2/block');
    expect(queryByLabelText('Mensaje')).toBeNull();
  });

  it('offers unblock when I blocked them, and unblocking reopens the composer', async () => {
    mockFetchConversationByOrder.mockResolvedValue(conv({ blockedByMe: true }));
    mockDelete.mockResolvedValue({ data: undefined });
    const { findByLabelText, getByLabelText, queryByLabelText } = renderChat();
    fireEvent.press(await findByLabelText('Más opciones del chat'));
    expect(queryByLabelText('Bloquear usuario')).toBeNull();
    fireEvent.press(getByLabelText('Desbloquear usuario'));
    expect(await findByLabelText('Mensaje')).toBeTruthy();
    expect(mockDelete).toHaveBeenCalledWith('/users/u2/block');
  });

  it('rolls the chat back to blocked when unblocking fails', async () => {
    mockFetchConversationByOrder.mockResolvedValue(conv({ blockedByMe: true }));
    mockDelete.mockRejectedValue(new Error('boom'));
    const { findByLabelText, getByLabelText, findByText } = renderChat();
    fireEvent.press(await findByLabelText('Más opciones del chat'));
    fireEvent.press(getByLabelText('Desbloquear usuario'));
    expect(await findByText(CHAT_BLOCKED_BY_ME_NOTICE)).toBeTruthy();
    await waitFor(() => expect(mockToastError).toHaveBeenCalled());
  });
});
