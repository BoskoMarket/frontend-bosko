import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { safeBack } from '@/core/navigation/safeBack';
import { adminReview } from '@/features/kyc/services/background-check.service';
import { TOKENS } from '@/core/design-system/tokens';
import { GRADIENTS } from '@/core/design-system/gradients';
import { useThemeColors, useIsDark } from '@/stores/theme.store';
import { AnimatedBackground } from '@/components/AnimatedBackground';

const C = {
  primary: TOKENS.color.primary,
  dark:    TOKENS.color.primaryDark,
  signal:  TOKENS.color.signal,
  bg:      '#F7F7FA',
  card:    '#FFFFFF',
  text:    '#1A1A1A',
  sub:     '#6B7280',
  border:  '#EDEDF0',
  green:   TOKENS.status.done.fg,
  red:     TOKENS.status.cancelled.fg,
  amber:   TOKENS.status.pending.fg,
  amberBg: TOKENS.status.pending.bg,
};

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
  const scaleA = useRef(new Animated.Value(1)).current;

  return (
    <Animated.View style={[s.card, { backgroundColor: tc.card, transform: [{ scale: scaleA }] }]}>
      {/* Header */}
      <View style={s.cardHeader}>
        {item.avatarUrl ? (
          <Image source={{ uri: item.avatarUrl }} style={s.avatar} contentFit="cover" />
        ) : (
          <LinearGradient colors={GRADIENTS.brand} style={s.avatarFallback}>
            <Text style={s.avatarInitial}>{(item.firstName?.[0] ?? 'P').toUpperCase()}</Text>
          </LinearGradient>
        )}
        <View style={{ flex: 1 }}>
          <Text style={[s.cardName, { color: tc.text }]}>{item.firstName} {item.lastName}</Text>
          <Text style={[s.cardEmail, { color: tc.textSub }]}>{item.email}</Text>
        </View>
        <View style={s.pendingBadge}>
          <Ionicons name="time-outline" size={12} color={C.amber} />
          <Text style={s.pendingText}>Pendiente</Text>
        </View>
      </View>

      {/* Doc preview link */}
      <Pressable
        style={[s.docRow, { backgroundColor: tc.accent }]}
        onPress={() => {
          Alert.alert('Documento', `URL del certificado:\n${item.backgroundCheckUrl}`, [{ text: 'OK' }]);
        }}
      >
        <Ionicons name="document-text-outline" size={18} color={C.signal} />
        <Text style={s.docText}>Ver certificado subido</Text>
        <Ionicons name="open-outline" size={14} color={tc.textSub} />
      </Pressable>

      {/* Acciones */}
      <View style={s.actionsRow}>
        <Pressable
          style={s.rejectBtn}
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
        >
          <Ionicons name="close-circle-outline" size={16} color={C.red} />
          <Text style={[s.actionText, { color: C.red }]}>Rechazar</Text>
        </Pressable>

        <View style={s.approveBtnShadow}>
          <Pressable
            style={s.approveBtn}
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
          >
            <LinearGradient colors={GRADIENTS.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.approveBtnGrad}>
              <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
              <Text style={s.approveBtnText}>Aprobar</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </Animated.View>
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
        <Pressable onPress={() => safeBack(router, '/(tabs)/profile')} style={[s.backBtn, { backgroundColor: tc.card }]} hitSlop={8}>
          <Ionicons name="arrow-back" size={20} color={tc.text} />
        </Pressable>
        <View>
          <Text style={[s.headerTitle, { color: tc.text }]}>Antecedentes</Text>
          <Text style={[s.headerSub, { color: tc.textSub }]}>Panel de administración</Text>
        </View>
        <View style={s.countBadge}>
          <Text style={s.countText}>{items.length}</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={C.primary} style={{ marginTop: 60 }} />
      ) : (
        <ScrollView
          contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 40 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={C.primary} />}
          showsVerticalScrollIndicator={false}
        >
          {items.length === 0 ? (
            <View style={s.empty}>
              <Ionicons name="checkmark-done-circle-outline" size={56} color={TOKENS.status.done.fg} />
              <Text style={[s.emptyTitle, { color: tc.text }]}>Todo al día</Text>
              <Text style={[s.emptySub, { color: tc.textSub }]}>No hay antecedentes pendientes de revisión.</Text>
            </View>
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
  root:   { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  backBtn:{ width: 36, height: 36, borderRadius: 12, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: C.text },
  headerSub:   { fontSize: 12, color: C.sub },
  countBadge:  { minWidth: 28, height: 28, borderRadius: 14, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  countText:   { fontSize: 13, fontWeight: '700', color: '#fff' },
  scroll:      { paddingHorizontal: 16, paddingTop: 8, gap: 12 },

  card:        { backgroundColor: C.card, borderRadius: 18, padding: 16, gap: 14, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 10 },
  cardHeader:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar:      { width: 46, height: 46, borderRadius: 23 },
  avatarFallback: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  avatarInitial:  { fontSize: 18, fontWeight: '700', color: '#fff' },
  cardName:    { fontSize: 15, fontWeight: '700', color: C.text },
  cardEmail:   { fontSize: 12, color: C.sub, marginTop: 2 },
  pendingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.amberBg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  pendingText:  { fontSize: 11, fontWeight: '600', color: C.amber },

  docRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, padding: 12 },
  docText:     { flex: 1, fontSize: 13, fontWeight: '700', color: C.signal },

  actionsRow:  { flexDirection: 'row', gap: 10 },
  rejectBtn:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 12, borderWidth: 1.5, borderColor: C.red, paddingVertical: 11 },
  actionText:  { fontSize: 14, fontWeight: '600' },
  approveBtnShadow: { flex: 2, borderRadius: 12, ...TOKENS.shadow.glow },
  approveBtn:  { flex: 2, borderRadius: 12, overflow: 'hidden' },
  approveBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  approveBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  empty:       { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyTitle:  { fontSize: 20, fontWeight: '700', color: C.text },
  emptySub:    { fontSize: 14, color: C.sub, textAlign: 'center' },
});
