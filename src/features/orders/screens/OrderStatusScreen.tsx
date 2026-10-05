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
import { TOKENS } from '@/core/design-system/tokens';
import { useThemeColors } from '@/stores/theme.store';
import { AnimatedBackground } from '@/components/AnimatedBackground';

const POLL_INTERVAL = 10000;

const STATUS_FLOW: OrderStatus[] = ['pending', 'accepted', 'in_progress', 'completed'];

const STATUS_DETAILS: Record<OrderStatus, { label: string; desc: string; icon: any; color: string }> = {
  pending:     { label: 'Pendiente',     desc: 'Esperando respuesta del proveedor', icon: 'hourglass-empty', color: '#d97706' },
  accepted:    { label: 'Aceptada',      desc: 'El proveedor confirmó el servicio', icon: 'check-circle',    color: '#2563eb' },
  in_progress: { label: 'En progreso',   desc: 'El proveedor está trabajando',      icon: 'build',           color: '#7c3aed' },
  completed:   { label: 'Completada',    desc: 'Trabajo terminado exitosamente',    icon: 'verified',        color: '#16a34a' },
  cancelled:   { label: 'Cancelada',     desc: 'La orden fue cancelada',            icon: 'cancel',          color: '#dc2626' },
  disputed:    { label: 'En disputa',    desc: 'Equipo Bosko está revisando',       icon: 'gavel',           color: '#f59e0b' },
};

function LiveTimeline({ status }: { status: OrderStatus }) {
  const tc = useThemeColors();
  const isTerminal = status === 'cancelled' || status === 'disputed';

  return (
    <View style={styles.timelineWrap}>
      {isTerminal ? (
        <View style={styles.terminalBanner}>
          <MaterialIcons
            name={STATUS_DETAILS[status].icon}
            size={28}
            color={STATUS_DETAILS[status].color}
          />
          <View style={styles.terminalTextWrap}>
            <Text style={[styles.terminalTitle, { color: STATUS_DETAILS[status].color }]}>
              {STATUS_DETAILS[status].label}
            </Text>
            <Text style={styles.terminalDesc}>{STATUS_DETAILS[status].desc}</Text>
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
                <View style={[styles.timelineNode, done && styles.nodeDone, active && styles.nodeActive]}>
                  <MaterialIcons
                    name={STATUS_DETAILS[step].icon}
                    size={16}
                    color={done ? '#fff' : 'rgba(133,0,33,0.25)'}
                  />
                </View>
                {idx < STATUS_FLOW.length - 1 && (
                  <View style={[styles.timelineConnector, done && idx < currentIdx && styles.connectorDone]} />
                )}
              </View>
              <View style={styles.timelineContent}>
                <Text style={[styles.stepLabel, done && styles.stepDone, { color: done ? tc.text : tc.textSub }]}>
                  {STATUS_DETAILS[step].label}
                </Text>
                <Text style={[styles.stepDesc, active && styles.stepActiveDesc, { color: active ? TOKENS.color.primary : tc.textSub }]}>
                  {STATUS_DETAILS[step].desc}
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
    <View style={styles.countdownRow}>
      <MaterialIcons name="access-time" size={16} color="#d97706" />
      <Text style={styles.countdownText}>
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
      <LinearGradient colors={['#fdf2f4', '#fef7ff', '#f0f4ff']} style={styles.bg}>
        <AnimatedBackground variant="minimal" />
        <View style={styles.center}>
          <ActivityIndicator color={TOKENS.color.primary} size="large" />
        </View>
      </LinearGradient>
    );
  }

  if (!order) {
    return (
      <LinearGradient colors={['#fdf2f4', '#fef7ff', '#f0f4ff']} style={styles.bg}>
        <AnimatedBackground variant="minimal" />
        <View style={styles.center}>
          <MaterialIcons name="search-off" size={48} color={tc.textSub} />
          <Text style={[styles.notFound, { color: tc.textSub }]}>Orden no encontrada</Text>
          <Pressable onPress={() => safeBack(router, '/(tabs)/orders')}>
            <Text style={styles.backLink}>← Volver</Text>
          </Pressable>
        </View>
      </LinearGradient>
    );
  }

  const statusConfig = STATUS_DETAILS[order.status] || STATUS_DETAILS.pending;
  const date = new Date(order.createdAt).toLocaleDateString('es-AR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <LinearGradient
      colors={['#fdf2f4', '#fef7ff', '#f0f4ff']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.bg}
    >
      <AnimatedBackground variant="minimal" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} tintColor={TOKENS.color.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => safeBack(router, '/(tabs)/orders')} hitSlop={12} style={[styles.backBtn, { backgroundColor: tc.surface }]}>
            <MaterialIcons name="arrow-back" size={24} color={tc.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: tc.text }]}>Seguimiento</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Hero status */}
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 14 }}
        >
          <View style={styles.heroCardShadow}>
            <BlurView intensity={30} tint="light" style={[styles.heroCard, { borderColor: tc.cardBorder }]}>
              <View style={[styles.heroIcon, { backgroundColor: statusConfig.color + '20' }]}>
                <MaterialIcons name={statusConfig.icon} size={40} color={statusConfig.color} />
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
            <BlurView intensity={25} tint="light" style={[styles.card, { borderColor: tc.cardBorder }]}>
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
            <BlurView intensity={25} tint="light" style={[styles.card, { borderColor: tc.cardBorder }]}>
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
            style={({ pressed }) => [styles.actionBtn, pressed && styles.btnPressed]}
            onPress={() => router.push({ pathname: '/orders/[id]', params: { id: order.id } })}
          >
            <MaterialIcons name="info-outline" size={20} color={TOKENS.color.primary} />
            <Text style={styles.actionBtnText}>Ver detalle completo</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.actionBtn, pressed && styles.btnPressed]}
            onPress={() => router.push({ pathname: '/chat/[id]', params: { id: order.id } })}
          >
            <MaterialIcons name="chat-bubble-outline" size={20} color={TOKENS.color.primary} />
            <Text style={styles.actionBtnText}>Ir al chat</Text>
          </Pressable>
        </MotiView>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  scroll: { paddingTop: 60, paddingBottom: 40, paddingHorizontal: 20, gap: 14 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4,
  },
  backBtn: {
    padding: 8, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.6)',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: TOKENS.color.text },
  notFound: { fontSize: 16, color: TOKENS.color.sub },
  backLink: { fontSize: 15, color: TOKENS.color.primary, fontWeight: '600' },
  heroCardShadow: {
    borderRadius: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06, shadowRadius: 12, elevation: 4,
  },
  heroCard: {
    borderRadius: 24, overflow: 'hidden', padding: 28, borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)', alignItems: 'center', gap: 10,
  },
  heroIcon: {
    width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center',
  },
  heroLabel: { fontSize: 22, fontWeight: '800', color: TOKENS.color.text, textAlign: 'center' },
  heroDesc: { fontSize: 14, color: TOKENS.color.sub, textAlign: 'center', lineHeight: 20 },
  countdownRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4,
    backgroundColor: '#fef3c7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
  },
  countdownText: { fontSize: 12, color: '#92400e', fontWeight: '500' },
  timelineWrap: { gap: 0, paddingTop: 8 },
  timelineItem: { flexDirection: 'row', gap: 14 },
  timelineCol: { alignItems: 'center', width: 32 },
  timelineNode: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(133,0,33,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  nodeDone: { backgroundColor: TOKENS.color.primary },
  nodeActive: {
    backgroundColor: TOKENS.color.primary,
    shadowColor: TOKENS.color.primary, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
  },
  timelineConnector: {
    width: 2, height: 28, backgroundColor: 'rgba(133,0,33,0.1)', marginTop: 2,
  },
  connectorDone: { backgroundColor: TOKENS.color.primary },
  timelineContent: { paddingTop: 6, paddingBottom: 16, flex: 1 },
  stepLabel: { fontSize: 14, fontWeight: '600', color: TOKENS.color.sub },
  stepDone: { color: TOKENS.color.text },
  stepDesc: { fontSize: 12, color: TOKENS.color.sub, marginTop: 2 },
  stepActiveDesc: { color: TOKENS.color.primary, fontWeight: '500' },
  terminalBanner: {
    flexDirection: 'row', gap: 14, alignItems: 'center',
    backgroundColor: '#fef2f2', borderRadius: 14, padding: 16,
  },
  terminalTextWrap: { flex: 1, gap: 4 },
  terminalTitle: { fontSize: 17, fontWeight: '700' },
  terminalDesc: { fontSize: 13, lineHeight: 18 },
  cardShadow: {
    borderRadius: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06, shadowRadius: 12, elevation: 4,
  },
  card: {
    borderRadius: 20, overflow: 'hidden', padding: 18, borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)', gap: 8,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: TOKENS.color.text, marginBottom: 2 },
  serviceName: { fontSize: 16, fontWeight: '600', color: TOKENS.color.text },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoText: { fontSize: 13, color: TOKENS.color.sub, flex: 1 },
  actionsWrap: { gap: 10 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: 14, borderRadius: 14,
    backgroundColor: 'rgba(133,0,33,0.06)', borderWidth: 1, borderColor: 'rgba(133,0,33,0.15)',
  },
  actionBtnText: { fontSize: 14, fontWeight: '600', color: TOKENS.color.primary },
  btnPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
});
