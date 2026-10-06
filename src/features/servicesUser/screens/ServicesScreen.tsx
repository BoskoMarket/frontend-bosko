/**
 * Rebrand "Señal Nocturna" — ServicesScreen (lista de categorías): misma lógica, estado y navegación que
 * el archivo original. Mismas 10 gradientes curadas por índice, mismo flip-in/press-depth — el stop bordo intermedio pasa a signal, el header/search (antes hardcodeados en modo claro) pasan a vidrio dark, y el emoji de ícono cae a un Ionicons.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { useCategories } from '@/hooks/queries/useMarketplaceQuery';
import type { Category } from '@/types/services';
import { EmptyState } from '@/core/components/EmptyState';
import { Skeleton, TOKENS, useIsDark, useThemeColors } from '@/core/design-system';
import { FeaturedCard } from '../components/FeaturedCard';
import { AnimatedBackground } from '@/components/AnimatedBackground';

const { width: W } = Dimensions.get('window');
const CARD_GAP   = 12;
const H_PAD      = 16;
const HALF_W     = (W - H_PAD * 2 - CARD_GAP) / 2;

function resolveCategoryIcon(icon?: string): React.ComponentProps<typeof Ionicons>['name'] {
  if (!icon || /\p{Extended_Pictographic}/u.test(icon)) return 'construct-outline';
  return icon as React.ComponentProps<typeof Ionicons>['name'];
}

function SkeletonScreen() {
  return (
    <View style={sk.wrap}>
      {/* Featured skeleton */}
      <View style={sk.featured}>
        <Skeleton width={W - H_PAD * 2} height={220} radius={24} />
      </View>
      {/* 2-col grid */}
      {[0, 1, 2].map(row => (
        <View key={row} style={sk.row}>
          <Skeleton width={HALF_W} height={160} radius={20} />
          <Skeleton width={HALF_W} height={160} radius={20} />
        </View>
      ))}
    </View>
  );
}
const sk = StyleSheet.create({
  wrap: { paddingHorizontal: H_PAD, gap: 12 },
  row:  { flexDirection: 'row', gap: CARD_GAP },
  featured: { marginBottom: CARD_GAP },
});

// ── Category card — misma FeaturedCard editorial que "servicios populares"
// en el Dashboard (panel de marca + ícono como marca de agua, sin thumbnail
// propio porque Category no trae imagen — ver icon/video en @/types/services).
function CategoryCard({
  category,
  featured,
  delay,
}: {
  category: Category;
  featured?: boolean;
  delay: number;
}) {
  return (
    <FeaturedCard
      style={{ width: featured ? W - H_PAD * 2 : HALF_W }}
      title={category.name}
      icon={resolveCategoryIcon(category.icon)}
      metaLabel={category.servicesCount != null ? `${category.servicesCount} PROS` : 'VER SERVICIOS'}
      ctaLabel="Ver servicios"
      onPress={() =>
        router.push({
          pathname: '/(tabs)/services/category/[id]',
          params: { id: category.id },
        })
      }
      delay={delay}
    />
  );
}

// ── Header ────────────────────────────────────────────────────────────────────
function Header({ titleAnim }: { titleAnim: Animated.Value }) {
  const tc = useThemeColors();
  return (
    <Animated.View style={[s.header, { opacity: titleAnim, transform: [{ translateY: titleAnim.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }) }] }]}>
      <View>
        <Text style={[s.headerTitle, { color: tc.text }]}>Explorar</Text>
        <Text style={[s.headerSub, { color: tc.textSub }]}>Descubrí profesionales cerca tuyo</Text>
      </View>
      <Pressable style={[s.searchIcon, { backgroundColor: tc.surface }]} onPress={() => router.push('/search')}>
        <Ionicons name="search" size={20} color={tc.text} />
      </Pressable>
    </Animated.View>
  );
}

// ── Search bar ────────────────────────────────────────────────────────────────
function SearchBar({ anim }: { anim: Animated.Value }) {
  const tc = useThemeColors();
  return (
    <Animated.View style={[s.searchWrap, { opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }]}>
      <Pressable style={[s.searchBar, { backgroundColor: tc.surface, borderColor: tc.cardBorder }]} onPress={() => router.push('/search')}>
        <Ionicons name="search-outline" size={16} color={tc.textMuted} />
        <Text style={[s.searchPlaceholder, { color: tc.textMuted }]}>Buscar servicios o profesionales…</Text>
        <View style={[s.searchFilter, { backgroundColor: tc.accent }]}>
          <Ionicons name="options-outline" size={15} color={TOKENS.color.primary} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function ServicesScreen() {
  const insets = useSafeAreaInsets();
  const tc = useThemeColors();
  const isDark = useIsDark();
  const categoriesQuery = useCategories();
  const categories = categoriesQuery.data ?? [];

  const loading = categoriesQuery.isLoading && categories.length === 0;

  // Header animations
  const headerAnim = useRef(new Animated.Value(0)).current;
  const searchAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(80, [
      Animated.timing(headerAnim, { toValue: 1, duration: 360, useNativeDriver: true }),
      Animated.timing(searchAnim, { toValue: 1, duration: 360, useNativeDriver: true }),
    ]).start();
  }, []);

  const [featured, ...rest] = categories;

  // 2-column rows from remaining categories
  const rows: Category[][] = [];
  for (let i = 0; i < rest.length; i += 2) {
    rows.push(rest.slice(i, i + 2));
  }

  return (
    <View style={[s.root, { backgroundColor: tc.bg, paddingTop: insets.top }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={tc.bg} />
      <AnimatedBackground variant="minimal" />

      <Header titleAnim={headerAnim} />
      <SearchBar anim={searchAnim} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 100 }]}
      >
        {loading ? (
          <SkeletonScreen />
        ) : categories.length === 0 ? (
          <EmptyState
            icon="grid-outline"
            title="Categorías próximamente"
            subtitle="Estamos cargando los servicios disponibles. Volvé en breve."
            iconColor={tc.textSub}
            iconBg={tc.surface2}
          />
        ) : (
          <View style={s.grid}>
            {/* Featured card (first category, full width) */}
            {featured && (
              <CategoryCard
                category={featured}
                featured
                delay={0}
              />
            )}

            {/* 2-column grid for the rest */}
            {rows.map((row, rowIdx) => (
              <View key={rowIdx} style={s.row}>
                {row.map((cat, colIdx) => {
                  const globalIdx = 1 + rowIdx * 2 + colIdx;
                  return (
                    <CategoryCard
                      key={cat.id}
                      category={cat}
                      delay={globalIdx * 55}
                    />
                  );
                })}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: H_PAD,
    paddingTop: 10,
    paddingBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 13,
    marginTop: 2,
  },
  searchIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: TOKENS.color.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },

  // Search bar
  searchWrap: {
    paddingHorizontal: H_PAD,
    paddingBottom: 14,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    borderWidth: 1,
    shadowColor: TOKENS.color.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 14,
  },
  searchFilter: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Grid
  scroll: { paddingTop: 2 },
  grid: {
    paddingHorizontal: H_PAD,
    gap: CARD_GAP,
  },
  row: {
    flexDirection: 'row',
    gap: CARD_GAP,
  },
});
