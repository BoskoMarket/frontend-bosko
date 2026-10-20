/**
 * Rebrand "Señal Nocturna" — NotificationsScreen: misma lógica, estado y navegación que
 * el archivo original. Mismo agrupamiento por tipo y long-press para borrar — TYPE_ICON usa tintes
 * translúcidos de `TOKENS.status` legibles en dark y light; todo color sale del design system.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  Animated,
  Linking,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { useNotifications } from '../state/NotificationsContext';
import { useNotificationsDenied } from '../hooks/useNotificationPermission';
import { Notification } from '../services/notifications.service';
import { getNotificationRoute } from '../utils/notificationRoute';
import {
  TOKENS,
  SPACING,
  Text,
  Badge,
  EmptyState,
  NoticeBanner,
  ScreenHeader,
  FullScreenModal,
  useThemeColors,
  withAlpha,
  dialog,
  SkeletonList,
} from '@/core/design-system';
import { useNotificationsOpen, closeNotifications } from '@/stores/notificationsUI.store';

type TypeIcon = { name: React.ComponentProps<typeof MaterialIcons>['name']; color?: string; bg?: string };

/** `color`/`bg` ausentes = neutro del tema (`tc.textSub` / `tc.surface2`). */
const TYPE_ICON: Record<string, TypeIcon> = {
  order_accepted: { name: 'check-circle', color: TOKENS.status.done.fg, bg: TOKENS.status.done.bg },
  order_rejected: { name: 'cancel', color: TOKENS.status.cancelled.fg, bg: TOKENS.status.cancelled.bg },
  order_started: { name: 'play-circle', color: TOKENS.status.progress.fg, bg: TOKENS.status.progress.bg },
  order_completed: { name: 'done-all', color: TOKENS.status.done.fg, bg: TOKENS.status.done.bg },
  order_cancelled: { name: 'block', color: TOKENS.status.cancelled.fg, bg: TOKENS.status.cancelled.bg },
  payment_received: { name: 'attach-money', color: TOKENS.status.done.fg, bg: TOKENS.status.done.bg },
  kyc_approved: { name: 'verified-user', color: TOKENS.color.signal, bg: withAlpha(TOKENS.color.signal, 0.14) },
  kyc_rejected: { name: 'gpp-bad', color: TOKENS.status.cancelled.fg, bg: TOKENS.status.cancelled.bg },
  message: { name: 'chat-bubble', color: TOKENS.status.progress.fg, bg: TOKENS.status.progress.bg },
  default: { name: 'notifications' },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'ahora';
  if (min < 60) return `hace ${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h}h`;
  const d = Math.floor(h / 24);
  return `hace ${d}d`;
}

function AnimatedItem({ index, children }: { index: number; children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const tx = useRef(new Animated.Value(-12)).current;

  useEffect(() => {
    const delay = Math.min(index, 8) * 30;
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 280, delay, useNativeDriver: true }),
      Animated.timing(tx, { toValue: 0, duration: 280, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateX: tx }] }}>
      {children}
    </Animated.View>
  );
}

function NotificationItem({ item, onPress, onDelete }: { item: Notification; onPress: () => void; onDelete: () => void }) {
  const tc = useThemeColors();
  const cfg = TYPE_ICON[item.type.toLowerCase()] ?? TYPE_ICON.default;

  const onLongPress = () => {
    dialog.fromAlert('Eliminar', '¿Eliminás esta notificación?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: onDelete },
    ]);
  };

  return (
    <View style={[s.itemWrapShadow, !item.read && s.itemShadowUnread]}>
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        accessibilityRole="button"
        accessibilityLabel={`${item.read ? '' : 'No leída. '}${item.title}. ${item.body}`}
        style={({ pressed }) => [
          s.itemWrap,
          pressed && s.itemPressed,
        ]}
      >
        <View style={[s.itemInner, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
          {!item.read && <View style={[s.unreadDot, { backgroundColor: tc.signal }]} />}
          <View style={[s.itemIcon, { backgroundColor: cfg.bg ?? tc.surface2 }]}>
            <MaterialIcons name={cfg.name} size={22} color={cfg.color ?? tc.textSub} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              variant="bodySmall"
              weight={item.read ? '600' : '800'}
              color={tc.text}
              numberOfLines={1}
              style={s.itemTitle}
            >
              {item.title}
            </Text>
            <Text variant="bodySmall" color={tc.textSub} numberOfLines={2} style={s.itemBody}>{item.body}</Text>
            <Text variant="caption" color={tc.textMuted} style={s.itemTime}>{timeAgo(item.createdAt)}</Text>
          </View>
          <Pressable
            onPress={onDelete}
            hitSlop={8}
            style={s.deleteBtn}
            accessibilityRole="button"
            accessibilityLabel="Eliminar notificación"
          >
            <MaterialIcons name="close" size={16} color={tc.textSub} />
          </Pressable>
        </View>
      </Pressable>
    </View>
  );
}

export default function NotificationsScreen() {
  const tc = useThemeColors();
  const { notifications, unreadCount, loading, error, load, hasMore, loadingMore, fetching, moreError, loadMore, markRead, markAllRead, remove, clearAll } = useNotifications();
  const permissionDenied = useNotificationsDenied();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { load(); }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try { await load(); } finally { setRefreshing(false); }
  };

  const handlePress = async (item: Notification) => {
    if (!item.read) await markRead(item.id);

    closeNotifications();
    const route = getNotificationRoute(item);
    if (route) router.push(route as any);
  };

  const handleClearAll = () => {
    dialog.fromAlert('Limpiar notificaciones', '¿Eliminás todas las notificaciones?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Limpiar todo', style: 'destructive', onPress: clearAll },
    ]);
  };

  const showError = !!error && !loading && notifications.length === 0;

  const headerRight = (
    <View style={s.headerActions}>
      {unreadCount > 0 && <Badge label={String(unreadCount)} tone="brand" size="sm" />}
      {unreadCount > 0 && (
        <Pressable
          onPress={markAllRead}
          hitSlop={8}
          style={[s.actionBtn, { backgroundColor: tc.surface }]}
          accessibilityRole="button"
          accessibilityLabel="Marcar todas como leídas"
        >
          <MaterialIcons name="done-all" size={20} color={tc.signal} />
        </Pressable>
      )}
      {notifications.length > 0 && (
        <Pressable
          onPress={handleClearAll}
          hitSlop={8}
          style={[s.actionBtn, { backgroundColor: tc.surface }]}
          accessibilityRole="button"
          accessibilityLabel="Eliminar todas las notificaciones"
        >
          <MaterialIcons name="delete-sweep" size={20} color={tc.textSub} />
        </Pressable>
      )}
    </View>
  );

  return (
    <View style={[s.bg, { backgroundColor: tc.bg }]}>
      <AnimatedBackground variant="minimal" />
      <View style={s.header}>
        <ScreenHeader title="Notificaciones" onBack={closeNotifications} right={headerRight} />
      </View>

      {permissionDenied && (
        <NoticeBanner variant="pending" icon="notifications-off-outline" style={s.notice}>
          Las notificaciones del sistema están desactivadas, no vas a recibir avisos con la app cerrada.{' '}
          <Text
            variant="bodySmall"
            weight="700"
            color={tc.signal}
            accessibilityRole="link"
            onPress={() => { Linking.openSettings().catch(() => {}); }}
          >
            Activar en Ajustes
          </Text>
        </NoticeBanner>
      )}

      <FlatList
        data={notifications}
        onEndReached={() => { if (hasMore && !loadingMore && !moreError) loadMore(); }}
        onEndReachedThreshold={0.4}
        ListFooterComponent={loadingMore ? <SkeletonList variant="row" count={2} /> : moreError ? (
          <Pressable onPress={() => loadMore()} accessibilityRole="button" accessibilityLabel="Reintentar cargar notificaciones">
            <Text color={tc.signal}>Reintentar cargar más</Text>
          </Pressable>
        ) : null}
        keyExtractor={n => n.id}
        renderItem={({ item, index }) => (
          <AnimatedItem index={index}>
            <NotificationItem item={item} onPress={() => handlePress(item)} onDelete={() => remove(item.id)} />
          </AnimatedItem>
        )}
        contentContainerStyle={[s.listContent, notifications.length === 0 && s.listEmpty]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[TOKENS.color.signal]}
            tintColor={TOKENS.color.signal}
          />
        }
        ListEmptyComponent={
          loading ? (
            <SkeletonList variant="row" count={7} />
          ) : showError ? (
            <EmptyState
              icon="cloud-offline-outline"
              title="No pudimos cargar tus notificaciones"
              subtitle={error}
              cta={{ label: 'Reintentar', onPress: () => { load(); } }}
            />
          ) : (
            <EmptyState
              icon="notifications-outline"
              title="Sin notificaciones"
              subtitle="Aquí aparecerán tus notificaciones de órdenes, pagos y más."
            />
          )
        }
      />
    </View>
  );
}

/** Montar UNA VEZ en app/_layout.tsx, fuera del Stack — junto a ToastRoot. */
export function NotificationsModalRoot() {
  const isOpen = useNotificationsOpen();
  return (
    <FullScreenModal visible={isOpen} onRequestClose={closeNotifications}>
      <NotificationsScreen />
    </FullScreenModal>
  );
}

const s = StyleSheet.create({
  bg: { flex: 1 },
  header: {
    paddingTop: 60,
    paddingHorizontal: SPACING.xxl,
    paddingBottom: SPACING.lg,
  },
  notice: { marginHorizontal: SPACING.xxl, marginBottom: SPACING.md },
  listContent: { paddingHorizontal: SPACING.xxl, paddingBottom: SPACING.huge, gap: SPACING.sm },
  listEmpty: { flexGrow: 1 },
  itemWrap: {
    borderRadius: TOKENS.radius.md,
    overflow: 'hidden',
  },
  itemWrapShadow: {
    borderRadius: TOKENS.radius.md,
    ...TOKENS.shadow.soft,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  itemShadowUnread: { shadowOpacity: 0.1, elevation: 4 },
  itemPressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  itemInner: {
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
    borderWidth: 1.5,
    borderRadius: TOKENS.radius.md,
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  itemIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  actionBtn: {
    padding: SPACING.sm,
    borderRadius: 12,
  },
  deleteBtn: {
    padding: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  itemTitle: { paddingRight: SPACING.sm },
  itemBody: { marginTop: 2 },
  itemTime: { marginTop: SPACING.xs },
});
