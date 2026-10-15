import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { safeBack } from '@/core/navigation/safeBack';
import { useAuth } from '@/features/auth/state/AuthContext';
import { deleteAccountService } from '@/features/profile/services/profile';
import {
  TOKENS,
  Button,
  Card,
  IconCircle,
  Input,
  NoticeBanner,
  ScreenHeader,
  Text,
  useThemeColors,
} from '@/core/design-system';
import { AnimatedBackground } from '@/components/AnimatedBackground';

const CONFIRM_WORD = 'ELIMINAR';

const WARNINGS = [
  'Tu perfil y datos personales serán eliminados permanentemente.',
  'Tus servicios publicados serán dados de baja.',
  'No podrás recuperar tu historial de órdenes ni conversaciones.',
  'Esta acción no tiene vuelta atrás.',
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

export default function DeleteAccountScreen() {
  const tc = useThemeColors();
  const { logout } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [confirmText, setConfirmText] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const iconScale = useRef(new Animated.Value(0.85)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const step2Opacity = useRef(new Animated.Value(0)).current;
  const step2Ty = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(iconScale, { toValue: 1, damping: 14, useNativeDriver: true }),
      Animated.timing(iconOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
    ]).start();
  }, []);

  const canProceed = confirmText === CONFIRM_WORD;
  const canDelete = canProceed && password.length >= 6;

  const goToStep2 = () => {
    setError('');
    setStep(2);
    Animated.parallel([
      Animated.timing(step2Opacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(step2Ty, { toValue: 0, duration: 350, useNativeDriver: true }),
    ]).start();
  };

  const handleBack = () => {
    if (loading) return;
    if (step === 2) {
      setStep(1);
      setPassword('');
      setError('');
    } else {
      safeBack(router, '/(tabs)/profile');
    }
  };

  const handleDelete = () => {
    if (!canDelete || loading) return;
    Alert.alert(
      'Última confirmación',
      '¿Estás absolutamente seguro? Esta acción eliminará tu cuenta para siempre.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, eliminar',
          style: 'destructive',
          onPress: async () => {
            setError('');
            setLoading(true);
            try {
              await deleteAccountService(password);
              await logout();
              router.replace('/login');
            } catch (err: any) {
              const code = err?.response?.data?.code;
              if (!err?.response) setError('Sin conexión. Revisá tu internet e intentá de nuevo.');
              else if (code === 'NOT_FOUND') setError('Usuario no encontrado.');
              else if (code === 'INVALID_PASSWORD' || err?.response?.status === 401)
                setError('Contraseña incorrecta. Verificá e intentá de nuevo.');
              else setError('Error al eliminar la cuenta. Intentá más tarde.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[s.bg, { backgroundColor: tc.bg }]}>
      <AnimatedBackground variant="minimal" />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <ScreenHeader title={step === 1 ? 'Eliminar cuenta' : 'Confirmar identidad'} onBack={handleBack} />

        {/* Step indicator */}
        <View style={s.stepRow}>
          <View style={[s.stepDot, { backgroundColor: TOKENS.color.error }]} />
          <View style={[s.stepLine, { backgroundColor: tc.divider }]} />
          <View style={[s.stepDot, { backgroundColor: step === 2 ? TOKENS.color.error : tc.border }]} />
        </View>

        {/* Warning icon */}
        <Animated.View style={[s.warningIconWrap, { opacity: iconOpacity, transform: [{ scale: iconScale }] }]}>
          <IconCircle name={step === 1 ? 'warning' : 'lock-closed'} variant="danger" size={84} />
          <Text variant="h3" color={TOKENS.color.error} center>
            {step === 1 ? 'Zona de peligro' : 'Verificá tu identidad'}
          </Text>
          <Text variant="bodySmall" color={tc.textSub} center>
            {step === 1
              ? 'Esta acción es permanente e irreversible.'
              : 'Ingresá tu contraseña para confirmar la eliminación.'}
          </Text>
        </Animated.View>

        {step === 1 && (
          <>
            {/* Consequences */}
            <FadeSlide delay={100}>
              <Card padding="xl" radius="lg" contentStyle={s.cardContent}>
                <Text variant="subtitle">Si eliminás tu cuenta:</Text>
                {WARNINGS.map((w, i) => (
                  <View key={i} style={s.warningItem}>
                    <MaterialIcons name="close" size={16} color={TOKENS.color.error} style={s.warningIcon} />
                    <Text variant="bodySmall" color={tc.textSub} style={s.warningText}>{w}</Text>
                  </View>
                ))}
              </Card>
            </FadeSlide>

            {/* Confirm word input */}
            <FadeSlide delay={200}>
              <Card padding="xl" radius="lg" contentStyle={s.cardContent}>
                <Text variant="body" color={tc.textSub}>
                  Escribí{' '}
                  <Text variant="body" weight="800" color={TOKENS.color.error}>{CONFIRM_WORD}</Text>
                  {' '}para continuar:
                </Text>
                <Input
                  value={confirmText}
                  onChangeText={setConfirmText}
                  placeholder={CONFIRM_WORD}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  accessibilityLabel={`Escribí ${CONFIRM_WORD} para continuar`}
                />
              </Card>
            </FadeSlide>

            <FadeSlide delay={300}>
              <Button
                label="Continuar"
                variant="danger"
                size="lg"
                fullWidth
                disabled={!canProceed}
                iconPosition="right"
                icon={<MaterialIcons name="arrow-forward" size={20} color={TOKENS.color.onPrimary} />}
                onPress={goToStep2}
              />
            </FadeSlide>
          </>
        )}

        {step === 2 && (
          <Animated.View style={[s.step2, { opacity: step2Opacity, transform: [{ translateY: step2Ty }] }]}>
            <Card padding="xl" radius="lg" contentStyle={s.cardContent}>
              <Input
                label="Ingresá tu contraseña actual"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
                editable={!loading}
                returnKeyType="done"
                onSubmitEditing={handleDelete}
              />
            </Card>

            {!!error && <NoticeBanner variant="error">{error}</NoticeBanner>}

            <Button
              label="Eliminar mi cuenta"
              variant="danger"
              size="lg"
              fullWidth
              loading={loading}
              disabled={!canDelete}
              icon={<MaterialIcons name="delete-forever" size={20} color={TOKENS.color.onPrimary} />}
              onPress={handleDelete}
            />
          </Animated.View>
        )}

        {!!error && step === 1 && <NoticeBanner variant="error">{error}</NoticeBanner>}

        <Button
          label="Cancelar, mantener mi cuenta"
          variant="ghost"
          disabled={loading}
          onPress={() => safeBack(router, '/(tabs)/profile')}
        />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  bg: { flex: 1 },
  scroll: { paddingTop: 60, paddingBottom: 40, paddingHorizontal: 24, gap: 16 },
  stepRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  stepDot: { width: 10, height: 10, borderRadius: 5 },
  stepLine: { width: 40, height: 2, marginHorizontal: 6 },
  warningIconWrap: { alignItems: 'center', gap: 10, paddingVertical: 8 },
  cardContent: { gap: 12 },
  warningItem: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  warningIcon: { marginTop: 2 },
  warningText: { flex: 1, lineHeight: 18 },
  step2: { gap: 16 },
});
