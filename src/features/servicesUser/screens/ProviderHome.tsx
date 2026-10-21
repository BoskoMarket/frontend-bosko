/**
 * ProviderHome — home for active providers, focused on their work: incoming
 * requests, a few real metrics, quick publishing actions and the latest
 * pending requests.
 *
 * Data: requests → useProviderOrders (status "pending"), metrics →
 * useProfileStats (GET /users/me/stats), name → ProfileContext. Blocks without
 * real data (profile completeness, response time) are intentionally absent.
 */
import React, { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { REEL_UPLOAD_ROUTE } from '@/features/reels/routes';

import { useProfile } from '@/features/profile/state/ProfileContext';
import { useProviderOrders, usePendingProviderRequestsQuery } from '@/hooks/queries/useOrdersQuery';
import { useProfileStats } from '@/hooks/queries/useProfileQuery';
import { HomeTopBar } from '@/features/servicesUser/components/HomeTopBar';
import type { Order } from '@/features/orders/types/orders.types';
import {
  Button,
  CategoryTile,
  EmptyState,
  RequestRow,
  SectionHeader,
  Skeleton,
  SPACING,
  StatTile,
  SummaryCard,
  Text,
  TOKENS,
  useIsDark,
  useThemeColors,
} from '@/core/design-system';

const RECENT_LIMIT = 3;

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const goOrders = () => router.push({ pathname: '/(tabs)/orders', params: { tab: 'provider' } });
const goOrder = (id: string) => router.push({ pathname: '/orders/[id]', params: { id } });
const goPublish = () => router.push('/service-form');

const QUICK_ACTIONS: { id: string; label: string; icon: IconName; go: () => void }[] = [
  { id: 'post', label: 'Publicar servicio', icon: 'add-circle-outline', go: goPublish },
  { id: 'services', label: 'Mis servicios', icon: 'list-outline', go: () => router.push('/(tabs)/profile/Services') },
  { id: 'reel', label: 'Subir reel', icon: 'videocam-outline', go: () => router.push(REEL_UPLOAD_ROUTE) },
];

function requestsTitle(count: number): string {
  if (count === 0) return 'No tenés solicitudes nuevas';
  return count === 1 ? 'Tenés 1 solicitud nueva' : `Tenés ${count} solicitudes nuevas`;
}

function requestTitle(order: Order): string {
  const who = order.otherParty ?? order.client;
  const name = who ? `${who.firstName} ${who.lastName ?? ''}`.trim() : '';
  const service = order.service?.title || order.title;
  return [name, service].filter(Boolean).join(' · ') || 'Solicitud';
}

function requestSubtitle(order: Order): string {
  const when = new Date(order.scheduledDate ?? order.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
  return [order.address, when].filter(Boolean).join(' · ');
}

export default function ProviderHome() {
  const insets = useSafeAreaInsets();
  const tc = useThemeColors();
  const isDark = useIsDark();
  const { profile } = useProfile();
  const ordersQuery = useProviderOrders();
  const pendingCountQuery = usePendingProviderRequestsQuery(true);
  const statsQuery = useProfileStats();
  const [refreshing, setRefreshing] = useState(false);

  const pending = useMemo(
    () =>
      (ordersQuery.data ?? [])
        .filter((o) => o.status === 'pending')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [ordersQuery.data],
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.allSettled([ordersQuery.refetch(), pendingCountQuery.refetch(), statsQuery.refetch()]);
    setRefreshing(false);
  }, [ordersQuery, pendingCountQuery, statsQuery]);

  const stats = statsQuery.data;
  const statTiles = [
    stats && stats.averageRating > 0 ? { label: 'Rating', value: stats.averageRating.toFixed(1) } : null,
    stats ? { label: 'Trabajos', value: String(stats.completedOrders) } : null,
    stats ? { label: 'Servicios', value: String(stats.servicesCount) } : null,
  ].filter((t): t is { label: string; value: string } => t !== null);

  const ordersLoading = ordersQuery.isLoading || pendingCountQuery.isLoading;
  const ordersFailed = (ordersQuery.isError && !ordersQuery.data) || (pendingCountQuery.isError && pendingCountQuery.data === undefined);

  return (
    <View style={[styles.root, { backgroundColor: tc.bg, paddingTop: insets.top }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={tc.bg} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 90 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={tc.signal} />}
      >
        <HomeTopBar />

        {ordersLoading ? (
          <Skeleton height={140} radius={TOKENS.radius.xl} />
        ) : ordersFailed ? null : (
          <SummaryCard
            eyebrow={profile?.firstName ? `Hola, ${profile.firstName}` : 'Hola'}
             title={requestsTitle(pendingCountQuery.data ?? 0)}
             actionLabel={(pendingCountQuery.data ?? 0) > 0 ? 'Ver solicitudes' : 'Ver mis órdenes'}
            onAction={goOrders}
          />
        )}

        {statsQuery.isLoading ? (
          <View style={styles.row}>
            {[0, 1, 2].map((i) => <View key={i} style={styles.flex}><Skeleton height={64} radius={TOKENS.radius.md} /></View>)}
          </View>
        ) : statTiles.length > 0 ? (
          <View style={styles.row}>
            {statTiles.map((t) => <StatTile key={t.label} {...t} />)}
          </View>
        ) : null}

        <View style={styles.row}>
          {QUICK_ACTIONS.map((a) => (
            <CategoryTile key={a.id} icon={a.icon} label={a.label} onPress={a.go} />
          ))}
        </View>

        <View style={styles.section}>
          <SectionHeader title="Solicitudes" onActionPress={goOrders} actionLabel="Ver todas" />
          {ordersLoading ? (
            <View style={styles.list}>
              {[0, 1].map((i) => <Skeleton key={i} height={64} radius={TOKENS.radius.md} />)}
            </View>
          ) : ordersFailed ? (
            <View style={styles.error}>
              <Ionicons name="cloud-offline-outline" size={32} color={tc.textSub} />
              <Text variant="bodySmall" color={tc.textSub}>No se pudieron cargar las solicitudes</Text>
               <Button label="Reintentar" size="sm" onPress={() => {
                 void ordersQuery.refetch();
                 void pendingCountQuery.refetch();
               }} />
            </View>
           ) : pending.length === 0 && (pendingCountQuery.data ?? 0) > 0 ? (
             <Button label="Ver todas las solicitudes" size="sm" onPress={goOrders} />
           ) : pending.length === 0 ? (
            <EmptyState
              icon="briefcase-outline"
              title="Sin solicitudes nuevas"
              subtitle="Cuando un cliente te escriba, vas a verlo acá."
              cta={{ label: 'Publicar un servicio', onPress: goPublish }}
            />
          ) : (
            <View style={styles.list}>
              {pending.slice(0, RECENT_LIMIT).map((o) => {
                const who = o.otherParty ?? o.client;
                return (
                  <RequestRow
                    key={o.id}
                    name={who?.firstName}
                    avatarUri={who?.avatarUrl}
                    title={requestTitle(o)}
                    subtitle={requestSubtitle(o)}
                    badge="Nueva"
                    onPress={() => goOrder(o.id)}
                  />
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm, gap: SPACING.xl + 2 },
  row: { flexDirection: 'row', gap: SPACING.sm },
  flex: { flex: 1 },
  section: { gap: SPACING.md },
  list: { gap: SPACING.sm },
  error: { alignItems: 'center', gap: SPACING.sm + 2, paddingVertical: SPACING.xxl },
});
