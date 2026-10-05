/**
 * Rebrand "Señal Nocturna" — CategoryServicesScreen: misma lógica, estado y navegación que
 * el archivo original. Mismo hero + lista infinita + skeleton shimmer que el original — stop bordo intermedio → signal, emoji de ícono/empty → Ionicons, precio a signal.
 */
import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { safeBack } from '@/core/navigation/safeBack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCategories, useServicesByCategory } from '@/hooks/queries/useMarketplaceQuery';
import type { ServiceSummary } from '@/types/services';
import { useFavorites } from '@/features/favorites/state/FavoritesContext';
import { TOKENS } from '@/core/design-system/tokens';
import { GRADIENTS } from '@/core/design-system/gradients';
import { useThemeColors } from '@/stores/theme.store';
import { RadialBlob } from '@/core/components/RadialBlob';
import { AnimatedBackground } from '@/components/AnimatedBackground';

const { width: W } = Dimensions.get('window');

const AMBER = '#F59E0B';

function useC() {
  const tc = useThemeColors();
  return { bg: tc.bg, card: tc.card, text: tc.text, sub: tc.textSub, border: tc.border, surface2: tc.surface2, amber: AMBER };
}

// ── Shimmer skeleton ──────────────────────────────────────────────────────────
function Shimmer({ width, height, radius = 12 }: { width: import('react-native').DimensionValue; height: number; radius?: number }) {
  const tc = useThemeColors();
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(anim, { toValue: 1, duration: 1100, useNativeDriver: true })
    ).start();
  }, []);
  const tx = anim.interpolate({ inputRange: [0, 1], outputRange: [-300, 300] });
  return (
    <View style={{ width, height, borderRadius: radius, backgroundColor: tc.surface2, overflow: 'hidden' }}>
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX: tx }] }]}>
        <LinearGradient
          colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.55)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </View>
  );
}

function SkeletonList() {
  const c = useC();
  return (
    <View style={{ paddingHorizontal: 16, gap: 12, paddingTop: 4 }}>
      {[0, 1, 2, 3].map(i => (
        <View key={i} style={[{ backgroundColor: c.card }, sk.card, { opacity: 1 - i * 0.15 }]}>
          <Shimmer width={64} height={64} radius={18} />
          <View style={{ flex: 1, gap: 8 }}>
            <Shimmer width="75%" height={14} radius={7} />
            <Shimmer width="50%" height={11} radius={6} />
            <Shimmer width="40%" height={11} radius={6} />
          </View>
        </View>
      ))}
    </View>
  );
}
const sk = StyleSheet.create({
  card: { flexDirection: 'row', gap: 12, alignItems: 'center', borderRadius: 18, padding: 16 },
});

// ── Price formatter ───────────────────────────────────────────────────────────
function formatRate(rate?: ServiceSummary['rate']) {
  if (!rate) return 'Consultar';
  const sym = rate.currency === 'ARS' ? '$' : rate.currency === 'USD' ? 'US$' : `${rate.currency} `;
  return `${sym}${rate.amount.toLocaleString('es-AR')} / ${rate.unit}`;
}

// ── Service card ──────────────────────────────────────────────────────────────
const ServiceCard = memo(function ServiceCard({
  item,
  index,
  onPress,
}: {
  item: ServiceSummary;
  index: number;
  onPress: () => void;
}) {
  const c = useC();
  const { isFavorite, toggle } = useFavorites();
  const fav = isFavorite(item.id);
  const heartScale = useRef(new Animated.Value(1)).current;

  const handleFavorite = () => {
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.4, useNativeDriver: true }),
      Animated.spring(heartScale, { toValue: 1,   useNativeDriver: true }),
    ]).start();
    toggle(item);
  };

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(32)).current;
  const scaleA    = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const delay = Math.min(index, 6) * 65;
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 380, delay, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, delay, tension: 80, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  const pressIn  = () => Animated.spring(scaleA, { toValue: 0.97, useNativeDriver: true, tension: 200, friction: 10 }).start();
  const pressOut = () => Animated.spring(scaleA, { toValue: 1,    useNativeDriver: true, tension: 200, friction: 10 }).start();

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }, { scale: scaleA }],
      }}
    >
      <Pressable onPressIn={pressIn} onPressOut={pressOut} onPress={onPress} style={[s.serviceCard, { backgroundColor: c.card, borderColor: c.border }]}>
        {/* Avatar + availability dot */}
        <View style={s.avatarWrap}>
          {item.thumbnail ? (
            <Image source={{ uri: item.thumbnail }} style={s.avatar} contentFit="cover" />
          ) : (
            <LinearGradient colors={['#e8ecf2', '#d0d7e2']} style={s.avatarFallback}>
              <Ionicons name="person-outline" size={24} color="#9CA3AF" />
            </LinearGradient>
          )}
          {item.isAvailable !== undefined && (
            <View style={[s.availDot, { backgroundColor: item.isAvailable ? TOKENS.color.mint : c.sub, borderColor: c.card }]} />
          )}
        </View>

        {/* Info */}
        <View style={s.info}>
          <Text style={[s.name, { color: c.text }]} numberOfLines={1}>{item.name}</Text>
          <Text style={[s.headline, { color: c.sub }]} numberOfLines={1}>{item.title}</Text>

          <View style={s.metaRow}>
            <View style={s.ratingChip}>
              <Ionicons name="star" size={11} color={c.amber} />
              <Text style={[s.ratingText, { color: c.amber }]}>{item.averageRating ? Number(item.averageRating).toFixed(1) : '—'}</Text>
              <Text style={[s.reviewCount, { color: c.sub }]}>({item.reviewsCount ?? 0})</Text>
            </View>
            <View style={[s.dot, { backgroundColor: c.border }]} />
            <Text style={[s.location, { color: c.sub }]} numberOfLines={1}>{item.location}</Text>
          </View>

          <Text style={s.price}>Cotizar por chat</Text>
        </View>

        {/* Favorite + chevron */}
        <View style={s.cardActions}>
          <Pressable onPress={handleFavorite} hitSlop={8} style={[s.heartBtn, { backgroundColor: c.surface2 }]}>
            <Animated.View style={{ transform: [{ scale: heartScale }] }}>
              <Ionicons
                name={fav ? 'heart' : 'heart-outline'}
                size={20}
                color={fav ? TOKENS.color.signal : c.border}
              />
            </Animated.View>
          </Pressable>
          <Ionicons name="chevron-forward" size={16} color={c.border} />
        </View>
      </Pressable>
    </Animated.View>
  );
});

// ── Hero header ───────────────────────────────────────────────────────────────
function Hero({
  category,
  onBack,
}: {
  category: { name: string; description: string; icon: string } | undefined;
  onBack: () => void;
}) {
  const c = useC();
  const scaleA   = useRef(new Animated.Value(0.9)).current;
  const fadeA    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleA, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      Animated.timing(fadeA,  { toValue: 1, duration: 350, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[s.hero, { opacity: fadeA, transform: [{ scale: scaleA }] }]}>
      <LinearGradient
        colors={GRADIENTS.brandDeep}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
      />
      {/* Blobs */}
      <RadialBlob
        size={200}
        color="rgb(255,255,255)"
        opacity={0.3}
        style={{ position: 'absolute', top: -60, right: -40 }}
      />
      <RadialBlob
        size={120}
        color="rgb(255,255,255)"
        opacity={0.2}
        style={{ position: 'absolute', bottom: -30, right: 80 }}
      />

      {/* Back button */}
      <Pressable onPress={onBack} style={[s.backBtn, { backgroundColor: c.card }]}>
        <Ionicons name="arrow-back" size={18} color={c.text} />
      </Pressable>

      {/* Content */}
      <View style={s.heroContent}>
        <View style={s.heroIconWrap}>
          <Text style={s.heroIcon}>{category?.icon ?? '🔧'}</Text>
        </View>
        <Text style={s.heroTitle}>{category?.name ?? 'Servicios'}</Text>
        {category?.description ? (
          <Text style={s.heroDesc} numberOfLines={2}>{category.description}</Text>
        ) : null}
      </View>
    </Animated.View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function CategoryServicesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  const categoryId    = typeof params.id === 'string' ? params.id : undefined;
  const fromHome      = params.from === 'home';
  const fromFavorites = params.from === 'favorites';
  const fromSearch    = params.from === 'search';

  const categoriesQuery = useCategories();
  const category = (categoriesQuery.data ?? []).find(c => c.id === categoryId);

  const servicesQuery = useServicesByCategory(categoryId ?? null);
  const services      = useMemo(
    () => servicesQuery.data?.pages.flatMap(p => p.data) ?? [],
    [servicesQuery.data],
  );
  const isLoading     = Boolean(servicesQuery.isLoading && services.length === 0);
  const isLoadingMore = servicesQuery.isFetchingNextPage;
  const hasMore       = Boolean(servicesQuery.hasNextPage);

  const handleProviderPress = useCallback((item: ServiceSummary) => {
    router.push({
      pathname: '/(tabs)/services/provider/[id]',
      params: { id: item.providerId ?? item.id },
    });
  }, [router]);

  const handleEndReached = useCallback(() => {
    if (hasMore && !isLoadingMore) {
      servicesQuery.fetchNextPage();
    }
  }, [hasMore, isLoadingMore, servicesQuery]);

  const c = useC();

  const ListHeader = (
    <>
      <View style={s.heroPad}>
        <Hero
          category={category as any}
          onBack={() => {
            if (fromHome) return router.replace('/(tabs)');
            if (fromFavorites) return router.replace('/(tabs)/profile/favorites');
            if (fromSearch) return router.replace('/search');
            return safeBack(router, '/(tabs)/services');
          }}
        />
      </View>
      {!isLoading && services.length > 0 && (
        <View style={s.sectionHeader}>
          <Text style={[s.sectionTitle, { color: c.text }]}>
            {`${services.length} profesional${services.length !== 1 ? 'es' : ''}`}
          </Text>
          <Text style={[s.sectionSub, { color: c.sub }]}>Tocá uno para ver su perfil completo</Text>
        </View>
      )}
    </>
  );

  const ListEmpty = isLoading ? (
    <SkeletonList />
  ) : (
    <View style={s.empty}>
      <Ionicons name="search-outline" size={48} color={c.sub} style={{ marginBottom: 4 }} />
      <Text style={[s.emptyTitle, { color: c.text }]}>Próximamente hay más</Text>
      <Text style={[s.emptySub, { color: c.sub }]}>Estamos sumando especialistas en esta categoría.</Text>
    </View>
  );

  const ListFooter = isLoadingMore ? (
    <ActivityIndicator color={TOKENS.color.primary} style={{ marginVertical: 20 }} />
  ) : !hasMore && services.length > 0 ? (
    <Text style={[s.endLabel, { color: c.sub }]}>Eso es todo por ahora</Text>
  ) : null;

  return (
    <View style={[s.root, { backgroundColor: c.bg, paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" backgroundColor={c.bg} />
      <AnimatedBackground variant="minimal" />

      <FlatList
        data={isLoading ? [] : services}
        keyExtractor={item => item.id}
        renderItem={({ item, index }) => (
          <View style={s.itemWrap}>
            <ServiceCard
              item={item}
              index={index}
              onPress={() => handleProviderPress(item)}
            />
          </View>
        )}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        ListFooterComponent={ListFooter}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.4}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 100 }]}
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    paddingTop: 4,
  },

  // Hero
  heroPad: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  hero: {
    borderRadius: 24,
    padding: 22,
    minHeight: 180,
    overflow: 'hidden',
    justifyContent: 'space-between',
    ...TOKENS.shadow.glow,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 4,
  },
  heroContent: {
    gap: 8,
    marginTop: 12,
  },
  heroIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIcon: {
    fontSize: 28,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  heroDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    lineHeight: 19,
  },

  // Section header
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    gap: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  sectionSub: {
    fontSize: 13,
  },

  // List item wrapper
  itemWrap: {
    paddingHorizontal: 16,
  },

  // End of list label
  endLabel: {
    textAlign: 'center',
    fontSize: 13,
    paddingVertical: 20,
  },

  // Service card
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
  },
  cardActions: {
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  heartBtn: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: '#F9FAFB', // overridden inline via c.surface2
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWrap: {
    position: 'relative',
    flexShrink: 0,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 18,
  },
  avatarFallback: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  availDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  info: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
  },
  headline: {
    fontSize: 13,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: AMBER,
  },
  reviewCount: {
    fontSize: 11,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  location: {
    fontSize: 12,
    flex: 1,
  },
  price: {
    fontSize: 13,
    fontWeight: '700',
    color: TOKENS.color.signal,
  },

  // Empty
  empty: {
    paddingTop: 60,
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 40,
  },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
