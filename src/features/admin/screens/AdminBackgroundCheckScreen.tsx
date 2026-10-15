import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { safeBack } from '@/core/navigation/safeBack';
import { adminReview } from '@/features/kyc/services/background-check.service';
import {
  TOKENS,
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  ScreenHeader,
  Text,
  useThemeColors,
  useIsDark,
} from '@/core/design-system';
import { AnimatedBackground } from '@/components/AnimatedBackground';

interface PendingUser {
  id: string;
  firstName: string;
  lastName?: string;
  email: string;
  username: string;
  avatarUrl?: string;
  backgroundCheckUrl: string;
  backgroundCheckStatus: string;
  createdAt: string;
}

function ProviderCard({ item, onReview }: { item: PendingUser; onReview: (id: string) => void }) {
  const tc = useThemeColors();

  return (
    <Card padding="lg" radius="lg" contentStyle={s.cardContent}>
      {/* Header */}
      <View style={s.cardHeader}>
        <Avatar uri={item.avatarUrl} name={item.firstName} size={46} />
        <View style={s.cardInfo}>
          <Text variant="subtitle">{item.firstName} {item.lastName}</Text>
          <Text variant="caption" color={tc.textSub}>{item.email}</Text>
        </View>
        <Badge label="Pendiente" tone="pending" icon="time-outline" size="sm" />
      </View>

      {/* Doc preview link */}
      <Pressable
        style={[s.docRow, { backgroundColor: tc.accent }]}
        onPress={() => {
          Alert.alert('Documento', `URL del certificado:\n${item.backgroundCheckUrl}`, [{ text: 'OK' }]);
        }}
      >
        <Ionicons name="document-text-outline" size={18} color={TOKENS.color.signal} />
        <Text variant="label" color={TOKENS.color.signal} style={s.docText}>Ver certificado subido</Text>
        <Ionicons name="open-outline" size={14} color={tc.textSub} />
      </Pressable>

      {/* Acciones */}
      <View style={s.actionsRow}>
        <Button
          label="Rechazar"
          variant="dangerOutline"
          size="sm"
          style={s.rejectBtn}
          icon={<Ionicons name="close-circle-outline" size={16} color={TOKENS.color.error} />}
          onPress={() => {
            Alert.prompt(
              'Rechazar',
              'Indicá el motivo del rechazo (opcional):',
              [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Rechazar',
                  style: 'destructive',
                  onPress: async (notes?: string) => {
                    try {
                      await adminReview(item.id, false, notes);
                      onReview(item.id);
                    } catch {
                      Alert.alert('Error', 'No se pudo rechazar.');
                    }
                  },
                },
              ],
              'plain-text',
            );
          }}
        />

        <View style={s.approveWrap}>
          <Button
            label="Aprobar"
            size="sm"
            fullWidth
            icon={<Ionicons name="checkmark-circle-outline" size={16} color={TOKENS.color.onPrimary} />}
            onPress={() => {
              Alert.alert('Aprobar antecedentes', `¿Aprobar el certificado de ${item.firstName}?`, [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Aprobar',
                  onPress: async () => {
                    try {
                      await adminReview(item.id, true);
                      onReview(item.id);
                    } catch {
                      Alert.alert('Error', 'No se pudo aprobar.');
                    }
                  },
                },
              ]);
            }}
          />
        </View>
      </View>
    </Card>
  );
}

export default function AdminBackgroundCheckScreen() {
  const tc = useThemeColors();
  const isDark = useIsDark();
  const insets = useSafeAreaInsets();
  const [items, setItems]         = useState<PendingUser[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    // El endpoint GET /admin/background-check/pending no está disponible en el backend actual
    setItems([]);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, []);

  const handleReviewed = (userId: string) => {
    setItems(prev => prev.filter(i => i.id !== userId));
  };

  return (
    <View style={[s.root, { backgroundColor: tc.bg, paddingTop: insets.top }]}>
      <AnimatedBackground variant="minimal" />
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={tc.bg} />

      <View style={s.header}>
        <ScreenHeader
          title="Antecedentes"
          onBack={() => safeBack(router, '/(tabs)/profile')}
          right={
            <View style={s.countBadge}>
              <Text variant="label" color={TOKENS.color.onPrimary}>{items.length}</Text>
            </View>
          }
        />
        <Text variant="caption" color={tc.textSub} center>Panel de administración</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={TOKENS.color.primary} style={s.loader} />
      ) : (
        <ScrollView
          contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 40 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={TOKENS.color.primary} />}
          showsVerticalScrollIndicator={false}
        >
          {items.length === 0 ? (
            <EmptyState
              icon="checkmark-done-circle-outline"
              title="Todo al día"
              subtitle="No hay antecedentes pendientes de revisión."
              iconColor={TOKENS.status.done.fg}
              iconBg={TOKENS.status.done.bg}
            />
          ) : (
            items.map(item => (
              <ProviderCard key={item.id} item={item} onReview={handleReviewed} />
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 12, gap: 4 },
  loader: { marginTop: 60 },
  countBadge:  { minWidth: 28, height: 28, borderRadius: 14, backgroundColor: TOKENS.color.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  scroll:      { paddingHorizontal: 16, paddingTop: 8, gap: 12 },

  cardContent: { gap: 14 },
  cardHeader:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardInfo:    { flex: 1, gap: 2 },

  docRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, padding: 12 },
  docText:     { flex: 1 },

  actionsRow:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rejectBtn:   { flex: 1 },
  approveWrap: { flex: 2 },
});
