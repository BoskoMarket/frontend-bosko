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
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { BlurView } from '@/core/components/BlurView';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { safeBack } from '@/core/navigation/safeBack';
import { Button, TOKENS, MOTION } from '@/core/design-system';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { forgotPasswordService } from '@/features/auth/services/auth';

const { width } = Dimensions.get('window');
const CODE_LENGTH = 6;
const RESEND_COOLDOWN = 30;

export default function VerifyResetCodeScreen() {
  const { email = '' } = useLocalSearchParams<{ email: string }>();

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const inputRefs = useRef<(TextInput | null)[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const screenExitAnim = useRef(new Animated.Value(1)).current;

  // Entrada escalonada: icono → título → una caja del OTP a la vez → botón
  const heroAnim = useRef(new Animated.Value(0)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;
  const digitAnims = useRef(Array.from({ length: CODE_LENGTH }, () => new Animated.Value(0))).current;
  const actionsAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 450, useNativeDriver: true }),
    ]).start();

    Animated.stagger(MOTION.fadeUpStagger, [
      Animated.timing(heroAnim, { toValue: 1, duration: MOTION.fadeUp.duration, useNativeDriver: true }),
      Animated.timing(titleAnim, { toValue: 1, duration: MOTION.fadeUp.duration, useNativeDriver: true }),
      ...digitAnims.map(anim => Animated.timing(anim, { toValue: 1, duration: 320, useNativeDriver: true })),
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

  const digitPopStyle = (anim: Animated.Value) => ({
    opacity: anim,
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
  });

  const code = digits.join('');

  const handleDigit = (value: string, index: number) => {
    const digit = value.replace(/[^0-9]/g, '').slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    setError('');

    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
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
    <View style={styles.background}>
      <AnimatedBackground variant="minimal" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => safeBack(router, '/login')} hitSlop={12} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#EDEAF5" />
          </Pressable>

          <Animated.View style={{ opacity: Animated.multiply(fadeAnim, screenExitAnim), transform: [{ translateY }] }}>
            <View style={styles.titleRow}>
              <Animated.View style={[styles.heroIconCircle, fadeUpStyle(heroAnim)]}>
                <Ionicons name="key-outline" size={32} color={TOKENS.color.signal} />
              </Animated.View>
              <Animated.Text style={[styles.title, fadeUpStyle(titleAnim)]}>Ingresá el código</Animated.Text>
              <Animated.Text style={[styles.subtitle, fadeUpStyle(titleAnim)]}>
                Enviamos un código de 6 dígitos a{'\n'}
                <Text style={styles.emailHighlight}>{email}</Text>
              </Animated.Text>
            </View>

            <View style={[styles.cardGlow, { backgroundColor: '#0A0910' }]}>
              <View style={[styles.cardShadow, { backgroundColor: '#0A0910' }]}>
                <BlurView intensity={30} tint="dark" style={styles.card}>
                  <View style={styles.otpContainer}>
                    <Text style={styles.otpLabel}>Código de recuperación</Text>
                    <View style={styles.otpRow}>
                      {digits.map((d, i) => (
                        <Animated.View key={i} style={digitPopStyle(digitAnims[i])}>
                          <TextInput
                            ref={ref => { inputRefs.current[i] = ref; }}
                            style={[styles.otpInput, d ? styles.otpInputFilled : null]}
                            value={d}
                            onChangeText={val => handleDigit(val, i)}
                            onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
                            keyboardType="number-pad"
                            maxLength={1}
                            selectTextOnFocus
                            textAlign="center"
                          />
                        </Animated.View>
                      ))}
                    </View>
                  </View>
                </BlurView>
              </View>
            </View>

            {!!error && <Text style={styles.errorText}>{error}</Text>}

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
                  <Text style={styles.resendText}>
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
  titleRow: { alignItems: 'center', marginBottom: 22, gap: 8 },
  title: {
    fontSize: 24,
    fontWeight: '800',
    fontFamily: 'Archivo_700Bold',
    color: '#EDEAF5',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(237,234,245,0.55)',
    textAlign: 'center',
    lineHeight: 20,
  },
  emailHighlight: {
    fontWeight: '700',
    color: '#FF2D6F',
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
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  otpContainer: { alignItems: 'center', gap: 16 },
  otpLabel: { fontSize: 13, fontWeight: '700', fontFamily: 'Archivo_700Bold', color: 'rgba(237,234,245,0.55)' },
  otpRow: { flexDirection: 'row', gap: 9 },
  otpInput: {
    width: 44,
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    fontSize: 22,
    fontWeight: '800',
    fontFamily: 'Archivo_700Bold',
    color: '#EDEAF5',
  },
  otpInputFilled: {
    borderColor: '#FF2D6F',
    backgroundColor: 'rgba(255,45,111,0.14)',
  },
  errorText: { fontSize: 13, color: '#FF4D4D', textAlign: 'center', marginTop: 14, marginBottom: -2 },
  btnGap: { marginTop: 20 },
  resendRow: { alignItems: 'center', paddingVertical: 14 },
  resendText: { fontSize: 14, fontWeight: '700', fontFamily: 'Archivo_700Bold', color: '#FF2D6F' },
});
