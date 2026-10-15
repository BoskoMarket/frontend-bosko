import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { safeBack } from '@/core/navigation/safeBack';
import { useOrders } from '../state/OrdersContext';
import { usePayments } from '@/features/payments/state/PaymentContext';
import type { Order } from '../types/orders.types';
import {
  Badge,
  Button,
  Card,
  Divider,
  BRAND_RADIAL_FILL,
  ScreenHeader,
  SPACING,
  TOKENS,
  useIsDark,
  useThemeColors,
} from '@/core/design-system';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { paymentBreakdown } from '@/features/payments/services/mockPayments';
import { getUserErrorMessage } from '@/lib/errors';

function formatCurrency(amount?: number) {
  if (!amount) return '—';
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);
}

function formatDate(iso?: string) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
}

function InfoRow({ icon, text }: { icon: React.ComponentProps<typeof MaterialIcons>['name']; text: string }) {
  const tc = useThemeColors();
  return (
    <View style={s.infoRow}>
      <MaterialIcons name={icon} size={15} color={tc.textSub} />
      <Text style={[s.infoText, { color: tc.textSub }]}>{text}</Text>
    </View>
  );
}

export function CheckoutScreen() {
  const tc = useThemeColors();
  const isDark = useIsDark();
  const insets  = useSafeAreaInsets();
  const params  = useLocalSearchParams<{ orderId: string }>();
  const { getOrder } = useOrders();
  const { initiate } = usePayments();

  const [order, setOrder]     = useState<Order | undefined>();
  const [loading, setLoading] = useState(true);
  const [paying, setPaying]   = useState(false);

  const fade   = useRef(new Animated.Value(0)).current;
  const slideY = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    (async () => {
      if (!params.orderId) { setLoading(false); return; }
      const data = await getOrder(params.orderId);
      setOrder(data);
      setLoading(false);
      Animated.parallel([
        Animated.timing(fade,   { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(slideY, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    })();
  }, [params.orderId]);

  const handlePay = useCallback(async () => {
    if (!order?.id) return;
    setPaying(true);
    try {
      const payment = await initiate(order.id);
      if (payment.status !== 'paid' || !payment.simulated) throw new Error('No se pudo confirmar la simulación.');
      router.replace({
        pathname: '/orders/payment-success',
        params: {
          orderId:     order.id,
          amount:      String(payment.amount),
          serviceName: order.service?.title ?? 'Servicio',
        },
      });
    } catch (err) {
      Alert.alert('Error', getUserErrorMessage(err));
    } finally {
      setPaying(false);
    }
  }, [order, initiate]);

  if (loading) {
    return (
      <View style={[s.root, s.centered, { paddingTop: insets.top, backgroundColor: tc.bg }]}>
        <ActivityIndicator color={TOKENS.color.signal} size="large" />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={[s.root, s.centered, { paddingTop: insets.top, backgroundColor: tc.bg }]}>
        <Text style={[s.errorText, { color: tc.textSub }]}>No se encontró la orden</Text>
        <Pressable onPress={() => safeBack(router, '/(tabs)/orders')} style={s.backLink}>
          <Text style={[s.backLinkText, { color: TOKENS.color.signal }]}>← Volver</Text>
        </Pressable>
      </View>
    );
  }

  const providerName = order.provider
    ? `${order.provider.firstName} ${order.provider.lastName ?? ''}`.trim()
    : 'Proveedor';

  const subtotal = order.agreedPrice ?? 0;
  const validPrice = Number.isFinite(subtotal) && subtotal > 0;
  const { fee, total } = validPrice ? paymentBreakdown(subtotal) : { fee: 0, total: 0 };

  return (
    <View style={[s.root, { paddingTop: insets.top, backgroundColor: tc.bg }]}>
      <AnimatedBackground variant="minimal" />
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={tc.bg} />

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={s.header}>
        <ScreenHeader title="Simular pago" onBack={() => safeBack(router, '/(tabs)/orders')} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 120 }]}
      >
        <Animated.View style={[s.stack, { opacity: fade, transform: [{ translateY: slideY }] }]}>

          {/* ── Resumen del servicio ──────────────────────────────────────── */}
          <Card padding="xl" radius="lg" contentStyle={s.card}>
            <Text style={[s.sectionLabel, { color: tc.textSub }]}>SERVICIO</Text>
            <View style={s.serviceRow}>
              {order.service?.thumbnail ? (
                <Image source={{ uri: order.service.thumbnail }} style={s.thumb} contentFit="cover" />
              ) : (
                <View style={[s.thumbFallback, BRAND_RADIAL_FILL]}>
                  <Ionicons name="construct" size={20} color={TOKENS.color.onPrimary} />
                </View>
              )}
              <View style={s.serviceInfo}>
                <Text style={[s.serviceName, { color: tc.text }]}>{order.service?.title ?? 'Servicio'}</Text>
                <Text style={[s.serviceProvider, { color: tc.textSub }]}>por {providerName}</Text>
              </View>
            </View>

            <Divider spacing="xs" />

            {order.scheduledDate && (
              <InfoRow icon="event" text={formatDate(order.scheduledDate) ?? ''} />
            )}
            {order.address && (
              <InfoRow icon="location-on" text={order.address} />
            )}
            {order.clientMessage ? (
              <InfoRow icon="notes" text={order.clientMessage} />
            ) : null}
          </Card>

          {/* ── Desglose de precio ───────────────────────────────────────── */}
          <Card padding="xl" radius="lg" contentStyle={s.card}>
            <Text style={[s.sectionLabel, { color: tc.textSub }]}>RESUMEN DE PAGO</Text>

            <View style={s.priceRow}>
              <Text style={[s.priceLabel, { color: tc.textSub }]}>Subtotal</Text>
              <Text style={[s.priceValue, { color: tc.text }]}>{formatCurrency(subtotal)}</Text>
            </View>
            <View style={s.priceRow}>
              <View style={s.feeRow}>
                <Text style={[s.priceLabel, { color: tc.textSub }]}>Comisión de servicio</Text>
                <Badge label="5%" tone="brand" size="sm" />
              </View>
              <Text style={[s.priceValue, { color: tc.text }]}>{formatCurrency(fee)}</Text>
            </View>

            <Divider spacing="xs" />

            <View style={s.priceRow}>
              <Text style={[s.totalLabel, { color: tc.text }]}>Total</Text>
              <Text style={[s.totalValue, { color: TOKENS.color.signal }]}>{formatCurrency(total)}</Text>
            </View>
          </Card>

          {/* ── Método ──────────────────────────────────────────────────── */}
          <Card padding="xl" radius="lg" contentStyle={s.methodCard}>
            <View style={[s.methodIcon, { backgroundColor: tc.accent }]}>
              <Ionicons name="shield-checkmark" size={20} color={TOKENS.color.signal} />
            </View>
            <View style={s.flex}>
              <Text style={[s.methodTitle, { color: tc.text }]}>Modo de prueba</Text>
              <Text style={[s.methodSub, { color: tc.textSub }]}>Esta simulación no cobra dinero ni modifica el pago de la orden real.</Text>
            </View>
          </Card>

        </Animated.View>
      </ScrollView>

      {/* ── CTA fija ────────────────────────────────────────────────────── */}
      <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, SPACING.lg), backgroundColor: tc.surface, borderTopColor: tc.border }]}>
        <Text style={[s.footerTotal, { color: tc.text }]}>{formatCurrency(total)}</Text>
        <View style={s.flex}>
          <Button
            label={!validPrice ? 'Falta acordar precio' : order.status !== 'accepted' ? 'Esperando aceptación' : 'Simular pago'}
            icon={<Ionicons name="lock-closed" size={16} color={TOKENS.color.onPrimary} />}
            fullWidth
            loading={paying}
            disabled={!validPrice || order.status !== 'accepted'}
            onPress={handlePay}
          />
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1 },
  flex:    { flex: 1 },
  centered: { alignItems: 'center', justifyContent: 'center' },

  header: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md },

  scroll: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm },
  stack: { gap: 14 },

  card: { gap: 10 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 2,
  },

  serviceRow:     { flexDirection: 'row', alignItems: 'center', gap: 14 },
  thumb:          { width: 54, height: 54, borderRadius: TOKENS.radius.sm },
  thumbFallback:  { width: 54, height: 54, borderRadius: TOKENS.radius.sm, alignItems: 'center', justifyContent: 'center' },
  serviceInfo:    { flex: 1, gap: 3 },
  serviceName:    { fontSize: 16, fontWeight: '700' },
  serviceProvider:{ fontSize: 13 },

  infoRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  infoText: { fontSize: 13, flex: 1 },

  priceRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  priceLabel: { fontSize: 14 },
  priceValue: { fontSize: 14, fontWeight: '500' },

  feeRow:    { flexDirection: 'row', alignItems: 'center', gap: 6 },

  totalLabel:   { fontSize: 16, fontWeight: '700' },
  totalValue:   { fontSize: 18, fontWeight: '800' },

  methodCard:  { flexDirection: 'row', alignItems: 'center', gap: 14 },
  methodIcon:  { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  methodTitle: { fontSize: 14, fontWeight: '600' },
  methodSub:   { fontSize: 12, lineHeight: 17, marginTop: 2 },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingTop: 14,
    borderTopWidth: 1,
    ...TOKENS.shadow.card,
  },
  footerTotal: { fontSize: 20, fontWeight: '800', minWidth: 100 },

  errorText:    { fontSize: 15, marginBottom: SPACING.md },
  backLink:     { paddingHorizontal: SPACING.lg, paddingVertical: 10 },
  backLinkText: { fontWeight: '600' },
});
