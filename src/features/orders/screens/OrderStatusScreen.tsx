/**
 * OrderStatusScreen — Seguimiento en tiempo real del estado de una orden.
 * Timeline expandido con estimaciones, datos de contacto, y botones de acción rápida.
 * Polling cada 10s para refrescar estado (mientras no haya WebSocket).
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from '@/core/components/BlurView';
import { MaterialIcons } from '@expo/vector-icons';
import { MotiView } from '@/core/components/MotiView';
import { router, useLocalSearchParams } from 'expo-router';
import { safeBack } from '@/core/navigation/safeBack';
import { useOrders } from '../state/OrdersContext';
import { Order, OrderStatus } from '../types/orders.types';
import { ORDER_STATUS } from '../constants/orderStatus';
import { ScreenHeader, SPACING, TOKENS, useIsDark, useThemeColors, wash, FONT_FAMILY } from '@/core/design-system';
import { AnimatedBackground } from '@/components/AnimatedBackground';

const POLL_INTERVAL = 10000;

const STATUS_FLOW: OrderStatus[] = ['pending', 'accepted', 'in_progress', 'completed'];

function LiveTimeline({ status }: { status: OrderStatus }) {
  const tc = useThemeColors();
  const isTerminal = status === 'cancelled' || status === 'disputed';
  const info = ORDER_STATUS[status];
  const palette = TOKENS.status[info.tone];

  return (
    <View style={styles.timelineWrap}>
      {isTerminal ? (
        <View style={[styles.terminalBanner, { backgroundColor: palette.bg }]}>
          <MaterialIcons name={info.icon} size={28} color={palette.fg} />
          <View style={styles.terminalTextWrap}>
            <Text style={[styles.terminalTitle, { color: palette.fg }]}>{info.label}</Text>
            <Text style={[styles.terminalDesc, { color: tc.textSub }]}>{info.desc}</Text>
          </View>
        </View>
      ) : (
        STATUS_FLOW.map((step, idx) => {
          const currentIdx = STATUS_FLOW.indexOf(status);
          const done = idx <= currentIdx;
          const active = idx === currentIdx;

          return (
            <View key={step} style={styles.timelineItem}>
              <View style={styles.timelineCol}>
                <View style={[styles.timelineNode, { backgroundColor: tc.accent }, done && styles.nodeDone, active && styles.nodeActive]}>
                  <MaterialIcons
                    name={ORDER_STATUS[step].icon}
                    size={16}
                    color={done ? TOKENS.color.onPrimary : tc.textMuted}
                  />
                </View>
                {idx < STATUS_FLOW.length - 1 && (
                  <View style={[styles.timelineConnector, { backgroundColor: tc.border }, done && idx < currentIdx && styles.connectorDone]} />
                )}
              </View>
              <View style={styles.timelineContent}>
                <Text style={[styles.stepLabel, { color: done ? tc.text : tc.textSub }]}>
                  {ORDER_STATUS[step].label}
                </Text>
                <Text style={[styles.stepDesc, active && styles.stepActiveDesc, { color: active ? TOKENS.color.signal : tc.textSub }]}>
                  {ORDER_STATUS[step].desc}
                </Text>
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}

function CountdownTimer({ createdAt, status }: { createdAt: string; status: OrderStatus }) {
  if (status !== 'pending') return null;

  const elapsed = Date.now() - new Date(createdAt).getTime();
  const hours = Math.floor(elapsed / 3600000);

  return (
    <View style={[styles.countdownRow, { backgroundColor: TOKENS.status.pending.bg }]}>
      <MaterialIcons name="access-time" size={16} color={TOKENS.status.pending.fg} />
      <Text style={[styles.countdownText, { color: TOKENS.status.pending.fg }]}>
        {hours < 1
          ? 'Solicitud enviada hace menos de 1 hora'
          : hours < 24
            ? `Esperando respuesta desde hace ${hours} hora${hours > 1 ? 's' : ''}`
            : `Hace ${Math.floor(hours / 24)} día${Math.floor(hours / 24) > 1 ? 's' : ''}`
        }
      </Text>
    </View>
  );
}

export default function OrderStatusScreen() {
  const tc = useThemeColors();
  const blurTint = useIsDark() ? 'dark' : 'light';
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getOrder } = useOrders();

  const [order, setOrder] = useState<Order | undefined>();
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const load = useCallback(async () => {
    if (!id) return;
    const data = await getOrder(id);
    if (data) setOrder(data);
    setLoading(false);
  }, [getOrder, id]);

  useEffect(() => { load(); }, [load]);

  // Polling cada 10s si está en un estado activo
  useEffect(() => {
    if (!order || order.status === 'completed' || order.status === 'cancelled') {
      clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(load, POLL_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, [order?.status, load]);

  if (loading) {
    return (
      <LinearGradient colors={wash(tc)} style={styles.bg}>
        <AnimatedBackground variant="minimal" />
        <View style={styles.center}>
          <ActivityIndicator color={TOKENS.color.signal} size="large" />
        </View>
      </LinearGradient>
    );
  }

  if (!order) {
    return (
      <LinearGradient colors={wash(tc)} style={styles.bg}>
        <AnimatedBackground variant="minimal" />
        <View style={styles.center}>
          <MaterialIcons name="search-off" size={48} color={tc.textSub} />
          <Text style={[styles.notFound, { color: tc.textSub }]}>Orden no encontrada</Text>
          <Pressable onPress={() => safeBack(router, '/(tabs)/orders')}>
            <Text style={[styles.backLink, { color: TOKENS.color.signal }]}>← Volver</Text>
          </Pressable>
        </View>
      </LinearGradient>
    );
  }

  const statusConfig = ORDER_STATUS[order.status] || ORDER_STATUS.pending;
  const statusPalette = TOKENS.status[statusConfig.tone];
  const date = new Date(order.createdAt).toLocaleDateString('es-AR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <LinearGradient
      colors={wash(tc)}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.bg}
    >
      <AnimatedBackground variant="minimal" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} tintColor={TOKENS.color.signal} />
        }
      >
        <ScreenHeader title="Seguimiento" onBack={() => safeBack(router, '/(tabs)/orders')} />

        {/* Hero status */}
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 14 }}
        >
          <View style={styles.heroCardShadow}>
            <BlurView intensity={30} tint={blurTint} style={[styles.heroCard, { borderColor: tc.cardBorder }]}>
              <View style={[styles.heroIcon, { backgroundColor: statusPalette.bg }]}>
                <MaterialIcons name={statusConfig.icon} size={40} color={statusPalette.fg} />
              </View>
              <Text style={[styles.heroLabel, { color: tc.text }]}>{statusConfig.label}</Text>
              <Text style={[styles.heroDesc, { color: tc.textSub }]}>{statusConfig.desc}</Text>
              <CountdownTimer createdAt={order.createdAt} status={order.status} />
            </BlurView>
          </View>
        </MotiView>

        {/* Timeline */}
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 100 }}
        >
          <View style={styles.cardShadow}>
            <BlurView intensity={25} tint={blurTint} style={[styles.card, { borderColor: tc.cardBorder }]}>
              <Text style={[styles.sectionTitle, { color: tc.text }]}>Progreso</Text>
              <LiveTimeline status={order.status} />
            </BlurView>
          </View>
        </MotiView>

        {/* Service info */}
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 180 }}
        >
          <View style={styles.cardShadow}>
            <BlurView intensity={25} tint={blurTint} style={[styles.card, { borderColor: tc.cardBorder }]}>
              <Text style={[styles.sectionTitle, { color: tc.text }]}>Detalle del servicio</Text>
              <Text style={[styles.serviceName, { color: tc.text }]}>{order.service?.title || 'Servicio'}</Text>
              {order.agreedPrice != null && (
                <View style={styles.infoRow}>
                  <MaterialIcons name="attach-money" size={16} color={tc.textSub} />
                  <Text style={[styles.infoText, { color: tc.textSub }]}>
                    ${order.agreedPrice.toLocaleString('es-AR')}
                  </Text>
                </View>
              )}
              <View style={styles.infoRow}>
                <MaterialIcons name="calendar-today" size={16} color={tc.textSub} />
                <Text style={[styles.infoText, { color: tc.textSub }]}>{date}</Text>
              </View>
              {order.address && (
                <View style={styles.infoRow}>
                  <MaterialIcons name="location-on" size={16} color={tc.textSub} />
                  <Text style={[styles.infoText, { color: tc.textSub }]}>{order.address}</Text>
                </View>
              )}
            </BlurView>
          </View>
        </MotiView>

        {/* Quick actions */}
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 260 }}
          style={styles.actionsWrap}
        >
          <Pressable
            style={({ pressed }) => [styles.actionBtn, { backgroundColor: tc.accent, borderColor: tc.border }, pressed && styles.btnPressed]}
            onPress={() => router.push({ pathname: '/orders/[id]', params: { id: order.id } })}
          >
            <MaterialIcons name="info-outline" size={20} color={TOKENS.color.signal} />
            <Text style={styles.actionBtnText}>Ver detalle completo</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.actionBtn, { backgroundColor: tc.accent, borderColor: tc.border }, pressed && styles.btnPressed]}
            onPress={() => router.push({ pathname: '/chat/[id]', params: { id: order.id } })}
          >
            <MaterialIcons name="chat-bubble-outline" size={20} color={TOKENS.color.signal} />
            <Text style={styles.actionBtnText}>Ir al chat</Text>
          </Pressable>
        </MotiView>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.md },
  scroll: { paddingTop: 60, paddingBottom: SPACING.huge, paddingHorizontal: SPACING.xl, gap: 14 },
  notFound: { fontSize: 16, fontFamily: FONT_FAMILY.body },
  backLink: { fontSize: 15, fontFamily: FONT_FAMILY.headingMedium },
  heroCardShadow: {
    borderRadius: TOKENS.radius.xl,
    ...TOKENS.shadow.soft,
  },
  heroCard: {
    borderRadius: TOKENS.radius.xl, overflow: 'hidden', padding: 28, borderWidth: 1.5,
    alignItems: 'center', gap: 10,
  },
  heroIcon: {
    width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center',
  },
  heroLabel: { fontSize: 22, fontFamily: FONT_FAMILY.display, textAlign: 'center' },
  heroDesc: { fontSize: 14, fontFamily: FONT_FAMILY.body, textAlign: 'center', lineHeight: 20 },
  countdownRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: SPACING.xs,
    paddingHorizontal: SPACING.md, paddingVertical: 6, borderRadius: SPACING.sm,
  },
  countdownText: { fontSize: 12, fontFamily: FONT_FAMILY.bodyMedium },
  timelineWrap: { gap: 0, paddingTop: SPACING.sm },
  timelineItem: { flexDirection: 'row', gap: 14 },
  timelineCol: { alignItems: 'center', width: 32 },
  timelineNode: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  nodeDone: { backgroundColor: TOKENS.color.primary },
  nodeActive: {
    backgroundColor: TOKENS.color.primary,
    shadowColor: TOKENS.color.primary, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
  },
  timelineConnector: { width: 2, height: 28, marginTop: 2 },
  connectorDone: { backgroundColor: TOKENS.color.primary },
  timelineContent: { paddingTop: 6, paddingBottom: SPACING.lg, flex: 1 },
  stepLabel: { fontSize: 14, fontFamily: FONT_FAMILY.headingMedium },
  stepDesc: { fontSize: 12, fontFamily: FONT_FAMILY.body, marginTop: 2 },
  stepActiveDesc: { fontFamily: FONT_FAMILY.bodyMedium },
  terminalBanner: {
    flexDirection: 'row', gap: 14, alignItems: 'center',
    borderRadius: TOKENS.radius.sm, padding: SPACING.lg,
  },
  terminalTextWrap: { flex: 1, gap: SPACING.xs },
  terminalTitle: { fontSize: 17, fontFamily: FONT_FAMILY.heading },
  terminalDesc: { fontSize: 13, fontFamily: FONT_FAMILY.body, lineHeight: 18 },
  cardShadow: {
    borderRadius: TOKENS.radius.lg,
    ...TOKENS.shadow.soft,
  },
  card: {
    borderRadius: TOKENS.radius.lg, overflow: 'hidden', padding: 18, borderWidth: 1.5, gap: SPACING.sm,
  },
  sectionTitle: { fontSize: 14, fontFamily: FONT_FAMILY.heading, marginBottom: 2 },
  serviceName: { fontSize: 16, fontFamily: FONT_FAMILY.headingMedium },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoText: { fontSize: 13, fontFamily: FONT_FAMILY.body, flex: 1 },
  actionsWrap: { gap: 10 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm,
    padding: 14, borderRadius: 14, borderWidth: 1,
  },
  actionBtnText: { fontSize: 14, fontFamily: FONT_FAMILY.headingMedium, color: TOKENS.color.signal },
  btnPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
});
