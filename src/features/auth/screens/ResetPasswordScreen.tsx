/**
 * ResetPasswordScreen — Restablecer contraseña con código OTP de 6 dígitos.
 * POST /auth/reset-password — body: { email, code, newPassword }
 * Rebrand "Señal Nocturna" — usa los componentes reales del design system
 * (`Input`, `Button`), mismo chrome que el resto del flujo de auth.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { BlurView } from '@/core/components/BlurView';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { Input } from '@/core/components/Input';
import { Button, TOKENS, MOTION } from '@/core/design-system';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { safeBack } from '@/core/navigation/safeBack';
import { resetPasswordService } from '@/features/auth/services/auth';

const { width } = Dimensions.get('window');

export default function ResetPasswordScreen() {
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
      <View style={styles.background}>
        <AnimatedBackground variant="minimal" />
        <View style={styles.successContainer}>
          <Animated.View
            style={[
              styles.cardGlow,
              {
                backgroundColor: '#0A0910',
                opacity: successFadeAnim,
                transform: [{ scale: successFadeAnim.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }],
              },
            ]}
          >
          <View style={[styles.cardShadow, { backgroundColor: '#0A0910' }]}>
            <BlurView intensity={30} tint="dark" style={[styles.card, styles.successCard]}>
              <View style={styles.successIconCircle}>
                <Ionicons name="checkmark-circle" size={48} color="#00E5A0" />
              </View>
              <Text style={styles.successTitle}>¡Contraseña actualizada!</Text>
              <Text style={styles.successText}>
                Tu contraseña fue restablecida correctamente. Ya podés iniciar sesión.
              </Text>
              <Button label="Iniciar sesión" onPress={() => router.replace('/login')} fullWidth />
            </BlurView>
          </View>
          </Animated.View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.background}>
      <AnimatedBackground variant="minimal" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => safeBack(router, '/login')} hitSlop={12} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#EDEAF5" />
          </Pressable>

          <Animated.View style={{ opacity: Animated.multiply(fadeAnim, formExitAnim), transform: [{ translateY }] }}>
            <View style={styles.titleRow}>
              <Animated.View style={[styles.heroIconCircle, fadeUpStyle(heroAnim)]}>
                <Ionicons name="key-outline" size={32} color={TOKENS.color.signal} />
              </Animated.View>
              <Animated.Text style={[styles.title, fadeUpStyle(titleAnim)]}>Nueva contraseña</Animated.Text>
              <Animated.Text style={[styles.subtitle, fadeUpStyle(subtitleAnim)]}>
                Elegí una contraseña segura de al menos 8 caracteres.
              </Animated.Text>
            </View>

            <Animated.View style={fadeUpStyle(cardAnim)}>
            <View style={[styles.cardGlow, { backgroundColor: '#0A0910' }]}>
            <View style={[styles.cardShadow, { backgroundColor: '#0A0910' }]}>
              <BlurView intensity={30} tint="dark" style={styles.card}>
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

                {!!error && <Text style={styles.errorText}>{error}</Text>}

                <Button label="Restablecer contraseña" onPress={handleSubmit} loading={loading} fullWidth />
              </BlurView>
            </View>
            </View>
            </Animated.View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: '#0A0910' },
  flex: { flex: 1 },
  scroll: { paddingTop: 60, paddingBottom: 40, paddingHorizontal: 24 },
  backBtn: {
    alignSelf: 'flex-start',
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 20,
  },
  heroIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,45,111,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  titleRow: { alignItems: 'center', marginBottom: 28 },
  title: {
    fontSize: 24,
    fontWeight: '800',
    fontFamily: 'Archivo_700Bold',
    color: '#EDEAF5',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(237,234,245,0.55)',
    textAlign: 'center',
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
  fieldGap: { marginBottom: 14 },
  errorText: { fontSize: 13, color: '#FF4D4D', marginBottom: 14, marginLeft: 4 },
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  successCard: { alignItems: 'center', gap: 14 },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0,229,160,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: { fontSize: 20, fontWeight: '700', fontFamily: 'Archivo_700Bold', color: '#EDEAF5', textAlign: 'center' },
  successText: {
    fontSize: 14,
    color: 'rgba(237,234,245,0.55)',
    textAlign: 'center',
    lineHeight: 20,
  },
});
