/**
 * MyReviewsScreen — Reseñas recibidas por el proveedor.
 * Muestra reseñas con opción de responder (POST /reviews/:id/reply).
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { MotiView } from '@/core/components/MotiView';
import { router } from 'expo-router';
import { safeBack } from '@/core/navigation/safeBack';
import { useServiceReviews } from '@/hooks/queries/useMarketplaceQuery';
import { useReplyToReview } from '@/hooks/mutations/useReviewMutations';
import { getUserErrorMessage } from '@/lib/errors';
import { useProfile } from '@/features/profile/state/ProfileContext';
import {
  TOKENS,
  SPACING,
  Avatar,
  Button,
  Card,
  EmptyState,
  Input,
  ScreenHeader,
  Text as AppText,
  toast,
  useThemeColors,
  wash,
} from '@/core/design-system';
import { useRequireProviderStatus } from '@/hooks/useRequireProviderStatus';
import { AnimatedBackground } from '@/components/AnimatedBackground';

interface ReviewItem {
  id: string;
  reviewer: { firstName: string; lastName?: string };
  rating: number;
  comment: string;
  reply?: string | null;
  createdAt: string;
}

function Stars({ rating }: { rating: number }) {
  const tc = useThemeColors();
  return (
    <View style={styles.stars} accessible accessibilityLabel={`${rating} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map(s => (
        <MaterialIcons
          key={s}
          name={s <= rating ? 'star' : 'star-outline'}
          size={16}
          color={s <= rating ? TOKENS.color.rating : tc.textMuted}
        />
      ))}
    </View>
  );
}

export default function MyReviewsScreen() {
  useRequireProviderStatus('provider');
  const tc = useThemeColors();
  const { profile } = useProfile();
  const reviewsQuery = useServiceReviews(profile?.id);
  const reviews = (reviewsQuery.data ?? []) as unknown as ReviewItem[];
  const loading = reviewsQuery.isLoading;
  const [refreshing, setRefreshing] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const replyM = useReplyToReview();

  const handleRefresh = async () => {
    setRefreshing(true);
    try { await reviewsQuery.refetch(); } finally { setRefreshing(false); }
  };

  const handleReply = async (reviewId: string) => {
    if (!replyText.trim() || replyM.isPending) return;
    try {
      await replyM.mutateAsync({ reviewId, reply: replyText.trim() });
      setReplyingTo(null);
      setReplyText('');
      toast.success('Respuesta enviada', 'Tu respuesta se publicó correctamente.');
    } catch (err) {
      toast.error('No pudimos enviar tu respuesta', getUserErrorMessage(err));
    }
  };

  return (
    <LinearGradient
      colors={wash(tc)}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.bg}
    >
      <AnimatedBackground variant="minimal" />

      <View style={[styles.header, { borderBottomColor: tc.cardBorder }]}>
        <ScreenHeader title="Mis Reseñas" onBack={() => safeBack(router, '/(tabs)/profile')} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={TOKENS.color.signal} size="large" />
        </View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={item => item.id}
          contentContainerStyle={[styles.listContent, reviews.length === 0 && styles.listEmpty]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[TOKENS.color.signal]}
              tintColor={TOKENS.color.signal}
            />
          }
          ListEmptyComponent={
            reviewsQuery.isError ? (
              <EmptyState
                icon="cloud-offline-outline"
                title="No pudimos cargar tus reseñas"
                subtitle={getUserErrorMessage(reviewsQuery.error)}
                cta={{ label: 'Reintentar', onPress: () => { reviewsQuery.refetch(); } }}
              />
            ) : (
              <EmptyState
                icon="star-outline"
                title="Sin reseñas todavía"
                subtitle="Cuando los clientes te califiquen, aparecerán acá."
              />
            )
          }
          renderItem={({ item, index }) => (
            <MotiView
              from={{ opacity: 0, translateY: 16 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 300, delay: index * 50 }}
            >
              <Card radius="lg" contentStyle={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Avatar name={item.reviewer?.firstName} size={40} />
                  <View style={styles.flex}>
                    <AppText variant="subtitle" color={tc.text}>
                      {item.reviewer?.firstName} {item.reviewer?.lastName || ''}
                    </AppText>
                    <Stars rating={item.rating} />
                  </View>
                  <AppText variant="caption" color={tc.textMuted}>
                    {new Date(item.createdAt).toLocaleDateString('es-AR')}
                  </AppText>
                </View>

                <AppText variant="body" color={tc.text}>{item.comment}</AppText>

                {/* Provider reply */}
                {item.reply ? (
                  <View style={[styles.replyBox, { backgroundColor: tc.accent }]}>
                    <View style={styles.replyHeader}>
                      <MaterialIcons name="reply" size={14} color={tc.signal} />
                      <AppText variant="caption" weight="700" color={tc.signal}>Tu respuesta</AppText>
                    </View>
                    <AppText variant="bodySmall" color={tc.text}>{item.reply}</AppText>
                  </View>
                ) : replyingTo === item.id ? (
                  <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <Input
                      value={replyText}
                      onChangeText={setReplyText}
                      placeholder="Escribí tu respuesta..."
                      accessibilityLabel="Tu respuesta"
                      multiline
                      maxLength={500}
                      autoFocus
                    />
                    <View style={styles.replyActions}>
                      <Button
                        label="Cancelar"
                        variant="ghost"
                        size="sm"
                        onPress={() => { setReplyingTo(null); setReplyText(''); }}
                      />
                      <Button
                        label="Responder"
                        size="sm"
                        onPress={() => handleReply(item.id)}
                        disabled={!replyText.trim()}
                        loading={replyM.isPending}
                      />
                    </View>
                  </KeyboardAvoidingView>
                ) : (
                  <Pressable
                    style={[styles.replyBtn, { backgroundColor: tc.accent }]}
                    onPress={() => { setReplyingTo(item.id); setReplyText(''); }}
                    accessibilityRole="button"
                    accessibilityLabel={`Responder a ${item.reviewer?.firstName ?? 'la reseña'}`}
                  >
                    <MaterialIcons name="reply" size={16} color={tc.signal} />
                    <AppText variant="label" color={tc.signal}>Responder</AppText>
                  </Pressable>
                )}
              </Card>
            </MotiView>
          )}
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  flex: { flex: 1 },
  header: {
    paddingTop: 60,
    paddingHorizontal: SPACING.xxl,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
  },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: SPACING.xxl, paddingBottom: SPACING.huge, gap: 14 },
  listEmpty: { flexGrow: 1 },
  stars: { flexDirection: 'row', gap: 2 },
  // Review card
  reviewCard: { gap: SPACING.md },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  // Reply
  replyBox: {
    borderRadius: TOKENS.radius.sm,
    padding: SPACING.md,
    gap: 6,
  },
  replyHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  replyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: SPACING.md,
    borderRadius: SPACING.sm,
  },
  replyActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
});
