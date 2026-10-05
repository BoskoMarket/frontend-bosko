/**
 * ForgotPasswordScreen — Recuperación de contraseña.
 * Rebrand "Señal Nocturna" — misma lógica (POST /auth/forgot-password),
 * usa los componentes reales del design system (`Input`, `Button`, `AnimatedBackground`).
 *
 * Sin pantalla intermedia de "email enviado": si el correo está registrado
 * pasamos directo a VerifyResetCodeScreen. El success final vive solo en
 * ResetPasswordScreen, al terminar el flujo completo.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Dimensions,
  Animated,
} from 'react-native';
import { BlurView } from '@/core/components/BlurView';
import { Input } from '@/core/components/Input';
import { Button, TOKENS, MOTION } from '@/core/design-system';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { safeBack } from '@/core/navigation/safeBack';
import { forgotPasswordService } from '@/features/auth/services/auth';
import { AnimatedBackground } from '@/components/AnimatedBackground';

const { width } = Dimensions.get('window');

export default function ForgotPasswordScreen() {
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
      <View style={styles.background}>
        <AnimatedBackground variant="minimal" />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY }] }]}>
            <Pressable onPress={() => safeBack(router, '/login')} style={styles.backButton} hitSlop={12}>
              <Ionicons name="chevron-back" size={22} color="#EDEAF5" />
            </Pressable>

            <Animated.View style={{ opacity: formExitAnim }}>
              <Animated.View style={[styles.heroIconCircle, fadeUpStyle(heroAnim)]}>
                <Ionicons name="key-outline" size={36} color={TOKENS.color.signal} />
              </Animated.View>

              <Animated.Text style={[styles.title, fadeUpStyle(titleAnim)]}>¿Olvidaste tu contraseña?</Animated.Text>
              <Animated.Text style={[styles.description, fadeUpStyle(descAnim)]}>
                Ingresá tu email y te enviamos un código para restablecerla.
              </Animated.Text>

              <Animated.View style={fadeUpStyle(cardAnim)}>
                <View style={[styles.cardGlow, { backgroundColor: '#0A0910' }]}>
                  <View style={[styles.cardShadow, { backgroundColor: '#0A0910' }]}>
                    <BlurView intensity={30} tint="dark" style={styles.card}>
                      <Text style={styles.cardTitle}>Recuperar contraseña</Text>

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

                      {!!error && <Text style={styles.errorText}>{error}</Text>}

                      <Button label="Enviar código" onPress={handleSend} loading={isLoading} fullWidth />
                    </BlurView>
                  </View>
                </View>
              </Animated.View>
            </Animated.View>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: '#0A0910' },
  flex: { flex: 1 },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 24,
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    zIndex: 10,
  },
  heroIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,45,111,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    fontFamily: 'Archivo_700Bold',
    color: '#EDEAF5',
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: 'rgba(237,234,245,0.55)',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  cardShadow: {
    borderRadius: 26,
    shadowColor: '#FF2D6F',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.28,
    shadowRadius: 34,
    elevation: 12,
  },
  cardGlow: {
    borderRadius: 26,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
  },
  card: {
    width: width - 48,
    borderRadius: 26,
    overflow: 'hidden',
    padding: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  cardTitle: { fontSize: 18, fontWeight: '700', fontFamily: 'Archivo_700Bold', color: '#EDEAF5', marginBottom: 20 },
  fieldGap: { marginBottom: 14 },
  errorText: { fontSize: 13, color: '#FF4D4D', marginBottom: 14, marginLeft: 4 },
});
