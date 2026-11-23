import React from 'react';
import { fireEvent, render, renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockReplace = jest.fn();
const mockAddOrder = jest.fn().mockResolvedValue({ id: 'o1' });
const mockToastError = jest.fn();
const mockFetchOrder = jest.fn();
const mockAccept = jest.fn();

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('expo-router', () => ({
  router: { replace: (...a: unknown[]) => mockReplace(...a), back: jest.fn(), push: jest.fn() },
  useLocalSearchParams: () => ({ serviceId: 's1' }),
}));
jest.mock('@/components/AnimatedBackground', () => ({ AnimatedBackground: () => null }));
jest.mock('@/core/navigation/safeBack', () => ({ safeBack: jest.fn() }));
jest.mock('@/features/orders/state/OrdersContext', () => ({
  useOrders: () => ({ addOrder: mockAddOrder }),
}));
jest.mock('@/core/components/Toast', () => ({
  toast: { error: (...a: unknown[]) => mockToastError(...a), success: jest.fn(), warning: jest.fn() },
}));
jest.mock('@/features/orders/services/orders.service', () => ({
  fetchOrdersAsClient: jest.fn(),
  fetchOrdersAsProvider: jest.fn(),
  fetchOrderById: (...a: unknown[]) => mockFetchOrder(...a),
  createOrder: jest.fn(),
  acceptOrder: (...a: unknown[]) => mockAccept(...a),
  rejectOrder: jest.fn(),
  startOrder: jest.fn(),
  markOrderDone: jest.fn(),
  confirmOrder: jest.fn(),
  cancelOrder: jest.fn(),
  disputeOrder: jest.fn(),
}));
jest.mock('@/core/design-system', () => {
  const actual = jest.requireActual('@/core/design-system');
  return {
    ...actual,
    dialog: {
      ...actual.dialog,
      fromAlert: (_t: string, _m: string, buttons?: Array<{ onPress?: () => void }>) => buttons?.[0]?.onPress?.(),
    },
  };
});

import QuoteRequestScreen from '@/features/orders/screens/QuoteRequestScreen';
import { useAcceptOrder, useOrder } from '@/hooks/queries/useOrdersQuery';
import { QUERY_KEYS } from '@/core/query/queryKeys';
import { useChatStore } from '@/stores/chat.store';

const wrapper = (qc: QueryClient) =>
  function W({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };

beforeEach(() => jest.clearAllMocks());

describe('T7 quote redirect', () => {
  it('lands on the client segment after sending the quote', async () => {
    const { getByPlaceholderText, getByText } = render(<QuoteRequestScreen />);
    fireEvent.changeText(getByPlaceholderText(/Necesito una instalación/), 'Necesito ayuda');
    fireEvent.press(getByText('Enviar solicitud'));
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/(tabs)/orders?tab=client'));
  });
});

describe('T5 single error surface', () => {
  it('the mutation hook does not toast; the screen owns the error', async () => {
    mockAccept.mockRejectedValue(new Error('boom'));
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    const { result } = renderHook(() => useAcceptOrder(), { wrapper: wrapper(qc) });
    await act(async () => { await result.current.mutateAsync('o1').catch(() => {}); });
    expect(mockToastError).not.toHaveBeenCalled();
  });
});

describe('T6 order detail refetch', () => {
  it('refetches on mount even when the cached order is fresh', async () => {
    mockFetchOrder.mockResolvedValue({ id: 'o1', status: 'accepted' });
    const qc = new QueryClient({ defaultOptions: { queries: { staleTime: 120000, retry: false } } });
    qc.setQueryData(QUERY_KEYS.orderById('o1'), { id: 'o1', status: 'pending' });
    const { result } = renderHook(() => useOrder('o1'), { wrapper: wrapper(qc) });
    expect(result.current.isLoading).toBe(false); // cached data shown, no loading flicker
    await waitFor(() => expect(mockFetchOrder).toHaveBeenCalledWith('o1'));
    await waitFor(() => expect((qc.getQueryData(QUERY_KEYS.orderById('o1')) as { status: string }).status).toBe('accepted'));
  });
});

describe('T8 chat unread', () => {
  it('clearConversationUnread zeroes the conversation and lowers the total', () => {
    useChatStore.setState({
      conversations: [{ id: 'c1', unreadCount: 3 }, { id: 'c2', unreadCount: 2 }] as never,
      unreadTotal: 5,
    });
    useChatStore.getState().clearConversationUnread('c1');
    const s = useChatStore.getState();
    expect(s.conversations.map((c) => c.unreadCount)).toEqual([0, 2]);
    expect(s.unreadTotal).toBe(2);
    useChatStore.getState().clearConversationUnread('missing');
    expect(useChatStore.getState().unreadTotal).toBe(2);
  });
});
