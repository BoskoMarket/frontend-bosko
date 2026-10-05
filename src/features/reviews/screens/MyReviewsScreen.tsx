/**
 * MyReviewsScreen — Reseñas recibidas por el proveedor.
 * Muestra reseñas con opción de responder (POST /reviews/:id/reply).
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from '@/core/components/BlurView';
import { MaterialIcons } from '@expo/vector-icons';
import { MotiView } from '@/core/components/MotiView';
import { router } from 'expo-router';
import { safeBack } from '@/core/navigation/safeBack';
import { useServiceReviews } from '@/hooks/queries/useMarketplaceQuery';
import { useReplyToReview } from '@/hooks/mutations/useReviewMutations';
import { getUserErrorMessage } from '@/lib/errors';
import { useProfile } from '@/features/profile/state/ProfileContext';
import { TOKENS } from '@/core/design-system/tokens';
import { GRADIENTS } from '@/core/design-system/gradients';
import { Button, Text as AppText, useThemeColors, useIsDark, wash } from '@/core/design-system';
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

export default function MyReviewsScreen() {
  useRequireProviderStatus('provider');
  const tc = useThemeColors();
  const isDark = useIsDark();
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
    await reviewsQuery.refetch();
    setRefreshing(false);
  };

  const handleReply = async (reviewId: string) => {
    if (!replyText.trim()) return;
    try {
      await replyM.mutateAsync({ reviewId, reply: replyText.trim() });
      setReplyingTo(null);
      setReplyText('');
      Alert.alert('Respuesta enviada', 'Tu respuesta se publicó correctamente.');
    } catch (err) {
      Alert.alert('Error', getUserErrorMessage(err));
    }
  };

  function Stars({ rating }: { rating: number }) {
    return (
      <View style={{ flexDirection: 'row', gap: 2 }}>
        {[1, 2, 3, 4, 5].map(s => (
          <MaterialIcons
            key={s}
            name={s <= rating ? 'star' : 'star-outline'}
            size={16}
            color={s <= rating ? '#FFD700' : tc.textMuted}
          />
        ))}
      </View>
    );
  }

  return (
    <LinearGradient
      colors={wash(tc)}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.bg}
    >
      <AnimatedBackground variant="minimal" />

      <BlurView intensity={25} tint={isDark ? 'dark' : 'light'} style={[styles.header, { borderBottomColor: tc.cardBorder }]}>
        <Pressable onPress={() => safeBack(router, '/(tabs)/profile')} hitSlop={12} style={[styles.backBtn, { backgroundColor: tc.card }]}>
          <MaterialIcons name="arrow-back" size={24} color={tc.text} />
        </Pressable>
        <AppText variant="h3" color={tc.text}>Mis Reseñas</AppText>
        <View style={{ width: 40 }} />
      </BlurView>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={TOKENS.color.signal} size="large" />
        </View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[TOKENS.color.signal]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <MaterialIcons name="star-outline" size={64} color={tc.textMuted} />
              <AppText variant="title" color={tc.text}>Sin reseñas todavía</AppText>
              <AppText variant="body" color={tc.textSub} center style={{ paddingHorizontal: 40 }}>
                Cuando los clientes te califiquen, aparecerán acá.
              </AppText>
            </View>
          }
          renderItem={({ item, index }) => (
            <MotiView
              from={{ opacity: 0, translateY: 16 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 300, delay: index * 50 }}
            >
              <BlurView intensity={25} tint={isDark ? 'dark' : 'light'} style={[styles.reviewCard, { borderColor: tc.cardBorder }]}>
                <View style={styles.reviewHeader}>
                  <LinearGradient colors={GRADIENTS.brand} style={styles.reviewerAvatar}>
                    <AppText variant="subtitle" color="#fff">
                      {(item.reviewer?.firstName || '?').charAt(0).toUpperCase()}
                    </AppText>
                  </LinearGradient>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.reviewerName, { color: tc.text }]}>
                      {item.reviewer?.firstName} {item.reviewer?.lastName || ''}
                    </Text>
                    <Stars rating={item.rating} />
                  </View>
                  <Text style={[styles.reviewDate, { color: tc.textMuted }]}>
                    {new Date(item.createdAt).toLocaleDateString('es-AR')}
                  </Text>
                </View>

                <AppText variant="body" color={tc.text}>{item.comment}</AppText>

                {/* Provider reply */}
                {item.reply ? (
                  <View style={[styles.replyBox, { backgroundColor: tc.accent }]}>
                    <View style={styles.replyHeader}>
                      <MaterialIcons name="reply" size={14} color={TOKENS.color.signal} />
                      <AppText variant="caption" weight="700" color={TOKENS.color.signal}>Tu respuesta</AppText>
                    </View>
                    <AppText variant="bodySmall" color={tc.text}>{item.reply}</AppText>
                  </View>
                ) : replyingTo === item.id ? (
                  <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <TextInput
                      style={[styles.replyInput, { backgroundColor: tc.surface2, color: tc.text, borderColor: tc.border }]}
                      value={replyText}
                      onChangeText={setReplyText}
                      placeholder="Escribí tu respuesta..."
                      placeholderTextColor={tc.textMuted}
                      multiline
                      maxLength={500}
                      autoFocus
                    />
                    <View style={styles.replyActions}>
                      <Pressable onPress={() => { setReplyingTo(null); setReplyText(''); }}>
                        <AppText
                          variant="body"
                          weight="600"
                          color={tc.textSub}
                          style={{ paddingVertical: 8, paddingHorizontal: 4 }}
                        >
                          Cancelar
                        </AppText>
                      </Pressable>
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
                  >
                    <MaterialIcons name="reply" size={16} color={TOKENS.color.signal} />
                    <AppText variant="label" color={TOKENS.color.signal}>Responder</AppText>
                  </Pressable>
                )}
              </BlurView>
            </MotiView>
          )}
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 16,
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.6)',
  },
  backBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: 24, paddingBottom: 40, gap: 14 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
  // Review card
  reviewCard: {
    padding: 16,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.85)',
    gap: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reviewerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewerName: { fontSize: 15, fontWeight: '700', color: TOKENS.color.text },
  reviewDate: { fontSize: 11, color: 'rgba(107,107,107,0.5)' },
  // Reply
  replyBox: {
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  replyHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  replyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  replyInput: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: TOKENS.color.text,
    minHeight: 80,
    borderWidth: 1.5,
    borderColor: 'rgba(200,200,220,0.5)',
  },
  replyActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
});
