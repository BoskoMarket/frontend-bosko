import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useKYC } from '../state/KYCContext';
import { useProviderStatus } from '@/hooks/useProviderStatus';
import { buildProviderSteps, currentStep, type ProviderStep } from '../utils/providerSteps';
import {
  TOKENS,
  BRAND_NAME,
  Button,
  Card,
  ScreenHeader,
  SPACING,
  StepTimeline,
  Text,
  useIsDark,
  useThemeColors,
} from '@/core/design-system';
import type { TimelineStep } from '@/core/design-system';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { safeBack } from '@/core/navigation/safeBack';

const STEP_ICON: Record<ProviderStep['id'], TimelineStep['icon']> = {
  kyc: 'id-card-outline',
  phone: 'call-outline',
  service: 'construct-outline',
};

const BENEFITS: { icon: React.ComponentProps<typeof Ionicons>['name']; text: string }[] = [
  { icon: 'cash-outline', text: 'Recibe pagos seguros por tus servicios' },
  { icon: 'people-outline', text: `Accede a miles de clientes en ${BRAND_NAME}` },
  { icon: 'star-outline', text: 'Construye tu reputación con reseñas' },
  { icon: 'shield-checkmark-outline', text: 'Insignia de prestador verificado en tu perfil' },
];

export function BecomeProviderScreen() {
  const insets = useSafeAreaInsets();
  const tc = useThemeColors();
  const isDark = useIsDark();
  const { refresh: refreshKYC, verification } = useKYC();
  const readiness = useProviderStatus();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    refreshKYC();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshKYC();
    setRefreshing(false);
  }, [refreshKYC]);

  const steps = buildProviderSteps(readiness, readiness.kycStatus, verification);
  const current = currentStep(steps);
  const timeline: TimelineStep[] = steps.map((step, i) => ({
    label: `${i + 1}. ${step.label}`,
    status: step.status,
    icon: step.status === 'done' ? 'checkmark' : STEP_ICON[step.id],
  }));

  return (
    <View style={[styles.root, { backgroundColor: tc.bg, paddingTop: insets.top }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={tc.bg} />
      <AnimatedBackground variant="minimal" />

      <View style={styles.header}>
        <ScreenHeader title="Convertirte en prestador" onBack={() => safeBack(router, '/(tabs)/profile')} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + SPACING.huge }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={TOKENS.color.primary} />}
      >
        {readiness.isLoading ? (
          <View style={styles.loadingWrap} testID="become-provider-loading">
            <ActivityIndicator color={TOKENS.color.primary} size="large" />
          </View>
        ) : (
          <>
            <Text variant="body" color={tc.textSub}>
              Para publicar tu servicio necesitas verificar tu identidad y tu teléfono. Los antecedentes son opcionales.
            </Text>

            <Card padding="xl" radius="lg">
              <StepTimeline steps={timeline} />
            </Card>

            {current && (
              <Card padding="xl" radius="lg" contentStyle={styles.currentContent}>
                <Text variant="subtitle">{current.label}</Text>
                <Text variant="bodySmall" color={tc.textSub}>{current.description}</Text>
                {current.cta && (
                  <Button
                    label={current.cta.label}
                    size="lg"
                    fullWidth
                    iconPosition="right"
                    icon={<Ionicons name="arrow-forward" size={16} color={TOKENS.color.onPrimary} />}
                    onPress={() => router.push(current.cta!.route as never)}
                  />
                )}
              </Card>
            )}

            {readiness.kycApproved && (
              <Button
                label="Antecedentes (opcional)"
                variant="ghost"
                onPress={() => router.push('/(tabs)/profile/background-check')}
              />
            )}

            {!readiness.canPublish && (
              <Card padding="xl" radius="lg" contentStyle={styles.benefitsContent}>
                <Text variant="subtitle">¿Por qué convertirte en prestador?</Text>
                {BENEFITS.map((b) => (
                  <View key={b.text} style={styles.benefitRow}>
                    <View style={[styles.benefitIcon, { backgroundColor: tc.accent }]}>
                      <Ionicons name={b.icon} size={16} color={TOKENS.color.signal} />
                    </View>
                    <Text variant="bodySmall" color={tc.textSub} style={styles.benefitText}>{b.text}</Text>
                  </View>
                ))}
              </Card>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md },
  scroll: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.xl, gap: SPACING.xl },
  loadingWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  currentContent: { gap: SPACING.md },
  benefitsContent: { gap: SPACING.md },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  benefitIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  benefitText: { flex: 1 },
});
