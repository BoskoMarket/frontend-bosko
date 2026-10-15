/**
 * ForgotPasswordScreen — Recuperación de contraseña.
 * Rebrand "Señal Nocturna" — misma lógica (POST /auth/forgot-password),
 * usa los componentes reales del design system (`Input`, `Button`, `AuthCard`, `IconCircle`) y `AnimatedBackground`.
 *
 * Sin pantalla intermedia de "email enviado": si el correo está registrado
 * pasamos directo a VerifyResetCodeScreen. El success final vive solo en
 * ResetPasswordScreen, al terminar el flujo completo.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
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
  useThemeColors, FONT_FAMILY } from '@/core/design-system';
import { safeBack } from '@/core/navigation/safeBack';
import { forgotPasswordService } from '@/features/auth/services/auth';
import { AnimatedBackground } from '@/components/AnimatedBackground';

export default function ForgotPasswordScreen() {
  const tc = useThemeColors();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;

  // Entrada escalonada: icono → título → descripción → card
  const heroAnim = useRef(new Animated.Value(0)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;
  const descAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;
  // Salida antes de navegar al paso del código
  const formExitAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();

    Animated.stagger(MOTION.fadeUpStagger, [
      Animated.timing(heroAnim, { toValue: 1, duration: MOTION.fadeUp.duration, useNativeDriver: true }),
      Animated.timing(titleAnim, { toValue: 1, duration: MOTION.fadeUp.duration, useNativeDriver: true }),
      Animated.timing(descAnim, { toValue: 1, duration: MOTION.fadeUp.duration, useNativeDriver: true }),
      Animated.timing(cardAnim, { toValue: 1, duration: MOTION.fadeUp.duration, useNativeDriver: true }),
    ]).start();
  }, []);

  const fadeUpStyle = (anim: Animated.Value) => ({
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
  });

  const handleSend = async () => {
    Keyboard.dismiss();

    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setError('Ingresá un email válido');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      // Validamos que el email exista antes de avanzar al paso del código
      await forgotPasswordService(trimmedEmail);
      setIsLoading(false);

      Animated.timing(formExitAnim, {
        toValue: 0,
        duration: MOTION.modalFadeOut.duration,
        useNativeDriver: true,
      }).start(() => {
        router.push({ pathname: '/auth/verify-reset-code', params: { email: trimmedEmail } });
      });
    } catch (err: any) {
      const code = err?.response?.data?.code;
      if (code === 'NOT_FOUND') setError('Ese email no está registrado.');
      else setError('Error al enviar el código. Intentá de nuevo.');
      setIsLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={[styles.background, { backgroundColor: tc.bg }]}>
        <AnimatedBackground variant="minimal" />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY }] }]}>
            <BackButton onPress={() => safeBack(router, '/login')} style={styles.backButton} />

            <Animated.View style={{ opacity: formExitAnim }}>
              <Animated.View style={[styles.hero, fadeUpStyle(heroAnim)]}>
                <IconCircle name="key-outline" size={80} iconSize={36} />
              </Animated.View>

              <Animated.View style={fadeUpStyle(titleAnim)}>
                <Text variant="h3" center style={styles.title}>¿Olvidaste tu contraseña?</Text>
              </Animated.View>
              <Animated.View style={fadeUpStyle(descAnim)}>
                <Text variant="body" center color={tc.textSub} style={styles.description}>
                  Ingresá tu email y te enviamos un código para restablecerla.
                </Text>
              </Animated.View>

              <Animated.View style={fadeUpStyle(cardAnim)}>
                <AuthCard padding={28}>
                  <Text variant="title" style={styles.cardTitle}>Recuperar contraseña</Text>

                  <View style={styles.fieldGap}>
                    <Input
                      leftIcon="mail-outline"
                      placeholder="Correo electrónico"
                      value={email}
                      onChangeText={text => { setEmail(text); setError(''); }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="done"
                      onSubmitEditing={handleSend}
                      autoFocus
                    />
                  </View>

                  {!!error && (
                    <Text variant="bodySmall" color={TOKENS.color.error} style={styles.errorText}>{error}</Text>
                  )}

                  <Button label="Enviar código" onPress={handleSend} loading={isLoading} fullWidth />
                </AuthCard>
              </Animated.View>
            </Animated.View>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  flex: { flex: 1 },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xxl,
    paddingBottom: SPACING.huge,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: SPACING.xxl,
    zIndex: 10,
  },
  hero: { alignItems: 'center', marginBottom: 10 },
  title: { fontSize: 24, fontFamily: FONT_FAMILY.display, marginBottom: 10 },
  description: { marginBottom: 28, paddingHorizontal: SPACING.sm },
  cardTitle: { fontSize: 18, marginBottom: SPACING.xl },
  fieldGap: { marginBottom: 14 },
  errorText: { marginBottom: 14, marginLeft: SPACING.xs },
});
