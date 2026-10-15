/**
 * OrderDetailScreen — Detalle completo de una orden.
 * Muestra el estado, timeline, y acciones disponibles según rol y estado.
 * Acciones: aceptar, rechazar, iniciar, completar, cancelar, disputar.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Modal,
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
import { ORDER_STATUS } from '../constants/orderStatus';
import { getUserErrorMessage } from '@/lib/errors';
import {
  Button,
  Card,
  Input,
  ScreenHeader,
  StepTimeline,
  Text,
  TOKENS,
  SPACING,
  useThemeColors,
  usePremiumColors,
  dialog,
} from '@/core/design-system';
import type { TimelineStep } from '@/core/design-system';
import { AnimatedBackground } from '@/components/AnimatedBackground';

// Pasos del timeline en orden
const TIMELINE_STEPS: { status: OrderStatus; label: string; icon: TimelineStep['icon'] }[] = [
  { status: 'pending',     label: 'Solicitud enviada', icon: 'send' },
  { status: 'accepted',    label: 'Aceptada',          icon: 'checkmark-circle' },
  { status: 'in_progress', label: 'En progreso',       icon: 'construct' },
  { status: 'completed',   label: 'Completada',        icon: 'shield-checkmark' },
];

const STATUS_ORDER: OrderStatus[] = ['pending', 'accepted', 'in_progress', 'completed'];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);
}

function Timeline({ currentStatus }: { currentStatus: OrderStatus }) {
  // Si está cancelada o en disputa, no mostramos el timeline normal
  if (currentStatus === 'cancelled' || currentStatus === 'disputed') {
    const info = ORDER_STATUS[currentStatus];
    const palette = TOKENS.status[info.tone];
    return (
      <View style={[styles.cancelledBanner, { backgroundColor: palette.bg }]}>
        <MaterialIcons name={info.icon} size={20} color={palette.fg} />
        <Text variant="label" color={palette.fg}>
          {currentStatus === 'cancelled' ? 'Orden cancelada' : 'En disputa — equipo revisando'}
        </Text>
      </View>
    );
  }

  const currentIdx = STATUS_ORDER.indexOf(currentStatus);
  const allDone = currentStatus === 'completed';

  const steps: TimelineStep[] = TIMELINE_STEPS.map((step, idx) => ({
    label: step.label,
    icon: step.icon,
    status: idx < currentIdx || allDone ? 'done' : idx === currentIdx ? 'active' : 'pending',
  }));

  return <StepTimeline steps={steps} />;
}

export default function OrderDetailScreen() {
  const tc = useThemeColors();
  const pc = usePremiumColors();
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


  const paymentPending = order?.paymentStatus === 'pending' || order?.paymentStatus === undefined;
  const needsPayment = isClient && paymentPending && ['accepted', 'in_progress', 'completed'].includes(order?.status || '');

  const handlePay = () => {
    if (!order?.id) return;
    router.push({
      pathname: '/orders/checkout',
      params: { orderId: order.id },
    });
  };

  const runAction = async (label: string, action: () => Promise<void>) => {
    setActionLoading(label);
    try {
      await action();
      await refetchOrder(); // Refresca los datos
    } catch (err) {
      dialog.fromAlert(`Error al ${label.toLowerCase()}`, getUserErrorMessage(err));
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

  const enter = (i: number) => ({
    opacity: anims[i],
    transform: [{ translateY: anims[i].interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
  });

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
        <Text variant="subtitle" color={tc.textSub} style={styles.notFoundText}>No se encontró la orden</Text>
        <Pressable onPress={() => safeBack(router, '/(tabs)/orders')} style={styles.backLink}>
          <Text variant="body" color={TOKENS.color.signal} weight="600">← Volver</Text>
        </Pressable>
      </View>
    );
  }

  const date = new Date(order.createdAt).toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const confirmDisabled = !reasonText.trim();

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
        <ScreenHeader title="Detalle de orden" onBack={() => safeBack(router, '/(tabs)/orders')} />

        {/* Nombre del servicio + fecha */}
        <Animated.View style={enter(0)}>
          <Card padding="lg" radius="lg" contentStyle={styles.card}>
            <Text variant="title" color={tc.text}>{order.service?.title || 'Servicio'}</Text>
            <View style={styles.metaRow}>
              <MaterialIcons name="schedule" size={14} color={tc.textSub} />
              <Text variant="bodySmall" color={tc.textSub}>{date}</Text>
            </View>
            {order.address && (
              <View style={styles.metaRow}>
                <MaterialIcons name="location-on" size={14} color={tc.textSub} />
                <Text variant="bodySmall" color={tc.textSub}>{order.address}</Text>
              </View>
            )}
          </Card>
        </Animated.View>

        {/* Timeline */}
        <Animated.View style={enter(1)}>
          <Card padding="lg" radius="lg" contentStyle={styles.card}>
            <Text variant="label" color={tc.text}>Estado de la orden</Text>
            <Timeline currentStatus={order.status} />
          </Card>
        </Animated.View>

        {/* Mensaje del cliente */}
        <Animated.View style={enter(2)}>
          <Card padding="lg" radius="lg" contentStyle={styles.card}>
            <Text variant="label" color={tc.text}>Mensaje</Text>
            <Text variant="body" color={tc.textSub}>{order.clientMessage}</Text>
          </Card>
        </Animated.View>

        {/* Botón ir al chat */}
        <Pressable
          style={({ pressed }) => [styles.chatButton, { backgroundColor: tc.accent, borderColor: tc.border }, pressed && styles.buttonPressed]}
          onPress={() => router.push({ pathname: '/chat/[id]', params: { id: order.id } })}
        >
          <MaterialIcons name="chat" size={18} color={TOKENS.color.signal} />
          <Text variant="label" color={TOKENS.color.signal} style={styles.chatButtonText}>Abrir chat de esta orden</Text>
          <MaterialIcons name="chevron-right" size={18} color={TOKENS.color.signal} />
        </Pressable>

        {/* Banner de reembolso */}
        {order.paymentStatus === 'refunded' && (
          <View style={[styles.banner, { backgroundColor: TOKENS.status.progress.bg }]}>
            <MaterialIcons name="assignment-return" size={22} color={TOKENS.status.progress.fg} />
            <View style={styles.flex}>
              <Text variant="label" color={TOKENS.status.progress.fg}>
                Reembolsado{order.agreedPrice ? ` — ${formatCurrency(order.agreedPrice)}` : ''}
              </Text>
              <Text variant="bodySmall" color={tc.textSub}>
                {order.disputeReason || order.cancellationReason || 'El monto fue devuelto a tu método de pago original.'}
              </Text>
            </View>
          </View>
        )}

        {/* Banner de orden completada */}
        {order.status === 'completed' && (
          <View style={[styles.banner, { backgroundColor: TOKENS.status.done.bg }]}>
            <MaterialIcons name="check-circle" size={22} color={TOKENS.status.done.fg} />
            <View style={styles.flex}>
              <Text variant="label" color={TOKENS.status.done.fg}>Orden completada</Text>
              <Text variant="bodySmall" color={tc.textSub}>
                {isProvider
                  ? 'El trabajo fue marcado como finalizado.'
                  : 'El servicio fue completado. Podés calificarlo.'}
              </Text>
            </View>
          </View>
        )}

        {/* Acciones según rol y estado */}
        <Animated.View style={[styles.actionsContainer, enter(3)]}>
          {/* PROVEEDOR: puede aceptar o rechazar si pending */}
          {isProvider && order.status === 'pending' && (
            <>
              <ActionButton
                label="Aceptar"
                icon="check"
                color={TOKENS.status.done.fg}
                loading={actionLoading === 'Aceptar'}
                onPress={() => runAction('Aceptar', () => acceptOrder(order.id))}
              />
              <ActionButton
                label="Rechazar"
                icon="close"
                color={TOKENS.status.cancelled.fg}
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
              color={TOKENS.status.done.fg}
              loading={actionLoading === 'Marcar como completado'}
              onPress={() => runAction('Marcar como completado', () => completeOrder(order.id))}
            />
          )}

          {/* CLIENTE: puede cancelar si pending o accepted */}
          {isClient && ['pending', 'accepted'].includes(order.status) && (
            <ActionButton
              label="Cancelar orden"
              icon="cancel"
              color={TOKENS.status.cancelled.fg}
              secondary
              loading={actionLoading === 'Cancelar orden'}
              onPress={() => promptAndRun(
                'Cancelar orden',
                'Ingresá el motivo de la cancelación',
                reason => cancelOrder(order.id, { reason }),
              )}
            />
          )}

          {/* CLIENTE: pagar si hay saldo pendiente */}
          {needsPayment && (
            <ActionButton
              label="Pagar orden"
              icon="payment"
              color={TOKENS.status.done.fg}
              loading={actionLoading === 'Pagar'}
              onPress={handlePay}
            />
          )}

          {/* CLIENTE: calificar si completado y todavía no calificó */}
          {isClient && order.status === 'completed' && !order.review && (
            <ActionButton
              label="Calificar servicio"
              icon="star"
              color={pc.goldFill}
              textColor={pc.onGold}
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
              <MaterialIcons name="star" size={18} color={TOKENS.color.rating} />
              <Text variant="label" color={tc.textSub}>
                Ya calificaste este servicio ({order.review.rating}/5)
              </Text>
            </View>
          )}

          {/* CLIENTE o PROVEEDOR: puede disputar si in_progress; solo cliente si completed */}
          {((isProvider && order.status === 'in_progress') || (isClient && ['in_progress', 'completed'].includes(order.status))) && (
            <ActionButton
              label="Abrir disputa"
              icon="gavel"
              color={TOKENS.color.warning}
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
          style={[styles.modalOverlay, { backgroundColor: TOKENS.scrim.medium }]}
        >
          <View style={[styles.modalBox, { backgroundColor: tc.surface }]}>
            <Text variant="subtitle" color={tc.text}>{reasonModal?.title}</Text>
            <Input
              placeholder={reasonModal?.placeholder}
              value={reasonText}
              onChangeText={setReasonText}
              multiline
              autoFocus
            />
            <View style={styles.modalActions}>
              <View style={styles.flex}>
                <Button label="Cancelar" variant="secondary" fullWidth onPress={() => setReasonModal(null)} />
              </View>
              <View style={styles.flex}>
                <Button
                  label="Confirmar"
                  fullWidth
                  disabled={confirmDisabled}
                  onPress={() => {
                    if (confirmDisabled) return;
                    reasonModal?.onConfirm(reasonText.trim());
                  }}
                />
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function ActionButton({
  label, icon, color, textColor = TOKENS.color.onPrimary, secondary, loading, onPress,
}: {
  label: string;
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  color: string;
  /** Label/icon color on a filled button (default: on-primary). */
  textColor?: string;
  secondary?: boolean;
  loading?: boolean;
  onPress: () => void;
}) {
  const fg = secondary ? color : textColor;
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
        ? <ActivityIndicator color={fg} size="small" />
        : (
          <>
            <MaterialIcons name={icon} size={18} color={fg} />
            <Text variant="button" color={fg}>{label}</Text>
          </>
        )
      }
    </Pressable>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  flex: { flex: 1 },
  centered: { alignItems: 'center', justifyContent: 'center' },
  container: {
    paddingTop: SPACING.sm,
    paddingHorizontal: SPACING.xl,
    gap: 14,
  },
  card: { gap: SPACING.sm },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    borderRadius: TOKENS.radius.sm,
    padding: 14,
  },
  cancelledBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    borderRadius: TOKENS.radius.sm,
    padding: SPACING.md,
  },
  reviewedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    borderRadius: TOKENS.radius.sm,
    borderWidth: 1,
    padding: SPACING.md,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    padding: 14,
    borderRadius: TOKENS.radius.md,
    borderWidth: 1,
  },
  chatButtonText: { flex: 1 },
  actionsContainer: { gap: 10 },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: 14,
    paddingHorizontal: SPACING.xl,
    borderRadius: 14,
    minHeight: 52,
  },
  buttonPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  notFoundText: { marginBottom: SPACING.lg },
  backLink: { padding: SPACING.sm },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.xxl,
  },
  modalBox: {
    borderRadius: TOKENS.radius.lg,
    padding: SPACING.xl,
    gap: 14,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
});
