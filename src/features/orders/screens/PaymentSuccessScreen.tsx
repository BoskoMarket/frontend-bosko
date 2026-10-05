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
import { TOKENS } from '@/core/design-system/tokens';
import { useThemeColors } from '@/stores/theme.store';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { useOrderPayment } from '@/hooks/queries/usePaymentsQuery';

function useC() {
  const tc = useThemeColors();
  return {
    primary: TOKENS.color.primary,
    dark:    TOKENS.color.primaryDark,
    bg:      tc.bg,
    card:    tc.card,
    text:    tc.text,
    sub:     tc.textSub,
    green:   '#16A34A',
    greenBg: '#F0FFF4',
  };
}

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
  const C = useC();
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

  if (paymentQuery.isLoading) return <View style={[s.root, { backgroundColor: C.bg, justifyContent: 'center' }]}><ActivityIndicator /></View>;
  if (!payment?.simulated || payment.status !== 'paid') return (
    <View style={[s.root, { backgroundColor: C.bg, justifyContent: 'center', padding: 24 }]}>
      <Text style={{ color: C.text }}>No encontramos una simulación confirmada para esta orden.</Text>
      <Pressable onPress={goHome}><Text style={{ color: C.primary, marginTop: 24 }}>Volver al inicio</Text></Pressable>
    </View>
  );

  return (
    <View style={[s.root, { backgroundColor: C.bg, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <AnimatedBackground variant="minimal" />
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* ── Success icon ────────────────────────────────────────────────── */}
      <View style={s.iconSection}>
        {/* Outer ring */}
        <Animated.View style={[s.outerRing, { transform: [{ scale: bgScale }] }]} />

        {/* Inner circle */}
        <View style={s.innerCircleShadow}>
          <Animated.View
            style={[
              s.innerCircle,
              { transform: [{ scale: Animated.multiply(checkScale, pulse) }], opacity: checkFade },
            ]}
          >
            <LinearGradient
              colors={[C.green, '#15803d']}
              style={s.checkGradient}
            >
              <Ionicons name="checkmark" size={48} color="#fff" />
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
        <Text style={[s.title, { color: C.text }]}>Simulación completada</Text>
        <Text style={[s.subtitle, { color: C.sub }]}>No se cobró dinero ni se notificó un pago al proveedor.</Text>

        {/* Amount pill */}
        <View style={[s.amountPill, { backgroundColor: C.card }]}>
          <Text style={[s.amountLabel, { color: C.sub }]}>Monto simulado</Text>
          <Text style={s.amountValue}>{formatCurrency(String(payment.amount))}</Text>
        </View>

        {/* Service card */}
        <View style={[s.detailCard, { backgroundColor: C.card }]}>
          <View style={s.detailRow}>
            <View style={s.detailIcon}>
              <Ionicons name="construct-outline" size={16} color={C.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.detailLabel, { color: C.sub }]}>Servicio</Text>
              <Text style={[s.detailValue, { color: C.text }]}>{payment.order?.title ?? 'Servicio'}</Text>
            </View>
          </View>

          <View style={s.detailDivider} />

          <View style={s.detailRow}>
            <View style={[s.detailIcon, { backgroundColor: '#F0FFF4' }]}>
              <Ionicons name="shield-checkmark-outline" size={16} color={C.green} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.detailLabel, { color: C.sub }]}>Estado del pago</Text>
              <Text style={[s.detailValue, { color: C.green }]}>Simulado · sin movimiento de dinero</Text>
            </View>
          </View>
        </View>

        <Text style={[s.escrowNote, { color: C.sub }]}>
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
        <Pressable onPress={goToOrder} style={s.primaryBtn}>
          <LinearGradient
            colors={[C.dark, C.primary, '#c0002f']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={s.primaryBtnGrad}
          >
            <Ionicons name="receipt-outline" size={18} color="#fff" />
            <Text style={s.primaryBtnText}>Ver estado de la orden</Text>
          </LinearGradient>
        </Pressable>

        <Pressable onPress={goHome} style={s.secondaryBtn}>
          <Text style={[s.secondaryBtnText, { color: C.sub }]}>Ir al inicio</Text>
        </Pressable>
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
    paddingHorizontal: 24,
    paddingVertical: 32,
  },

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
    backgroundColor: '#F0FFF4',
    borderWidth: 2,
    borderColor: '#BBF7D0',
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
    shadowColor: '#16A34A',
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
    gap: 16,
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
    borderRadius: 16,
    paddingHorizontal: 28,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  amountLabel: { fontSize: 12, fontWeight: '500' },
  amountValue: { fontSize: 26, fontWeight: '800', color: TOKENS.color.primary, letterSpacing: -0.5 },

  detailCard: {
    width: '100%',
    borderRadius: 16,
    padding: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  detailRow:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  detailIcon:    { width: 36, height: 36, borderRadius: 10, backgroundColor: '#FFF0F3', alignItems: 'center', justifyContent: 'center' },
  detailLabel:   { fontSize: 11, marginBottom: 1 },
  detailValue:   { fontSize: 14, fontWeight: '600' },
  detailDivider: { height: 1, backgroundColor: '#EDEDF0' },

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
  primaryBtn:     { borderRadius: 15, overflow: 'hidden' },
  primaryBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  primaryBtnText:   { fontSize: 16, fontWeight: '700', color: '#fff' },
  secondaryBtn:     { alignItems: 'center', paddingVertical: 14 },
  secondaryBtnText: { fontSize: 15, fontWeight: '600' },
});
