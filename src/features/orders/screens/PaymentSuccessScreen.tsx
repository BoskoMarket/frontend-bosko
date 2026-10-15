import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Button,
  Card,
  Divider,
  GRADIENTS,
  SPACING,
  TOKENS,
  useIsDark,
  useThemeColors,
} from '@/core/design-system';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { useOrderPayment } from '@/hooks/queries/usePaymentsQuery';

function formatCurrency(amount: string | undefined) {
  const n = parseFloat(amount ?? '0');
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n);
}

export function PaymentSuccessScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    orderId:     string;
    amount:      string;
    serviceName: string;
  }>();
  const tc = useThemeColors();
  const isDark = useIsDark();
  const paymentQuery = useOrderPayment(params.orderId);
  const payment = paymentQuery.data;

  // Animations
  const bgScale   = useRef(new Animated.Value(0)).current;
  const checkFade = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0.4)).current;
  const contentFade = useRef(new Animated.Value(0)).current;
  const contentY    = useRef(new Animated.Value(30)).current;
  const pulse       = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      // 1. background ring expands
      Animated.spring(bgScale, { toValue: 1, friction: 5, useNativeDriver: true }),
      // 2. checkmark pops in
      Animated.parallel([
        Animated.spring(checkScale, { toValue: 1, friction: 5, useNativeDriver: true }),
        Animated.timing(checkFade,  { toValue: 1, duration: 200, useNativeDriver: true }),
      ]),
      // 3. content slides up
      Animated.parallel([
        Animated.timing(contentFade, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.spring(contentY,    { toValue: 0, friction: 7, useNativeDriver: true }),
      ]),
    ]).start(() => {
      // subtle pulse on checkmark
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.08, duration: 900, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1,    duration: 900, useNativeDriver: true }),
        ])
      ).start();
    });
  }, []);

  const goToOrder = () => {
    router.replace({
      pathname: '/orders/[id]',
      params: { id: params.orderId },
    });
  };

  const goHome = () => router.replace('/(tabs)');

  if (paymentQuery.isLoading) return <View style={[s.root, { backgroundColor: tc.bg, justifyContent: 'center' }]}><ActivityIndicator color={TOKENS.color.signal} /></View>;
  if (!payment?.simulated || payment.status !== 'paid') return (
    <View style={[s.root, { backgroundColor: tc.bg, justifyContent: 'center', padding: SPACING.xxl }]}>
      <Text style={{ color: tc.text }}>No encontramos una simulación confirmada para esta orden.</Text>
      <Pressable onPress={goHome}><Text style={{ color: TOKENS.color.signal, marginTop: SPACING.xxl }}>Volver al inicio</Text></Pressable>
    </View>
  );

  return (
    <View style={[s.root, { backgroundColor: tc.bg, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <AnimatedBackground variant="minimal" />
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={tc.bg} />

      {/* ── Success icon ────────────────────────────────────────────────── */}
      <View style={s.iconSection}>
        {/* Outer ring */}
        <Animated.View
          style={[
            s.outerRing,
            { backgroundColor: TOKENS.status.done.bg, borderColor: TOKENS.status.done.fg, transform: [{ scale: bgScale }] },
          ]}
        />

        {/* Inner circle */}
        <View style={s.innerCircleShadow}>
          <Animated.View
            style={[
              s.innerCircle,
              { transform: [{ scale: Animated.multiply(checkScale, pulse) }], opacity: checkFade },
            ]}
          >
            <LinearGradient
              colors={GRADIENTS.success}
              style={s.checkGradient}
            >
              <Ionicons name="checkmark" size={48} color={TOKENS.color.onPrimary} />
            </LinearGradient>
          </Animated.View>
        </View>
      </View>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <Animated.View
        style={[
          s.content,
          { opacity: contentFade, transform: [{ translateY: contentY }] },
        ]}
      >
        <Text style={[s.title, { color: tc.text }]}>Simulación completada</Text>
        <Text style={[s.subtitle, { color: tc.textSub }]}>No se cobró dinero ni se notificó un pago al proveedor.</Text>

        {/* Amount pill */}
        <Card padding="lg" radius="md" contentStyle={s.amountPill}>
          <Text style={[s.amountLabel, { color: tc.textSub }]}>Monto simulado</Text>
          <Text style={[s.amountValue, { color: TOKENS.color.signal }]}>{formatCurrency(String(payment.amount))}</Text>
        </Card>

        {/* Service card */}
        <Card padding="lg" radius="md" style={s.detailWrap} contentStyle={s.detailCard}>
          <View style={s.detailRow}>
            <View style={[s.detailIcon, { backgroundColor: tc.accent }]}>
              <Ionicons name="construct-outline" size={16} color={TOKENS.color.signal} />
            </View>
            <View style={s.flex}>
              <Text style={[s.detailLabel, { color: tc.textSub }]}>Servicio</Text>
              <Text style={[s.detailValue, { color: tc.text }]}>{payment.order?.title ?? 'Servicio'}</Text>
            </View>
          </View>

          <Divider />

          <View style={s.detailRow}>
            <View style={[s.detailIcon, { backgroundColor: TOKENS.status.done.bg }]}>
              <Ionicons name="shield-checkmark-outline" size={16} color={TOKENS.status.done.fg} />
            </View>
            <View style={s.flex}>
              <Text style={[s.detailLabel, { color: tc.textSub }]}>Estado del pago</Text>
              <Text style={[s.detailValue, { color: TOKENS.status.done.fg }]}>Simulado · sin movimiento de dinero</Text>
            </View>
          </View>
        </Card>

        <Text style={[s.escrowNote, { color: tc.textSub }]}>
          La orden conserva su estado real. Este comprobante corresponde únicamente a una prueba en este dispositivo.
        </Text>
      </Animated.View>

      {/* ── CTAs ────────────────────────────────────────────────────────── */}
      <Animated.View
        style={[
          s.ctaSection,
          { opacity: contentFade, transform: [{ translateY: contentY }] },
        ]}
      >
        <Button
          label="Ver estado de la orden"
          icon={<Ionicons name="receipt-outline" size={18} color={TOKENS.color.onPrimary} />}
          fullWidth
          onPress={goToOrder}
        />

        <Button label="Ir al inicio" variant="ghost" fullWidth onPress={goHome} />
      </Animated.View>
    </View>
  );
}

const RING_SIZE = 180;
const CIRCLE_SIZE = 120;

const s = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.xxxl,
  },
  flex: { flex: 1 },

  iconSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRing: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 2,
  },
  innerCircle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    overflow: 'hidden',
  },
  innerCircleShadow: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    shadowColor: TOKENS.color.mint,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  checkGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  content: {
    flex: 2,
    width: '100%',
    alignItems: 'center',
    gap: SPACING.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },

  amountPill: {
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: 28,
  },
  amountLabel: { fontSize: 12, fontWeight: '500' },
  amountValue: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },

  detailWrap: { width: '100%' },
  detailCard: { gap: 10 },
  detailRow:     { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  detailIcon:    { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  detailLabel:   { fontSize: 11, marginBottom: 1 },
  detailValue:   { fontSize: 14, fontWeight: '600' },

  escrowNote: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },

  ctaSection: {
    width: '100%',
    gap: 10,
  },
});
