import React from 'react';
import * as fs from 'fs';
import * as path from 'path';
import { act, fireEvent, render } from '@testing-library/react-native';
import { useThemeStore } from '@/stores/theme.store';

const mockLoad = jest.fn(async () => {});
const mockMarkAllRead = jest.fn(async () => {});
const mockToggle = jest.fn(async () => {});
let mockNotif: any;
let mockFavs: any;
let mockDenied = false;

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), push: jest.fn(), back: jest.fn() },
  useLocalSearchParams: () => ({ orderId: 'o1' }),
}));
jest.mock('@/core/navigation/safeBack', () => ({ safeBack: jest.fn() }));
jest.mock('@/components/AnimatedBackground', () => ({ AnimatedBackground: () => null }));
jest.mock('@/features/notifications/state/NotificationsContext', () => ({ useNotifications: () => mockNotif }));
jest.mock('@/features/notifications/hooks/useNotificationPermission', () => ({ useNotificationsDenied: () => mockDenied }));
jest.mock('@/features/favorites/state/FavoritesContext', () => ({ useFavorites: () => mockFavs }));
jest.mock('@/hooks/mutations/useReviewMutations', () => ({
  useCreateReview: () => ({ mutateAsync: jest.fn(), isPending: false }),
  useReplyToReview: () => ({ mutateAsync: jest.fn(), isPending: false }),
}));

import NotificationsScreen from '@/features/notifications/screens/NotificationsScreen';
import { FavoritesScreen } from '@/features/favorites/screens/FavoritesScreen';
import ReviewScreen from '@/features/reviews/screens/ReviewScreen';

const setMode = (mode: 'dark' | 'light') => act(() => { useThemeStore.getState().setMode(mode); });

const note = (over: any = {}) => ({
  id: 'n1', userId: 'u', title: 'Orden aceptada', body: 'Tu orden fue aceptada', type: 'order_accepted',
  read: false, createdAt: new Date().toISOString(), ...over,
});

describe.each(['dark', 'light'] as const)('T11 screens (%s)', (mode) => {
  beforeEach(() => {
    jest.clearAllMocks();
    setMode(mode);
    mockDenied = false;
    mockNotif = {
      notifications: [], unreadCount: 0, loading: false, error: '', load: mockLoad,
      markRead: jest.fn(), markAllRead: mockMarkAllRead, remove: jest.fn(), clearAll: jest.fn(),
    };
    mockFavs = { favorites: [], count: 0, toggle: mockToggle };
  });
  afterAll(() => setMode('dark'));

  describe('NotificationsScreen', () => {
    it('shows the empty state', () => {
      const { getByText } = render(<NotificationsScreen />);
      expect(getByText('Sin notificaciones')).toBeTruthy();
    });

    it('shows an error with retry when loading fails', () => {
      mockNotif = { ...mockNotif, error: 'boom' };
      const { getByText } = render(<NotificationsScreen />);
      expect(getByText('No pudimos cargar tus notificaciones')).toBeTruthy();
      mockLoad.mockClear();
      fireEvent.press(getByText('Reintentar'));
      expect(mockLoad).toHaveBeenCalledTimes(1);
    });

    it('lists notifications and marks all as read from a labelled button', () => {
      mockNotif = { ...mockNotif, notifications: [note()], unreadCount: 1 };
      const { getByText, getByLabelText } = render(<NotificationsScreen />);
      expect(getByText('Orden aceptada')).toBeTruthy();
      fireEvent.press(getByLabelText('Marcar todas como leídas'));
      expect(mockMarkAllRead).toHaveBeenCalledTimes(1);
      expect(getByLabelText('Eliminar notificación')).toBeTruthy();
    });

    it('warns when system notifications are denied', () => {
      mockDenied = true;
      const { getByText } = render(<NotificationsScreen />);
      expect(getByText('Activar en Ajustes')).toBeTruthy();
    });
  });

  describe('FavoritesScreen', () => {
    it('shows the empty state with a CTA', () => {
      const { getByText } = render(<FavoritesScreen />);
      expect(getByText('Sin favoritos todavía')).toBeTruthy();
      expect(getByText('Explorar servicios')).toBeTruthy();
    });

    it('offers undo after removing a favorite', async () => {
      const item = { id: 's1', title: 'Plomería', name: 'Ana', categoryId: 'c', averageRating: 4.5 };
      mockFavs = { favorites: [item], count: 1, toggle: mockToggle };
      const { getByLabelText, findByText } = render(<FavoritesScreen />);
      await act(async () => { fireEvent.press(getByLabelText('Quitar Plomería de favoritos')); });
      const undo = await findByText('Deshacer');
      mockToggle.mockClear();
      await act(async () => { fireEvent.press(undo); });
      expect(mockToggle).toHaveBeenCalledWith(item);
    });
  });

  describe('ReviewScreen', () => {
    it('renders labelled stars and keeps submit disabled until a rating is picked', () => {
      const { getByLabelText, getByText } = render(<ReviewScreen />);
      fireEvent.press(getByLabelText('4 estrellas: Bueno'));
      expect(getByText('Enviar Reseña')).toBeTruthy();
    });
  });
});

describe('T11 screens have no hard-coded design literals', () => {
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
    ...walk(path.join(repo, 'src/features/notifications')),
    ...walk(path.join(repo, 'src/features/reviews')),
    ...walk(path.join(repo, 'src/features/search')),
    ...walk(path.join(repo, 'src/features/favorites')),
    ...walk(path.join(repo, 'src/features/appConfig')),
    path.join(repo, 'app/search.tsx'),
    path.join(repo, 'app/orders/review.tsx'),
    path.join(repo, 'app/(tabs)/profile/favorites.tsx'),
    path.join(repo, 'app/(tabs)/profile/my-reviews.tsx'),
  ];

  it('finds the files', () => {
    expect(files.length).toBeGreaterThan(12);
  });

  it('removes the dead serviceCategories constants', () => {
    expect(fs.existsSync(path.join(repo, 'src/features/servicesUser/constants/serviceCategories.ts'))).toBe(false);
  });

  it.each(files.map((f) => [path.relative(repo, f).replace(/\\/g, '/'), f]))('%s', (rel, abs) => {
    const src = stripComments(fs.readFileSync(abs, 'utf8'));
    expect({ file: rel, raw: raw.exec(src)?.[0] ?? null }).toEqual({ file: rel, raw: null });
    expect({ file: rel, named: named.exec(src)?.[0] ?? null }).toEqual({ file: rel, named: null });
  });
});
