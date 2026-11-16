import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() },
  useLocalSearchParams: () => ({}),
  useFocusEffect: (cb: () => void) => { const R = require('react'); R.useEffect(cb, []); },
}));
jest.mock('@/components/AnimatedBackground', () => ({ AnimatedBackground: () => null }));
jest.mock('@/hooks/queries/useProfileQuery', () => ({
  useIsProvider: () => false,
  useProfile: () => ({ data: { id: 'u1' } }),
}));

const mockUseOrders = jest.fn();
jest.mock('@/features/orders/state/OrdersContext', () => ({ useOrders: () => mockUseOrders() }));

const mockFetchConversations = jest.fn();
jest.mock('@/features/chat/services/chat.service', () => ({
  ...jest.requireActual('@/features/chat/services/chat.service'),
  fetchConversations: (...a: unknown[]) => mockFetchConversations(...a),
}));

import OrdersListScreen from '@/features/orders/screens/OrdersListScreen';
import ConversationsListScreen from '@/features/chat/screens/ConversationsListScreen';
import { getLoadErrorMessage } from '@/lib/errors';

const serverError = Object.assign(new Error('boom'), { isAxiosError: true, response: { status: 500 } });
const offlineError = Object.assign(new Error('Network Error'), { isAxiosError: true, code: 'ERR_NETWORK' });

const ordersState = (over: Record<string, unknown> = {}) => ({
  clientOrders: [], providerOrders: [], loading: false,
  loadClientOrders: jest.fn(), loadProviderOrders: jest.fn(),
  clientHasMore: false, providerHasMore: false, clientLoadingMore: false, providerLoadingMore: false,
  clientFetching: false, providerFetching: false, clientMoreError: false, providerMoreError: false,
  loadMoreClientOrders: jest.fn(), loadMoreProviderOrders: jest.fn(),
  clientError: null, providerError: null,
  ...over,
});

describe('OrdersListScreen error state', () => {
  it('shows the mapped message with retry when the list fails to load', () => {
    const state = ordersState({ clientError: serverError });
    mockUseOrders.mockReturnValue(state);
    const { getByText } = render(<OrdersListScreen />);
    expect(getByText(getLoadErrorMessage(serverError))).toBeTruthy();
    state.loadClientOrders.mockClear();
    fireEvent.press(getByText('Reintentar'));
    expect(state.loadClientOrders).toHaveBeenCalledTimes(1);
  });

  it('only mentions the connection when the error is offline', () => {
    mockUseOrders.mockReturnValue(ordersState({ clientError: serverError }));
    const server = render(<OrdersListScreen />);
    expect(server.queryByText(/conexión/)).toBeNull();
    server.unmount();

    mockUseOrders.mockReturnValue(ordersState({ clientError: offlineError }));
    const offline = render(<OrdersListScreen />);
    expect(offline.getByText(/conexión/)).toBeTruthy();
  });

  it('keeps the empty state when there is no error', () => {
    mockUseOrders.mockReturnValue(ordersState());
    const { getByText, queryByText } = render(<OrdersListScreen />);
    expect(getByText('Todavía no pediste nada')).toBeTruthy();
    expect(queryByText('Reintentar')).toBeNull();
  });
});

describe('ConversationsListScreen error state', () => {
  beforeEach(() => jest.spyOn(console, 'error').mockImplementation(() => {}));
  afterEach(() => jest.restoreAllMocks());

  it('shows the mapped message and retries', async () => {
    mockFetchConversations.mockRejectedValueOnce(serverError);
    const { findByText, getByText } = render(<ConversationsListScreen />);
    expect(await findByText(getLoadErrorMessage(serverError))).toBeTruthy();
    mockFetchConversations.mockResolvedValueOnce([]);
    fireEvent.press(getByText('Reintentar'));
    await waitFor(() => expect(mockFetchConversations).toHaveBeenCalledTimes(2));
  });
});
