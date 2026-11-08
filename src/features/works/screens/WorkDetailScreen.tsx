import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  ScreenHeader,
  SPACING,
  Text,
  TOKENS,
  useThemeColors,
  type ReportSheetSubmit,
} from '@/core/design-system';
import { safeBack } from '@/core/navigation/safeBack';
import { WORKS_TAB_ROUTE } from '../constants';
import { useProfile } from '@/hooks/queries/useProfileQuery';
import { useReportWork, useWorkFromCache } from '@/hooks/queries/useWorksQuery';
import { ReportFlow } from '@/features/reports/components/ReportFlow';
import { canReport } from '@/features/reports/canReport';
import { quoteHref } from '@/features/servicesUser/utils/quoteRoute';
import { workRatio } from '../utils/masonry';

/**
 * Photo detail. There is no single-post endpoint, so the item comes from the cached feed
 * pages (the screen is reached by tapping a tile); a cold deep link shows a friendly fallback.
 */
export default function WorkDetailScreen() {
  const tc = useThemeColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const work = useWorkFromCache(id);
  const { data: profile } = useProfile();
  const { mutateAsync: reportAsync } = useReportWork();
  const [reportOpen, setReportOpen] = useState(false);
  const closeReport = useCallback(() => setReportOpen(false), []);
  const submitReport = useCallback(
    ({ reason, details }: ReportSheetSubmit) => reportAsync({ postId: id!, reason, details }),
    [id, reportAsync],
  );

  if (!work) {
    return (
      <View style={[styles.root, { backgroundColor: tc.bg, paddingTop: insets.top }]}>
        <ScreenHeader title="Trabajo" style={styles.header} />
        <EmptyState
          icon="image-outline"
          title="Esta foto ya no está disponible"
          subtitle="Vuelve a Trabajos para ver los más recientes."
          cta={{ label: 'Volver', onPress: () => safeBack(router, WORKS_TAB_ROUTE) }}
        />
      </View>
    );
  }

  const { service, provider } = work;
  const isOwn = !!profile?.id && profile.id === provider.id;
  const showReport = canReport(provider.id, profile?.id);

  return (
    <View style={[styles.root, { backgroundColor: tc.bg, paddingTop: insets.top }]}>
      <ScreenHeader
        title="Trabajo"
        style={styles.header}
        right={
          showReport ? (
            <Pressable
              onPress={() => setReportOpen(true)}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Reportar foto"
            >
              <Ionicons name="flag-outline" size={22} color={tc.text} />
            </Pressable>
          ) : undefined
        }
      />

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + SPACING.xxxl }]}>
        <View style={[styles.photo, { aspectRatio: workRatio(work), backgroundColor: tc.surface2 }]}>
          <Image
            source={{ uri: work.imageUrl }}
            placeholder={work.thumbnailUrl ? { uri: work.thumbnailUrl } : undefined}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={200}
            accessibilityLabel={`Foto de ${service.title}`}
          />
        </View>

        <View style={styles.titleBlock}>
          <Text variant="h3">{service.title}</Text>
          <Badge label={service.categoryName} tone="brand" size="sm" style={styles.category} />
          {work.description ? (
            <Text variant="body" color={tc.textSub}>
              {work.description}
            </Text>
          ) : null}
        </View>

        <Card
          onPress={() =>
            router.push({ pathname: '/(tabs)/services/provider/[id]', params: { id: provider.id } })
          }
          contentStyle={styles.providerRow}
          accessibilityRole="button"
          accessibilityLabel={`Ver perfil de ${provider.name}`}
        >
          <Avatar uri={provider.avatarUrl} name={provider.name} size={48} />
          <View style={styles.providerInfo}>
            <Text variant="title">{provider.name}</Text>
            <View style={styles.meta}>
              {provider.rating != null ? (
                <View style={styles.rating}>
                  <Ionicons name="star" size={14} color={TOKENS.color.rating} />
                  <Text variant="caption" color={tc.textSub}>
                    {provider.rating.toFixed(1)}
                  </Text>
                </View>
              ) : null}
              {provider.isVerified ? <Badge label="Verificado" tone="done" icon="checkmark-circle" size="sm" /> : null}
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={tc.textMuted} />
        </Card>

        {!isOwn ? (
          <Button
            label="Cotizar"
            fullWidth
            onPress={() => router.push(quoteHref({ id: service.id, title: service.title }, provider.name))}
          />
        ) : null}
      </ScrollView>

      <ReportFlow
        visible={reportOpen}
        title="Reportar foto"
        message="Cuéntanos por qué quieres reportar este contenido."
        onClose={closeReport}
        submit={submitReport}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm },
  content: { paddingHorizontal: SPACING.lg, gap: SPACING.lg },
  photo: { width: '100%', borderRadius: TOKENS.radius.lg, overflow: 'hidden' },
  titleBlock: { gap: SPACING.sm },
  category: { alignSelf: 'flex-start' },
  providerRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  providerInfo: { flex: 1, gap: SPACING.xs },
  meta: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  rating: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
});
