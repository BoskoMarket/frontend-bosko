/**
 * ClientHome — home for users who are not providers. Explains Bosko (value
 * proposition + search, hire/offer paths, how it works, trust signals) and then
 * lets the user explore categories and popular services.
 *
 * Data: categories → useCategories, popular services → useFeaturedServices,
 * profile (name/zone) → ProfileContext, unread dot → NotificationsContext.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useCategories, useFeaturedServices } from '@/hooks/queries/useMarketplaceQuery';
import { useFavorites } from '@/features/favorites/state/FavoritesContext';
import { HomeTopBar } from '@/features/servicesUser/components/HomeTopBar';
import { RoleSelectionModal, ROLE_MODAL_SEEN_KEY } from '@/features/servicesUser/components/RoleSelectionModal';
import type { ServiceSummary } from '@/types/services';
import {
  Button,
  CategoryTile,
  EmptyState,
  formatServicePrice,
  PathCard,
  SectionHeader,
  ServiceCard,
  Skeleton,
  SPACING,
  StepCard,
  Text,
  TOKENS,
  TrustRow,
  useIsDark,
  useThemeColors,
  ValueHero,
} from '@/core/design-system';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const CATEGORY_LIMIT = 8;
const CATEGORY_COLUMNS = 4;
const SERVICES_LIMIT = 6;
const SERVICE_COLUMNS = 2;

const STEPS = [
  { number: '01', title: 'Buscá', caption: 'Por rubro o zona' },
  { number: '02', title: 'Pedí presupuesto', caption: 'Por chat, sin cargo' },
  { number: '03', title: 'Coordiná y calificá', caption: 'Todo en la orden' },
] as const;

const TRUST: { icon: IconName; title: string; caption: string }[] = [
  { icon: 'shield-checkmark-outline', title: 'Identidad verificada', caption: 'Los profesionales validan su identidad y antecedentes' },
  { icon: 'star-outline', title: 'Reseñas reales', caption: 'Solo califica quien contrató el servicio' },
  { icon: 'chatbubbles-outline', title: 'Chat por orden', caption: 'Toda la conversación queda en un lugar' },
];

function categoryIcon(icon?: string): IconName {
  // Backend may send an emoji or nothing: never render an emoji as UI icon.
  if (!icon || /\p{Extended_Pictographic}/u.test(icon)) return 'construct-outline';
  return icon as IconName;
}

function chunk<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) rows.push(items.slice(i, i + size));
  return rows;
}

/** Rows of `columns` equal cells; the last row is padded with empty cells so widths stay equal. */
function Grid<T>({ items, columns, keyOf, render }: {
  items: T[];
  columns: number;
  keyOf: (item: T) => string;
  render: (item: T) => React.ReactNode;
}) {
  return (
    <View style={styles.grid}>
      {chunk(items, columns).map((row) => (
        <View key={row.map(keyOf).join('|')} style={styles.gridRow}>
          {row.map((item) => <View key={keyOf(item)} style={styles.cell}>{render(item)}</View>)}
          {Array.from({ length: columns - row.length }).map((_, i) => <View key={`pad-${i}`} style={styles.cell} />)}
        </View>
      ))}
    </View>
  );
}

function ServiceSkeletons() {
  return (
    <Grid
      items={Array.from({ length: 4 }, (_, i) => i)}
      columns={SERVICE_COLUMNS}
      keyOf={String}
      render={() => (
        <View style={styles.skeleton}>
          <Skeleton height={120} radius={TOKENS.radius.lg} />
          <Skeleton width="85%" height={12} radius={6} />
          <Skeleton width="50%" height={10} radius={6} />
        </View>
      )}
    />
  );
}

function CategorySkeletons() {
  return (
    <Grid
      items={Array.from({ length: CATEGORY_COLUMNS }, (_, i) => i)}
      columns={CATEGORY_COLUMNS}
      keyOf={String}
      render={() => <Skeleton height={72} radius={TOKENS.radius.md} />}
    />
  );
}

function InlineError({ message, onRetry }: { message: string; onRetry: () => void }) {
  const tc = useThemeColors();
  return (
    <View style={styles.inlineError}>
      <Ionicons name="cloud-offline-outline" size={32} color={tc.textSub} />
      <Text variant="bodySmall" color={tc.textSub}>{message}</Text>
      <Button label="Reintentar" size="sm" onPress={onRetry} />
    </View>
  );
}

export default function ClientHome() {
  const insets = useSafeAreaInsets();
  const tc = useThemeColors();
  const isDark = useIsDark();
  const { isFavorite, toggle } = useFavorites();

  const categoriesQuery = useCategories();
  const servicesQuery = useFeaturedServices();
  const categories = categoriesQuery.data ?? [];
  const services = useMemo(() => (servicesQuery.data ?? []).slice(0, SERVICES_LIMIT), [servicesQuery.data]);

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // One-time welcome (client vs provider). This screen only renders for non-providers.
  useEffect(() => {
    AsyncStorage.getItem(ROLE_MODAL_SEEN_KEY).then((seen) => {
      if (!seen) setShowRoleModal(true);
    });
  }, []);

  const dismissRoleModal = async () => {
    setShowRoleModal(false);
    await AsyncStorage.setItem(ROLE_MODAL_SEEN_KEY, 'true');
  };

  const handleSelectProvider = async () => {
    await dismissRoleModal();
    router.push('/(tabs)/profile/become-provider');
  };

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.allSettled([categoriesQuery.refetch(), servicesQuery.refetch()]);
    setRefreshing(false);
  }, [categoriesQuery, servicesQuery]);

  const goSearch = () => router.push('/search');
  const goServices = () => router.push('/(tabs)/services'); // catalog: hidden route, not a tab
  const goBecomeProvider = () => router.push('/(tabs)/profile/become-provider');
  const goCategory = (id: string) =>
    router.push({ pathname: '/(tabs)/services/category/[id]', params: { id, from: 'home' } });
  const goService = (item: ServiceSummary) =>
    router.push({ pathname: '/(tabs)/services/provider/[id]', params: { id: item.providerId ?? item.id, from: 'home' } });

  const categoryName = (item: ServiceSummary) =>
    item.categoryName ?? categories.find((c) => c.id === item.categoryId)?.name;

  return (
    <View style={[styles.root, { backgroundColor: tc.bg, paddingTop: insets.top }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={tc.bg} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 90 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={tc.signal} />}
      >
        <HomeTopBar />

        <ValueHero
          eyebrow="Servicios en red · ARG"
          title="Encontrá quien lo haga. O hacelo vos."
          body="Bosko conecta a quienes necesitan un trabajo con quienes saben hacerlo, cerca tuyo."
          searchPlaceholder="¿Qué necesitás? Electricista, pintor…"
          onSearchPress={goSearch}
        />

        <View style={styles.paths}>
          <PathCard
            icon="search-outline"
            title="Contratar"
            description="Profesionales verificados con reseñas reales."
            linkLabel="Buscar servicios →"
            onPress={goSearch}
          />
          <PathCard
            icon="construct-outline"
            title="Ofrecer"
            description="Publicá tus servicios y conseguí clientes."
            linkLabel="Empezar a ofrecer →"
            onPress={goBecomeProvider}
          />
        </View>

        <View style={styles.section}>
          <SectionHeader title="Cómo funciona" />
          <View style={styles.steps}>
            {STEPS.map((s) => <StepCard key={s.number} {...s} />)}
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Categorías" onActionPress={goServices} actionLabel="Ver todas" />
          {categoriesQuery.isLoading && !categories.length ? (
            <CategorySkeletons />
          ) : categoriesQuery.isError && !categories.length ? (
            <InlineError message="No se pudieron cargar las categorías" onRetry={() => categoriesQuery.refetch()} />
          ) : (
            <Grid
              items={categories.slice(0, CATEGORY_LIMIT)}
              columns={CATEGORY_COLUMNS}
              keyOf={(c) => c.id}
              render={(c) => <CategoryTile icon={categoryIcon(c.icon)} label={c.name} onPress={() => goCategory(c.id)} />}
            />
          )}
        </View>

        <View style={styles.section}>
          <SectionHeader title="Servicios populares" onActionPress={goServices} />
          {servicesQuery.isLoading ? (
            <ServiceSkeletons />
          ) : servicesQuery.isError ? (
            <InlineError message="No se pudieron cargar los servicios" onRetry={() => servicesQuery.refetch()} />
          ) : services.length === 0 ? (
            <EmptyState
              icon="search-outline"
              title="Todavía no hay servicios"
              subtitle="Cuando se publiquen, los vas a ver acá."
              cta={{ label: 'Explorar categorías', onPress: goServices }}
            />
          ) : (
            <Grid
              items={services}
              columns={SERVICE_COLUMNS}
              keyOf={(s) => s.id}
              render={(item) => (
                <ServiceCard
                  title={item.title || item.name}
                  imageUri={item.thumbnail ?? item.images?.[0]}
                  fallbackIcon={categoryIcon(categories.find((c) => c.id === item.categoryId)?.icon)}
                  category={categoryName(item)}
                  location={item.location}
                  rating={item.averageRating ? Number(item.averageRating) : null}
                  reviewsCount={item.reviewsCount}
                  price={formatServicePrice(item.rate)}
                  isAvailable={item.isAvailable}
                  isFavorite={isFavorite(item.id)}
                  onToggleFavorite={() => toggle(item)}
                  onPress={() => goService(item)}
                />
              )}
            />
          )}
        </View>

        <View style={styles.trust}>
          {TRUST.map((t) => <TrustRow key={t.title} {...t} />)}
        </View>

        <View style={[styles.cta, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
          <View style={styles.ctaText}>
            <Text variant="meta" color={tc.signal}>¿Sabés hacer algo?</Text>
            <Text variant="title">Ganá con tu oficio</Text>
            <Text variant="caption" color={tc.textSub}>Publicá tu servicio en minutos</Text>
          </View>
          <Button label="Ofrecer" size="sm" onPress={goBecomeProvider} />
        </View>
      </ScrollView>

      <RoleSelectionModal
        visible={showRoleModal}
        onSelectClient={dismissRoleModal}
        onSelectProvider={handleSelectProvider}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm, gap: SPACING.xl + 2 },
  paths: { flexDirection: 'row', gap: SPACING.sm + 2 },
  section: { gap: SPACING.md },
  steps: { flexDirection: 'row', gap: SPACING.sm },
  grid: { gap: SPACING.md },
  gridRow: { flexDirection: 'row', gap: SPACING.md },
  cell: { flex: 1 },
  skeleton: { gap: SPACING.sm },
  inlineError: { alignItems: 'center', gap: SPACING.sm + 2, paddingVertical: SPACING.xxl },
  trust: { gap: SPACING.sm },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.lg,
    borderRadius: TOKENS.radius.lg,
    borderWidth: 1,
  },
  ctaText: { flex: 1, gap: SPACING.xs },
});
