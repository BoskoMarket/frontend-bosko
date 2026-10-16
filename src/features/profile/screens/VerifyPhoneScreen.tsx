/**
 * VerifyPhoneScreen — Verificación de teléfono via Firebase Phone Auth.
 * Flujo: ingresá número → recibís SMS → ingresás código → teléfono verificado.
 * Requiere build nativo (no funciona en Expo Go).
 */

import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { router } from 'expo-router';
import { safeBack } from '@/core/navigation/safeBack';
import { useProfile } from '@/features/profile/state/ProfileContext';
import { verifyPhoneWithFirebase } from '@/features/profile/services/profile';
import { getUserErrorMessage } from '@/lib/errors';
import {
  Button,
  Card,
  IconCircle,
  Input,
  NoticeBanner,
  OtpInput,
  ScreenHeader,
  Text,
  useThemeColors,
} from '@/core/design-system';
import { AnimatedBackground } from '@/components/AnimatedBackground';

type Step = 'phone' | 'code';

// E.164: "+" followed by 8 to 15 digits.
const E164 = /^\+\d{8,15}$/;

export default function VerifyPhoneScreen() {
  const tc = useThemeColors();
  const { refreshProfile } = useProfile();

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const confirmationRef = useRef<any>(null);

  const handleSendCode = async () => {
    if (loading) return;
    const trimmed = phone.trim();
    if (!trimmed) {
      setError('Ingresá un número de teléfono');
      return;
    }

    // Normalizar formato internacional (sin espacios, guiones ni paréntesis)
    const compact = trimmed.replace(/[\s\-().]/g, '');
    const normalized = compact.startsWith('+') ? compact : `+${compact}`;
    if (!E164.test(normalized)) {
      setError('Ingresá el número con código de país, por ejemplo +54 9 11 1234-5678');
      return;
    }

    setError('');
    setLoading(true);
    try {
      // Importación dinámica para no romper si no hay build nativo
      const auth = require('@react-native-firebase/auth').default;
      const confirmation = await auth().signInWithPhoneNumber(normalized);
      confirmationRef.current = confirmation;
      setStep('code');
    } catch (err: any) {
      const missingNative = /Cannot find module|native module/i.test(String(err?.message));
      setError(
        missingNative
          ? 'La verificación por SMS no está disponible en esta versión de la app.'
          : err?.message || 'No se pudo enviar el SMS. Verificá el número.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (loading) return;
    const trimmed = code.trim();
    if (trimmed.length !== 6) {
      setError('El código debe tener 6 dígitos');
      return;
    }

    setError('');
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
        setError('Código incorrecto. Intentá de nuevo.');
      } else if (err?.isAxiosError) {
        setError(getUserErrorMessage(err));
      } else {
        setError(err?.message || 'No se pudo verificar el código.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    setCode('');
    setError('');
    setStep('phone');
    confirmationRef.current = null;
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={[styles.bg, { backgroundColor: tc.bg }]}>
        <AnimatedBackground variant="minimal" />

        <KeyboardAvoidingView
          behavior="padding"
          style={styles.flex}
        >
          <View style={styles.header}>
            <ScreenHeader title="Verificar teléfono" onBack={() => safeBack(router, '/(tabs)/profile')} />
          </View>

          <View style={styles.container}>
            <Card padding="xxl" radius="xl" contentStyle={styles.cardContent}>
              <IconCircle name={step === 'phone' ? 'call-outline' : 'chatbubble-ellipses-outline'} size={68} />

              <Text variant="h3" center>
                {step === 'phone' ? 'Ingresá tu número' : 'Ingresá el código'}
              </Text>
              <Text variant="body" color={tc.textSub} center>
                {step === 'phone'
                  ? 'Te enviaremos un SMS con un código de verificación'
                  : `Enviamos un código de 6 dígitos a ${phone}`}
              </Text>

              {step === 'phone' ? (
                <Input
                  containerStyle={styles.fullWidth}
                  leftIcon="call-outline"
                  placeholder="+54 9 11 1234-5678"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleSendCode}
                  accessibilityLabel="Número de teléfono"
                />
              ) : (
                <OtpInput value={code} onChange={setCode} autoFocus />
              )}

              {!!error && <NoticeBanner variant="error" style={styles.fullWidth}>{error}</NoticeBanner>}

              <Button
                label={step === 'phone' ? 'Enviar código' : 'Verificar'}
                size="lg"
                fullWidth
                loading={loading}
                onPress={step === 'phone' ? handleSendCode : handleVerifyCode}
              />

              {step === 'code' && (
                <Button label="¿No recibiste el código? Reenviar" variant="ghost" size="sm" disabled={loading} onPress={handleResend} />
              )}
            </Card>
          </View>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  flex: { flex: 1 },
  header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 12 },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    paddingBottom: 60,
  },
  cardContent: { gap: 16, alignItems: 'center' },
  fullWidth: { width: '100%' },
});
