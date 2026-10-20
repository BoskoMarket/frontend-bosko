/**
 * Rebrand "Señal Nocturna" — OrdersListScreen (Solicitudes): misma lógica, estado y navegación que
 * el archivo original. Misma lógica cliente/proveedor y estados — solo acento bordo → signal.
 */
/**
 * OrdersListScreen — Lista de órdenes del usuario.
 * Muestra tabs "Como cliente" y "Como proveedor" con sus órdenes respectivas.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOrders } from '../state/OrdersContext';
import { useIsProvider } from '@/hooks/queries/useProfileQuery';
import { Order, OrderStatus } from '../types/orders.types';
import { ORDER_STATUS } from '../constants/orderStatus';
import { Badge, Button, EmptyState, ScreenHeader, SkeletonList, TOKENS, useThemeColors, FONT_FAMILY } from '@/core/design-system';
import { AnimatedBackground } from '@/components/AnimatedBackground';

type TabType = 'client' | 'provider';

/**
 * Which segment the list opens on: an explicit `?tab=` always wins; otherwise
 * providers land on the orders they received and clients on the ones they hired.
 */
export function resolveOrdersSegment(tabParam: string | undefined, isProvider: boolean): TabType {
  if (tabParam === 'provider' || tabParam === 'client') return tabParam;
  return isProvider ? 'provider' : 'client';
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const info = ORDER_STATUS[status] || ORDER_STATUS.pending;
  return <Badge label={info.label} tone={info.tone} size="sm" />;
}

function OrderCard({ order, onPress }: { order: Order; onPress: () => void }) {
  const tc = useThemeColors();
  const otherName = order.otherParty
    ? `${order.otherParty.firstName} ${order.otherParty.lastName ?? ''}`.trim()
    : null;
  const serviceTitle = order.service?.title || order.title || 'Servicio';
  const date = new Date(order.createdAt).toLocaleDateString('es-AR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
  const anim = useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={{ opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }}>
      <View style={styles.orderCardShadow}>
        <Pressable
          style={({ pressed }) => [{ backgroundColor: tc.card, borderRadius: 16, flexDirection: 'row', overflow: 'hidden' }, pressed && styles.orderCardPressed]}
          onPress={onPress}
        >
        {/* Acento de color según estado */}
        <View style={[styles.statusStripe, { backgroundColor: TOKENS.status[(ORDER_STATUS[order.status] || ORDER_STATUS.pending).tone].fg }]} />

        <View style={styles.orderContent}>
          <View style={styles.orderHeader}>
            <Text style={[styles.orderTitle, { color: tc.text }]} numberOfLines={1}>
              {otherName || serviceTitle}
            </Text>
            <StatusBadge status={order.status} />
          </View>
          {otherName ? (
            <Text style={[styles.orderService, { color: TOKENS.color.signal }]} numberOfLines={1}>{serviceTitle}</Text>
          ) : null}

          <Text style={[styles.orderMessage, { color: tc.textSub }]} numberOfLines={2}>{order.clientMessage}</Text>

          <View style={styles.orderFooter}>
            <View style={styles.orderMeta}>
              <MaterialIcons name="schedule" size={13} color={tc.textSub} />
              <Text style={[styles.orderDate, { color: tc.textSub }]}>{date}</Text>
            </View>
            {order.address && (
              <View style={styles.orderMeta}>
                <MaterialIcons name="location-on" size={13} color={tc.textSub} />
                <Text style={[styles.orderAddress, { color: tc.textSub }]} numberOfLines={1}>{order.address}</Text>
              </View>
            )}
            <MaterialIcons name="chevron-right" size={18} color={tc.textSub} />
          </View>
        </View>
      </Pressable>
      </View>
    </Animated.View>
  );
}

export default function OrdersListScreen() {
  const tc = useThemeColors();
  const insets = useSafeAreaInsets();
  const { clientOrders, providerOrders, loading, loadClientOrders, loadProviderOrders,
    clientHasMore, providerHasMore, clientLoadingMore, providerLoadingMore,
    clientFetching, providerFetching,
    clientMoreError, providerMoreError, loadMoreClientOrders, loadMoreProviderOrders } = useOrders();
  // `?tab=provider` (e.g. from the provider home) opens the provider list.
  const { tab: tabParam } = useLocalSearchParams<{ tab?: string }>();
  const isProvider = useIsProvider();
  // A manual segment pick overrides the default until a new `?tab=` arrives.
  const [pickedTab, setActiveTab] = useState<TabType | null>(null);
  useEffect(() => { setActiveTab(null); }, [tabParam]);
  const activeTab = pickedTab ?? resolveOrdersSegment(tabParam, isProvider);
  const [refreshing, setRefreshing] = useState(false);

  // Carga inicial de ambas listas
  useEffect(() => {
    loadClientOrders();
    loadProviderOrders();
  }, [loadClientOrders, loadProviderOrders]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadClientOrders(), loadProviderOrders()]);
    setRefreshing(false);
  }, [loadClientOrders, loadProviderOrders]);

  const orders = activeTab === 'client' ? clientOrders : providerOrders;
  const hasMore = activeTab === 'client' ? clientHasMore : providerHasMore;
  const loadingMore = activeTab === 'client' ? clientLoadingMore : providerLoadingMore;
  const fetching = activeTab === 'client' ? clientFetching : providerFetching;
  const moreError = activeTab === 'client' ? clientMoreError : providerMoreError;
  const loadMore = activeTab === 'client' ? loadMoreClientOrders : loadMoreProviderOrders;

  const OrdersEmptyState = () =>
    activeTab === 'client' ? (
      <EmptyState
        icon="receipt-outline"
        title="Todavía no pediste nada"
        subtitle="Explorá servicios, cotizá con profesionales y hacé tu primer pedido."
        cta={{ label: 'Explorar servicios', onPress: () => router.push('/(tabs)') }}
      />
    ) : (
      <EmptyState
        icon="briefcase-outline"
        title="Sin solicitudes todavía"
        subtitle="Asegurate de tener tu perfil verificado y al menos un servicio publicado."
        cta={{ label: 'Ver mi perfil', onPress: () => router.push('/(tabs)/profile') }}
        secondaryCta={{ label: 'Publicar un servicio', onPress: () => router.push('/service-form') }}
      />
    );

  return (
    <View style={[styles.background, { backgroundColor: tc.bg }]}>
      <AnimatedBackground variant="minimal" />
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <ScreenHeader variant="large" title="Mis órdenes" />
      </View>

      {/* Tabs */}
      <View style={[styles.tabBar, { borderColor: tc.cardBorder }]}>
        {(['client', 'provider'] as TabType[]).map(tab => (
          <Pressable
            key={tab}
            style={[styles.tab, activeTab === tab && { backgroundColor: tc.accent }]}
            onPress={() => setActiveTab(tab)}
          >
            <MaterialIcons
              name={tab === 'client' ? 'shopping-bag' : 'work'}
              size={16}
              color={activeTab === tab ? TOKENS.color.signal : tc.textSub}
            />
            <Text style={[styles.tabText, { color: activeTab === tab ? TOKENS.color.signal : tc.textSub }, activeTab === tab && styles.tabTextActive]}>
              {tab === 'client' ? 'Como cliente' : 'Como proveedor'}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading && !refreshing && orders.length === 0 ? (
        <SkeletonList variant="card" count={5} />
      ) : (
        <FlatList
          data={orders}
          onEndReached={() => { if (hasMore && !loadingMore && !moreError) loadMore(); }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={loadingMore ? <SkeletonList variant="card" count={2} /> : moreError ? (
            <Button label="Reintentar cargar más" onPress={() => { loadMore(); }} />
          ) : null}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              onPress={() => router.push({
                pathname: '/orders/[id]',
                params: { id: item.id },
              })}
            />
          )}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<OrdersEmptyState />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={TOKENS.color.signal}
              colors={[TOKENS.color.signal]}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  tabText: {
    fontSize: 13,
    fontFamily: FONT_FAMILY.bodyMedium,
  },
  tabTextActive: {
    fontFamily: FONT_FAMILY.heading,
  },
  listContent: {
    paddingHorizontal: 20,
    gap: 12,
    flexGrow: 1,
  },
  orderCardShadow: {
    borderRadius: 16,
    ...TOKENS.shadow.soft,
  },
  orderCardPressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  statusStripe: {
    width: 4,
  },
  orderContent: {
    flex: 1,
    padding: 14,
    gap: 6,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  orderTitle: {
    fontSize: 15,
    fontFamily: FONT_FAMILY.heading,
    flex: 1,
  },
  orderService: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.bodyMedium,
    marginTop: -2,
  },
  orderMessage: {
    fontSize: 13,
    fontFamily: FONT_FAMILY.body,
    lineHeight: 18,
  },
  orderFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  orderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flex: 1,
  },
  orderDate: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.body,
  },
  orderAddress: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.body,
    flex: 1,
  },
});
