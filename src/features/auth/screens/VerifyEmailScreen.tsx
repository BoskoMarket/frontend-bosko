/**
 * VerifyEmailScreen — Verificación de email con OTP de 6 dígitos.
 * POST /auth/verify-email — body: { email, code }
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
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from '@/core/components/BlurView';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { safeBack } from '@/core/navigation/safeBack';
import { useAuth } from '@/features/auth/state/AuthContext';
import { Button, TOKENS } from '@/core/design-system';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { WELCOME_VIDEO_PENDING_KEY } from '@/features/auth/constants';
import { extractApiError, getUserErrorMessage } from '@/lib/errors';

const { width } = Dimensions.get('window');
const CODE_LENGTH = 6;

export default function VerifyEmailScreen() {
  const { email = '' } = useLocalSearchParams<{ email: string }>();
  const { verifyEmail, logout, clearError } = useAuth();

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const inputRefs = useRef<(TextInput | null)[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const successPop = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    // Evita mostrar un error que haya quedado pegado del login o registro
    clearError();

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 450, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (success) {
      successPop.setValue(0.4);
      Animated.spring(successPop, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }).start();
    }
  }, [success]);

  // Cuenta regresiva para reenviar
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const code = digits.join('');

  const handleDigit = (value: string, index: number) => {
    // Solo acepta dígitos
    const digit = value.replace(/[^0-9]/g, '').slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);

    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

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
      <View style={styles.background}>
        <AnimatedBackground variant="minimal" />
        <View style={styles.successOuter}>
          <View style={[styles.cardGlow, { backgroundColor: '#0A0910' }]}>
            <View style={[styles.cardShadow, { backgroundColor: '#0A0910' }]}>
              <BlurView intensity={30} tint="dark" style={styles.card}>
                <View style={styles.successContainer}>
                  <Animated.View
                    style={[styles.successIconCircle, { opacity: successPop, transform: [{ scale: successPop }] }]}
                  >
                    <LinearGradient colors={[TOKENS.color.mint, '#00b382']} style={styles.successIconGradient}>
                      <Ionicons name="mail-open" size={40} color="#fff" />
                    </LinearGradient>
                  </Animated.View>
                  <Text style={styles.successTitle}>¡Email verificado!</Text>
                  <Text style={styles.successText}>
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
              </BlurView>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.background}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => safeBack(router, '/login')} hitSlop={12} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#EDEAF5" />
          </Pressable>

          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY }] }}>
            <View style={styles.titleRow}>
              <View style={styles.heroIconCircle}>
                <Ionicons name="mail-outline" size={32} color={TOKENS.color.signal} />
              </View>
              <Text style={styles.title}>Verificá tu email</Text>
              <Text style={styles.subtitle}>
                Enviamos un código de 6 dígitos a{'\n'}
                <Text style={styles.emailHighlight}>{email}</Text>
              </Text>
            </View>

            <View style={[styles.cardGlow, { backgroundColor: '#0A0910' }]}>
              <View style={[styles.cardShadow, { backgroundColor: '#0A0910' }]}>
                <BlurView intensity={30} tint="dark" style={styles.card}>
                  <View style={styles.otpContainer}>
                    <Text style={styles.otpLabel}>Ingresá el código</Text>
                    <View style={styles.otpRow}>
                      {digits.map((d, i) => (
                        <TextInput
                          key={i}
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
                      ))}
                    </View>
                  </View>
                </BlurView>
              </View>
            </View>

            {!!error && <Text style={styles.errorText}>{error}</Text>}

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
                <Text style={styles.resendText}>
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
  successOuter: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  successContainer: { alignItems: 'center', gap: 14 },
  successIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    shadowColor: '#00E5A0',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 8,
  },
  successIconGradient: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: { fontSize: 20, fontWeight: '700', fontFamily: 'Archivo_700Bold', color: '#EDEAF5' },
  successText: {
    fontSize: 14,
    color: 'rgba(237,234,245,0.55)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
});
