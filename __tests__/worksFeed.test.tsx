import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

const mockPush = jest.fn();
const mockRefetch = jest.fn();
const mockFetchNext = jest.fn();
let mockFeed: any;
let mockIsProvider = false;
const mockCategoryCalls: Array<string | null> = [];

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('expo-router', () => ({
  router: { push: (...a: unknown[]) => mockPush(...a), back: jest.fn(), replace: jest.fn() },
}));
jest.mock('@/hooks/queries/useProfileQuery', () => ({ useIsProvider: () => mockIsProvider }));
jest.mock('@/hooks/queries/useMarketplaceQuery', () => ({
  useCategories: () => ({
    data: [
      { id: 'c1', name: 'Plomería' },
      { id: 'c2', name: 'Electricidad' },
    ],
  }),
}));
jest.mock('@/hooks/queries/useWorksQuery', () => ({
  ...jest.requireActual('@/hooks/queries/useWorksQuery'),
  useWorksFeed: (categoryId: string | null) => {
    mockCategoryCalls.push(categoryId);
    return mockFeed;
  },
}));

import WorksFeedScreen from '@/features/works/screens/WorksFeedScreen';

const item = (id: string) => ({
  id,
  imageUrl: `https://cdn.test/${id}.jpg`,
  thumbnailUrl: `https://cdn.test/${id}_t.jpg`,
  width: 1080,
  height: 1350,
  description: null,
  createdAt: '2026-11-03T12:00:00.000Z',
  likes: 0,
  service: { id: 's1', title: 'Baño completo', categoryId: 'c1', categoryName: 'Plomería' },
  provider: { id: 'p1', name: 'Ana Gómez', avatarUrl: null, rating: 4.8, isVerified: true },
});

const feedState = (over: Record<string, unknown> = {}) => ({
  data: { pages: [{ data: [], nextCursor: null }] },
  isPending: false,
  isError: false,
  hasNextPage: false,
  isFetchingNextPage: false,
  isRefetching: false,
  refetch: mockRefetch,
  fetchNextPage: mockFetchNext,
  ...over,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockCategoryCalls.length = 0;
  mockIsProvider = false;
  mockFeed = feedState();
});

describe('WorksFeedScreen', () => {
  it('shows a skeleton while loading', () => {
    mockFeed = feedState({ isPending: true, data: undefined });
    const { getByLabelText, queryByText } = render(<WorksFeedScreen />);
    expect(getByLabelText('Cargando trabajos')).toBeTruthy();
    expect(queryByText('Todavía no hay trabajos')).toBeNull();
  });

  it('shows a friendly empty state to clients, without a CTA', () => {
    const { getByText, queryByText } = render(<WorksFeedScreen />);
    expect(getByText('Todavía no hay trabajos')).toBeTruthy();
    expect(queryByText('Mis trabajos')).toBeNull();
  });

  it('invites providers to upload and opens Mis trabajos', () => {
    mockIsProvider = true;
    const { getByText } = render(<WorksFeedScreen />);
    expect(getByText('Subí tus primeros trabajos')).toBeTruthy();
    fireEvent.press(getByText('Mis trabajos'));
    expect(mockPush).toHaveBeenCalledWith('/(tabs)/profile/my-works');
  });

  it('adapts the empty message to the selected category and can go back to all', () => {
    const { getByText, queryByText } = render(<WorksFeedScreen />);
    fireEvent.press(getByText('Plomería'));
    expect(mockCategoryCalls[mockCategoryCalls.length - 1]).toBe('c1');
    expect(getByText('Sin trabajos en Plomería')).toBeTruthy();
    fireEvent.press(getByText('Ver todas'));
    expect(queryByText('Sin trabajos en Plomería')).toBeNull();
    expect(mockCategoryCalls[mockCategoryCalls.length - 1]).toBeNull();
  });

  it('shows an error state with retry', () => {
    mockFeed = feedState({ isError: true, data: undefined });
    const { getByText } = render(<WorksFeedScreen />);
    expect(getByText('No pudimos cargar los trabajos')).toBeTruthy();
    fireEvent.press(getByText('Reintentar'));
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('renders the photos and opens the detail on press', () => {
    mockFeed = feedState({ data: { pages: [{ data: [item('w1'), item('w2')], nextCursor: 'n' }] }, hasNextPage: true });
    const { getAllByRole } = render(<WorksFeedScreen />);
    const tiles = getAllByRole('button').filter((b) => /Baño completo, de Ana Gómez/.test(b.props.accessibilityLabel ?? ''));
    expect(tiles).toHaveLength(2);
    fireEvent.press(tiles[0]);
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/work/[id]', params: { id: 'w1' } });
  });

  it('asks for the next page near the end of the scroll', () => {
    mockFeed = feedState({ data: { pages: [{ data: [item('w1')], nextCursor: 'n' }] }, hasNextPage: true });
    const { UNSAFE_getAllByType } = render(<WorksFeedScreen />);
    const { ScrollView } = require('react-native');
    const vertical = UNSAFE_getAllByType(ScrollView).find((s: any) => !s.props.horizontal)!;
    fireEvent.scroll(vertical, {
      nativeEvent: { layoutMeasurement: { height: 800 }, contentOffset: { y: 900 }, contentSize: { height: 1800 } },
    });
    expect(mockFetchNext).toHaveBeenCalledTimes(1);
    expect(mockFetchNext).toHaveBeenCalledWith({ cancelRefetch: false });
  });

  it('does not page while a refetch (pull-to-refresh) is running', () => {
    mockFeed = feedState({
      data: { pages: [{ data: [item('w1')], nextCursor: 'n' }] },
      hasNextPage: true,
      isRefetching: true,
    });
    const { UNSAFE_getAllByType } = render(<WorksFeedScreen />);
    const { ScrollView } = require('react-native');
    const vertical = UNSAFE_getAllByType(ScrollView).find((s: any) => !s.props.horizontal)!;
    fireEvent.scroll(vertical, {
      nativeEvent: { layoutMeasurement: { height: 800 }, contentOffset: { y: 900 }, contentSize: { height: 1800 } },
    });
    expect(mockFetchNext).not.toHaveBeenCalled();
  });

  it('fetches the next page when the content is shorter than the viewport', () => {
    mockFeed = feedState({ data: { pages: [{ data: [item('w1')], nextCursor: 'n' }] }, hasNextPage: true });
    const { UNSAFE_getAllByType } = render(<WorksFeedScreen />);
    const { ScrollView } = require('react-native');
    const vertical = UNSAFE_getAllByType(ScrollView).find((s: any) => !s.props.horizontal)!;
    fireEvent(vertical, 'layout', { nativeEvent: { layout: { height: 900, width: 400, x: 0, y: 0 } } });
    fireEvent(vertical, 'contentSizeChange', 400, 300);
    expect(mockFetchNext).toHaveBeenCalledWith({ cancelRefetch: false });
  });
});
