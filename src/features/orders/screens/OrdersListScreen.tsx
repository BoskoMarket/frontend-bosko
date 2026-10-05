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
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOrders } from '../state/OrdersContext';
import { Order, OrderStatus } from '../types/orders.types';
import { TOKENS } from '@/core/design-system/tokens';
import { useThemeColors } from '@/stores/theme.store';
import { EmptyState } from '@/core/components/EmptyState';
import { AnimatedBackground } from '@/components/AnimatedBackground';

type TabType = 'client' | 'provider';

// Mapeo de estado a etiqueta y color legibles
const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  pending:     { label: 'Pendiente',    color: '#d97706', bg: '#fef3c7' },
  accepted:    { label: 'Aceptada',     color: '#2563eb', bg: '#dbeafe' },
  in_progress: { label: 'En progreso',  color: '#7c3aed', bg: '#ede9fe' },
  completed:   { label: 'Completada',   color: '#16a34a', bg: '#dcfce7' },
  cancelled:   { label: 'Cancelada',    color: '#dc2626', bg: '#fee2e2' },
  disputed:    { label: 'En disputa',   color: '#dc2626', bg: '#fee2e2' },
};

function StatusBadge({ status }: { status: OrderStatus }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.badgeText, { color: config.color }]}>{config.label}</Text>
    </View>
  );
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
        <View style={[styles.statusStripe, { backgroundColor: STATUS_CONFIG[order.status]?.color || TOKENS.color.signal }]} />

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
  const { clientOrders, providerOrders, loading, loadClientOrders, loadProviderOrders } = useOrders();
  const [activeTab, setActiveTab] = useState<TabType>('client');
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

  const OrdersEmptyState = () =>
    activeTab === 'client' ? (
      <EmptyState
        icon="receipt-outline"
        title="Todavía no pediste nada"
        subtitle="Explorá servicios, cotizá con profesionales y hacé tu primer pedido."
        cta={{ label: 'Explorar servicios', onPress: () => router.push('/(tabs)/services') }}
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
        <Text style={[styles.headerTitle, { color: tc.text }]}>Mis órdenes</Text>
      </View>

      {/* Tabs */}
      <View style={[styles.tabBar, { borderColor: tc.cardBorder }]}>
        {(['client', 'provider'] as TabType[]).map(tab => (
          <Pressable
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
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
        <ActivityIndicator
          color={TOKENS.color.signal}
          size="large"
          style={styles.loader}
        />
      ) : (
        <FlatList
          data={orders}
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
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
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
  tabActive: {
    backgroundColor: 'rgba(133,0,33,0.08)',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
  },
  tabTextActive: {
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 20,
    gap: 12,
    flexGrow: 1,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  orderCardShadow: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
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
    fontWeight: '700',
    flex: 1,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  orderService: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: -2,
  },
  orderMessage: {
    fontSize: 13,
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
  },
  orderAddress: {
    fontSize: 12,
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  ctaButton: {
    marginTop: 8,
    backgroundColor: TOKENS.color.signal,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonPressed: { opacity: 0.85 },
  ctaText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  loader: { flex: 1 },
});
