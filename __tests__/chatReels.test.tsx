import React from 'react';
import * as fs from 'fs';
import * as path from 'path';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { useThemeStore } from '@/stores/theme.store';
import { useChatStore } from '@/stores/chat.store';

const mockPush = jest.fn();
const mockFetchConversations = jest.fn();
const mockRefetchMyReels = jest.fn();
let mockMyReels: any = { data: [], isLoading: false, isError: false, isFetching: false, refetch: mockRefetchMyReels };

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('expo-router', () => {
  const R = require('react');
  return {
    router: { push: (...a: any[]) => mockPush(...a), replace: jest.fn(), back: jest.fn() },
    useFocusEffect: (cb: () => void) => { R.useEffect(() => { cb(); }, []); },
  };
});
jest.mock('@/core/navigation/safeBack', () => ({ safeBack: jest.fn() }));
jest.mock('@/components/AnimatedBackground', () => ({ AnimatedBackground: () => null }));
jest.mock('@/features/chat/services/chat.service', () => ({
  fetchConversations: (...a: any[]) => mockFetchConversations(...a),
}));
jest.mock('@/hooks/queries/useProfileQuery', () => ({ useProfile: () => ({ data: { id: 'me' } }) }));
jest.mock('@/hooks/useRequireProviderStatus', () => ({ useRequireProviderStatus: jest.fn() }));
jest.mock('@/hooks/queries/useReelsQuery', () => ({
  useMyReels: () => mockMyReels,
  useUpdateReel: () => ({ mutateAsync: jest.fn(), isPending: false }),
  useDeleteReel: () => ({ mutateAsync: jest.fn(), isPending: false }),
}));

import ConversationsListScreen from '@/features/chat/screens/ConversationsListScreen';
import MyReelsScreen from '@/features/reels/screens/MyReelsScreen';

const setMode = (mode: 'dark' | 'light') => act(() => { useThemeStore.getState().setMode(mode); });

const conversation = (over: any = {}) => ({
  id: 'c1',
  orderId: 'o1',
  createdAt: '2026-01-05T10:00:00Z',
  unreadCount: 2,
  otherParty: { firstName: 'Ana', lastName: 'Gómez', avatarUrl: null },
  lastMessage: { content: 'Hola', createdAt: '2026-01-05T10:00:00Z' },
  ...over,
});

describe.each(['dark', 'light'] as const)('chat and reels screens (%s)', (mode) => {
  beforeEach(() => {
    jest.clearAllMocks();
    setMode(mode);
    act(() => { useChatStore.setState({ conversations: [], unreadTotal: 0 } as any); });
    mockMyReels = { data: [], isLoading: false, isError: false, isFetching: false, refetch: mockRefetchMyReels };
  });
  afterAll(() => setMode('dark'));

  describe('ConversationsListScreen', () => {
    it('shows an error with retry when the first load fails', async () => {
      mockFetchConversations.mockRejectedValueOnce(new Error('boom'));
      jest.spyOn(console, 'error').mockImplementation(() => {});
      const { findByText } = render(<ConversationsListScreen />);
      expect(await findByText('No pudimos cargar tus mensajes', {}, { timeout: 5000 })).toBeTruthy();
      mockFetchConversations.mockResolvedValueOnce([]);
      fireEvent.press(await findByText('Reintentar'));
      await waitFor(() => expect(mockFetchConversations).toHaveBeenCalledTimes(2));
    });

    it('shows the empty state when there are no conversations', async () => {
      mockFetchConversations.mockResolvedValueOnce([]);
      const { findByText } = render(<ConversationsListScreen />);
      expect(await findByText('Sin mensajes todavía')).toBeTruthy();
    });

    it('lists conversations with an accessible label that includes the unread count', async () => {
      mockFetchConversations.mockResolvedValueOnce([conversation()]);
      const { findByLabelText } = render(<ConversationsListScreen />);
      const row = await findByLabelText('Chat con Ana Gómez, 2 sin leer. Hola');
      fireEvent.press(row);
      expect(mockPush).toHaveBeenCalledWith({ pathname: '/chat/[id]', params: { id: 'o1' } });
    });

    it('does not show the refresh warning when the load succeeds', async () => {
      mockFetchConversations.mockResolvedValueOnce([conversation()]);
      const { findByLabelText, queryByText } = render(<ConversationsListScreen />);
      await findByLabelText('Chat con Ana Gómez, 2 sin leer. Hola');
      expect(queryByText(/No pudimos actualizar tus mensajes/)).toBeNull();
    });
  });

  describe('MyReelsScreen', () => {
    it('shows an error with retry when reels fail to load', () => {
      mockMyReels = { ...mockMyReels, isError: true };
      const { getByText } = render(<MyReelsScreen />);
      expect(getByText('No pudimos cargar tus reels')).toBeTruthy();
      fireEvent.press(getByText('Reintentar'));
      expect(mockRefetchMyReels).toHaveBeenCalledTimes(1);
    });

    it('offers a call to action when there are no reels', () => {
      const { getByText } = render(<MyReelsScreen />);
      fireEvent.press(getByText('Publicar un reel'));
      expect(mockPush).toHaveBeenCalledWith('/(tabs)/profile/upload-reel');
    });

    it('labels the icon-only buttons', () => {
      const { getByLabelText } = render(<MyReelsScreen />);
      expect(getByLabelText('Volver')).toBeTruthy();
      expect(getByLabelText('Publicar reel')).toBeTruthy();
    });

    it('describes each reel tile for screen readers', () => {
      mockMyReels = {
        ...mockMyReels,
        data: [{ id: 'r1', type: 'video', videoUrl: 'https://x/v.mp4', likes: 3, comments: 1, tags: [], description: 'd', user: { id: 'u' } }],
      };
      const { getByLabelText } = render(<MyReelsScreen />);
      expect(getByLabelText('Editar reel, 3 me gusta, 1 comentarios')).toBeTruthy();
    });
  });
});

describe('chat and reels have no hard-coded design literals', () => {
  const repo = path.resolve(__dirname, '..');
  const raw = /#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|fontFamily\s*:\s*['"`]/;
  const named = /[cC]olor\s*[:=]\s*\{?\s*['"](?!transparent['"])[a-z]+['"]|tint\s*[:=]\s*\{?\s*['"][a-z]+['"]/;
  const stripComments = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

  const walk = (dir: string): string[] =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const p = path.join(dir, e.name);
      return e.isDirectory() ? walk(p) : /\.tsx?$/.test(e.name) ? [p] : [];
    });

  const files = [
    ...walk(path.join(repo, 'src/features/chat')),
    ...walk(path.join(repo, 'src/features/reels')),
    ...walk(path.join(repo, 'app/chat')),
    path.join(repo, 'app/(tabs)/chat.tsx'),
    path.join(repo, 'app/(tabs)/reels.tsx'),
    path.join(repo, 'app/(tabs)/profile/my-reels.tsx'),
    path.join(repo, 'app/(tabs)/profile/upload-reel.tsx'),
  ];

  it('finds the files', () => {
    expect(files.length).toBeGreaterThan(14);
  });

  it.each(files.map((f) => [path.relative(repo, f).replace(/\\/g, '/'), f]))('%s', (rel, abs) => {
    const src = stripComments(fs.readFileSync(abs, 'utf8'));
    expect({ file: rel, raw: raw.exec(src)?.[0] ?? null }).toEqual({ file: rel, raw: null });
    expect({ file: rel, named: named.exec(src)?.[0] ?? null }).toEqual({ file: rel, named: null });
  });
});
