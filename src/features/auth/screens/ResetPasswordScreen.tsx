/**
 * ResetPasswordScreen — Restablecer contraseña con código OTP de 6 dígitos.
 * POST /auth/reset-password — body: { email, code, newPassword }
 * Rebrand "Señal Nocturna" — usa los componentes reales del design system
 * (`Input`, `Button`, `AuthCard`), mismo chrome que el resto del flujo de auth.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
} from 'react-native';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import {
  AuthCard,
  BackButton,
  Button,
  IconCircle,
  Input,
  MOTION,
  SPACING,
  Text,
  TOKENS,
  useThemeColors,
} from '@/core/design-system';
import { router, useLocalSearchParams } from 'expo-router';
import { safeBack } from '@/core/navigation/safeBack';
import { resetPasswordService } from '@/features/auth/services/auth';

export default function ResetPasswordScreen() {
  const tc = useThemeColors();
  // email y code vienen del OTP screen
  const { email = '', code = '' } = useLocalSearchParams<{ email: string; code: string }>();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const successFadeAnim = useRef(new Animated.Value(0)).current;

  // Entrada escalonada: icono → título → subtítulo → card
  const heroAnim = useRef(new Animated.Value(0)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;
  const subtitleAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;
  // Salida de la card de formulario antes de mostrar el éxito
  const formExitAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 450, useNativeDriver: true }),
    ]).start();

    Animated.stagger(MOTION.fadeUpStagger, [
      Animated.timing(heroAnim, { toValue: 1, duration: MOTION.fadeUp.duration, useNativeDriver: true }),
      Animated.timing(titleAnim, { toValue: 1, duration: MOTION.fadeUp.duration, useNativeDriver: true }),
      Animated.timing(subtitleAnim, { toValue: 1, duration: MOTION.fadeUp.duration, useNativeDriver: true }),
      Animated.timing(cardAnim, { toValue: 1, duration: MOTION.fadeUp.duration, useNativeDriver: true }),
    ]).start();
  }, []);

  const fadeUpStyle = (anim: Animated.Value) => ({
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
  });

  const validate = (): string => {
    if (newPassword.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
    if (newPassword !== confirmPassword) return 'Las contraseñas no coinciden.';
    return '';
  };

  const handleSubmit = async () => {
    const msg = validate();
    if (msg) { setError(msg); return; }

    setError('');
    setLoading(true);
    try {
      await resetPasswordService(email, code, newPassword);
      Animated.timing(formExitAnim, {
        toValue: 0,
        duration: MOTION.modalFadeOut.duration,
        useNativeDriver: true,
      }).start(() => {
        setSuccess(true);
        successFadeAnim.setValue(0);
        Animated.timing(successFadeAnim, { toValue: 1, duration: MOTION.modalFadeIn.duration, useNativeDriver: true }).start();
      });
    } catch (err: any) {
      const errCode = err?.response?.data?.code;
      if (errCode === 'INVALID_VERIFICATION_CODE') setError('Código incorrecto o expirado. Volvé a solicitarlo.');
      else if (errCode === 'NOT_FOUND')      setError('Usuario no encontrado.');
      else if (errCode === 'BAD_REQUEST') setError('Código inválido, expirado o contraseña muy corta.');
      else setError('Error al restablecer. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <View style={[styles.background, { backgroundColor: tc.bg }]}>
        <AnimatedBackground variant="minimal" />
        <View style={styles.successContainer}>
          <Animated.View
            style={{
              opacity: successFadeAnim,
              transform: [{ scale: successFadeAnim.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }],
            }}
          >
            <AuthCard padding={28}>
              <View style={styles.successCard}>
                <IconCircle name="checkmark" variant="success" size={80} iconSize={40} />
                <Text variant="h3" center>¡Contraseña actualizada!</Text>
                <Text variant="body" center color={tc.textSub}>
                  Tu contraseña fue restablecida correctamente. Ya podés iniciar sesión.
                </Text>
                <Button label="Iniciar sesión" onPress={() => router.replace('/login')} fullWidth />
              </View>
            </AuthCard>
          </Animated.View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.background, { backgroundColor: tc.bg }]}>
      <AnimatedBackground variant="minimal" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <BackButton onPress={() => safeBack(router, '/login')} style={styles.backBtn} />

          <Animated.View style={{ opacity: Animated.multiply(fadeAnim, formExitAnim), transform: [{ translateY }] }}>
            <View style={styles.titleRow}>
              <Animated.View style={[styles.hero, fadeUpStyle(heroAnim)]}>
                <IconCircle name="key-outline" size={72} iconSize={32} />
              </Animated.View>
              <Animated.View style={fadeUpStyle(titleAnim)}>
                <Text variant="h3" center style={styles.title}>Nueva contraseña</Text>
              </Animated.View>
              <Animated.View style={fadeUpStyle(subtitleAnim)}>
                <Text variant="body" center color={tc.textSub} style={styles.subtitle}>
                  Elegí una contraseña segura de al menos 8 caracteres.
                </Text>
              </Animated.View>
            </View>

            <Animated.View style={fadeUpStyle(cardAnim)}>
              <AuthCard padding={28}>
                <View style={styles.fieldGap}>
                  <Input
                    leftIcon="lock-closed-outline"
                    placeholder="Nueva contraseña"
                    secureTextEntry
                    value={newPassword}
                    onChangeText={setNewPassword}
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.fieldGap}>
                  <Input
                    leftIcon="lock-closed-outline"
                    placeholder="Confirmar contraseña"
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    autoCapitalize="none"
                  />
                </View>

                {!!error && (
                  <Text variant="bodySmall" color={TOKENS.color.error} style={styles.errorText}>{error}</Text>
                )}

                <Button label="Restablecer contraseña" onPress={handleSubmit} loading={loading} fullWidth />
              </AuthCard>
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
  hero: { alignItems: 'center', marginBottom: SPACING.sm },
  titleRow: { alignItems: 'center', marginBottom: 28 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: SPACING.sm },
  subtitle: { paddingHorizontal: SPACING.sm },
  fieldGap: { marginBottom: 14 },
  errorText: { marginBottom: 14, marginLeft: SPACING.xs },
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.xxl },
  successCard: { alignItems: 'center', gap: 14 },
});
