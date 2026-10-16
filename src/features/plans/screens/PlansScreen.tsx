import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { safeBack } from '@/core/navigation/safeBack';
import {
  fetchPlans,
  fetchMyPlan,
  subscribe,
  cancelSubscription,
  Plan,
  MyPlan,
} from '@/features/plans/services/plan.service';
import { TOKENS } from '@/core/design-system/tokens';
import { GRADIENTS, BRAND_RADIAL_FILL } from '@/core/design-system/gradients';
import { getUserErrorMessage } from '@/lib/errors';
import { useThemeColors, usePremiumColors, wash, withAlpha, dialog } from '@/core/design-system';
import { useRequireProviderStatus } from '@/hooks/useRequireProviderStatus';
import { AnimatedBackground } from '@/components/AnimatedBackground';

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(price);
}

function AnimatedCard({ index, children }: { index: number; children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 350, delay: index * 100, useNativeDriver: true }),
      Animated.spring(ty, { toValue: 0, damping: 16, delay: index * 100, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY: ty }] }}>
      {children}
    </Animated.View>
  );
}

export default function PlansScreen() {
  useRequireProviderStatus('provider');
  const tc = useThemeColors();
  const pc = usePremiumColors();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [myPlan, setMyPlan] = useState<MyPlan | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [subscribing, setSubscribing] = useState<string | null>(null);

  const bannerOpacity = useRef(new Animated.Value(0)).current;
  const bannerScale = useRef(new Animated.Value(0.95)).current;

  const load = useCallback(async () => {
    try {
      const [plansData, myPlanData] = await Promise.all([
        fetchPlans(),
        fetchMyPlan().catch(() => null),
      ]);
      setPlans(plansData);
      setMyPlan(myPlanData);
      Animated.parallel([
        Animated.timing(bannerOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(bannerScale, { toValue: 1, damping: 14, useNativeDriver: true }),
      ]).start();
    } catch (err) {
      console.error('Error loading plans:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleSubscribe = async (planId: string) => {
    setSubscribing(planId);
    try {
      await subscribe(planId);
      dialog.fromAlert('Simulación completada', 'No se cobró dinero ni se activaron beneficios reales.');
      load();
    } catch (err: any) {
      dialog.fromAlert('Error', getUserErrorMessage(err));
    } finally {
      setSubscribing(null);
    }
  };

  const handleCancel = () => {
    dialog.fromAlert(
      'Cancelar suscripción',
      '¿Estás seguro? Esta acción cancela la simulación en este dispositivo.',
      [
        { text: 'No, mantener', style: 'cancel' },
        {
          text: 'Cancelar', style: 'destructive',
          onPress: async () => {
            try {
              await cancelSubscription();
              dialog.fromAlert('Suscripción cancelada', 'Se canceló la simulación. No hubo movimientos de dinero.');
              load();
            } catch (err: any) {
              dialog.fromAlert('Error', getUserErrorMessage(err));
            }
          },
        },
      ],
    );
  };

  const currentPlanId = myPlan?.plan?.id;
  const isSubscribed = !!myPlan;

  return (
    <LinearGradient
      colors={wash(tc)}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={s.bg}
    >
      <AnimatedBackground variant="minimal" />

      {/* Header */}
      <View style={[s.header, { backgroundColor: tc.surface, borderBottomColor: tc.cardBorder }]}>
        <Pressable onPress={() => safeBack(router, '/(tabs)/profile')} hitSlop={12} style={[s.backBtn, { backgroundColor: tc.card }]}>
          <MaterialIcons name="arrow-back" size={24} color={tc.text} />
        </Pressable>
        <Text style={[s.headerTitle, { color: tc.text }]}>Planes · simulación</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator color={TOKENS.color.signal} size="large" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[TOKENS.color.signal]}
            />
          }
        >
          {/* Current plan banner */}
          {isSubscribed && myPlan && (
            <Animated.View style={[s.currentPlanBanner, { opacity: bannerOpacity, transform: [{ scale: bannerScale }] }]}>
              <LinearGradient
                colors={GRADIENTS.brandDeep}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.currentPlanGrad}
              >
                <MaterialIcons name="workspace-premium" size={28} color={pc.goldFill} />
                <View style={s.currentPlanInfo}>
                  <Text style={[s.currentPlanLabel, { color: pc.goldFill }]}>Plan actual</Text>
                  <Text style={s.currentPlanName}>{myPlan.plan.name}</Text>
                  <Text style={s.currentPlanPeriod}>
                    Vigente hasta {new Date(myPlan.currentPeriodEnd).toLocaleDateString('es-AR')}
                  </Text>
                </View>
                <Pressable onPress={handleCancel} style={s.cancelBtn}>
                  <Text style={s.cancelBtnText}>Cancelar</Text>
                </Pressable>
              </LinearGradient>
            </Animated.View>
          )}

          {/* Free plan note */}
          {!isSubscribed && (
            <View style={[s.freeNote, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
              <MaterialIcons name="info" size={18} color={TOKENS.color.signal} />
              <Text style={[s.freeNoteText, { color: tc.text }]}>
                Estás en el plan Free. Actualizá para acceder a más beneficios.
              </Text>
            </View>
          )}

          {/* Plans */}
          {plans.map((plan, idx) => {
            const isCurrent = plan.id === currentPlanId;
            const isPopular = plan.highlighted;

            return (
              <AnimatedCard key={plan.id} index={idx}>
                <View style={[s.planCardShadow, isPopular && s.planCardShadowPopular]}>
                <Pressable
                  style={s.planCard}
                  onPress={() => { if (!isCurrent && !subscribing) handleSubscribe(plan.id); }}
                  disabled={isCurrent || !!subscribing}
                >
                  <View style={[s.planInner, { backgroundColor: tc.card, borderColor: tc.cardBorder }, isPopular && { borderColor: withAlpha(TOKENS.color.signal, 0.35), borderWidth: 1.5 }]}>
                    {isPopular && (
                      <View style={[s.popularBadge, { backgroundColor: pc.goldFill }]}>
                        <Text style={[s.popularText, { color: pc.onGold }]}>Más popular</Text>
                      </View>
                    )}

                    <View style={s.planHeader}>
                      <Text style={[s.planName, { color: tc.text }, isPopular && { color: TOKENS.color.signal }]}>{plan.name}</Text>
                      <View style={s.planPrice}>
                        <Text style={[s.planPriceAmount, { color: tc.text }, isPopular && { color: TOKENS.color.signal }]}>
                          {formatPrice(plan.price, plan.currency)}
                        </Text>
                        <Text style={[s.planPriceInterval, { color: tc.textSub }]}>
                          /{plan.interval === 'month' ? 'mes' : 'año'}
                        </Text>
                      </View>
                    </View>

                    <Text style={[s.planDescription, { color: tc.textSub }]}>{plan.description}</Text>

                    <View style={s.featuresList}>
                      {plan.features.map((feature, i) => (
                        <View key={i} style={s.featureRow}>
                          <MaterialIcons
                            name="check-circle"
                            size={18}
                            color={isPopular ? pc.gold : TOKENS.color.mint}
                          />
                          <Text style={[s.featureText, { color: tc.text }]}>{feature}</Text>
                        </View>
                      ))}
                    </View>

                    {isCurrent ? (
                      <View style={[s.currentBadge, { backgroundColor: TOKENS.status.done.bg }]}>
                        <MaterialIcons name="check" size={16} color={TOKENS.status.done.fg} />
                        <Text style={[s.currentBadgeText, { color: TOKENS.status.done.fg }]}>Plan actual</Text>
                      </View>
                    ) : (
                      <View style={[s.subscribeBtn, isPopular ? { overflow: 'hidden' } : BRAND_RADIAL_FILL]}>
                        {isPopular && (<LinearGradient colors={[pc.goldFill, pc.goldFillEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />)}
                        {subscribing === plan.id ? (
                          <ActivityIndicator color={TOKENS.color.onPrimary} size="small" />
                        ) : (
                          <Text style={[s.subscribeBtnText, isPopular && { color: pc.onGold }]}>
                            {plan.price === 0 ? 'Gratuito' : 'Suscribirse'}
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                </Pressable>
              </View>
            </AnimatedCard>
            );
          })}
        </ScrollView>
      )}
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  bg: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 8,
    borderRadius: 12,
  },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { padding: 24, paddingBottom: 40, gap: 20 },
  currentPlanBanner: { borderRadius: 20, overflow: 'hidden' },
  currentPlanGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  currentPlanInfo: { flex: 1, gap: 2 },
  currentPlanLabel: {
    fontSize: 11,
    fontWeight: '700',
    opacity: 0.7,
    textTransform: 'uppercase',
  },
  currentPlanName: { fontSize: 18, fontWeight: '800', color: TOKENS.onMedia.text },
  currentPlanPeriod: { fontSize: 12, color: TOKENS.onMedia.textMuted },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: TOKENS.onMedia.border,
  },
  cancelBtnText: { fontSize: 12, fontWeight: '600', color: TOKENS.onMedia.textSub },
  freeNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  freeNoteText: { flex: 1, fontSize: 13, lineHeight: 18 },
  planCardShadow: {
    borderRadius: 24,
    shadowColor: TOKENS.color.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  planCardShadowPopular: { shadowOpacity: 0.15, shadowRadius: 20, elevation: 6 },
  planCard: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  planInner: {
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderRadius: 24,
  },
  popularBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  popularText: { fontSize: 12, fontWeight: '800' },
  planHeader: { gap: 8 },
  planName: { fontSize: 20, fontWeight: '800' },
    planPrice: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  planPriceAmount: { fontSize: 32, fontWeight: '800' },
    planPriceInterval: { fontSize: 14 },
  planDescription: { fontSize: 14, lineHeight: 20 },
  featuresList: { gap: 10 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureText: { fontSize: 14, flex: 1 },
  currentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
  },
  currentBadgeText: { fontSize: 14, fontWeight: '700' },
  subscribeBtn: { paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  subscribeBtnText: { fontSize: 16, fontWeight: '700', color: TOKENS.color.onPrimary },
});
