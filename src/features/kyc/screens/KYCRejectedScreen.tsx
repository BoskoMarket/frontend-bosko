import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { safeBack } from '@/core/navigation/safeBack';
import { useKYC } from '../state/KYCContext';
import {
  TOKENS,
  Button,
  Card,
  IconCircle,
  NoticeBanner,
  ScreenHeader,
  Text,
  wash,
  withAlpha,
  useThemeColors,
} from '@/core/design-system';
import { AnimatedBackground } from '@/components/AnimatedBackground';

const MAX_ATTEMPTS = 3;

const REJECTION_TIPS = [
  'Asegurate de que el documento no esté cortado ni borroso.',
  'Tomá la foto con buena iluminación, sin reflejos.',
  'La selfie debe mostrar claramente tu rostro y el documento.',
  'Usá el documento vigente, no vencido.',
];

function FadeSlide({ delay, children }: { delay: number; children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
      Animated.timing(ty, { toValue: 0, duration: 400, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY: ty }] }}>
      {children}
    </Animated.View>
  );
}

export default function KYCRejectedScreen() {
  const tc = useThemeColors();
  const { verification, retry, loading, error, clearError } = useKYC();

  const attemptCount = verification?.attemptCount ?? 0;
  const maxAttempts = verification?.maxAttempts ?? MAX_ATTEMPTS;
  const canRetry = attemptCount < maxAttempts;
  const rejectionReason = verification?.rejectionReason;

  const handleRetry = async () => {
    clearError();
    try {
      await retry();
      router.replace('/(tabs)/profile/kyc');
    } catch {
      // Error en contexto
    }
  };

  return (
    <LinearGradient
      colors={wash(tc)}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={s.bg}
    >
      <AnimatedBackground variant="minimal" />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Verificación rechazada" onBack={() => safeBack(router, '/(tabs)/profile/kyc')} />

        {/* Icon */}
        <Animated.View style={[s.iconWrap, { opacity: 1 }]}>
          <IconCircle name="close-circle" variant="danger" size={84} iconSize={52} />
          <Text variant="h3" color={TOKENS.color.error} center>Verificación rechazada</Text>
          <Text variant="body" color={tc.textSub} center>
            Tu verificación de identidad no fue aprobada. Revisá el motivo y volvé a intentarlo.
          </Text>
        </Animated.View>

        {/* Rejection reason */}
        {!!rejectionReason && (
          <FadeSlide delay={100}>
            <Card
              padding="xl"
              radius="lg"
              contentStyle={{
                gap: 12,
                backgroundColor: TOKENS.status.cancelled.bg,
                borderColor: withAlpha(TOKENS.color.error, 0.35),
              }}
            >
              <View style={s.reasonHeader}>
                <MaterialIcons name="info" size={18} color={TOKENS.color.error} />
                <Text variant="label" color={TOKENS.color.error}>Motivo del rechazo</Text>
              </View>
              <Text variant="body">{rejectionReason}</Text>
            </Card>
          </FadeSlide>
        )}

        {/* Tips */}
        <FadeSlide delay={150}>
          <Card padding="xl" radius="lg" contentStyle={s.cardContent}>
            <Text variant="subtitle">Consejos para el reintento</Text>
            {REJECTION_TIPS.map((tip, i) => (
              <View key={i} style={s.tipRow}>
                <View style={[s.tipBullet, { backgroundColor: tc.accent }]}>
                  <Text variant="caption" weight="700" color={TOKENS.color.signal}>{i + 1}</Text>
                </View>
                <Text variant="bodySmall" color={tc.textSub} style={s.tipText}>{tip}</Text>
              </View>
            ))}
          </Card>
        </FadeSlide>

        {/* Attempts counter */}
        <FadeSlide delay={200}>
          <View style={[s.attemptsCard, { backgroundColor: tc.surface, borderColor: tc.border }]}>
            <MaterialIcons
              name="refresh"
              size={18}
              color={canRetry ? TOKENS.color.signal : TOKENS.color.error}
            />
            <Text variant="label" color={canRetry ? TOKENS.color.signal : TOKENS.color.error}>
              {canRetry
                ? `Intentos disponibles: ${maxAttempts - attemptCount} de ${maxAttempts}`
                : `Agotaste los ${maxAttempts} intentos. Contactá a soporte.`
              }
            </Text>
          </View>
        </FadeSlide>

        {!!error && <NoticeBanner variant="error">{error}</NoticeBanner>}

        {canRetry ? (
          <FadeSlide delay={250}>
            <Button
              label="Reintentar verificación"
              size="lg"
              fullWidth
              loading={loading}
              icon={<MaterialIcons name="refresh" size={20} color={TOKENS.color.onPrimary} />}
              onPress={handleRetry}
            />
          </FadeSlide>
        ) : (
          <Card padding="lg" radius="md" contentStyle={s.supportContent}>
            <MaterialIcons name="support-agent" size={24} color={TOKENS.color.signal} />
            <View style={s.supportText}>
              <Text variant="label">¿Necesitás ayuda?</Text>
              <Text variant="bodySmall" color={tc.textSub}>
                Contactá a nuestro equipo de soporte con tu problema de verificación.
              </Text>
            </View>
          </Card>
        )}

        <Button
          label="Ver estado de verificación"
          variant="ghost"
          onPress={() => router.replace('/(tabs)/profile/kyc')}
        />
      </ScrollView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  bg: { flex: 1 },
  scroll: { paddingTop: 60, paddingBottom: 40, paddingHorizontal: 24, gap: 16 },
  iconWrap: { alignItems: 'center', gap: 10, paddingVertical: 8 },
  cardContent: { gap: 12 },
  reasonHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  tipBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  tipText: { flex: 1 },
  attemptsCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  supportContent: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  supportText: { flex: 1, gap: 2 },
});
