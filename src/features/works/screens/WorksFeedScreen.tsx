import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, RefreshControl, type LayoutChangeEvent, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BRAND_NAME,
  Chip,
  EmptyState,
  ScreenHeader,
  Skeleton,
  SPACING,
  TAB_BAR_CLEARANCE,
  TOKENS,
  useThemeColors,
} from '@/core/design-system';
import { useCategories } from '@/hooks/queries/useMarketplaceQuery';
import { useIsProvider } from '@/hooks/queries/useProfileQuery';
import { flattenWorksPages, useWorksFeed } from '@/hooks/queries/useWorksQuery';
import { WorksMasonry } from '../components/WorksMasonry';
import { MY_WORKS_ROUTE, workDetailHref } from '../constants';
import type { WorkFeedItem } from '../types';

const NEAR_END_PX = 600;
const SKELETON_HEIGHTS = [180, 130, 150, 200, 140, 170] as const;

function FeedSkeleton() {
  const { width } = useWindowDimensions();
  const columnWidth = (width - SPACING.lg * 2 - SPACING.sm) / 2;
  const cols = [SKELETON_HEIGHTS.filter((_, i) => i % 2 === 0), SKELETON_HEIGHTS.filter((_, i) => i % 2 === 1)];
  return (
    <View
      style={styles.skeletonRow}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Cargando trabajos"
    >
      {cols.map((heights, c) => (
        <View key={c} style={{ width: columnWidth, gap: SPACING.sm }}>
          {heights.map((h, i) => (
            <Skeleton key={i} width={columnWidth} height={h} radius={TOKENS.radius.md} />
          ))}
        </View>
      ))}
    </View>
  );
}

/** "Trabajos" tab: public masonry feed of finished jobs with a category filter. */
export default function WorksFeedScreen() {
  const tc = useThemeColors();
  const insets = useSafeAreaInsets();
  const isProvider = useIsProvider();
  const [categoryId, setCategoryId] = useState<string | null>(null);

  const { data: categories = [] } = useCategories();
  const feed = useWorksFeed(categoryId);
  const items = useMemo(() => flattenWorksPages(feed.data?.pages), [feed.data]);
  const category = categories.find((c) => c.id === categoryId);

  const { refetch, fetchNextPage, hasNextPage, isFetchingNextPage, isRefetching } = feed;
  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  // Never start a page fetch while a refetch runs, and never cancel it: both would break pull-to-refresh.
  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage && !isRefetching) fetchNextPage({ cancelRefetch: false });
  }, [hasNextPage, isFetchingNextPage, isRefetching, fetchNextPage]);

  const viewportH = useRef(0);
  const contentH = useRef(0);
  // If the first pages do not fill the screen there is nothing to scroll, so scroll paging never fires.
  const fillViewport = useCallback(() => {
    if (viewportH.current > 0 && contentH.current > 0 && contentH.current < viewportH.current) loadMore();
  }, [loadMore]);
  const handleLayout = useCallback(
    (e: LayoutChangeEvent) => {
      viewportH.current = e.nativeEvent.layout.height;
      fillViewport();
    },
    [fillViewport],
  );
  const handleContentSize = useCallback(
    (_w: number, h: number) => {
      contentH.current = h;
      fillViewport();
    },
    [fillViewport],
  );

  const handleScroll = useCallback(
    (e: { nativeEvent: { layoutMeasurement: { height: number }; contentOffset: { y: number }; contentSize: { height: number } } }) => {
      const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
      const remaining = contentSize.height - (contentOffset.y + layoutMeasurement.height);
      if (remaining < NEAR_END_PX) loadMore();
    },
    [loadMore],
  );

  const openWork = useCallback((item: WorkFeedItem) => router.push(workDetailHref(item.id)), []);

  const showSkeleton = feed.isPending;
  const showError = feed.isError && items.length === 0;
  const showEmpty = !showSkeleton && !showError && items.length === 0;

  return (
    <View style={[styles.root, { backgroundColor: tc.bg }]}>
      <View style={[styles.header, { paddingTop: insets.top + SPACING.xl }]}>
        <ScreenHeader variant="large" title="Trabajos" subtitle="Mirá trabajos reales y pedí tu cotización" />
      </View>

      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
          accessibilityLabel="Filtrar por categoría"
        >
          <Chip label="Todas" selected={categoryId === null} onPress={() => setCategoryId(null)} />
          {categories.map((c) => (
            <Chip key={c.id} label={c.name} selected={categoryId === c.id} onPress={() => setCategoryId(c.id)} />
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + TAB_BAR_CLEARANCE }]}
        onScroll={handleScroll}
        onLayout={handleLayout}
        onContentSizeChange={handleContentSize}
        scrollEventThrottle={64}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={TOKENS.color.primary} />
        }
      >
        {showSkeleton ? <FeedSkeleton /> : null}

        {showError ? (
          <EmptyState
            icon="cloud-offline-outline"
            title="No pudimos cargar los trabajos"
            subtitle="Revisá tu conexión e intentá de nuevo."
            cta={{ label: 'Reintentar', onPress: () => refetch() }}
          />
        ) : null}

        {showEmpty ? (
          isProvider ? (
            <EmptyState
              icon="images-outline"
              title={category ? `Sin trabajos en ${category.name}` : 'Subí tus primeros trabajos'}
              subtitle={
                category
                  ? 'Todavía nadie publicó fotos en esta categoría. Mostrá lo que sabés hacer.'
                  : `Mostrá tus trabajos terminados en ${BRAND_NAME} y conseguí más cotizaciones.`
              }
              cta={{ label: 'Mis trabajos', onPress: () => router.push(MY_WORKS_ROUTE) }}
              secondaryCta={category ? { label: 'Ver todas', onPress: () => setCategoryId(null) } : undefined}
            />
          ) : (
            <EmptyState
              icon="images-outline"
              title={category ? `Sin trabajos en ${category.name}` : 'Todavía no hay trabajos'}
              subtitle={
                category
                  ? 'Todavía no hay fotos en esta categoría. Probá con otra.'
                  : `Pronto vas a ver acá fotos de trabajos terminados por profesionales de ${BRAND_NAME}.`
              }
              secondaryCta={category ? { label: 'Ver todas', onPress: () => setCategoryId(null) } : undefined}
            />
          )
        ) : null}

        {items.length > 0 ? (
          <WorksMasonry
            items={items}
            onPressItem={openWork}
            labelFor={(w) => `${w.service.title}, de ${w.provider.name}`}
          />
        ) : null}

        {feed.isFetchingNextPage ? <ActivityIndicator style={styles.footer} color={TOKENS.color.primary} /> : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  header: { paddingHorizontal: SPACING.xl, paddingBottom: SPACING.md },
  chips: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md, gap: SPACING.sm },
  content: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.xs },
  skeletonRow: { flexDirection: 'row', justifyContent: 'space-between' },
  footer: { marginVertical: SPACING.xl },
});
