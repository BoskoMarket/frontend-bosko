import React from 'react';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { act, fireEvent, render } from '@testing-library/react-native';
import { CustomTabBar, getTabLabel, getVisibleRoutes, shouldShowTabBar } from '@/components/CustomTabBar';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('react-native-svg', () => {
  const { View } = require('react-native');
  return { __esModule: true, default: View, Path: View };
});

const mockUnread = jest.fn();
const mockIsProvider = jest.fn();
const mockPending = jest.fn();
jest.mock('@/hooks/queries/useOrdersQuery', () => ({
  usePendingProviderRequestsCount: (enabled: boolean) => (enabled ? mockPending() : 0),
}));
jest.mock('@/stores/chat.store', () => ({ useUnreadTotal: () => mockUnread() }));
jest.mock('@/hooks/queries/useProfileQuery', () => ({ useIsProvider: () => mockIsProvider() }));

const ORDER = ['index', 'reels', 'orders', 'chat', 'profile', 'services'];

function makeProps(
  focusedName: string,
  hidden: string[] = ['services'],
  nested: Record<string, { index: number }> = {},
) {
  const routes = ORDER.map((name) => ({ key: `${name}-key`, name, ...(nested[name] ? { state: nested[name] } : {}) }));
  const descriptors: Record<string, { options: { href?: null } }> = {};
  routes.forEach((r) => {
    descriptors[r.key] = { options: hidden.includes(r.name) ? { href: null } : {} };
  });
  const navigation = {
    emit: jest.fn(() => ({ defaultPrevented: false })),
    navigate: jest.fn(),
    dispatch: jest.fn(),
  };
  return {
    props: {
      state: { index: ORDER.indexOf(focusedName), routes, key: 'tab', routeNames: ORDER, type: 'tab', stale: false },
      descriptors,
      navigation,
    } as unknown as BottomTabBarProps,
    navigation,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockUnread.mockReturnValue(0);
  mockIsProvider.mockReturnValue(false);
  mockPending.mockReturnValue(0);
});

describe('CustomTabBar', () => {
  it('renders five labeled tabs in order and skips the hidden services route', () => {
    const { props } = makeProps('index');
    const { getAllByRole, queryByText } = render(<CustomTabBar {...props} />);
    const tabs = getAllByRole('tab');
    expect(tabs.map((t) => t.props.accessibilityLabel)).toEqual(['Inicio', 'Reels', 'Pedidos', 'Mensajes', 'Perfil']);
    expect(queryByText('Servicios')).toBeNull();
  });

  it('marks only the focused tab as selected', () => {
    const { props } = makeProps('chat');
    const { getAllByRole } = render(<CustomTabBar {...props} />);
    const selected = getAllByRole('tab').filter((t) => t.props.accessibilityState?.selected);
    expect(selected).toHaveLength(1);
    expect(selected[0].props.accessibilityLabel).toBe('Mensajes');
  });

  it('labels Pedidos as Órdenes for providers', () => {
    mockIsProvider.mockReturnValue(true);
    const { props } = makeProps('index');
    const { getByText, queryByText } = render(<CustomTabBar {...props} />);
    expect(getByText('Órdenes')).toBeTruthy();
    expect(queryByText('Pedidos')).toBeNull();
  });

  it('announces the unread count on Mensajes', () => {
    mockUnread.mockReturnValue(3);
    const { props } = makeProps('index');
    const { getByLabelText } = render(<CustomTabBar {...props} />);
    expect(getByLabelText('Mensajes, 3 sin leer')).toBeTruthy();
  });

  it('announces pending requests on Órdenes for providers only', () => {
    mockPending.mockReturnValue(2);
    mockIsProvider.mockReturnValue(true);
    const { props } = makeProps('index');
    const { getByLabelText, getByText, unmount } = render(<CustomTabBar {...props} />);
    expect(getByLabelText('Órdenes, 2 pendientes')).toBeTruthy();
    expect(getByText('2')).toBeTruthy();
    unmount();

    mockIsProvider.mockReturnValue(false);
    const second = render(<CustomTabBar {...props} />);
    expect(second.queryByLabelText(/pendientes/)).toBeNull();
    expect(second.getByLabelText('Pedidos')).toBeTruthy();
  });

  it('navigates to the route behind the pressed visible tab', () => {
    const { props, navigation } = makeProps('index');
    const { getByLabelText } = render(<CustomTabBar {...props} />);
    fireEvent.press(getByLabelText('Perfil'));
    expect(navigation.navigate).toHaveBeenCalledWith('profile', undefined);
  });

  it('renders nothing while a hidden route (services) is focused', () => {
    const { props } = makeProps('services');
    const { queryAllByRole } = render(<CustomTabBar {...props} />);
    expect(queryAllByRole('tab')).toHaveLength(0);
  });

  it('renders nothing on a nested profile screen and returns at the stack root', () => {
    const nested = render(<CustomTabBar {...makeProps('profile', ['services'], { profile: { index: 1 } }).props} />);
    expect(nested.queryAllByRole('tab')).toHaveLength(0);
    nested.unmount();
    const root = render(<CustomTabBar {...makeProps('profile', ['services'], { profile: { index: 0 } }).props} />);
    expect(root.getAllByRole('tab')).toHaveLength(5);
  });
});

describe('tab helpers', () => {
  it('shouldShowTabBar only shows the bar on visible tab roots', () => {
    const show = (name: string, nested: Record<string, { index: number }> = {}) => {
      const { props } = makeProps(name, ['services'], nested);
      return shouldShowTabBar(props.state, props.descriptors);
    };
    expect(show('profile', { profile: { index: 0 } })).toBe(true);
    expect(show('profile', { profile: { index: 1 } })).toBe(false);
    expect(show('profile')).toBe(true);
    expect(show('services')).toBe(false);
    expect(show('services', { services: { index: 0 } })).toBe(false);
    expect(show('reels')).toBe(true);
  });

  it('getVisibleRoutes drops routes without a TABS entry or with href null', () => {
    const { props } = makeProps('index', ['services', 'reels']);
    expect(getVisibleRoutes(props.state, props.descriptors).map((v) => v.route.name)).toEqual(['index', 'orders', 'chat', 'profile']);
  });

  it('getTabLabel resolves role-aware labels', () => {
    expect(getTabLabel('orders', false)).toBe('Pedidos');
    expect(getTabLabel('orders', true)).toBe('Órdenes');
    expect(getTabLabel('profile', true)).toBe('Perfil');
  });
});

describe('tabs layout', () => {
  const layout = require('fs').readFileSync(
    require('path').resolve(__dirname, '../app/(tabs)/_layout.tsx'),
    'utf8',
  ) as string;

  it('declares the visible tabs in bar order and hides services', () => {
    const names = [...layout.matchAll(/<Tabs\.Screen name="(\w+)"/g)].map((m) => m[1]);
    expect(names).toEqual(['index', 'reels', 'orders', 'chat', 'profile', 'services']);
    expect(layout).toMatch(/name="services"[^>]*href: null/);
  });
});

describe('CustomTabBar bubble icon', () => {
  const opacityOf = (node: any) => {
    const { StyleSheet } = require('react-native');
    return StyleSheet.flatten(node.props.style).opacity;
  };
  const settle = () => act(() => { jest.runAllTimers(); });

  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('hides the bar icon under the bubble (after animations settle)', () => {
    const { props } = makeProps('reels');
    const { getByTestId } = render(<CustomTabBar {...props} />);
    settle();
    expect(opacityOf(getByTestId('tab-icon-reels'))).toBe(0);
    expect(opacityOf(getByTestId('tab-icon-index'))).toBe(0.55);
  });

});
