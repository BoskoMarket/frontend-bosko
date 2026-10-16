import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { StackActions } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUnreadTotal } from '@/stores/chat.store';
import { useIsProvider } from '@/hooks/queries/useProfileQuery';
import { usePendingProviderRequestsCount } from '@/hooks/queries/useOrdersQuery';
import { TOKENS, useThemeColors, withAlpha, FONT_FAMILY, Text as DSText } from '@/core/design-system';
import type { ThemeColors } from '@/core/design-system';

// ── Constants ─────────────────────────────────────────────────────────────────
const BAR_H   = 64;
const BAR_R   = 26;
const BUBBLE  = 54;
const BR      = BUBBLE / 2;
const NOTCH_W = BR + 6;
const NOTCH_D = BR + 4;   // deeper than BR so notch fully receives bubble
const EASE    = 20;
const LIFT    = BR;       // center of bubble sits at bar top edge

const SPRING = { tension: 120, friction: 10, useNativeDriver: true };

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const TABS: Record<string, { icon: IconName; active: IconName; label: string }> = {
  index:    { icon: 'home-outline',                active: 'home',                label: 'Inicio'    },
  orders:   { icon: 'receipt-outline',             active: 'receipt',             label: 'Pedidos'   },
  reels:    { icon: 'play-circle-outline',         active: 'play-circle',         label: 'Reels'     },
  chat:     { icon: 'chatbubble-ellipses-outline', active: 'chatbubble-ellipses', label: 'Mensajes'  },
  profile:  { icon: 'person-outline',              active: 'person',              label: 'Perfil'    },
};

// ── SVG path ──────────────────────────────────────────────────────────────────
function buildPath(W: number, cx: number): string {
  if (W <= 0) return '';
  const lx = cx - NOTCH_W;
  const rx = cx + NOTCH_W;
  const la = Math.max(lx - EASE, BAR_R);
  const ra = Math.min(rx + EASE, W - BAR_R);
  return (
    `M ${BAR_R} 0 L ${la} 0 ` +
    `C ${lx} 0 ${lx} ${NOTCH_D} ${cx} ${NOTCH_D} ` +
    `C ${rx} ${NOTCH_D} ${rx} 0 ${ra} 0 ` +
    `L ${W - BAR_R} 0 Q ${W} 0 ${W} ${BAR_R} ` +
    `L ${W} ${BAR_H - BAR_R} Q ${W} ${BAR_H} ${W - BAR_R} ${BAR_H} ` +
    `L ${BAR_R} ${BAR_H} Q 0 ${BAR_H} 0 ${BAR_H - BAR_R} ` +
    `L 0 ${BAR_R} Q 0 0 ${BAR_R} 0 Z`
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
/**
 * Routes that get a slot in the bar: they have a TABS entry and are not hidden
 * with `href: null` (hidden routes stay navigable, e.g. the services catalog).
 * Each entry keeps its navigator route index so presses target the right route.
 */
export function getVisibleRoutes(
  state: BottomTabBarProps['state'],
  descriptors: BottomTabBarProps['descriptors'],
) {
  return state.routes
    .map((route, routeIndex) => ({ route, routeIndex }))
    .filter(({ route }) => {
      if (!TABS[route.name]) return false;
      const href = (descriptors[route.key]?.options as { href?: string | null } | undefined)?.href;
      return href !== null;
    });
}

/** Label shown under each tab; "Pedidos" reads "Órdenes" for providers. */
export function getTabLabel(routeName: string, isProvider: boolean): string {
  if (routeName === 'orders' && isProvider) return 'Órdenes';
  return TABS[routeName]?.label ?? '';
}

export function CustomTabBar({ state, navigation, descriptors }: BottomTabBarProps) {
  const unread = useUnreadTotal();
  const isProvider = useIsProvider();
  const pendingRequests = usePendingProviderRequestsCount(isProvider);
  const insets   = useSafeAreaInsets();
  const tc = useThemeColors();
  const styles = useMemo(() => createStyles(tc), [tc]);
  const [barW, setBarW] = useState(Dimensions.get('window').width - 32);

  const visible = useMemo(() => getVisibleRoutes(state, descriptors), [state, descriptors]);
  // Position of the focused route among visible tabs. On a hidden route (e.g. the
  // services catalog) keep the pill where it was instead of jumping.
  const lastVisibleIndex = useRef(0);
  const focusedVisible = visible.findIndex(v => v.routeIndex === state.index);
  if (focusedVisible >= 0) lastVisibleIndex.current = focusedVisible;
  const activeIndex = lastVisibleIndex.current;

  const tabCount = visible.length;
  const tabW     = barW / Math.max(1, tabCount);
  const getCx    = (idx: number) => idx * tabW + tabW / 2;

  // Bubble translateX — react-native Animated (works in Expo Go)
  const bubbleAnim = useRef(new Animated.Value(getCx(activeIndex) - BR)).current;

  // SVG path updated in JS (no reanimated needed)
  const [pathD, setPathD] = useState(() => buildPath(barW, getCx(activeIndex)));

  // Interpolate notch position alongside bubble for smooth SVG update
  const notchAnim = useRef(new Animated.Value(getCx(activeIndex))).current;

  useEffect(() => {
    const cx = getCx(activeIndex);
    Animated.spring(bubbleAnim, { toValue: cx - BR, ...SPRING }).start();
    Animated.spring(notchAnim,  { toValue: cx,      ...SPRING }).start();
  }, [activeIndex, tabW]);

  // Drive SVG path from notchAnim listener
  useEffect(() => {
    const id = notchAnim.addListener(({ value }) => {
      setPathD(buildPath(barW, value));
    });
    return () => notchAnim.removeListener(id);
  }, [barW]);

  // Reset on barW change
  useEffect(() => {
    const cx = getCx(activeIndex);
    bubbleAnim.setValue(cx - BR);
    notchAnim.setValue(cx);
    setPathD(buildPath(barW, cx));
  }, [barW]);

  const onPress = useCallback((i: number) => {
    const route = state.routes[i];
    if (!route) return;
    const focused = state.index === i;
    const ev = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (ev.defaultPrevented) return;
    if (!focused) {
      navigation.navigate(route.name, route.params);
    } else if (route.state?.key) {
      // Tab ya enfocado: volver a la raíz de su stack anidado (ej: profile
      // stuck en una subpantalla como become-provider) en vez de no-opear.
      navigation.dispatch({ ...StackActions.popToTop(), target: route.state.key });
    }
  }, [navigation, state]);

  const onLongPress = useCallback((i: number) => {
    const route = state.routes[i];
    if (route) navigation.emit({ type: 'tabLongPress', target: route.key });
  }, [navigation, state.routes]);

  const activeTab = TABS[visible[activeIndex]?.route.name ?? ''] ?? TABS.index;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.shell, { bottom: Math.max(insets.bottom, 16) + 12 }]}
    >
      {/* ── Bar shadow wrapper — elevation sin overflow (Android fix) ── */}
      <View
        style={styles.barShadow}
        onLayout={e => setBarW(e.nativeEvent.layout.width)}
      >
        {/* ── Bar clip — overflow hidden sin elevation ── */}
        <View style={styles.bar}>
          <Svg
            width={barW}
            height={BAR_H}
            viewBox={`0 0 ${barW} ${BAR_H}`}
            style={StyleSheet.absoluteFill}
          >
            <Path d={pathD} fill={tc.surface} />
          </Svg>

          <View style={styles.row}>
            {visible.map(({ route, routeIndex: idx }) => {
              const cfg     = TABS[route.name];
              const focused = idx === state.index;
              const label   = getTabLabel(route.name, isProvider);
              const badge   = route.name === 'chat' ? unread : route.name === 'orders' ? pendingRequests : 0;
              const badgeNoun = route.name === 'orders' ? 'pendientes' : 'sin leer';
              return (
                <TabSlot
                  key={route.key}
                  icon={cfg.icon}
                  label={label}
                  a11yLabel={badge > 0 ? `${label}, ${badge} ${badgeNoun}` : label}
                  focused={focused}
                  badge={badge}
                  onPress={() => onPress(idx)}
                  onLongPress={() => onLongPress(idx)}
                />
              );
            })}
          </View>
        </View>
      </View>

      {/* ── Bubble ── */}
      <Animated.View
        pointerEvents="none"
        style={[styles.bubble, { transform: [{ translateX: bubbleAnim }] }]}
      >
        <View style={styles.bubbleInner}>
          <Ionicons name={activeTab.active} size={26} color={TOKENS.color.onPrimary} />
        </View>
        <View style={styles.bubbleRing} />
      </Animated.View>
    </View>
  );
}

// ── Tab slot ──────────────────────────────────────────────────────────────────
function TabSlot({ icon, label, a11yLabel, focused, badge, onPress, onLongPress }: {
  icon: IconName; label: string; a11yLabel: string; focused: boolean; badge: number;
  onPress: () => void; onLongPress: () => void;
}) {
  const tc = useThemeColors();
  const styles = useMemo(() => createStyles(tc), [tc]);
  // The icon of the focused tab lives in the floating bubble, so only its label stays in the bar.
  const opacity = useRef(new Animated.Value(focused ? 0 : 0.55)).current;

  useEffect(() => {
    Animated.spring(opacity, {
      toValue: focused ? 0 : 0.55,
      ...SPRING,
    }).start();
  }, [focused]);

  return (
    <Pressable
      style={styles.slot}
      accessibilityRole="tab"
      accessibilityLabel={a11yLabel}
      accessibilityState={{ selected: focused }}
      onPress={onPress}
      onLongPress={onLongPress}
      hitSlop={8}
    >
      <Animated.View style={[styles.iconWrap, { opacity }]}>
        <Ionicons name={icon} size={22} color={tc.text} />
        {badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
          </View>
        )}
      </Animated.View>
      <DSText
        variant="caption"
        numberOfLines={1}
        color={focused ? tc.text : tc.textSub}
        style={styles.label}
      >
        {label}
      </DSText>
    </Pressable>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const createStyles = (tc: ThemeColors) => StyleSheet.create({
  shell: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: LIFT + BAR_H,
    zIndex: 9999,
    elevation: 0,
  },
  // Wrapper: provee elevation en Android (sin overflow)
  // Sin backgroundColor — SVG es el background visual, notch transparente
  barShadow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: BAR_H,
    borderRadius: BAR_R,
    elevation: 20,
    shadowColor: TOKENS.color.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
  },
  // Inner: overflow hidden para clipear el SVG a la forma redondeada
  bar: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BAR_R,
    overflow: 'hidden',
  },
  row: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
  },
  slot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
    lineHeight: 12,
    textAlign: 'center',
  },
  iconWrap: {
    width: 32,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: BUBBLE,
    height: BUBBLE,
  },
  bubbleInner: {
    width: BUBBLE,
    height: BUBBLE,
    borderRadius: BR,
    backgroundColor: TOKENS.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: TOKENS.color.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 14,
    elevation: 14,
  },
  bubbleRing: {
    position: 'absolute',
    top: -3,
    left: -3,
    width: BUBBLE + 6,
    height: BUBBLE + 6,
    borderRadius: BR + 3,
    borderWidth: 2,
    borderColor: withAlpha(TOKENS.color.primary, 0.22),
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: TOKENS.color.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: tc.surface,
  },
  badgeText: {
    fontSize: 9,
    fontFamily: FONT_FAMILY.display,
    color: TOKENS.color.onPrimary,
  },
});
