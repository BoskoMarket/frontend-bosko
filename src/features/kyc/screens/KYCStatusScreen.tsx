import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { safeBack } from '@/core/navigation/safeBack';
import { useKYC } from '../state/KYCContext';
import { KYCStatus } from '../types/kyc.types';
import { KYC_STATUS, toneColors } from '../constants/kycStatus';
import { TOKENS, Button, Card, ScreenHeader, Text, useThemeColors } from '@/core/design-system';
import { MotiView } from '@/core/components/MotiView';
import { AnimatedBackground } from '@/components/AnimatedBackground';

const BENEFITS: { icon: React.ComponentProps<typeof MaterialIcons>['name']; text: string }[] = [
  { icon: 'work', text: 'Publicar servicios en el marketplace' },
  { icon: 'shopping-cart', text: 'Contratar servicios de otros proveedores' },
  { icon: 'verified-user', text: 'Badge de verificado en tu perfil' },
  { icon: 'security', text: 'Mayor confianza de los clientes' },
];

export default function KYCStatusScreen() {
  const { verification, loading, refresh } = useKYC();
  const tc = useThemeColors();

  const iconScale = useRef(new Animated.Value(0.9)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(iconScale, { toValue: 1, damping: 14, delay: 100, useNativeDriver: true }),
      Animated.timing(iconOpacity, { toValue: 1, duration: 350, delay: 100, useNativeDriver: true }),
    ]).start();
  }, []);

  if (loading && !verification) {
    return (
      <View style={[s.background, s.centered, { backgroundColor: tc.bg }]}>
        <ActivityIndicator color={TOKENS.color.primary} size="large" />
      </View>
    );
  }

  const rawStatus = (verification?.status?.toLowerCase() ?? 'not_started') as KYCStatus;
  // pending sin inquiryId significa que nunca se inició el proceso
  const status: KYCStatus = (rawStatus === 'pending' && !verification?.inquiryId) ? 'not_started' : rawStatus;
  const ui = KYC_STATUS[status] ?? KYC_STATUS.not_started;
  const tone = toneColors(ui.tone, tc);

  const canRetry = (status === 'rejected' || status === 'declined') && !!verification && verification.attemptCount < verification.maxAttempts;
  const cta =
    status === 'not_started' || status === 'expired' || status === 'failed'
      ? { label: 'Iniciar verificación', icon: 'arrow-forward' as const }
      : status === 'in_progress' || status === 'pending'
        ? { label: 'Continuar verificación', icon: 'arrow-forward' as const }
        : canRetry
          ? { label: 'Reintentar verificación', icon: 'refresh' as const }
          : null;

  return (
    <View style={[s.background, { backgroundColor: tc.bg }]}>
      <AnimatedBackground variant="app" />
      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Verificación de identidad" onBack={() => safeBack(router, '/(tabs)/profile')} />

        {/* Status visual */}
        <Animated.View style={[s.statusContainer, { opacity: iconOpacity, transform: [{ scale: iconScale }] }]}>
          <View style={[s.iconCircle, { backgroundColor: tone.bg }]}>
            <MaterialIcons name={ui.icon} size={48} color={tone.fg} />
          </View>
          <Text variant="h3" color={tone.fg} center>{ui.title}</Text>
          <Text variant="body" color={tc.textSub} center style={s.statusDescription}>{ui.description}</Text>
        </Animated.View>

        {/* Beneficios (solo si no está aprobado) */}
        {status !== 'approved' && status !== 'in_progress' && status !== 'pending' && (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 200 }}
          >
            <Card padding="xl" radius="lg" contentStyle={s.cardContent}>
              <Text variant="subtitle">¿Por qué verificar tu identidad?</Text>
              {BENEFITS.map(item => (
                <View key={item.icon} style={s.benefitRow}>
                  <View style={[s.benefitIcon, { backgroundColor: tc.accent }]}>
                    <MaterialIcons name={item.icon} size={16} color={TOKENS.color.primary} />
                  </View>
                  <Text variant="body" style={s.benefitText}>{item.text}</Text>
                </View>
              ))}
            </Card>
          </MotiView>
        )}

        {/* Attempts remaining */}
        {verification && (
          <View style={[s.attemptsCard, { backgroundColor: tc.surface, borderColor: tc.border }]}>
            <MaterialIcons name="info-outline" size={16} color={tc.textSub} />
            <Text variant="bodySmall" color={tc.textSub}>
              Intentos utilizados: {verification.attemptCount} de 3
            </Text>
          </View>
        )}

        {/* CTAs según estado */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 300 }}
          style={s.ctaContainer}
        >
          {cta && (
            <Button
              label={cta.label}
              size="lg"
              fullWidth
              iconPosition="right"
              icon={<MaterialIcons name={cta.icon} size={18} color={TOKENS.color.onPrimary} />}
              onPress={() => router.push('/(tabs)/profile/kyc/intro')}
            />
          )}

          {status === 'approved' && (
            <Button
              label="Ir a mi perfil"
              variant="secondary"
              size="lg"
              fullWidth
              icon={<MaterialIcons name="home" size={18} color={TOKENS.status.done.fg} />}
              onPress={() => router.push('/(tabs)/profile')}
            />
          )}
        </MotiView>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  background: { flex: 1 },
  centered: { alignItems: 'center', justifyContent: 'center' },
  container: { paddingTop: 60, paddingBottom: 40, paddingHorizontal: 24, gap: 16 },
  statusContainer: { alignItems: 'center', gap: 12, paddingVertical: 24 },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statusDescription: { paddingHorizontal: 8 },
  cardContent: { gap: 12 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  benefitIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitText: { flex: 1 },
  attemptsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  ctaContainer: { gap: 12 },
});
