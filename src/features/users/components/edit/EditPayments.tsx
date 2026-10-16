import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import { usePayments } from '@/features/payments/state/PaymentContext';
import { Badge, Divider, EmptyState, Text, useThemeColors, TOKENS } from '@/core/design-system';
import type { BadgeTone } from '@/core/design-system';

const STATUS_LABEL: Record<string, { label: string; tone: BadgeTone }> = {
  pending:  { label: 'Pendiente',   tone: 'pending' },
  paid:     { label: 'Pagado',      tone: 'accepted' },
  released: { label: 'Liberado',    tone: 'done' },
  refunded: { label: 'Reintegrado', tone: 'neutral' },
  failed:   { label: 'Fallido',     tone: 'cancelled' },
};

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(amount);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function EditPayments() {
  const { history, loading, error, loadHistory } = usePayments();
  const tc = useThemeColors();

  useEffect(() => { loadHistory(); }, []);

  if (loading && history.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={TOKENS.color.signal} />
      </View>
    );
  }

  if (error && history.length === 0) {
    return (
      <View style={styles.centered}>
        <EmptyState
          icon="cloud-offline-outline"
          title="No pudimos cargar tus pagos"
          subtitle="Revisá tu conexión e intentá de nuevo."
          cta={{ label: 'Reintentar', onPress: () => { loadHistory(); } }}
        />
      </View>
    );
  }

  if (!loading && history.length === 0) {
    return (
      <View style={styles.centered}>
        <EmptyState
          icon="receipt-outline"
          title="Sin pagos registrados"
          subtitle="No tenés simulaciones registradas en este dispositivo."
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text variant="title" style={styles.title}>Historial de pagos simulados</Text>
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        renderItem={({ item }) => {
          const st = STATUS_LABEL[item.status] ?? { label: item.status, tone: 'neutral' as BadgeTone };
          return (
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Text variant="label" numberOfLines={1}>
                  {item.order?.title ?? `Orden ${item.orderId.slice(0, 8)}`}
                </Text>
                <Text variant="caption" color={tc.textSub}>{formatDate(item.createdAt)}</Text>
              </View>
              <View style={styles.rowRight}>
                <Text variant="subtitle">{formatAmount(item.amount, item.currency)}</Text>
                <Badge label={st.label} tone={st.tone} size="sm" />
              </View>
            </View>
          );
        }}
        ItemSeparatorComponent={() => <Divider />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  title: { marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  rowLeft: { flex: 1, marginRight: 12, gap: 2 },
  rowRight: { alignItems: 'flex-end', gap: 4 },
});
