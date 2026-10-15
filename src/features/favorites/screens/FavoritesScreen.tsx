import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  Animated,
  FlatList,
  Pressable,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { safeBack } from '@/core/navigation/safeBack';
import { useFavorites } from '../state/FavoritesContext';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import type { ServiceSummary } from '@/types/services';
import {
  TOKENS,
  GRADIENTS,
  SPACING,
  Badge,
  EmptyState,
  Card,
  ScreenHeader,
  Text,
  useIsDark,
  useThemeColors,
} from '@/core/design-system';

const UNDO_MS = 5000;

function formatRate(rate?: ServiceSummary['rate']) {
  if (!rate?.amount) return null;
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: rate.currency ?? 'ARS', maximumFractionDigits: 0,
  }).format(rate.amount);
}

function FavoriteCard({ item, onRemove }: { item: ServiceSummary; onRemove: () => void }) {
  const tc = useThemeColors();
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(14)).current;
  const heartScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 320, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 7, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleRemove = () => {
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.3, useNativeDriver: true }),
      Animated.spring(heartScale, { toValue: 0,   useNativeDriver: true }),
    ]).start(() => onRemove());
  };

  const goToService = () => {
    router.push({
      pathname: '/(tabs)/services/category/[id]',
      params: { id: item.categoryId, from: 'favorites' },
    });
  };

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <Pressable
        onPress={goToService}
        accessibilityRole="button"
        accessibilityLabel={`${item.title}, de ${item.name}`}
        style={({ pressed }) => [s.card, { backgroundColor: tc.card }, pressed && s.cardPressed]}
      >
        {/* Thumbnail */}
        {item.thumbnail ? (
          <Image source={{ uri: item.thumbnail }} style={s.thumb} contentFit="cover" />
        ) : (
          <LinearGradient colors={GRADIENTS.brand} style={s.thumbFallback}>
            <Ionicons name="construct" size={22} color={TOKENS.color.onPrimary} />
          </LinearGradient>
        )}

        {/* Info */}
        <View style={s.info}>
          <Text variant="bodySmall" weight="700" color={tc.text} numberOfLines={1}>{item.title}</Text>
          <Text variant="caption" color={tc.textSub} numberOfLines={1}>{item.name}</Text>

          <View style={s.metaRow}>
            {item.averageRating > 0 && (
              <View style={s.ratingChip}>
                <Ionicons name="star" size={11} color={TOKENS.color.rating} />
                <Text variant="caption" weight="600" color={tc.text}>{item.averageRating ? Number(item.averageRating).toFixed(1) : '—'}</Text>
              </View>
            )}
            {item.location ? (
              <Text variant="caption" color={tc.textSub} numberOfLines={1} style={s.location}>{item.location}</Text>
            ) : null}
          </View>

          {formatRate(item.rate) && (
            <Text variant="bodySmall" weight="700" color={tc.signal} style={s.price}>Desde {formatRate(item.rate)}</Text>
          )}
        </View>

        {/* Actions */}
        <View style={s.actions}>
          <Animated.View style={{ transform: [{ scale: heartScale }] }}>
            <Pressable
              onPress={handleRemove}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Quitar ${item.title} de favoritos`}
              style={[s.heartBtn, { backgroundColor: TOKENS.status.cancelled.bg }]}
            >
              <Ionicons name="heart" size={20} color={TOKENS.color.error} />
            </Pressable>
          </Animated.View>
          <Ionicons name="chevron-forward" size={16} color={tc.border} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

export function FavoritesScreen() {
  const tc = useThemeColors();
  const isDark = useIsDark();
  const insets = useSafeAreaInsets();
  const { favorites, toggle, count } = useFavorites();
  const [undoItem, setUndoItem] = useState<ServiceSummary | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (undoTimer.current) clearTimeout(undoTimer.current); }, []);

  const handleRemove = useCallback(async (item: ServiceSummary) => {
    await toggle(item);
    setUndoItem(item);
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setUndoItem(null), UNDO_MS);
  }, [toggle]);

  const handleUndo = useCallback(async () => {
    if (!undoItem) return;
    const restored = undoItem;
    setUndoItem(null);
    if (undoTimer.current) clearTimeout(undoTimer.current);
    await toggle(restored);
  }, [undoItem, toggle]);

  return (
    <View style={[s.root, { backgroundColor: tc.bg, paddingTop: insets.top }]}>
      <AnimatedBackground variant="minimal" />
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={tc.bg} />

      {/* Header */}
      <View style={s.header}>
        <ScreenHeader
          title="Favoritos"
          onBack={() => safeBack(router, '/(tabs)/profile')}
          right={count > 0 ? <Badge label={String(count)} tone="cancelled" size="sm" /> : undefined}
        />
      </View>

      <FlatList
        data={favorites}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <FavoriteCard item={item} onRemove={() => handleRemove(item)} />
        )}
        contentContainerStyle={[
          s.list,
          { paddingBottom: insets.bottom + 100 },
          favorites.length === 0 && s.listEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="heart-outline"
            title="Sin favoritos todavía"
            subtitle="Guardá los servicios que te gusten tocando el corazón para encontrarlos rápido."
            cta={{ label: 'Explorar servicios', onPress: () => router.push('/(tabs)/services') }}
            iconColor={TOKENS.color.error}
            iconBg={TOKENS.status.cancelled.bg}
          />
        }
      />

      {undoItem && (
        <View style={[s.undo, { bottom: insets.bottom + SPACING.lg }]}>
          <Card padding="md" radius="md" elevated contentStyle={s.undoRow}>
            <Ionicons name="heart-dislike-outline" size={18} color={tc.textSub} />
            <Text variant="bodySmall" color={tc.text} numberOfLines={1} style={s.undoText}>
              Quitaste "{undoItem.title}"
            </Text>
            <Pressable
              onPress={handleUndo}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Deshacer: volver a guardar ${undoItem.title}`}
            >
              <Text variant="label" weight="700" color={tc.signal}>Deshacer</Text>
            </Pressable>
          </Card>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },

  header: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },

  list:      { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm, gap: 10 },
  listEmpty: { flex: 1 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: TOKENS.radius.md,
    padding: SPACING.md,
    gap: SPACING.md,
    ...TOKENS.shadow.soft,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardPressed: { opacity: 0.85 },

  thumb: { width: 60, height: 60, borderRadius: 12 },
  thumbFallback: {
    width: 60, height: 60, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },

  info:          { flex: 1, gap: 3 },
  metaRow:       { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  ratingChip:    { flexDirection: 'row', alignItems: 'center', gap: 3 },
  location:      { flex: 1 },
  price:         { marginTop: 2 },

  actions: { alignItems: 'center', gap: SPACING.sm },
  heartBtn: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },

  undo: { position: 'absolute', left: SPACING.lg, right: SPACING.lg },
  undoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACING.md },
  undoText: { flex: 1 },
});
