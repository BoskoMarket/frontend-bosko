import React from 'react';
import { act, fireEvent, render, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockGet = jest.fn();
const mockPost = jest.fn();
const mockDelete = jest.fn();
jest.mock('@/core/api/axiosinstance', () => ({
  __esModule: true,
  default: {
    get: (...a: unknown[]) => mockGet(...a),
    post: (...a: unknown[]) => mockPost(...a),
    delete: (...a: unknown[]) => mockDelete(...a),
  },
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('expo-router', () => ({ router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() } }));
jest.mock('@/core/navigation/safeBack', () => ({ safeBack: jest.fn() }));
jest.mock('@/components/AnimatedBackground', () => ({ AnimatedBackground: () => null }));
const mockToastError = jest.fn();
jest.mock('@/core/design-system/components/Toast', () => ({
  ...jest.requireActual('@/core/design-system/components/Toast'),
  toast: { error: (...a: unknown[]) => mockToastError(...a), success: jest.fn(), warning: jest.fn() },
}));

import { QUERY_KEYS } from '@/core/query/queryKeys';
import { blockUser, unblockUser, fetchBlockedUsers } from '@/features/users/services/users';
import { fetchConversationByOrder, fetchConversations, normalizeConversation } from '@/features/chat/services/chat.service';
import { useBlockUser, useUnblockUser } from '@/hooks/mutations/useBlockMutations';
import { ChatActionsSheet } from '@/features/chat/components/ChatActionsSheet';
import {
  chatBlockNotice,
  chatBlockState,
  isUserBlockedError,
  isUserBlockedSocketError,
  CHAT_BLOCKED_BY_ME_NOTICE,
  CHAT_BLOCKED_ME_NOTICE,
} from '@/features/chat/constants/chatBlockRules';
import { BlockedUsersScreen } from '@/features/users/screens/BlockedUsersScreen';
import { ERROR_MESSAGES } from '@/lib/error-messages';

const blocked = (id: string, over = {}) => ({
  id,
  firstName: `Nombre${id}`,
  lastName: 'Apellido',
  avatarUrl: null,
  blockedAt: '2026-11-01T10:00:00.000Z',
  ...over,
});
const page = (data: unknown[], p = 1, total = data.length, limit = 20) => ({ data, total, page: p, limit });
const conv = (orderId: string, otherId: string, over = {}) => ({
  id: `c-${orderId}`,
  orderId,
  otherParty: { id: otherId, firstName: 'Ana', role: 'provider', isVerified: true },
  unreadCount: 0,
  createdAt: '2026-11-01T10:00:00.000Z',
  ...over,
});

function makeClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } } });
}
function wrapperFor(qc: QueryClient) {
  return ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('block services', () => {
  it('blocks, unblocks and lists with the contract URLs', async () => {
    mockPost.mockResolvedValue({ data: undefined });
    mockDelete.mockResolvedValue({ data: undefined });
    mockGet.mockResolvedValue({ data: page([blocked('u1')], 2, 41, 20) });
    await blockUser('u1');
    await unblockUser('u1');
    const res = await fetchBlockedUsers(2, 20);
    expect(mockPost).toHaveBeenCalledWith('/users/u1/block');
    expect(mockDelete).toHaveBeenCalledWith('/users/u1/block');
    expect(mockGet).toHaveBeenCalledWith('/users/me/blocks', { params: { page: 2, limit: 20 } });
    expect(res).toMatchObject({ total: 41, page: 2, limit: 20 });
    expect(res.data[0].id).toBe('u1');
  });

  it('rejects a malformed blocks page', async () => {
    mockGet.mockResolvedValue({ data: { nope: true } });
    await expect(fetchBlockedUsers()).rejects.toThrow();
  });
});

describe('conversation block flags', () => {
  it('defaults to false when the backend does not send them', async () => {
    mockGet.mockResolvedValueOnce({ data: [conv('o1', 'u1')] });
    mockGet.mockResolvedValueOnce({ data: conv('o1', 'u1', { blockedMe: true }) });
    const list = await fetchConversations();
    expect(list[0]).toMatchObject({ blockedByMe: false, blockedMe: false });
    expect(await fetchConversationByOrder('o1')).toMatchObject({ blockedByMe: false, blockedMe: true });
    expect(normalizeConversation({ ...conv('o', 'u'), blockedByMe: true } as any).blockedByMe).toBe(true);
  });
});

describe('chat block rules', () => {
  it('maps flags to a state and a notice', () => {
    expect(chatBlockState(undefined)).toBeNull();
    expect(chatBlockState({})).toBeNull();
    expect(chatBlockState({ blockedByMe: true, blockedMe: true })).toBe('byMe');
    expect(chatBlockState({ blockedMe: true })).toBe('byOther');
    expect(chatBlockNotice('byMe')).toBe(CHAT_BLOCKED_BY_ME_NOTICE);
    expect(chatBlockNotice('byOther')).toBe(CHAT_BLOCKED_ME_NOTICE);
    expect(chatBlockNotice(null)).toBeNull();
  });

  it('detects only 403 USER_BLOCKED', () => {
    expect(isUserBlockedError({ response: { status: 403, data: { code: 'USER_BLOCKED' } } })).toBe(true);
    expect(isUserBlockedError({ response: { status: 403, data: { code: 'FORBIDDEN' } } })).toBe(false);
    expect(isUserBlockedError({ response: { status: 409, data: { code: 'USER_BLOCKED' } } })).toBe(false);
    expect(isUserBlockedError(new Error('x'))).toBe(false);
    expect(isUserBlockedSocketError({ code: 'USER_BLOCKED' })).toBe(true);
    expect(isUserBlockedSocketError({ code: 'ORDER_CLOSED' })).toBe(false);
  });

  it('has copy for the new error codes', () => {
    expect(ERROR_MESSAGES.USER_BLOCKED).toBeTruthy();
    expect(ERROR_MESSAGES.CANNOT_BLOCK_SELF).toBeTruthy();
  });
});

describe('block mutations', () => {
  const seed = (qc: QueryClient) => {
    qc.setQueryData(QUERY_KEYS.conversations, [conv('o1', 'u1'), conv('o2', 'u2')]);
    qc.setQueryData(QUERY_KEYS.conversationByOrder('o1'), conv('o1', 'u1'));
    qc.setQueryData(QUERY_KEYS.blockedUsers, {
      pages: [page([blocked('u1'), blocked('u2')], 1, 2)],
      pageParams: [1],
    });
  };

  it('block: flags the conversations optimistically and invalidates chat + list', async () => {
    const qc = makeClient();
    seed(qc);
    let release!: () => void;
    mockPost.mockReturnValue(new Promise((r) => { release = () => r({ data: undefined }); }));
    const invalidate = jest.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useBlockUser(), { wrapper: wrapperFor(qc) });

    act(() => { result.current.mutate('u1'); });
    await waitFor(() => {
      const list = qc.getQueryData<any[]>(QUERY_KEYS.conversations)!;
      expect(list[0].blockedByMe).toBe(true);
      expect(list[1].blockedByMe).toBeUndefined();
    });
    expect(qc.getQueryData<any>(QUERY_KEYS.conversationByOrder('o1')).blockedByMe).toBe(true);

    await act(async () => { release(); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockPost).toHaveBeenCalledWith('/users/u1/block');
    expect(invalidate).toHaveBeenCalledWith({ queryKey: QUERY_KEYS.conversations });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: QUERY_KEYS.blockedUsers });
  });

  it('block: rolls back when the request fails', async () => {
    const qc = makeClient();
    seed(qc);
    mockPost.mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useBlockUser(), { wrapper: wrapperFor(qc) });
    await act(async () => { result.current.mutate('u1'); });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(qc.getQueryData<any[]>(QUERY_KEYS.conversations)![0].blockedByMe).toBeUndefined();
    expect(qc.getQueryData<any>(QUERY_KEYS.conversationByOrder('o1')).blockedByMe).toBeUndefined();
  });

  it('unblock: clears the flag, removes the row, and puts the row back on failure', async () => {
    const qc = makeClient();
    seed(qc);
    qc.setQueryData(QUERY_KEYS.conversations, [conv('o1', 'u1', { blockedByMe: true }), conv('o2', 'u2')]);
    let fail!: (e: Error) => void;
    mockDelete.mockReturnValue(new Promise((_, rej) => { fail = rej; }));
    const { result } = renderHook(() => useUnblockUser(), { wrapper: wrapperFor(qc) });
    act(() => { result.current.mutate('u1'); });
    await waitFor(() => {
      const pages = qc.getQueryData<any>(QUERY_KEYS.blockedUsers).pages;
      expect(pages[0].data.map((u: any) => u.id)).toEqual(['u2']);
      expect(qc.getQueryData<any[]>(QUERY_KEYS.conversations)![0].blockedByMe).toBe(false);
    });
    await act(async () => { fail(new Error('boom')); });
    await waitFor(() => expect(result.current.isError).toBe(true));
    const pages = qc.getQueryData<any>(QUERY_KEYS.blockedUsers).pages;
    expect(pages[0].data.map((u: any) => u.id).sort()).toEqual(['u1', 'u2']);
    expect(qc.getQueryData<any[]>(QUERY_KEYS.conversations)![0].blockedByMe).toBe(true);
  });
});

describe('ChatActionsSheet', () => {
  const base = { visible: true, otherName: 'Ana Gómez', canReport: true, blockedByMe: false, onSelect: jest.fn(), onClose: jest.fn() };

  it('offers report and block by default', () => {
    const onSelect = jest.fn();
    const { getByLabelText, queryByLabelText } = render(<ChatActionsSheet {...base} onSelect={onSelect} />);
    expect(getByLabelText('Denunciar a Ana Gómez')).toBeTruthy();
    expect(getByLabelText('Bloquear usuario')).toBeTruthy();
    expect(queryByLabelText('Desbloquear usuario')).toBeNull();
    fireEvent.press(getByLabelText('Bloquear usuario'));
    expect(onSelect).toHaveBeenCalledWith('block');
    fireEvent.press(getByLabelText('Denunciar a Ana Gómez'));
    expect(onSelect).toHaveBeenLastCalledWith('report');
  });

  it('offers unblock when I already blocked them', () => {
    const onSelect = jest.fn();
    const { getByLabelText, queryByLabelText } = render(<ChatActionsSheet {...base} blockedByMe onSelect={onSelect} />);
    expect(queryByLabelText('Bloquear usuario')).toBeNull();
    fireEvent.press(getByLabelText('Desbloquear usuario'));
    expect(onSelect).toHaveBeenCalledWith('unblock');
  });

  it('hides report when it is not allowed', () => {
    const { queryByLabelText } = render(<ChatActionsSheet {...base} canReport={false} />);
    expect(queryByLabelText('Denunciar a Ana Gómez')).toBeNull();
  });
});

describe('BlockedUsersScreen', () => {
  const renderScreen = (qc = makeClient()) => ({ qc, ...render(<BlockedUsersScreen />, { wrapper: wrapperFor(qc) }) });

  it('shows a loading state, then the list', async () => {
    mockGet.mockResolvedValue({ data: page([blocked('u1'), blocked('u2')]) });
    const { getByLabelText, findByText } = renderScreen();
    expect(getByLabelText('Cargando')).toBeTruthy();
    expect(await findByText('Nombreu1 Apellido')).toBeTruthy();
    expect(await findByText('Nombreu2 Apellido')).toBeTruthy();
  });

  it('shows the empty state', async () => {
    mockGet.mockResolvedValue({ data: page([]) });
    const { findByText } = renderScreen();
    expect(await findByText('No has bloqueado a nadie')).toBeTruthy();
  });

  it('shows an error with retry', async () => {
    mockGet.mockRejectedValueOnce(new Error('offline'));
    mockGet.mockResolvedValueOnce({ data: page([blocked('u1')]) });
    const { findByText, getByText } = renderScreen();
    expect(await findByText('No pudimos cargar la lista')).toBeTruthy();
    fireEvent.press(getByText('Reintentar'));
    expect(await findByText('Nombreu1 Apellido')).toBeTruthy();
  });

  it('unblocks optimistically and brings the row back with a toast if it fails', async () => {
    mockGet.mockResolvedValue({ data: page([blocked('u1')]) });
    let fail!: (e: Error) => void;
    mockDelete.mockReturnValue(new Promise((_, rej) => { fail = rej; }));
    const { findByText, queryByText, getByLabelText } = renderScreen();
    await findByText('Nombreu1 Apellido');
    fireEvent.press(getByLabelText('Desbloquear a Nombreu1 Apellido'));
    await waitFor(() => expect(queryByText('Nombreu1 Apellido')).toBeNull());
    expect(mockDelete).toHaveBeenCalledWith('/users/u1/block');
    await act(async () => { fail(new Error('boom')); });
    expect(await findByText('Nombreu1 Apellido')).toBeTruthy();
    expect(mockToastError).toHaveBeenCalled();
  });
});
