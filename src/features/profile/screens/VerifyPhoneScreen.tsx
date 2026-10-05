/**
 * VerifyPhoneScreen — Verificación de teléfono via Firebase Phone Auth.
 * Flujo: ingresá número → recibís SMS → ingresás código → teléfono verificado.
 * Requiere build nativo (no funciona en Expo Go).
 */

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from '@/core/components/BlurView';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { safeBack } from '@/core/navigation/safeBack';
import { useProfile } from '@/features/profile/state/ProfileContext';
import { verifyPhoneWithFirebase } from '@/features/profile/services/profile';
import { getUserErrorMessage } from '@/lib/errors';
import { TOKENS } from '@/core/design-system/tokens';
import { GRADIENTS } from '@/core/design-system/gradients';
import { useThemeColors, useIsDark, wash } from '@/core/design-system';
import { AnimatedBackground } from '@/components/AnimatedBackground';

type Step = 'phone' | 'code';

export default function VerifyPhoneScreen() {
  const tc = useThemeColors();
  const isDark = useIsDark();
  const { refreshProfile } = useProfile();

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const confirmationRef = useRef<any>(null);

  const handleSendCode = async () => {
    const trimmed = phone.trim();
    if (!trimmed) {
      Alert.alert('Error', 'Ingresá un número de teléfono');
      return;
    }

    // Normalizar formato internacional
    const normalized = trimmed.startsWith('+') ? trimmed : `+${trimmed}`;

    setLoading(true);
    try {
      // Importación dinámica para no romper si no hay build nativo
      const auth = require('@react-native-firebase/auth').default;
      const confirmation = await auth().signInWithPhoneNumber(normalized);
      confirmationRef.current = confirmation;
      setStep('code');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'No se pudo enviar el SMS. Verificá el número.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    const trimmed = code.trim();
    if (trimmed.length !== 6) {
      Alert.alert('Error', 'El código debe tener 6 dígitos');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await confirmationRef.current.confirm(trimmed);
      const idToken = await userCredential.user.getIdToken();
      await verifyPhoneWithFirebase(idToken);
      await refreshProfile();
      Alert.alert('¡Listo!', 'Tu teléfono fue verificado correctamente.', [
        { text: 'OK', onPress: () => safeBack(router, '/(tabs)/profile') },
      ]);
    } catch (err: any) {
      if (err?.code === 'auth/invalid-verification-code') {
        Alert.alert('Error', 'Código incorrecto. Intentá de nuevo.');
      } else if (err?.isAxiosError) {
        Alert.alert('Error', getUserErrorMessage(err));
      } else {
        Alert.alert('Error', err?.message || 'No se pudo verificar el código.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setCode('');
    setStep('phone');
    confirmationRef.current = null;
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <LinearGradient
        colors={wash(tc)}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.bg}
      >
        <AnimatedBackground variant="minimal" />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={() => safeBack(router, '/(tabs)/profile')} hitSlop={12} style={[styles.backBtn, { backgroundColor: tc.surface }]}>
              <MaterialIcons name="arrow-back" size={24} color={tc.text} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: tc.text }]}>Verificar teléfono</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.container}>
            <BlurView intensity={30} tint={isDark ? 'dark' : 'light'} style={[styles.card, { borderColor: tc.cardBorder }]}>
              {/* Ícono */}
              <View style={[styles.iconWrap, { backgroundColor: tc.accent }]}>
                <MaterialIcons
                  name={step === 'phone' ? 'phone' : 'sms'}
                  size={32}
                  color={TOKENS.color.signal}
                />
              </View>

              <Text style={[styles.title, { color: tc.text }]}>
                {step === 'phone' ? 'Ingresá tu número' : 'Ingresá el código'}
              </Text>
              <Text style={[styles.subtitle, { color: tc.textSub }]}>
                {step === 'phone'
                  ? 'Te enviaremos un SMS con un código de verificación'
                  : `Enviamos un código de 6 dígitos a ${phone}`}
              </Text>

              {step === 'phone' ? (
                <View style={[styles.inputWrap, { backgroundColor: tc.surface, borderColor: tc.border }]}>
                  <Text style={styles.flag}>🇦🇷</Text>
                  <TextInput
                    style={[styles.input, { color: tc.text }]}
                    placeholder="+54 9 11 1234-5678"
                    placeholderTextColor={tc.textSub}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    autoFocus
                    returnKeyType="done"
                    onSubmitEditing={handleSendCode}
                  />
                </View>
              ) : (
                <View style={[styles.inputWrap, { backgroundColor: tc.surface, borderColor: tc.border }]}>
                  <MaterialIcons name="lock" size={20} color={tc.textSub} />
                  <TextInput
                    style={[styles.input, styles.codeInput, { color: tc.text }]}
                    placeholder="123456"
                    placeholderTextColor={tc.textSub}
                    value={code}
                    onChangeText={setCode}
                    keyboardType="number-pad"
                    maxLength={6}
                    autoFocus
                    returnKeyType="done"
                    onSubmitEditing={handleVerifyCode}
                  />
                </View>
              )}

              <View style={[styles.btnShadow, TOKENS.shadow.glow]}>
                <Pressable
                  style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
                  onPress={step === 'phone' ? handleSendCode : handleVerifyCode}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={GRADIENTS.brand}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.btnGradient}
                  >
                    {loading
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <Text style={styles.btnText}>
                          {step === 'phone' ? 'Enviar código' : 'Verificar'}
                        </Text>
                    }
                  </LinearGradient>
                </Pressable>
              </View>

              {step === 'code' && (
                <Pressable onPress={handleResend} style={styles.resendBtn}>
                  <Text style={styles.resendText}>¿No recibiste el código? Reenviar</Text>
                </Pressable>
              )}
            </BlurView>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  backBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TOKENS.color.text,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    paddingBottom: 60,
  },
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    padding: 28,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)',
    gap: 16,
    alignItems: 'center',
  },
  iconWrap: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: 'rgba(133,0,33,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: TOKENS.color.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: TOKENS.color.sub,
    textAlign: 'center',
    lineHeight: 20,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(200,200,220,0.5)',
    paddingHorizontal: 14,
    paddingVertical: 4,
    gap: 10,
    minHeight: 52,
  },
  flag: { fontSize: 20 },
  input: {
    flex: 1,
    fontSize: 16,
    color: TOKENS.color.text,
    paddingVertical: 8,
  },
  codeInput: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 8,
  },
  btnShadow: {
    width: '100%',
    borderRadius: 14,
    shadowColor: TOKENS.color.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 4,
  },
  btn: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
  },
  btnPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  btnGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  resendBtn: { paddingVertical: 4 },
  resendText: {
    fontSize: 14,
    color: TOKENS.color.signal,
    fontWeight: '500',
  },
});
