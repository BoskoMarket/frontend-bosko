import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useKYC } from '../state/KYCContext';
import { useProfile } from '@/features/profile/state/ProfileContext';
import {
  getBackgroundCheckStatus,
  BackgroundCheckState,
} from '../services/background-check.service';
import type { KYCStatus } from '../types/kyc.types';
import { KYC_STATUS, BACKGROUND_CHECK_STATUS, toneColors } from '../constants/kycStatus';
import {
  TOKENS,
  GRADIENTS,
  Badge,
  Button,
  Card,
  ScreenHeader,
  Text,
  useThemeColors,
  withAlpha,
} from '@/core/design-system';
import type { BadgeTone } from '@/core/design-system';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { safeBack } from '@/core/navigation/safeBack';

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

/** Visual tone of each onboarding step state (same palette as the status badges). */
const STEP_TONE: Record<StepState, BadgeTone> = {
  done:        'done',
  in_progress: 'progress',
  pending:     'pending',
  error:       'cancelled',
  locked:      'neutral',
};

function stepIcon(state: StepState): React.ComponentProps<typeof Ionicons>['name'] {
  switch (state) {
    case 'done':        return 'checkmark-circle';
    case 'in_progress': return 'time';
    case 'pending':     return 'time-outline';
    case 'error':       return 'close-circle';
    case 'locked':      return 'lock-closed';
  }
}

function StepCard({ step, anim }: { step: Step; anim: Animated.Value }) {
  const tc = useThemeColors();
  const tone = toneColors(STEP_TONE[step.state], tc);
  const border = step.state === 'locked' ? tc.border : withAlpha(tone.fg, 0.3);
  const isActionable = !!step.action && step.state !== 'locked' && step.state !== 'done';

  return (
    <Animated.View
      style={[
        { opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] },
        step.state === 'locked' && s.stepCardLocked,
      ]}
    >
      <Card padding="lg" radius="md" contentStyle={{ ...s.stepCard, borderColor: border }}>
        {/* Number + icon */}
        <View style={[s.stepIconWrap, { backgroundColor: tone.bg, borderColor: border }]}>
          <Ionicons name={stepIcon(step.state)} size={22} color={tone.fg} />
        </View>

        {/* Content */}
        <View style={s.stepContent}>
          <View style={s.stepHeader}>
            <Text variant="subtitle" color={step.state === 'locked' ? tc.textSub : tc.text} style={s.stepTitle}>
              {step.title}
            </Text>
            {step.badge && <Badge label={step.badge} tone={STEP_TONE[step.state]} size="sm" />}
          </View>
          <Text variant="bodySmall" color={tc.textSub}>{step.description}</Text>

          {isActionable && step.action && (
            <Button
              label={step.actionLabel ?? 'Continuar'}
              size="sm"
              fullWidth
              iconPosition="right"
              icon={<Ionicons name="arrow-forward" size={14} color={TOKENS.color.onPrimary} />}
              onPress={step.action}
              style={s.stepBtn}
            />
          )}

          {step.state === 'in_progress' && (
            <View style={s.waitingNote}>
              <Ionicons name="information-circle-outline" size={13} color={tone.fg} />
              <Text variant="caption" color={tone.fg} style={s.waitingNoteText}>
                En revisión — te avisamos cuando esté listo
              </Text>
            </View>
          )}
        </View>
      </Card>
    </Animated.View>
  );
}

function ProviderActiveCard() {
  return (
    <View style={[s.activeCard, TOKENS.shadow.glow]}>
      <LinearGradient colors={GRADIENTS.brandDeep} style={s.activeGrad}>
        <View style={s.activeIconWrap}>
          <Ionicons name="briefcase" size={28} color={TOKENS.color.onPrimary} />
        </View>
        <View style={s.activeText}>
          <Text variant="h3" color={TOKENS.color.onPrimary}>¡Ya sos prestador!</Text>
          <Text variant="bodySmall" color={TOKENS.onMedia.textSub}>Podés publicar servicios y recibir órdenes</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const BENEFITS: { icon: React.ComponentProps<typeof Ionicons>['name']; text: string }[] = [
  { icon: 'cash-outline',             text: 'Recibí pagos seguros por tus servicios' },
  { icon: 'people-outline',           text: 'Accedé a miles de clientes en Bosko' },
  { icon: 'star-outline',             text: 'Construí tu reputación con reseñas' },
  { icon: 'shield-checkmark-outline', text: 'Badge de prestador verificado en tu perfil' },
];

export function BecomeProviderScreen() {
  const insets = useSafeAreaInsets();
  const tc = useThemeColors();
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
      badge: KYC_STATUS[kycStatus].badge,
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
      badge: bgStatus === 'NOT_SUBMITTED' ? undefined : BACKGROUND_CHECK_STATUS[bgStatus].label,
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
  const completedSteps = steps.filter(st => st.state === 'done').length;
  const progress = completedSteps / steps.length;

  return (
    <View style={[s.root, { backgroundColor: tc.bg, paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <AnimatedBackground variant="minimal" />

      {/* ── Header con gradiente de marca ──────────────────────────────────── */}
      <LinearGradient colors={GRADIENTS.brandDeep} style={s.header}>
        <ScreenHeader tone="onBrand" title="Convertirte en prestador" onBack={() => safeBack(router, '/(tabs)/profile')} />
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 40 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={TOKENS.color.primary} />
        }
      >
        {loading ? (
          <View style={s.loadingWrap}>
            <ActivityIndicator color={TOKENS.color.primary} size="large" />
          </View>
        ) : (
          <Animated.View style={[s.content, { opacity: headerAnim }]}>

            {/* ── Proveedor activo ──────────────────────────────────────── */}
            {isProvider && <ProviderActiveCard />}

            {/* ── Progress bar ─────────────────────────────────────────── */}
            <View style={s.progressSection}>
              <View style={s.progressHeader}>
                <Text variant="label">Progreso</Text>
                <Text variant="bodySmall" color={tc.textSub}>{completedSteps} de {steps.length} pasos</Text>
              </View>
              <View style={[s.progressTrack, { backgroundColor: tc.border }]}>
                <View style={[s.progressFill, { width: `${progress * 100}%` }]} />
              </View>
            </View>

            {/* ── Steps ────────────────────────────────────────────────── */}
            <View>
              {steps.map((step, i) => (
                <View key={step.id}>
                  <StepCard step={step} anim={anims[i]} />
                  {i < steps.length - 1 && (
                    <View style={[
                      s.connector,
                      { backgroundColor: step.state === 'done' ? TOKENS.status.done.fg : tc.border },
                    ]} />
                  )}
                </View>
              ))}
            </View>

            {/* ── Beneficios ───────────────────────────────────────────── */}
            {!isProvider && (
              <Card padding="xl" radius="lg" contentStyle={s.benefitsContent}>
                <Text variant="subtitle">¿Por qué convertirte en prestador?</Text>
                {BENEFITS.map((b, i) => (
                  <View key={i} style={s.benefitRow}>
                    <View style={[s.benefitIcon, { backgroundColor: tc.accent }]}>
                      <Ionicons name={b.icon} size={16} color={TOKENS.color.signal} />
                    </View>
                    <Text variant="bodySmall" color={tc.textSub} style={s.benefitText}>{b.text}</Text>
                  </View>
                ))}
              </Card>
            )}

          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1 },

  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },

  scroll: { paddingHorizontal: 16, paddingTop: 20, gap: 20 },
  content: { gap: 20 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },

  // Active provider banner
  activeCard:   { borderRadius: 18, overflow: 'hidden' },
  activeGrad:   { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 16 },
  activeIconWrap: {
    width: 52, height: 52, borderRadius: 15,
    backgroundColor: TOKENS.onMedia.fill,
    alignItems: 'center', justifyContent: 'center',
  },
  activeText: { flex: 1, gap: 4 },

  // Progress
  progressSection: { gap: 8 },
  progressHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressTrack: {
    height: 6, borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%', borderRadius: 3,
    backgroundColor: TOKENS.color.signal,
  },

  // Steps
  stepCard: {
    flexDirection: 'row',
    gap: 14,
    borderWidth: 1.5,
  },
  stepCardLocked: { opacity: 0.55 },
  stepIconWrap: {
    width: 44, height: 44, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, flexShrink: 0,
  },
  stepContent: { flex: 1, gap: 6 },
  stepHeader:  { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  stepTitle:   { flex: 1 },
  stepBtn:     { marginTop: 4 },

  waitingNote: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  waitingNoteText: { flex: 1 },

  connector:     { width: 2, height: 16, marginLeft: 37 },

  // Benefits
  benefitsContent: { gap: 12 },
  benefitRow:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  benefitIcon: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  benefitText: { flex: 1 },
});
