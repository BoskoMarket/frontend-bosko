/**
 * Rebrand "Señal Nocturna" — NotificationsScreen: misma lógica, estado y navegación que
 * el archivo original. Mismo agrupamiento por tipo, swipe/delete y polling — TYPE_ICON pasa de pasteles claros a tintes translúcidos legibles en dark, wash de fondo a glow rosa, header/cards a vidrio.
 */
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { useNotifications } from '../state/NotificationsContext';
import { Notification } from '../services/notifications.service';
import { TOKENS } from '@/core/design-system/tokens';
import { useThemeColors, FullScreenModal } from '@/core/design-system';
import { useNotificationsOpen, closeNotifications } from '@/stores/notificationsUI.store';

const TYPE_ICON: Record<string, { name: any; color: string; bg: string }> = {
  order_accepted: { name: 'check-circle', color: TOKENS.status.done.fg, bg: TOKENS.status.done.bg },
  order_rejected: { name: 'cancel', color: TOKENS.status.cancelled.fg, bg: TOKENS.status.cancelled.bg },
  order_started: { name: 'play-circle', color: TOKENS.status.progress.fg, bg: TOKENS.status.progress.bg },
  order_completed: { name: 'done-all', color: TOKENS.status.done.fg, bg: TOKENS.status.done.bg },
  order_cancelled: { name: 'block', color: TOKENS.status.cancelled.fg, bg: TOKENS.status.cancelled.bg },
  kyc_approved: { name: 'verified-user', color: TOKENS.color.signal, bg: 'rgba(255,45,111,0.14)' },
  kyc_rejected: { name: 'gpp-bad', color: TOKENS.status.cancelled.fg, bg: TOKENS.status.cancelled.bg },
  message: { name: 'chat-bubble', color: TOKENS.status.progress.fg, bg: TOKENS.status.progress.bg },
  default: { name: 'notifications', color: '#9CA3AF', bg: 'rgba(156,163,175,0.14)' },
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
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 280, delay: index * 30, useNativeDriver: true }),
      Animated.timing(tx, { toValue: 0, duration: 280, delay: index * 30, useNativeDriver: true }),
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
  const swipeX = useRef(new Animated.Value(0)).current;
  const deleteOpacity = swipeX.interpolate({ inputRange: [-80, -20], outputRange: [1, 0], extrapolate: 'clamp' });

  const onLongPress = () => {
    Alert.alert('Eliminar', '¿Eliminás esta notificación?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: onDelete },
    ]);
  };

  return (
    <View style={[s.itemWrapShadow, !item.read && s.itemShadowUnread]}>
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        style={({ pressed }) => [
          s.itemWrap,
          pressed && s.itemPressed,
        ]}
      >
        <View style={[s.itemInner, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
          {!item.read && <View style={s.unreadDot} />}
          <View style={[s.itemIcon, { backgroundColor: cfg.bg }]}>
            <MaterialIcons name={cfg.name} size={22} color={cfg.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.itemTitle, { color: tc.text }, !item.read && s.itemTitleUnread]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={[s.itemBody, { color: tc.textSub }]} numberOfLines={2}>{item.body}</Text>
            <Text style={[s.itemTime, { color: tc.textMuted }]}>{timeAgo(item.createdAt)}</Text>
          </View>
          <Pressable onPress={onDelete} hitSlop={8} style={s.deleteBtn}>
            <MaterialIcons name="close" size={16} color={tc.textSub} />
          </Pressable>
        </View>
      </Pressable>
    </View>
  );
}

function EmptyState() {
  const tc = useThemeColors();
  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, damping: 14, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 350, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={s.emptyWrap}>
      <Animated.View style={{ alignItems: 'center', gap: 12, opacity, transform: [{ scale }] }}>
        <MaterialIcons name="notifications-none" size={64} color="rgba(255,45,111,0.25)" />
        <Text style={[s.emptyTitle, { color: tc.text }]}>Sin notificaciones</Text>
        <Text style={[s.emptyText, { color: tc.textSub }]}>
          Aquí aparecerán tus notificaciones de órdenes, mensajes y más.
        </Text>
      </Animated.View>
    </View>
  );
}

export default function NotificationsScreen() {
  const tc = useThemeColors();
  const { notifications, unreadCount, loading, load, markRead, markAllRead, remove, clearAll } = useNotifications();

  useEffect(() => { load(); }, []);

  const handlePress = async (item: Notification) => {
    if (!item.read) await markRead(item.id);

    const type = item.type.toLowerCase();
    closeNotifications();
    if (item.data?.orderId) {
      router.push(`/orders/${item.data.orderId}`);
    } else if (type === 'new_message' && item.data?.conversationId) {
      router.push(`/chat/${item.data.conversationId}`);
    } else if (type.startsWith('identity') || type === 'background_check') {
      router.push('/(tabs)/profile/become-provider');
    }
  };

  const handleClearAll = () => {
    Alert.alert('Limpiar notificaciones', '¿Eliminás todas las notificaciones?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Limpiar todo', style: 'destructive', onPress: clearAll },
    ]);
  };

  return (
    <View style={[s.bg, { backgroundColor: tc.bg }]}>
      <AnimatedBackground variant="minimal" />
      <View style={s.header}>
        <Pressable onPress={closeNotifications} hitSlop={12} style={[s.backBtn, { backgroundColor: tc.surface }]}>
          <MaterialIcons name="arrow-back" size={24} color={tc.text} />
        </Pressable>
        <View style={s.headerCenter}>
          <Text style={[s.headerTitle, { color: tc.text }]}>Notificaciones</Text>
          {unreadCount > 0 && (
            <View style={s.countBadge}>
              <Text style={s.countText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <View style={s.headerActions}>
          {unreadCount > 0 && (
            <Pressable onPress={markAllRead} hitSlop={8} style={[s.actionBtn, { backgroundColor: tc.surface }]}>
              <MaterialIcons name="done-all" size={20} color={TOKENS.color.signal} />
            </Pressable>
          )}
          {notifications.length > 0 && (
            <Pressable onPress={handleClearAll} hitSlop={8} style={[s.actionBtn, { backgroundColor: tc.surface }]}>
              <MaterialIcons name="delete-sweep" size={20} color={tc.textSub} />
            </Pressable>
          )}
        </View>
      </View>

      {loading && notifications.length === 0 && (
        <View style={s.loadingWrap}>
          <ActivityIndicator color={TOKENS.color.signal} size="large" />
        </View>
      )}

      {!loading && notifications.length === 0 && <EmptyState />}

      <FlatList
        data={notifications}
        keyExtractor={n => n.id}
        renderItem={({ item, index }) => (
          <AnimatedItem index={index}>
            <NotificationItem item={item} onPress={() => handlePress(item)} onDelete={() => remove(item.id)} />
          </AnimatedItem>
        )}
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => load()}
            colors={[TOKENS.color.signal]}
          />
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
  bg: { flex: 1, backgroundColor: '#0A0910' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  backBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: TOKENS.color.text },
  countBadge: {
    backgroundColor: TOKENS.color.signal,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: TOKENS.color.text },
  emptyText: { fontSize: 14, color: TOKENS.color.sub, textAlign: 'center', lineHeight: 20 },
  listContent: { paddingHorizontal: 24, paddingBottom: 40, gap: 8 },
  itemWrap: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  itemWrapShadow: {
    borderRadius: 16,
    shadowColor: '#000',
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
    gap: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.09)',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: TOKENS.color.signal,
  },
  itemIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  headerActions: { flexDirection: 'row', gap: 4 },
  actionBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  deleteBtn: {
    padding: 4,
    marginLeft: 4,
  },
  itemTitle: { fontSize: 14, fontWeight: '600', color: TOKENS.color.text, paddingRight: 8 },
  itemTitleUnread: { fontWeight: '800' },
  itemBody: { fontSize: 13, color: TOKENS.color.sub, lineHeight: 18, marginTop: 2 },
  itemTime: { fontSize: 11, color: 'rgba(107,107,107,0.6)', marginTop: 4 },
});
