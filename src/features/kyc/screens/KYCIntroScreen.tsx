import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Animated,
} from 'react-native';
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
  useThemeColors,
} from '@/core/design-system';
import { MotiView } from '@/core/components/MotiView';
import { AnimatedBackground } from '@/components/AnimatedBackground';

const STEPS: { icon: React.ComponentProps<typeof MaterialIcons>['name']; title: string; description: string }[] = [
  {
    icon: 'badge',
    title: 'Foto de tu documento',
    description: 'DNI, Cédula o Pasaporte — frente y dorso con buena iluminación.',
  },
  {
    icon: 'face',
    title: 'Selfie de verificación',
    description: 'Una foto de tu rostro sosteniendo el documento. Debe ser clara y sin filtros.',
  },
  {
    icon: 'hourglass-top',
    title: 'Revisión en 24 horas',
    description: 'Nuestro equipo revisará tu solicitud y te notificaremos el resultado.',
  },
];

function FadeSlide({ delay, children }: { delay: number; children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(20)).current;

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

export default function KYCIntroScreen() {
  const { start, loading, error } = useKYC();
  const tc = useThemeColors();

  return (
    <View style={[s.background, { backgroundColor: tc.bg }]}>
      <AnimatedBackground variant="minimal" />
      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Verificación" onBack={() => safeBack(router, '/(tabs)/profile/kyc')} />

        {/* Hero */}
        <FadeSlide delay={100}>
          <View style={s.hero}>
            <IconCircle name="shield-checkmark" size={100} iconSize={56} />
            <Text variant="h3" center>Verificá tu identidad</Text>
            <Text variant="body" color={tc.textSub} center>
              El proceso toma menos de 5 minutos y solo se realiza una vez.
            </Text>
          </View>
        </FadeSlide>

        {/* Steps card */}
        <FadeSlide delay={200}>
          <Card padding="xl" radius="lg" contentStyle={s.cardContent}>
            <Text variant="subtitle">¿Qué vas a necesitar?</Text>
            {STEPS.map((step, idx) => (
              <View key={idx} style={s.stepRow}>
                <View style={s.stepNumber}>
                  <Text variant="caption" weight="800" color={TOKENS.color.onPrimary}>{idx + 1}</Text>
                </View>
                <View style={[s.stepIcon, { backgroundColor: tc.accent }]}>
                  <MaterialIcons name={step.icon} size={20} color={TOKENS.color.signal} />
                </View>
                <View style={s.stepText}>
                  <Text variant="label">{step.title}</Text>
                  <Text variant="bodySmall" color={tc.textSub}>{step.description}</Text>
                </View>
              </View>
            ))}
          </Card>
        </FadeSlide>

        {/* Privacy banner */}
        <FadeSlide delay={300}>
          <NoticeBanner variant="trust" icon="shield-checkmark-outline">
            Tus datos se encriptan y nunca se comparten con terceros.
            Solo se usan para verificar tu identidad.
          </NoticeBanner>
        </FadeSlide>

        {/* Error */}
        {!!error && <NoticeBanner variant="error">{error}</NoticeBanner>}

        {/* CTA */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 400 }}
          style={s.ctaContainer}
        >
          <Button
            label="Comenzar ahora"
            size="lg"
            fullWidth
            loading={loading}
            iconPosition="right"
            icon={<MaterialIcons name="arrow-forward" size={18} color={TOKENS.color.onPrimary} />}
            onPress={start}
          />

          <Button
            label="Lo haré más tarde"
            variant="ghost"
            onPress={() => safeBack(router, '/(tabs)/profile/kyc')}
          />
        </MotiView>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  background: { flex: 1 },
  container: { paddingTop: 60, paddingBottom: 40, paddingHorizontal: 24, gap: 16 },
  hero: { alignItems: 'center', gap: 12, paddingVertical: 20 },
  cardContent: { gap: 16 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: TOKENS.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { flex: 1, gap: 2 },
  ctaContainer: { gap: 12 },
});
