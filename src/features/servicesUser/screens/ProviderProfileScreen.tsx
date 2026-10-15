/**
 * Rebrand "Señal Nocturna" — ProviderProfileScreen: misma lógica, estado y navegación que
 * el archivo original. Misma carga de perfil/servicios/reseñas y el modal de detalle — hero y CTA pasan al gradiente signal→bordo→profundo, badges de verificación a tintes translúcidos legibles en dark.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import api from '@/core/api/axiosinstance';
import { safeBack } from '@/core/navigation/safeBack';
import { ServiceDetailModal } from '../components/ServiceDetailModal';
import type { ServiceSummary } from '@/types/services';
import { Button, GRADIENTS, TOKENS, useIsDark, useThemeColors, withAlpha, type ReportSheetSubmit } from '@/core/design-system';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { useProfile } from '@/hooks/queries/useProfileQuery';
import { ReportFlow } from '@/features/reports/components/ReportFlow';
import { canReport } from '@/features/reports/canReport';
import { reportUser } from '@/features/reports/services/report.service';
import { reportReview } from '@/features/reviews/services/review.service';

interface ReviewItem {
  id: string;
  rating: number;
  comment: string | null;
  reply: string | null;
  createdAt: string;
  reviewer: { id: string | null; firstName: string; lastName: string; avatarUrl: string | null };
}

function useC() {
  const tc = useThemeColors();
  return { bg: tc.bg, card: tc.card, text: tc.text, sub: tc.textSub, border: tc.border, surface2: tc.surface2, muted: tc.textMuted, amber: TOKENS.color.rating };
}

interface PublicProvider {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  isVerified: boolean;
  kycApproved?: boolean;
  rating: number | null;
  reviewsCount: number;
  location?: string;
  bio?: string;
}

function formatRate(rate?: ServiceSummary['rate']) {
  if (!rate || !rate.amount) return 'Consultar';
  const sym = rate.currency === 'ARS' ? '$' : rate.currency === 'USD' ? 'US$' : rate.currency;
  const price = `${sym}${Number(rate.amount).toLocaleString('es-AR')}`;
  return rate.unit ? `${price} / ${rate.unit}` : price;
}

function ServiceRow({ item, onPress }: { item: ServiceSummary; onPress: () => void }) {
  const c = useC();
  const scaleA = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      onPressIn={() => Animated.spring(scaleA, { toValue: 0.97, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scaleA, { toValue: 1, useNativeDriver: true }).start()}
      onPress={onPress}
    >
      <Animated.View style={[s.serviceRow, { transform: [{ scale: scaleA }], borderBottomColor: c.border }]}>
        {item.thumbnail ? (
          <Image source={{ uri: item.thumbnail }} style={[s.serviceThumb, { backgroundColor: c.surface2 }]} contentFit="cover" />
        ) : (
          <View style={[s.serviceThumb, { backgroundColor: c.surface2 }]}>
            <Ionicons name="construct-outline" size={20} color={c.sub} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={[s.serviceTitle, { color: c.text }]} numberOfLines={1}>{item.title}</Text>
          <Text style={[s.serviceSummary, { color: c.sub }]} numberOfLines={2}>{item.summary}</Text>
          {item.rate?.amount ? (
            <Text style={[s.servicePrice, { color: c.sub }]}>{formatRate(item.rate)}</Text>
          ) : null}
        </View>
        <Ionicons name="chevron-forward" size={16} color={c.muted} />
      </Animated.View>
    </Pressable>
  );
}

export default function ProviderProfileScreen() {
  const insets = useSafeAreaInsets();
  const c = useC();
  const isDark = useIsDark();
  const router = useRouter();
  const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();
  const goBack = () => {
    if (from === 'home') return router.replace('/(tabs)');
    if (from === 'reels') return router.replace('/(tabs)/reels');
    if (from === 'search') return router.replace('/search');
    return safeBack(router, '/(tabs)/services');
  };

  const [provider, setProvider] = useState<PublicProvider | null>(null);
  const [services, setServices] = useState<ServiceSummary[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [loadKey, setLoadKey] = useState(0);
  const [selectedService, setSelectedService] = useState<ServiceSummary | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const { data: me } = useProfile();
  const [reportTarget, setReportTarget] = useState<{ kind: 'profile' } | { kind: 'review'; id: string } | null>(null);
  const closeReport = useCallback(() => setReportTarget(null), []);
  const submitReport = useCallback(
    async ({ reason, details }: ReportSheetSubmit) => {
      if (!reportTarget) return;
      if (reportTarget.kind === 'review') {
        await reportReview(reportTarget.id, { reason, details });
      } else if (id) {
        await reportUser(id, { reason, details, context: { type: 'profile' } });
      }
    },
    [reportTarget, id],
  );
  const canReportProfile = canReport(id, me?.id);
  const openProfileMenu = () =>
    Alert.alert('Opciones', undefined, [
      { text: 'Reportar perfil', style: 'destructive', onPress: () => setReportTarget({ kind: 'profile' }) },
      { text: 'Cancelar', style: 'cancel' },
    ]);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!id) return;
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setLoadError(false);
      try {
        const [profileRes, servicesRes, reviewsRes] = await Promise.all([
          api.get<PublicProvider>(`/users/${id}/public`),
          api.get<any>(`/services`, { params: { providerId: id, limit: 20 } }),
          api.get<any>(`/reviews/providers/${id}/reviews`, { params: { limit: 10 } }).catch(() => ({ data: { data: [] } })),
        ]);

        if (!mounted) return;

        const providerData = profileRes.data as any;
        setProvider({
          id: providerData.id,
          firstName: providerData.firstName ?? '',
          lastName: providerData.lastName ?? '',
          avatarUrl: providerData.avatarUrl ?? null,
          isVerified: providerData.isVerified ?? false,
          kycApproved: providerData.kycApproved ?? providerData.isVerified ?? false,
          rating: providerData.rating != null ? Number(providerData.rating) : null,
          reviewsCount: providerData.reviewsCount ?? 0,
          location: providerData.location ?? '',
          bio: providerData.bio ?? '',
        });

        const rawServices: any[] = servicesRes.data?.data ?? servicesRes.data ?? [];
        setServices(rawServices.map(s => ({
          id: s.id,
          categoryId: s.category?.id ?? '',
          providerId: id,
          name: [providerData.firstName, providerData.lastName].filter(Boolean).join(' '),
          title: s.title ?? '',
          summary: s.description ?? '',
          thumbnail: s.images?.[0] ?? undefined,
          images: s.images ?? [],
          location: providerData.location ?? '',
          rate: {
            amount: parseFloat(s.price?.amount ?? 0) || 0,
            currency: s.price?.currency ?? 'ARS',
            unit: s.price?.unit ?? undefined,
          },
          averageRating: Number(providerData.rating ?? 0),
          reviewsCount: providerData.reviewsCount ?? 0,
        })));

        const rawReviews: any[] = reviewsRes.data?.data ?? reviewsRes.data ?? [];
        setReviews(rawReviews.map(r => ({
          id: r.id,
          rating: Number(r.rating ?? 0),
          comment: r.comment ?? null,
          reply: r.reply ?? null,
          createdAt: r.createdAt ?? '',
          reviewer: {
            id: r.reviewer?.id ?? r.reviewerId ?? null,
            firstName: r.reviewer?.firstName ?? '',
            lastName: r.reviewer?.lastName ?? '',
            avatarUrl: r.reviewer?.avatarUrl ?? null,
          },
        })));

        Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
      } catch (err) {
        console.error('Error loading provider profile:', err);
        if (mounted) setLoadError(true);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [id, loadKey]);

  const fullName = provider ? [provider.firstName, provider.lastName].filter(Boolean).join(' ') : '';
  const initials = provider ? (provider.firstName[0] ?? '') + (provider.lastName?.[0] ?? '') : '';

  if (loading) {
    return (
      <View style={[s.root, s.center, { backgroundColor: c.bg, paddingTop: insets.top }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={TOKENS.color.signal} />
      </View>
    );
  }

  if (!provider) {
    return (
      <View style={[s.root, s.center, { backgroundColor: c.bg, paddingTop: insets.top }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Pressable onPress={goBack} style={[s.backBtn, { backgroundColor: c.card }]}>
          <Ionicons name="arrow-back" size={22} color={c.text} />
        </Pressable>
        <Text style={[s.errorTitle, { color: c.text }]}>
          {loadError ? 'No se pudo cargar el perfil' : 'Perfil no encontrado'}
        </Text>
        <Text style={[s.errorSub, { color: c.sub }]}>
          {loadError ? 'Revisá tu conexión e intentá de nuevo.' : 'Volvé y elegí otro profesional.'}
        </Text>
        {loadError && (
          <Button label="Reintentar" onPress={() => setLoadKey(k => k + 1)} style={s.retryBtn} />
        )}
      </View>
    );
  }

  const handleRequest = () => {
    if (services.length === 0) return;
    router.push({
      pathname: '/orders/quote',
      params: {
        serviceId: services[0].id,
        providerName: fullName,
        serviceTitle: services[0].title,
      },
    });
  };

  return (
    <View style={[s.root, { backgroundColor: c.bg, paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={c.bg} />
      <AnimatedBackground variant="minimal" />

      {/* Back button flotante */}
      <Pressable onPress={goBack} style={[s.backBtn, s.backBtnFloat, { backgroundColor: c.card }]}>
        <Ionicons name="arrow-back" size={22} color={c.text} />
      </Pressable>

      {canReportProfile && (
        <Pressable
          onPress={openProfileMenu}
          style={[s.backBtn, s.moreBtnFloat, { backgroundColor: c.card }]}
          accessibilityRole="button"
          accessibilityLabel="Más opciones del perfil"
        >
          <Ionicons name="ellipsis-horizontal" size={20} color={c.text} />
        </Pressable>
      )}

      <Animated.ScrollView
        style={{ opacity: fadeAnim }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 110 }]}
      >
        {/* ── Hero ── */}
        <LinearGradient
          colors={GRADIENTS.brandDeep}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.hero}
        >
          <View style={s.heroBubble1} />
          <View style={s.heroBubble2} />

          <View style={s.heroBody}>
            {provider.avatarUrl ? (
              <Image source={{ uri: provider.avatarUrl }} style={s.avatar} contentFit="cover" />
            ) : (
              <LinearGradient colors={[TOKENS.onMedia.fillStrong, TOKENS.onMedia.fill]} style={s.avatarFallback}>
                <Text style={s.avatarInitials}>{initials.toUpperCase()}</Text>
              </LinearGradient>
            )}

            <View style={s.heroInfo}>
              <View style={s.nameRow}>
                <Text style={s.heroName}>{fullName}</Text>
                {provider.isVerified && (
                  <Ionicons name="checkmark-circle" size={18} color={TOKENS.color.mint} />
                )}
              </View>

              {provider.location ? (
                <View style={s.locationRow}>
                  <Ionicons name="location-outline" size={13} color={TOKENS.onMedia.textSub} />
                  <Text style={s.locationText}>{provider.location}</Text>
                </View>
              ) : null}

              <View style={s.statsRow}>
                <Ionicons name="star" size={13} color={c.amber} />
                <Text style={s.statText}>
                  {provider.rating ? Number(provider.rating).toFixed(1) : 'Sin reseñas'}
                </Text>
                {provider.reviewsCount > 0 && (
                  <Text style={s.statSub}>({provider.reviewsCount} reseñas)</Text>
                )}
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* ── Verificación ── */}
        <View style={[s.section, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={[s.sectionTitle, { color: c.text }]}>Verificación</Text>
          <View style={s.badgeRow}>
            <View style={[s.badge, provider.kycApproved ? { backgroundColor: TOKENS.status.done.bg } : { backgroundColor: c.surface2 }]}>
              <Ionicons
                name={provider.kycApproved ? 'shield-checkmark' : 'shield-outline'}
                size={15}
                color={provider.kycApproved ? TOKENS.status.done.fg : c.sub}
              />
              <Text style={[s.badgeText, { color: provider.kycApproved ? TOKENS.status.done.fg : c.sub }]}>
                {provider.kycApproved ? 'Identidad verificada' : 'Sin verificar'}
              </Text>
            </View>

            {provider.isVerified && (
              <View style={[s.badge, { backgroundColor: TOKENS.status.done.bg }]}>
                <Ionicons name="checkmark-circle" size={15} color={TOKENS.status.done.fg} />
                <Text style={[s.badgeText, { color: TOKENS.status.done.fg }]}>Profesional aprobado</Text>
              </View>
            )}

            <View style={[s.badge, { backgroundColor: withAlpha(TOKENS.color.rating, 0.12) }]}>
              <Ionicons name="star" size={15} color={TOKENS.color.rating} />
              <Text style={[s.badgeText, { color: TOKENS.color.rating }]}>
                {provider.reviewsCount > 0
                  ? `${Number(provider.rating ?? 0).toFixed(1)} · ${provider.reviewsCount} reseñas`
                  : 'Sin reseñas aún'}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Bio ── */}
        {provider.bio ? (
          <View style={[s.section, { backgroundColor: c.card, borderColor: c.border }]}>
            <Text style={[s.sectionTitle, { color: c.text }]}>Sobre el profesional</Text>
            <Text style={[s.bioText, { color: c.sub }]}>{provider.bio}</Text>
          </View>
        ) : null}

        {/* ── Servicios ── */}
        {services.length > 0 && (
          <View style={[s.section, { backgroundColor: c.card, borderColor: c.border }]}>
            <Text style={[s.sectionTitle, { color: c.text }]}>
              Servicios
              <Text style={[s.sectionCount, { color: c.sub }]}> ({services.length})</Text>
            </Text>
            {services.map(item => (
              <ServiceRow
                key={item.id}
                item={item}
                onPress={() => {
                  setSelectedService(item);
                  setModalVisible(true);
                }}
              />
            ))}
          </View>
        )}

        {services.length === 0 && (
          <View style={[s.section, s.emptyServices, { backgroundColor: c.card, borderColor: c.border }]}>
            <Ionicons name="construct-outline" size={36} color={c.muted} />
            <Text style={[s.emptySub, { color: c.sub }]}>Este profesional aún no publicó servicios.</Text>
          </View>
        )}

        {/* ── Reseñas ── */}
        {reviews.length > 0 && (
          <View style={[s.section, { backgroundColor: c.card, borderColor: c.border }]}>
            <Text style={[s.sectionTitle, { color: c.text }]}>
              Reseñas
              <Text style={[s.sectionCount, { color: c.sub }]}> ({provider?.reviewsCount ?? reviews.length})</Text>
            </Text>
            {reviews.map(r => {
              const name = [r.reviewer.firstName, r.reviewer.lastName].filter(Boolean).join(' ') || 'Usuario';
              const initial = (r.reviewer.firstName[0] ?? r.reviewer.lastName[0] ?? 'U').toUpperCase();
              const date = r.createdAt ? new Date(r.createdAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
              return (
                <View key={r.id} style={[s.reviewCard, { borderBottomColor: c.border }]}>
                  <View style={s.reviewHeader}>
                    <View style={[s.reviewAvatar, { backgroundColor: TOKENS.color.signal }]}>
                      {r.reviewer.avatarUrl
                        ? <Image source={{ uri: r.reviewer.avatarUrl }} style={{ width: 36, height: 36, borderRadius: 18 }} contentFit="cover" />
                        : <Text style={s.reviewInitial}>{initial}</Text>
                      }
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.reviewName, { color: c.text }]}>{name}</Text>
                      <View style={s.starsRow}>
                        {[1,2,3,4,5].map(i => (
                          <Ionicons key={i} name="star" size={11} color={i <= r.rating ? c.amber : c.muted} />
                        ))}
                        <Text style={[s.reviewDate, { color: c.sub }]}>{date}</Text>
                      </View>
                    </View>
                  </View>
                  {r.comment ? <Text style={[s.reviewComment, { color: c.sub }]}>{r.comment}</Text> : null}
                  {canReport(r.reviewer.id, me?.id) ? (
                    <Pressable
                      onPress={() => setReportTarget({ kind: 'review', id: r.id })}
                      hitSlop={8}
                      style={s.reportReviewBtn}
                      accessibilityRole="button"
                      accessibilityLabel="Reportar reseña"
                    >
                      <Ionicons name="flag-outline" size={13} color={c.muted} />
                      <Text style={[s.reportReviewText, { color: c.muted }]}>Reportar reseña</Text>
                    </Pressable>
                  ) : null}
                  {r.reply ? (
                    <View style={[s.replyBox, { backgroundColor: c.surface2, borderLeftColor: TOKENS.color.signal }]}>
                      <Text style={[s.replyLabel, { color: TOKENS.color.signal }]}>Respuesta del proveedor</Text>
                      <Text style={[s.replyText, { color: c.sub }]}>{r.reply}</Text>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        )}
      </Animated.ScrollView>

      {/* ── Footer CTA ── */}
      {services.length > 0 && (
        <View style={[s.footer, { backgroundColor: c.card, borderTopColor: c.border, paddingBottom: insets.bottom + 12 }]}>
          <Pressable onPress={handleRequest}>
            <LinearGradient colors={GRADIENTS.brand} style={s.ctaBtn}>
              <Ionicons name="chatbubble-ellipses-outline" size={18} color={TOKENS.color.onPrimary} />
              <Text style={s.ctaBtnText}>Solicitar servicio</Text>
            </LinearGradient>
          </Pressable>
        </View>
      )}

      <ServiceDetailModal
        visible={modalVisible}
        service={selectedService}
        onClose={() => setModalVisible(false)}
      />

      <ReportFlow
        visible={reportTarget !== null}
        title={reportTarget?.kind === 'review' ? 'Reportar reseña' : 'Reportar perfil'}
        message="Contanos por qué querés reportar esto."
        onClose={closeReport}
        submit={submitReport}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  scroll: { gap: 12, paddingTop: 0 },

  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: TOKENS.color.shadow, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  backBtnFloat: {
    position: 'absolute', top: 56, left: 16, zIndex: 10,
  },
  moreBtnFloat: {
    position: 'absolute', top: 56, right: 16, zIndex: 10,
  },

  // Hero
  hero: {
    paddingTop: 64, paddingBottom: 24, paddingHorizontal: 20,
    gap: 20, overflow: 'hidden',
  },
  heroBubble1: {
    position: 'absolute', width: 220, height: 220,
    borderRadius: 110, backgroundColor: TOKENS.onMedia.fillFaint,
    top: -60, right: -60,
  },
  heroBubble2: {
    position: 'absolute', width: 140, height: 140,
    borderRadius: 70, backgroundColor: TOKENS.onMedia.fillFaint,
    bottom: -40, left: 20,
  },
  heroBody: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: {
    width: 80, height: 80, borderRadius: 24,
    borderWidth: 3, borderColor: TOKENS.onMedia.fillStrong,
  },
  avatarFallback: {
    width: 80, height: 80, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: TOKENS.onMedia.border,
  },
  avatarInitials: { fontSize: 28, fontWeight: '700', color: TOKENS.onMedia.text },
  heroInfo: { flex: 1, gap: 6 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  heroName: { fontSize: 20, fontWeight: '800', color: TOKENS.onMedia.text, letterSpacing: -0.3 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: 12, color: TOKENS.onMedia.textSub },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 13, fontWeight: '700', color: TOKENS.color.rating },
  statSub: { fontSize: 12, color: TOKENS.onMedia.textMuted },
  // Footer CTA
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 16, paddingTop: 12,
    borderTopWidth: 1,
    shadowColor: TOKENS.color.shadow, shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 8,
  },
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 16,
    paddingVertical: 15,
    ...TOKENS.shadow.glow,
  },
  ctaBtnText: { fontSize: 16, fontWeight: '700', color: TOKENS.color.onPrimary },

  // Sections
  section: {
    marginHorizontal: 16, borderRadius: 20,
    padding: 18, gap: 12,
    borderWidth: 1,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  sectionCount: { fontWeight: '400' },
  bioText: { fontSize: 14, lineHeight: 21 },

  // Verification badges
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20,
  },
  badgeText: { fontSize: 12, fontWeight: '600' },

  // Service row
  serviceRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  serviceThumb: {
    width: 56, height: 56, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  serviceTitle: { fontSize: 14, fontWeight: '600' },
  serviceSummary: { fontSize: 12, lineHeight: 17, marginTop: 2 },
  servicePrice: { fontSize: 13, fontWeight: '600', marginTop: 4 },

  // Reviews
  reviewCard: { gap: 8, paddingVertical: 10, borderBottomWidth: 1 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  reviewAvatar: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  reviewInitial: { fontSize: 15, fontWeight: '700', color: TOKENS.color.onPrimary },
  reviewName: { fontSize: 13, fontWeight: '600' },
  starsRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 },
  reviewDate: { fontSize: 11, marginLeft: 4 },
  reviewComment: { fontSize: 13, lineHeight: 19 },
  reportReviewBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
  reportReviewText: { fontSize: 11 },
  replyBox: { marginTop: 6, padding: 10, borderRadius: 8, borderLeftWidth: 3 },
  replyLabel: { fontSize: 11, fontWeight: '700', marginBottom: 2 },
  replyText: { fontSize: 13, lineHeight: 18 },

  // Empty
  emptyServices: { alignItems: 'center', paddingVertical: 24 },
  emptySub: { fontSize: 14, textAlign: 'center' },
  errorTitle: { fontSize: 18, fontWeight: '700', marginTop: 16 },
  errorSub: { fontSize: 14, marginTop: 6 },
  retryBtn: { marginTop: 20 },
});
