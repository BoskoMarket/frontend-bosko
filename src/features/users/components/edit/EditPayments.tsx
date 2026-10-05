import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { usePayments } from '@/features/payments/state/PaymentContext';
import { TOKENS } from '@/core/design-system/tokens';

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending:  { label: 'Pendiente', color: '#D97706' },
  paid:     { label: 'Pagado',    color: '#2563EB' },
  released: { label: 'Liberado',  color: '#16A34A' },
  refunded: { label: 'Reintegrado', color: '#6B7280' },
  failed:   { label: 'Fallido',   color: '#DC2626' },
};

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(amount);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function EditPayments() {
  const { history, loading, loadHistory } = usePayments();

  useEffect(() => { loadHistory(); }, []);

  if (loading && history.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={TOKENS.color.primary} />
      </View>
    );
  }

  if (!loading && history.length === 0) {
    return (
      <View style={styles.centered}>
        <MaterialIcons name="receipt-long" size={40} color={TOKENS.color.sub} />
        <Text style={styles.empty}>No tenés simulaciones registradas en este dispositivo.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Historial de pagos simulados</Text>
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        renderItem={({ item }) => {
          const st = STATUS_LABEL[item.status] ?? { label: item.status, color: '#6B7280' };
          return (
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {item.order?.title ?? `Orden ${item.orderId.slice(0, 8)}`}
                </Text>
                <Text style={styles.rowDate}>{formatDate(item.createdAt)}</Text>
              </View>
              <View style={styles.rowRight}>
                <Text style={styles.rowAmount}>{formatAmount(item.amount, item.currency)}</Text>
                <Text style={[styles.rowStatus, { color: st.color }]}>{st.label}</Text>
              </View>
            </View>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  empty: { fontSize: 15, color: TOKENS.color.sub },
  title: { fontSize: 18, fontWeight: '700', color: TOKENS.color.text, marginBottom: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  rowLeft: { flex: 1, marginRight: 12 },
  rowTitle: { fontSize: 14, fontWeight: '600', color: TOKENS.color.text },
  rowDate: { fontSize: 12, color: TOKENS.color.sub, marginTop: 2 },
  rowRight: { alignItems: 'flex-end' },
  rowAmount: { fontSize: 15, fontWeight: '700', color: TOKENS.color.text },
  rowStatus: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  separator: { height: 1, backgroundColor: '#F3F4F6' },
});
