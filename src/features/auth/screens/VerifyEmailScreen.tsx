/**
 * VerifyEmailScreen — Verificación de email con OTP de 6 dígitos.
 * POST /auth/verify-email — body: { email, code }
 * Rebrand "Señal Nocturna" — mismo chrome que el resto del flujo de auth.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { safeBack } from '@/core/navigation/safeBack';
import { useAuth } from '@/features/auth/state/AuthContext';
import {
  AuthCard,
  BackButton,
  Button,
  IconCircle,
  OtpInput,
  SPACING,
  Text,
  TOKENS,
  useThemeColors,
} from '@/core/design-system';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { WELCOME_VIDEO_PENDING_KEY } from '@/features/auth/constants';
import { extractApiError, getUserErrorMessage } from '@/lib/errors';

const CODE_LENGTH = 6;

export default function VerifyEmailScreen() {
  const tc = useThemeColors();
  const { email = '' } = useLocalSearchParams<{ email: string }>();
  const { verifyEmail, logout, clearError } = useAuth();

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // Evita mostrar un error que haya quedado pegado del login o registro
    clearError();

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 450, useNativeDriver: true }),
    ]).start();
  }, []);

  // Cuenta regresiva para reenviar
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleVerify = async () => {
    // Evita doble submit (doble tap) mandando el mismo código dos veces:
    // el backend invalida el código en el primer uso, el segundo intento
    // devuelve INVALID_VERIFICATION_CODE aunque la cuenta ya haya quedado verificada.
    if (loading) return;
    if (code.length < CODE_LENGTH) {
      setError('Ingresá los 6 dígitos del código.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await verifyEmail(email, code);
      await AsyncStorage.setItem(WELCOME_VIDEO_PENDING_KEY, 'true');
      setSuccess(true);
    } catch (err) {
      // Decidir por `code`, nunca por el texto de `message` (frontend-error-contract.md)
      const { code: errorCode } = extractApiError(err);
      if (errorCode === 'INVALID_VERIFICATION_CODE') {
        setError('Código incorrecto o expirado. Verificá y volvé a intentar.');
      } else if (errorCode === 'NOT_FOUND') {
        setError('Usuario no encontrado.');
      } else {
        setError(getUserErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    // TODO: el backend necesita POST /auth/resend-verification para reenviar el OTP de registro
    setError('Por ahora si el código expiró, registrate de nuevo con el mismo email.');
  };

  if (success) {
    return (
      <View style={[styles.background, { backgroundColor: tc.bg }]}>
        <AnimatedBackground variant="minimal" />
        <View style={styles.successOuter}>
          <AuthCard padding={22}>
            <View style={styles.successContainer}>
              <IconCircle name="mail-open" variant="success" size={88} iconSize={40} />
              <Text variant="h3" center>¡Email verificado!</Text>
              <Text variant="body" center color={tc.textSub} style={styles.successText}>
                Tu cuenta fue activada correctamente. Ya podés iniciar sesión.
              </Text>
              <Button
                label="Ir a iniciar sesión"
                onPress={async () => {
                  // verifyEmail ya dejó una sesión iniciada — la cerramos
                  // para que el usuario entre con sus credenciales.
                  await logout();
                  router.replace('/login');
                }}
                fullWidth
              />
            </View>
          </AuthCard>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.background, { backgroundColor: tc.bg }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <BackButton onPress={() => safeBack(router, '/login')} style={styles.backBtn} />

          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY }] }}>
            <View style={styles.titleRow}>
              <IconCircle name="mail-outline" size={72} iconSize={32} style={styles.hero} />
              <Text variant="h3" center style={styles.title}>Verificá tu email</Text>
              <Text variant="body" center color={tc.textSub}>
                Enviamos un código de 6 dígitos a{'\n'}
                <Text variant="body" weight="700" color={TOKENS.color.signal}>{email}</Text>
              </Text>
            </View>

            <AuthCard padding={22}>
              <OtpInput value={code} onChange={setCode} length={CODE_LENGTH} label="Ingresá el código" />
            </AuthCard>

            {!!error && (
              <Text variant="bodySmall" center color={TOKENS.color.error} style={styles.errorText}>{error}</Text>
            )}

            <View style={styles.btnGap}>
              <Button
                label="Verificar"
                onPress={handleVerify}
                loading={loading}
                disabled={code.length < CODE_LENGTH || loading}
                fullWidth
              />
            </View>

            <Pressable onPress={handleResend} disabled={resending || cooldown > 0} style={styles.resendRow}>
              {resending ? (
                <ActivityIndicator size="small" color={TOKENS.color.signal} />
              ) : (
                <Text variant="body" weight="700" color={TOKENS.color.signal}>
                  {cooldown > 0 ? `Reenviar en ${cooldown}s` : '¿No recibiste el código? Reenviar'}
                </Text>
              )}
            </Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  flex: { flex: 1 },
  scroll: { paddingTop: 60, paddingBottom: SPACING.huge, paddingHorizontal: SPACING.xxl },
  backBtn: { marginBottom: SPACING.xl },
  hero: { marginBottom: SPACING.sm },
  titleRow: { alignItems: 'center', marginBottom: 22, gap: SPACING.sm },
  title: { fontSize: 24, fontWeight: '800' },
  errorText: { marginTop: 14, marginBottom: -2 },
  btnGap: { marginTop: SPACING.xl },
  resendRow: { alignItems: 'center', paddingVertical: 14 },
  successOuter: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.xxl },
  successContainer: { alignItems: 'center', gap: 14 },
  successText: { marginBottom: SPACING.sm },
});
