import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useKYC } from '../state/KYCContext';
import { useProfile } from '@/features/profile/state/ProfileContext';
import {
  getBackgroundCheckStatus,
  BackgroundCheckState,
} from '../services/background-check.service';
import type { KYCStatus } from '../types/kyc.types';
import { TOKENS, GRADIENTS, FONT_FAMILY } from '@/core/design-system';
import { useThemeColors } from '@/stores/theme.store';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { safeBack } from '@/core/navigation/safeBack';

function makeC(tc: ReturnType<typeof useThemeColors>) {
  return {
    primary: TOKENS.color.primary,
    dark:    TOKENS.color.primaryDark,
    bg:      tc.bg,
    card:    tc.card,
    text:    tc.text,
    sub:     tc.textSub,
    border:  tc.border,
    surface2: tc.surface2,
    accent:  tc.accent,
    green:   TOKENS.status.done.fg,
    greenBg: TOKENS.status.done.bg,
    blue:    TOKENS.status.progress.fg,
    blueBg:  TOKENS.status.progress.bg,
    amber:   TOKENS.status.pending.fg,
    amberBg: TOKENS.status.pending.bg,
    red:     TOKENS.status.cancelled.fg,
    redBg:   TOKENS.status.cancelled.bg,
  };
}

type C = ReturnType<typeof makeC>;

type StepState = 'done' | 'in_progress' | 'pending' | 'error' | 'locked';

interface Step {
  id: string;
  title: string;
  description: string;
  state: StepState;
  badge?: string;
  action?: () => void;
  actionLabel?: string;
}

function stepColor(state: StepState, C: C) {
  switch (state) {
    case 'done':        return { icon: C.green,   bg: C.greenBg, border: 'rgba(0,229,160,0.3)' };
    case 'in_progress': return { icon: C.blue,    bg: C.blueBg,  border: 'rgba(176,124,255,0.3)' };
    case 'pending':     return { icon: C.amber,   bg: C.amberBg, border: 'rgba(255,176,32,0.3)' };
    case 'error':       return { icon: C.red,     bg: C.redBg,   border: 'rgba(255,77,77,0.3)' };
    case 'locked':      return { icon: C.sub,     bg: C.surface2, border: C.border };
  }
}

function stepIcon(state: StepState): React.ComponentProps<typeof Ionicons>['name'] {
  switch (state) {
    case 'done':        return 'checkmark-circle';
    case 'in_progress': return 'time';
    case 'pending':     return 'time-outline';
    case 'error':       return 'close-circle';
    case 'locked':      return 'lock-closed';
  }
}

function StepCard({ step, index, anim, C, s }: { step: Step; index: number; anim: Animated.Value; C: C; s: ReturnType<typeof makeStyles> }) {
  const colors = stepColor(step.state, C);
  const scale  = useRef(new Animated.Value(1)).current;
  const isActionable = !!step.action && step.state !== 'locked' && step.state !== 'done';

  return (
    <Animated.View
      style={[
        s.stepCard,
        { borderColor: colors.border, opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] },
        step.state === 'locked' && s.stepCardLocked,
      ]}
    >
      {/* Number + icon */}
      <View style={[s.stepIconWrap, { backgroundColor: colors.bg, borderColor: colors.border }]}>
        <Ionicons name={stepIcon(step.state)} size={22} color={colors.icon} />
      </View>

      {/* Content */}
      <View style={s.stepContent}>
        <View style={s.stepHeader}>
          <Text style={[s.stepTitle, step.state === 'locked' && s.stepTitleLocked]}>
            {step.title}
          </Text>
          {step.badge && (
            <View style={[s.stepBadge, { backgroundColor: colors.bg }]}>
              <Text style={[s.stepBadgeText, { color: colors.icon }]}>{step.badge}</Text>
            </View>
          )}
        </View>
        <Text style={s.stepDesc}>{step.description}</Text>

        {isActionable && step.action && (
          <Pressable
            onPressIn={() => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start()}
            onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
            onPress={step.action}
          >
            <Animated.View style={[s.stepBtn, TOKENS.shadow.glow, { backgroundColor: C.card, transform: [{ scale }] }]}>
              <LinearGradient
                colors={GRADIENTS.brand}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.stepBtnGrad}
              >
                <Text style={s.stepBtnText}>{step.actionLabel ?? 'Continuar'}</Text>
                <Ionicons name="arrow-forward" size={14} color="#fff" />
              </LinearGradient>
            </Animated.View>
          </Pressable>
        )}

        {step.state === 'in_progress' && (
          <View style={s.waitingNote}>
            <Ionicons name="information-circle-outline" size={13} color={C.blue} />
            <Text style={s.waitingNoteText}>En revisión — te avisamos cuando esté listo</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

function ProviderActiveCard({ C, s }: { C: C; s: ReturnType<typeof makeStyles> }) {
  return (
    <View style={[s.activeCard, TOKENS.shadow.glow]}>
      <LinearGradient colors={GRADIENTS.brandDeep} style={s.activeGrad}>
        <View style={s.activeIconWrap}>
          <Ionicons name="briefcase" size={28} color="#fff" />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={s.activeTitle}>¡Ya sos prestador!</Text>
          <Text style={s.activeSub}>Podés publicar servicios y recibir órdenes</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

export function BecomeProviderScreen() {
  const insets = useSafeAreaInsets();
  const tc = useThemeColors();
  const C = useMemo(() => makeC(tc), [tc]);
  const s = useMemo(() => makeStyles(C), [C]);
  const { profile } = useProfile();
  const { verification, loading: kycLoading, refresh: refreshKYC } = useKYC();

  const [bgCheck, setBgCheck]     = useState<BackgroundCheckState | null>(null);
  const [bgLoading, setBgLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const anims = useRef(Array.from({ length: 3 }, () => new Animated.Value(0))).current;
  const headerAnim = useRef(new Animated.Value(0)).current;

  const loadData = useCallback(async () => {
    try {
      const bg = await getBackgroundCheckStatus();
      setBgCheck(bg);
    } catch {
    } finally {
      setBgLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    refreshKYC();
  }, []);

  useEffect(() => {
    if (!kycLoading && !bgLoading) {
      Animated.parallel([
        Animated.timing(headerAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.stagger(100, anims.map(v =>
          Animated.spring(v, { toValue: 1, friction: 7, useNativeDriver: true })
        )),
      ]).start();
    }
  }, [kycLoading, bgLoading]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshKYC(), loadData()]);
    setRefreshing(false);
  }, [refreshKYC, loadData]);

  const isProvider = profile?.isProvider === true;

  // ── Derivar estado KYC ────────────────────────────────────────────────────
  const rawKyc = (verification?.status?.toLowerCase() ?? 'not_started') as KYCStatus;
  const kycStatus: KYCStatus = (rawKyc === 'pending' && !verification?.inquiryId) ? 'not_started' : rawKyc;

  function kycStepState(): StepState {
    switch (kycStatus) {
      case 'approved':                return 'done';
      case 'in_progress':
      case 'pending':                 return 'in_progress';
      case 'rejected':
      case 'declined':
      case 'failed':                  return 'error';
      case 'expired':                 return 'error';
      default:                        return 'pending';
    }
  }

  function kycBadge(): string | undefined {
    switch (kycStatus) {
      case 'approved':    return 'Verificado';
      case 'in_progress':
      case 'pending':     return 'En revisión';
      case 'rejected':
      case 'declined':    return 'Rechazado';
      case 'failed':      return 'Error';
      case 'expired':     return 'Vencido';
      default:            return undefined;
    }
  }

  function kycActionLabel(): string {
    switch (kycStatus) {
      case 'not_started':             return 'Iniciar verificación';
      case 'expired':
      case 'failed':
      case 'rejected':
      case 'declined':                return 'Reintentar';
      default:                        return 'Continuar';
    }
  }

  // ── Derivar estado background check ──────────────────────────────────────
  const bgStatus = bgCheck?.status ?? 'NOT_SUBMITTED';

  function bgStepState(): StepState {
    if (kycStepState() !== 'done') return 'locked';
    switch (bgStatus) {
      case 'APPROVED':     return 'done';
      case 'UNDER_REVIEW': return 'in_progress';
      case 'REJECTED':     return 'error';
      default:             return 'pending';
    }
  }

  function bgBadge(): string | undefined {
    switch (bgStatus) {
      case 'APPROVED':     return 'Aprobado';
      case 'UNDER_REVIEW': return 'En revisión';
      case 'REJECTED':     return 'Rechazado';
      default:             return undefined;
    }
  }

  function bgActionLabel(): string {
    return bgStatus === 'NOT_SUBMITTED' ? 'Cargar documento' : 'Ver estado';
  }

  // ── Step 3: publicar ──────────────────────────────────────────────────────
  function publishStepState(): StepState {
    if (!isProvider) return 'locked';
    return 'pending';
  }

  const loading = kycLoading || bgLoading;

  const steps: Step[] = [
    {
      id: 'kyc',
      title: 'Verificación de identidad',
      description: kycStatus === 'approved'
        ? 'Tu identidad fue verificada exitosamente.'
        : kycStatus === 'in_progress' || kycStatus === 'pending'
          ? 'Estamos revisando tu documentación. Puede tardar hasta 24 horas.'
          : kycStatus === 'rejected' || kycStatus === 'declined'
            ? 'Hubo un problema con tus documentos. Podés reintentar.'
            : 'Subí tu DNI o pasaporte para confirmar tu identidad.',
      state: kycStepState(),
      badge: kycBadge(),
      action: kycStepState() !== 'done' && kycStepState() !== 'in_progress'
        ? () => router.push('/(tabs)/profile/kyc')
        : kycStepState() === 'in_progress'
          ? () => router.push('/(tabs)/profile/kyc')
          : undefined,
      actionLabel: kycActionLabel(),
    },
    {
      id: 'background',
      title: 'Antecedentes penales',
      description: bgStatus === 'APPROVED'
        ? 'Tu documento fue verificado exitosamente.'
        : bgStatus === 'UNDER_REVIEW'
          ? 'Tu documento está siendo revisado por el equipo de Bosko.'
          : bgStatus === 'REJECTED'
            ? bgCheck?.notes ?? 'El documento fue rechazado. Cargá uno válido.'
            : 'Cargá tu certificado de antecedentes penales para continuar.',
      state: bgStepState(),
      badge: bgBadge(),
      action: bgStepState() !== 'locked' && bgStepState() !== 'done'
        ? () => router.push('/(tabs)/profile/background-check')
        : undefined,
      actionLabel: bgActionLabel(),
    },
    {
      id: 'publish',
      title: 'Publicá tu primer servicio',
      description: isProvider
        ? 'Tu cuenta está activa. Creá tu primer servicio y empezá a recibir clientes.'
        : 'Una vez aprobados ambos pasos, podrás publicar servicios.',
      state: publishStepState(),
      action: isProvider ? () => router.push('/service-form') : undefined,
      actionLabel: 'Crear servicio',
    },
  ];

  // Progreso
  const completedSteps = steps.filter(s => s.state === 'done').length;
  const progress = completedSteps / steps.length;

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <AnimatedBackground variant="minimal" />

      {/* ── Header con gradiente de marca ──────────────────────────────────── */}
      <LinearGradient colors={GRADIENTS.brandDeep} style={s.header}>
        <Pressable
          onPress={() => safeBack(router, '/(tabs)/profile')}
          hitSlop={12}
          style={s.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <Text style={s.headerTitle}>Convertirte en prestador</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 40 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />
        }
      >
        {loading ? (
          <View style={s.loadingWrap}>
            <ActivityIndicator color={C.primary} size="large" />
          </View>
        ) : (
          <Animated.View style={{ opacity: headerAnim }}>

            {/* ── Proveedor activo ──────────────────────────────────────── */}
            {isProvider && <ProviderActiveCard C={C} s={s} />}

            {/* ── Progress bar ─────────────────────────────────────────── */}
            <View style={s.progressSection}>
              <View style={s.progressHeader}>
                <Text style={s.progressLabel}>Progreso</Text>
                <Text style={s.progressCount}>{completedSteps} de {steps.length} pasos</Text>
              </View>
              <View style={s.progressTrack}>
                <View style={[s.progressFill, { width: `${progress * 100}%` }]} />
              </View>
            </View>

            {/* ── Steps ────────────────────────────────────────────────── */}
            <View style={s.stepsSection}>
              {steps.map((step, i) => (
                <View key={step.id}>
                  <StepCard step={step} index={i} anim={anims[i]} C={C} s={s} />
                  {i < steps.length - 1 && (
                    <View style={[
                      s.connector,
                      step.state === 'done' && s.connectorDone,
                    ]} />
                  )}
                </View>
              ))}
            </View>

            {/* ── Beneficios ───────────────────────────────────────────── */}
            {!isProvider && (
              <View style={s.benefitsCard}>
                <Text style={s.benefitsTitle}>¿Por qué convertirte en prestador?</Text>
                {[
                  { icon: 'clipboard-outline' as const,  text: 'Gestioná las solicitudes de tus servicios' },
                  { icon: 'people-outline' as const,     text: 'Accedé a miles de clientes en Bosko' },
                  { icon: 'star-outline' as const,       text: 'Construí tu reputación con reseñas' },
                  { icon: 'shield-checkmark-outline' as const, text: 'Badge de prestador verificado en tu perfil' },
                ].map((b, i) => (
                  <View key={i} style={s.benefitRow}>
                    <View style={s.benefitIcon}>
                      <Ionicons name={b.icon} size={16} color={TOKENS.color.signal} />
                    </View>
                    <Text style={s.benefitText}>{b.text}</Text>
                  </View>
                ))}
              </View>
            )}

          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const makeStyles = (C: C) => StyleSheet.create({
  root:    { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn:     { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#fff', fontFamily: FONT_FAMILY.heading },

  scroll: { paddingHorizontal: 16, paddingTop: 20, gap: 20 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },

  // Active provider banner
  activeCard:   { borderRadius: 18, overflow: 'hidden' },
  activeGrad:   { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 16 },
  activeIconWrap: {
    width: 52, height: 52, borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  activeTitle: { fontSize: 18, fontWeight: '800', color: '#fff', fontFamily: FONT_FAMILY.heading },
  activeSub:   { fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 18 },

  // Progress
  progressSection: { gap: 8 },
  progressHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel:   { fontSize: 13, fontWeight: '600', color: C.text },
  progressCount:   { fontSize: 13, color: C.sub },
  progressTrack: {
    height: 6, borderRadius: 3,
    backgroundColor: C.border, overflow: 'hidden',
  },
  progressFill: {
    height: '100%', borderRadius: 3,
    backgroundColor: TOKENS.color.signal,
  },

  // Steps
  stepsSection: { gap: 0 },
  stepCard: {
    flexDirection: 'row',
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    borderWidth: 1.5,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  stepCardLocked: { opacity: 0.55 },
  stepIconWrap: {
    width: 44, height: 44, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, flexShrink: 0,
  },
  stepContent: { flex: 1, gap: 6 },
  stepHeader:  { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  stepTitle:   { fontSize: 15, fontWeight: '700', color: C.text, flex: 1, fontFamily: FONT_FAMILY.heading },
  stepTitleLocked: { color: C.sub },
  stepBadge:   { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  stepBadgeText: { fontSize: 11, fontWeight: '700' },
  stepDesc:    { fontSize: 13, color: C.sub, lineHeight: 18 },

  stepBtn:     { marginTop: 4, borderRadius: 10, overflow: 'hidden' },
  stepBtnGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, paddingHorizontal: 16,
  },
  stepBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  waitingNote: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  waitingNoteText: { fontSize: 12, color: C.blue, flex: 1 },

  connector:     { width: 2, height: 16, backgroundColor: C.border, marginLeft: 37 },
  connectorDone: { backgroundColor: C.green },

  // Benefits
  benefitsCard: {
    backgroundColor: C.card,
    borderRadius: 18,
    padding: 18,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  benefitsTitle: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 2, fontFamily: FONT_FAMILY.heading },
  benefitRow:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  benefitIcon: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center',
  },
  benefitText: { fontSize: 13, color: C.sub, flex: 1, lineHeight: 18 },
});
