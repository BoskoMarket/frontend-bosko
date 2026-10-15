/**
 * VerifyResetCodeScreen — Código de 6 dígitos del flujo "Olvidé mi contraseña".
 * No valida contra el backend por separado: el código viaja como `code` a
 * ResetPasswordScreen, que lo valida junto con la nueva contraseña en
 * POST /auth/reset-password — body: { email, code, newPassword }.
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
import { router, useLocalSearchParams } from 'expo-router';
import { safeBack } from '@/core/navigation/safeBack';
import {
  AuthCard,
  BackButton,
  Button,
  IconCircle,
  MOTION,
  OtpInput,
  SPACING,
  Text,
  TOKENS,
  useThemeColors, FONT_FAMILY } from '@/core/design-system';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { forgotPasswordService } from '@/features/auth/services/auth';

const CODE_LENGTH = 6;
const RESEND_COOLDOWN = 30;

export default function VerifyResetCodeScreen() {
  const tc = useThemeColors();
  const { email = '' } = useLocalSearchParams<{ email: string }>();

  const [code, setCode] = useState('');
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const screenExitAnim = useRef(new Animated.Value(1)).current;

  // Entrada escalonada: icono → título → código → botón
  const heroAnim = useRef(new Animated.Value(0)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;
  const codeAnim = useRef(new Animated.Value(0)).current;
  const actionsAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 450, useNativeDriver: true }),
    ]).start();

    Animated.stagger(MOTION.fadeUpStagger, [
      Animated.timing(heroAnim, { toValue: 1, duration: MOTION.fadeUp.duration, useNativeDriver: true }),
      Animated.timing(titleAnim, { toValue: 1, duration: MOTION.fadeUp.duration, useNativeDriver: true }),
      Animated.timing(codeAnim, { toValue: 1, duration: MOTION.fadeUp.duration, useNativeDriver: true }),
      Animated.timing(actionsAnim, { toValue: 1, duration: MOTION.fadeUp.duration, useNativeDriver: true }),
    ]).start();
  }, []);

  // Cuenta regresiva para reenviar
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const fadeUpStyle = (anim: Animated.Value) => ({
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
  });

  const handleCodeChange = (next: string) => {
    setCode(next);
    setError('');
  };

  const handleContinue = () => {
    if (code.length < CODE_LENGTH) {
      setError('Ingresá los 6 dígitos del código.');
      return;
    }
    setError('');

    // Desvanece antes de navegar — la transición de pantalla del navigator
    // hace el resto, esto solo evita el corte seco del contenido actual
    Animated.timing(screenExitAnim, {
      toValue: 0,
      duration: MOTION.modalFadeOut.duration,
      useNativeDriver: true,
    }).start(() => {
      router.push({ pathname: '/auth/reset-password', params: { email, code } });
    });
  };

  const handleResend = async () => {
    if (resending || cooldown > 0) return;
    setResending(true);
    setError('');
    try {
      await forgotPasswordService(String(email).toLowerCase());
      setCooldown(RESEND_COOLDOWN);
    } catch {
      setError('No pudimos reenviar el código. Intentá de nuevo.');
    } finally {
      setResending(false);
    }
  };

  return (
    <View style={[styles.background, { backgroundColor: tc.bg }]}>
      <AnimatedBackground variant="minimal" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <BackButton onPress={() => safeBack(router, '/login')} style={styles.backBtn} />

          <Animated.View style={{ opacity: Animated.multiply(fadeAnim, screenExitAnim), transform: [{ translateY }] }}>
            <View style={styles.titleRow}>
              <Animated.View style={[styles.hero, fadeUpStyle(heroAnim)]}>
                <IconCircle name="key-outline" size={72} iconSize={32} />
              </Animated.View>
              <Animated.View style={fadeUpStyle(titleAnim)}>
                <Text variant="h3" center style={styles.title}>Ingresá el código</Text>
              </Animated.View>
              <Animated.View style={fadeUpStyle(titleAnim)}>
                <Text variant="body" center color={tc.textSub}>
                  Enviamos un código de 6 dígitos a{'\n'}
                  <Text variant="body" weight="700" color={TOKENS.color.signal}>{email}</Text>
                </Text>
              </Animated.View>
            </View>

            <Animated.View style={fadeUpStyle(codeAnim)}>
              <AuthCard padding={22}>
                <OtpInput value={code} onChange={handleCodeChange} length={CODE_LENGTH} label="Código de recuperación" />
              </AuthCard>
            </Animated.View>

            {!!error && (
              <Text variant="bodySmall" center color={TOKENS.color.error} style={styles.errorText}>{error}</Text>
            )}

            <Animated.View style={[styles.btnGap, fadeUpStyle(actionsAnim)]}>
              <Button
                label="Continuar"
                onPress={handleContinue}
                disabled={code.length < CODE_LENGTH}
                fullWidth
              />
            </Animated.View>

            <Animated.View style={fadeUpStyle(actionsAnim)}>
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
  title: { fontSize: 24, fontFamily: FONT_FAMILY.display },
  errorText: { marginTop: 14, marginBottom: -2 },
  btnGap: { marginTop: SPACING.xl },
  resendRow: { alignItems: 'center', paddingVertical: 14 },
});
