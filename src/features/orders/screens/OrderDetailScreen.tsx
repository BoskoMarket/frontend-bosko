/**
 * Rebrand "Señal Nocturna" — OrderDetailScreen: misma lógica, estado y navegación que
 * el archivo original. Mismo timeline, acciones (aceptar/rechazar/iniciar/completar/cancelar/disputar) — íconos de timeline pendiente pasan de tinte bordo apagado a signal.
 */
/**
 * OrderDetailScreen — Detalle completo de una orden.
 * Muestra el estado, timeline, y acciones disponibles según rol y estado.
 * Acciones: aceptar, rechazar, iniciar, completar, cancelar, disputar.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { safeBack } from '@/core/navigation/safeBack';
import { useOrders } from '../state/OrdersContext';
import { useOrder } from '@/hooks/queries/useOrdersQuery';
import { useProfile } from '@/features/profile/state/ProfileContext';
import { OrderStatus } from '../types/orders.types';
import { getUserErrorMessage } from '@/lib/errors';
import { TOKENS } from '@/core/design-system/tokens';
import { useThemeColors } from '@/stores/theme.store';
import { AnimatedBackground } from '@/components/AnimatedBackground';

// Pasos del timeline en orden
const TIMELINE_STEPS: { status: OrderStatus; label: string; icon: string }[] = [
  { status: 'pending',     label: 'Solicitud enviada', icon: 'send' },
  { status: 'accepted',    label: 'Aceptada',          icon: 'check-circle' },
  { status: 'in_progress', label: 'En progreso',       icon: 'build' },
  { status: 'completed',   label: 'Completada',        icon: 'verified' },
];

const STATUS_ORDER: OrderStatus[] = ['pending', 'accepted', 'in_progress', 'completed'];

function Timeline({ currentStatus }: { currentStatus: OrderStatus }) {
  const tc = useThemeColors();
  // Si está cancelada o en disputa, no mostramos el timeline normal
  if (currentStatus === 'cancelled' || currentStatus === 'disputed') {
    return (
      <View style={styles.cancelledBanner}>
        <MaterialIcons
          name={currentStatus === 'cancelled' ? 'cancel' : 'gavel'}
          size={20}
          color={currentStatus === 'cancelled' ? '#dc2626' : '#f59e0b'}
        />
        <Text style={[
          styles.cancelledText,
          { color: currentStatus === 'cancelled' ? '#dc2626' : '#f59e0b' }
        ]}>
          {currentStatus === 'cancelled' ? 'Orden cancelada' : 'En disputa — equipo revisando'}
        </Text>
      </View>
    );
  }

  const currentIdx = STATUS_ORDER.indexOf(currentStatus);

  return (
    <View style={styles.timeline}>
      {TIMELINE_STEPS.map((step, idx) => {
        const done = idx <= currentIdx;
        const active = idx === currentIdx;

        return (
          <View key={step.status} style={styles.timelineStep}>
            <View style={styles.timelineLeft}>
              <View style={[
                styles.timelineDot,
                done && styles.timelineDotDone,
                active && styles.timelineDotActive,
              ]}>
                <MaterialIcons
                  name={step.icon as any}
                  size={14}
                  color={done ? '#fff' : 'rgba(255,45,111,0.35)'}
                />
              </View>
              {idx < TIMELINE_STEPS.length - 1 && (
                <View style={[styles.timelineLine, done && idx < currentIdx && styles.timelineLineDone]} />
              )}
            </View>
            <Text style={[styles.timelineLabel, done && styles.timelineLabelDone, { color: done ? tc.text : tc.textSub }]}>
              {step.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export default function OrderDetailScreen() {
  const tc = useThemeColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id: string }>();
  const { acceptOrder, rejectOrder, startOrder, completeOrder, cancelOrder, disputeOrder } = useOrders();
  const { profile } = useProfile();

  const { data: order, isLoading: loading, refetch: refetchOrder } = useOrder(params.id);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modal de motivo (reemplaza Alert.prompt que no funciona en Android)
  const [reasonModal, setReasonModal] = useState<{
    title: string;
    placeholder: string;
    onConfirm: (reason: string) => void;
  } | null>(null);
  const [reasonText, setReasonText] = useState('');

  const anims = useRef(
    Array.from({ length: 4 }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    Animated.stagger(80, anims.map(v =>
      Animated.timing(v, { toValue: 1, duration: 350, useNativeDriver: true })
    )).start();
  }, []);

  // Determinar si el usuario autenticado es el cliente o el proveedor
  const isClient   = profile?.id === order?.clientId;
  const isProvider = profile?.id === order?.providerId;


  const runAction = async (label: string, action: () => Promise<void>) => {
    setActionLoading(label);
    try {
      await action();
      await refetchOrder(); // Refresca los datos
    } catch (err) {
      Alert.alert(`Error al ${label.toLowerCase()}`, getUserErrorMessage(err));
    } finally {
      setActionLoading(null);
    }
  };

  const promptAndRun = (label: string, placeholder: string, action: (reason: string) => Promise<void>) => {
    setReasonText('');
    setReasonModal({
      title: label,
      placeholder,
      onConfirm: (reason: string) => {
        setReasonModal(null);
        runAction(label, () => action(reason));
      },
    });
  };

  if (loading) {
    return (
      <View style={[styles.background, styles.centered, { paddingTop: insets.top, backgroundColor: tc.bg }]}>
        <AnimatedBackground variant="minimal" />
        <ActivityIndicator color={TOKENS.color.signal} size="large" />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={[styles.background, styles.centered, { paddingTop: insets.top, backgroundColor: tc.bg }]}>
        <AnimatedBackground variant="minimal" />
        <Text style={[styles.notFoundText, { color: tc.textSub }]}>No se encontró la orden</Text>
        <Pressable onPress={() => safeBack(router, '/(tabs)/orders')} style={styles.backLink}>
          <Text style={styles.backLinkText}>← Volver</Text>
        </Pressable>
      </View>
    );
  }

  const date = new Date(order.createdAt).toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <View style={[styles.background, { paddingTop: insets.top, backgroundColor: tc.bg }]}>
      <AnimatedBackground variant="minimal" />
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refetchOrder}
            tintColor={TOKENS.color.signal}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => safeBack(router, '/(tabs)/orders')}
            hitSlop={12}
            style={[styles.backButton, { backgroundColor: tc.card, borderWidth: 1, borderColor: tc.cardBorder }]}
          >
            <MaterialIcons name="arrow-back" size={24} color={tc.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: tc.text }]}>Detalle de orden</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Nombre del servicio + fecha */}
        <Animated.View style={{ opacity: anims[0], transform: [{ translateY: anims[0].interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }}>
          <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
            <Text style={[styles.serviceName, { color: tc.text }]}>{order.service?.title || 'Servicio'}</Text>
            <View style={styles.metaRow}>
              <MaterialIcons name="schedule" size={14} color={tc.textSub} />
              <Text style={[styles.metaText, { color: tc.textSub }]}>{date}</Text>
            </View>
            {order.address && (
              <View style={styles.metaRow}>
                <MaterialIcons name="location-on" size={14} color={tc.textSub} />
                <Text style={[styles.metaText, { color: tc.textSub }]}>{order.address}</Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Timeline */}
        <Animated.View style={{ opacity: anims[1], transform: [{ translateY: anims[1].interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }}>
          <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
            <Text style={[styles.sectionTitle, { color: tc.text }]}>Estado de la orden</Text>
            <Timeline currentStatus={order.status} />
          </View>
        </Animated.View>

        {/* Mensaje del cliente */}
        <Animated.View style={{ opacity: anims[2], transform: [{ translateY: anims[2].interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }}>
          <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
            <Text style={[styles.sectionTitle, { color: tc.text }]}>Mensaje</Text>
            <Text style={[styles.messageText, { color: tc.textSub }]}>{order.clientMessage}</Text>
          </View>
        </Animated.View>

        {/* Botón ir al chat */}
        <Pressable
          style={({ pressed }) => [styles.chatButton, pressed && styles.buttonPressed]}
          onPress={() => router.push({ pathname: '/chat/[id]', params: { id: order.id } })}
        >
          <MaterialIcons name="chat" size={18} color={TOKENS.color.signal} />
          <Text style={styles.chatButtonText}>Abrir chat de esta orden</Text>
          <MaterialIcons name="chevron-right" size={18} color={TOKENS.color.signal} />
        </Pressable>

        {/* Banner de orden completada */}
        {order.status === 'completed' && (
          <View style={styles.completedBanner}>
            <MaterialIcons name="check-circle" size={22} color="#16a34a" />
            <View style={{ flex: 1 }}>
              <Text style={styles.completedTitle}>Orden completada</Text>
              <Text style={styles.completedSub}>
                {isProvider
                  ? 'El trabajo fue marcado como finalizado.'
                  : 'El servicio fue completado. Podés calificarlo.'}
              </Text>
            </View>
          </View>
        )}

        {/* Acciones según rol y estado */}
        <Animated.View style={[styles.actionsContainer, { opacity: anims[3], transform: [{ translateY: anims[3].interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }]}>
          {/* PROVEEDOR: puede aceptar o rechazar si pending */}
          {isProvider && order.status === 'pending' && (
            <>
              <ActionButton
                label="Aceptar"
                icon="check"
                color="#16a34a"
                loading={actionLoading === 'Aceptar'}
                onPress={() => runAction('Aceptar', () => acceptOrder(order.id))}
              />
              <ActionButton
                label="Rechazar"
                icon="close"
                color="#dc2626"
                secondary
                loading={actionLoading === 'Rechazar'}
                onPress={() => promptAndRun(
                  'Rechazar orden',
                  'Ingresá el motivo del rechazo',
                  reason => rejectOrder(order.id, { reason }),
                )}
              />
            </>
          )}

          {/* PROVEEDOR: puede iniciar si accepted */}
          {isProvider && order.status === 'accepted' && (
            <ActionButton
              label="Iniciar trabajo"
              icon="play-arrow"
              color={TOKENS.color.signal}
              loading={actionLoading === 'Iniciar trabajo'}
              onPress={() => runAction('Iniciar trabajo', () => startOrder(order.id))}
            />
          )}

          {/* PROVEEDOR: puede completar si in_progress */}
          {isProvider && order.status === 'in_progress' && (
            <ActionButton
              label="Marcar como completado"
              icon="check-circle"
              color="#16a34a"
              loading={actionLoading === 'Marcar como completado'}
              onPress={() => runAction('Marcar como completado', () => completeOrder(order.id))}
            />
          )}

          {/* CLIENTE: puede cancelar si pending o accepted */}
          {isClient && ['pending', 'accepted'].includes(order.status) && (
            <ActionButton
              label="Cancelar orden"
              icon="cancel"
              color="#dc2626"
              secondary
              loading={actionLoading === 'Cancelar orden'}
              onPress={() => promptAndRun(
                'Cancelar orden',
                'Ingresá el motivo de la cancelación',
                reason => cancelOrder(order.id, { reason }),
              )}
            />
          )}

          {/* CLIENTE: calificar si completado y todavía no calificó */}
          {isClient && order.status === 'completed' && !order.review && (
            <ActionButton
              label="Calificar servicio"
              icon="star"
              color="#FFD700"
              loading={false}
              onPress={() => router.push({
                pathname: '/orders/review',
                params: {
                  orderId: order.id,
                  providerName: order.provider ? `${order.provider.firstName} ${order.provider.lastName || ''}`.trim() : undefined,
                  serviceName: order.service?.title,
                },
              })}
            />
          )}

          {/* CLIENTE: ya calificó esta orden */}
          {isClient && order.status === 'completed' && order.review && (
            <View style={[styles.reviewedBanner, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
              <MaterialIcons name="star" size={18} color="#FFD700" />
              <Text style={[styles.reviewedBannerText, { color: tc.textSub }]}>
                Ya calificaste este servicio ({order.review.rating}/5)
              </Text>
            </View>
          )}

          {/* CLIENTE o PROVEEDOR: puede disputar si in_progress; solo cliente si completed */}
          {((isProvider && order.status === 'in_progress') || (isClient && ['in_progress', 'completed'].includes(order.status))) && (
            <ActionButton
              label="Abrir disputa"
              icon="gavel"
              color="#f59e0b"
              secondary
              loading={actionLoading === 'Abrir disputa'}
              onPress={() => promptAndRun(
                'Abrir disputa',
                'Describí el problema para que el equipo de Bosko pueda ayudarte',
                reason => disputeOrder(order.id, { reason }),
              )}
            />
          )}
        </Animated.View>
      </ScrollView>

      {/* Modal de motivo */}
      <Modal
        visible={!!reasonModal}
        transparent
        animationType="fade"
        onRequestClose={() => setReasonModal(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalBox, { backgroundColor: tc.card }]}>
            <Text style={[styles.modalTitle, { color: tc.text }]}>{reasonModal?.title}</Text>
            <TextInput
              style={[styles.modalInput, { borderColor: tc.border, backgroundColor: tc.surface2, color: tc.text }]}
              placeholder={reasonModal?.placeholder}
              placeholderTextColor={tc.textSub}
              value={reasonText}
              onChangeText={setReasonText}
              multiline
              autoFocus
            />
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalCancel, { borderColor: tc.border }]}
                onPress={() => setReasonModal(null)}
              >
                <Text style={[styles.modalCancelText, { color: tc.textSub }]}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.modalConfirm, !reasonText.trim() && { opacity: 0.4 }]}
                onPress={() => {
                  if (!reasonText.trim()) return;
                  reasonModal?.onConfirm(reasonText.trim());
                }}
                disabled={!reasonText.trim()}
              >
                <Text style={styles.modalConfirmText}>Confirmar</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function ActionButton({
  label, icon, color, secondary, loading, onPress
}: {
  label: string;
  icon: any;
  color: string;
  secondary?: boolean;
  loading?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.actionButton,
        secondary ? { borderWidth: 1.5, borderColor: color, backgroundColor: 'transparent' } : { backgroundColor: color },
        pressed && styles.buttonPressed,
      ]}
      onPress={onPress}
      disabled={loading}
    >
      {loading
        ? <ActivityIndicator color={secondary ? color : '#fff'} size="small" />
        : (
          <>
            <MaterialIcons name={icon} size={18} color={secondary ? color : '#fff'} />
            <Text style={[styles.actionButtonText, secondary && { color }]}>{label}</Text>
          </>
        )
      }
    </Pressable>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  centered: { alignItems: 'center', justifyContent: 'center' },
  container: {
    paddingTop: 8,
    paddingHorizontal: 20,
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TOKENS.color.text,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    padding: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
    gap: 8,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '700',
    color: TOKENS.color.text,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: TOKENS.color.sub,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: TOKENS.color.text,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    color: TOKENS.color.sub,
    lineHeight: 20,
  },
  // Timeline
  timeline: { gap: 0 },
  timelineStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 4,
  },
  timelineLeft: {
    alignItems: 'center',
    width: 28,
  },
  timelineDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(133,0,33,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDotDone: {
    backgroundColor: TOKENS.color.signal,
  },
  timelineDotActive: {
    backgroundColor: TOKENS.color.signal,
    shadowColor: TOKENS.color.signal,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  timelineLine: {
    width: 2,
    height: 24,
    backgroundColor: 'rgba(133,0,33,0.1)',
    marginTop: 2,
  },
  timelineLineDone: {
    backgroundColor: TOKENS.color.signal,
  },
  timelineLabel: {
    fontSize: 14,
    color: TOKENS.color.sub,
    paddingTop: 6,
  },
  timelineLabelDone: {
    color: TOKENS.color.text,
    fontWeight: '600',
  },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f0fdf4',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  completedTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#16a34a',
  },
  completedSub: {
    fontSize: 13,
    color: '#15803d',
    marginTop: 2,
  },
  cancelledBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    padding: 12,
  },
  cancelledText: {
    fontSize: 14,
    fontWeight: '600',
  },
  reviewedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  reviewedBannerText: {
    fontSize: 14,
    fontWeight: '600',
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(133,0,33,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(133,0,33,0.15)',
  },
  chatButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: TOKENS.color.signal,
    flex: 1,
  },
  actionsContainer: { gap: 10 },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    minHeight: 52,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  buttonPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  notFoundText: {
    fontSize: 17,
    color: TOKENS.color.sub,
    marginBottom: 16,
  },
  backLink: { padding: 8 },
  backLinkText: {
    fontSize: 15,
    color: TOKENS.color.signal,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    gap: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: TOKENS.color.text,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: TOKENS.color.text,
    minHeight: 80,
    textAlignVertical: 'top',
    backgroundColor: '#FAFAFA',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: TOKENS.color.sub,
  },
  modalConfirm: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: TOKENS.color.signal,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});

