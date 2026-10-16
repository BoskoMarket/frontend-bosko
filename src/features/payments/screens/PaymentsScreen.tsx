import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { safeBack } from '@/core/navigation/safeBack';
import { usePayments } from '../state/PaymentContext';
import { PaymentHistoryItem, EarningsItem, PaymentStatus } from '../services/payments';
import {
  Badge,
  EmptyState,
  ScreenHeader,
  SPACING,
  TOKENS,
  useThemeColors,
  wash,
} from '@/core/design-system';
import type { BadgeTone } from '@/core/design-system';
import { AnimatedBackground } from '@/components/AnimatedBackground';

type Tab = 'history' | 'earnings';

const STATUS_CONFIG: Record<PaymentStatus, { label: string; tone: BadgeTone }> = {
  pending: { label: 'Pendiente', tone: 'pending' },
  paid: { label: 'Pagado', tone: 'done' },
  released: { label: 'Liberado', tone: 'accepted' },
  refunded: { label: 'Reembolsado', tone: 'progress' },
  failed: { label: 'Fallido', tone: 'cancelled' },
};

function formatCurrency(amount: number, currency = 'ARS') {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(amount);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function StatusBadge({ status }: { status: PaymentStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return <Badge label={cfg.label} tone={cfg.tone} size="sm" />;
}

function AnimatedItem({ index, children }: { index: number; children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 300, delay: index * 40, useNativeDriver: true }),
      Animated.timing(ty, { toValue: 0, duration: 300, delay: index * 40, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY: ty }] }}>
      {children}
    </Animated.View>
  );
}

export default function PaymentsScreen() {
  const tc = useThemeColors();
  const { history, earnings, loading, loadHistory, loadEarnings } = usePayments();
  const [tab, setTab] = useState<Tab>('history');

  useEffect(() => {
    if (tab === 'history') loadHistory().catch(() => { });
    else loadEarnings().catch(() => { });
  }, [tab]);

  const renderHistoryItem = ({ item, index }: { item: PaymentHistoryItem; index: number }) => (
    <AnimatedItem index={index}>
      <View style={s.cardShadow}>
        <Pressable
          style={({ pressed }) => [s.card, pressed && s.cardPressed]}
          onPress={() => item.orderId && router.push(`/orders/${item.orderId}`)}
        >
          <View style={[s.cardInner, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
            <View style={s.cardRow}>
              <View style={[s.cardIcon, { backgroundColor: tc.accent }]}>
                <MaterialIcons name="payment" size={22} color={TOKENS.color.signal} />
              </View>
              <View style={s.flex}>
                <Text style={[s.cardTitle, { color: tc.text }]} numberOfLines={1}>
                  {item.order?.title ?? `Orden #${item.orderId.slice(-6)}`}
                </Text>
                <Text style={[s.cardDate, { color: tc.textSub }]}>{formatDate(item.createdAt)}</Text>
              </View>
              <View style={s.amountCol}>
                <Text style={[s.cardAmount, { color: tc.text }]}>{formatCurrency(item.amount, item.currency)}</Text>
                <StatusBadge status={item.status} />
              </View>
            </View>
          </View>
        </Pressable>
      </View>
    </AnimatedItem>
  );

  const renderEarningsItem = ({ item, index }: { item: EarningsItem; index: number }) => (
    <AnimatedItem index={index}>
      <View style={[s.earningsCard, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
        <View style={[s.earningsIcon, { backgroundColor: TOKENS.status.done.bg }]}>
          <MaterialIcons name="attach-money" size={22} color={TOKENS.status.done.fg} />
        </View>
        <View style={s.flex}>
          <Text style={[s.cardTitle, { color: tc.text }]} numberOfLines={1}>
            {item.order?.title ?? `Orden #${item.orderId.slice(-6)}`}
          </Text>
          <Text style={[s.cardDate, { color: tc.textSub }]}>{formatDate(item.createdAt)}</Text>
        </View>
        <View style={s.amountCol}>
          <Text style={[s.earningsAmount, { color: TOKENS.status.done.fg }]}>{formatCurrency(item.amount, item.currency)}</Text>
          <StatusBadge status={item.status} />
        </View>
      </View>
    </AnimatedItem>
  );

  const isEmpty = tab === 'history' ? history.length === 0 : earnings.length === 0;

  return (
    <LinearGradient
      colors={wash(tc)}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={s.bg}
    >
      <AnimatedBackground variant="minimal" />

      {/* Header */}
      <View style={s.header}>
        <ScreenHeader title="Pagos simulados" onBack={() => safeBack(router, '/(tabs)/profile')} />
      </View>

      {/* Tabs */}
      <View style={[s.tabBar, { backgroundColor: tc.surface, borderColor: tc.cardBorder }]}>
        {([
          { key: 'history', label: 'Simulaciones', icon: 'history' },
          { key: 'earnings', label: 'Ganancias', icon: 'trending-up' },
        ] as const).map(t => (
          <Pressable
            key={t.key}
            onPress={() => setTab(t.key)}
            style={[s.tab, tab === t.key && { backgroundColor: tc.accent }]}
          >
            <MaterialIcons
              name={t.icon}
              size={18}
              color={tab === t.key ? TOKENS.color.signal : tc.textSub}
            />
            <Text style={[s.tabText, { color: tab === t.key ? TOKENS.color.signal : tc.textSub }]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      {loading && (
        <View style={s.loadingWrap}>
          <ActivityIndicator color={TOKENS.color.signal} size="large" />
        </View>
      )}

      {!loading && isEmpty && (
        <EmptyState
          icon={tab === 'history' ? 'receipt-outline' : 'wallet-outline'}
          title={tab === 'history' ? 'Sin pagos' : 'Sin ganancias'}
          subtitle={tab === 'history'
            ? 'Tus pagos aparecerán aquí cuando completes una orden.'
            : 'Tus ganancias aparecerán aquí cuando recibas pagos por servicios.'}
        />
      )}

      {!loading && !isEmpty && tab === 'history' && (
        <FlatList
          data={history}
          keyExtractor={i => i.id}
          renderItem={renderHistoryItem}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={() => loadHistory()} colors={[TOKENS.color.signal]} />
          }
        />
      )}

      {!loading && !isEmpty && tab === 'earnings' && (
        <FlatList
          data={earnings}
          keyExtractor={i => i.id}
          renderItem={renderEarningsItem}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={() => loadEarnings()} colors={[TOKENS.color.signal]} />
          }
        />
      )}
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  bg: { flex: 1 },
  flex: { flex: 1 },
  header: {
    paddingTop: 60,
    paddingHorizontal: SPACING.xxl,
    paddingBottom: SPACING.lg,
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: SPACING.xxl,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1.5,
    marginBottom: SPACING.lg,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: SPACING.md,
    borderRadius: SPACING.md,
  },
  tabText: { fontSize: 14, fontWeight: '600' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingHorizontal: SPACING.xxl, paddingBottom: SPACING.huge, gap: SPACING.md },
  card: {
    borderRadius: TOKENS.radius.md,
    overflow: 'hidden',
  },
  cardShadow: {
    borderRadius: TOKENS.radius.md,
    ...TOKENS.shadow.soft,
  },
  cardPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  cardInner: {
    padding: SPACING.lg,
    borderWidth: 1.5,
    borderRadius: TOKENS.radius.md,
  },
  earningsCard: {
    borderRadius: TOKENS.radius.md,
    overflow: 'hidden',
    padding: SPACING.lg,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  amountCol: { alignItems: 'flex-end', gap: SPACING.xs },
  cardIcon: {
    width: 42,
    height: 42,
    borderRadius: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  earningsIcon: {
    width: 42,
    height: 42,
    borderRadius: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontSize: 14, fontWeight: '700' },
  cardDate: { fontSize: 12, marginTop: 2 },
  cardAmount: { fontSize: 16, fontWeight: '800' },
  earningsAmount: { fontSize: 16, fontWeight: '800' },
});
