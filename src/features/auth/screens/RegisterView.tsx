/**
 * RegisterView — Pantalla de registro multi-paso.
 * Rebrand "Señal Nocturna" — misma lógica de 4 pasos, validación y flujo
 * que el archivo original; usa los componentes reales del design system
 * (`Input`, `Button`) para el campo del paso y el CTA.
 */

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Dimensions,
  Animated,
  Alert,
  Easing,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from '@/core/components/BlurView';
import { Input } from '@/core/components/Input';
import { Button } from '@/core/design-system';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/features/auth/state/AuthContext';
import { useGoogleSignIn } from '@/features/auth/hooks/useGoogleSignIn';
import { getFormErrors, getUserErrorMessage } from '@/lib/errors';
import { BrandMark } from '@/components/BrandMark';

const { width } = Dimensions.get('window');

interface Step {
  label: string;
  placeholder: string;
  field: keyof FormData;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  secure?: boolean;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}

interface FormData {
  firstName: string;
  lastName:  string;
  email:     string;
  password:  string;
}

const STEPS: Step[] = [
  { label: 'Nombre',     placeholder: 'Tu nombre',            field: 'firstName', keyboardType: 'default',       icon: 'person-outline' },
  { label: 'Apellido',   placeholder: 'Tu apellido',          field: 'lastName',  keyboardType: 'default',       icon: 'person-outline' },
  { label: 'Email',      placeholder: 'tucorreo@ejemplo.com', field: 'email',     keyboardType: 'email-address', icon: 'mail-outline'  },
  { label: 'Contraseña', placeholder: 'Mínimo 8 caracteres',  field: 'password',  secure: true,                  icon: 'lock-closed-outline' },
];

const REGISTER_FIELDS = STEPS.map(s => s.field);

export default function RegisterView({ toRegister }: { toRegister?: () => void }) {
  const { registerUser, isLoading, error, clearError } = useAuth();
  const { loading: googleLoading, signInWithGoogle } = useGoogleSignIn();

  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({ firstName: '', lastName: '', email: '', password: '' });
  const [fieldError, setFieldError] = useState('');

  const inputRef = useRef<TextInput>(null);
  const progress = useRef(new Animated.Value(1 / STEPS.length)).current;
  const glow = useRef(new Animated.Value(0.7)).current;

  React.useEffect(() => {
    // Evita mostrar un error que haya quedado pegado de otra pantalla
    // (login, registro, verificación de email comparten el mismo `error` de AuthContext)
    clearError();

    // Glow de fondo pulsante — mismo lenguaje que AnimatedSplashScreen, le da vida al gradiente estático
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0.7, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  const currentStep = STEPS[step];
  const isLastStep = step === STEPS.length - 1;

  const progressStyle = {
    width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
  };

  const validateCurrent = async (): Promise<boolean> => {
    const value = formData[currentStep.field].trim();
    if (!value) { setFieldError('Este campo es obligatorio'); return false; }
    if (currentStep.field === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) { setFieldError('Ingresá un email válido'); return false; }
    }
    if (currentStep.field === 'password') {
      if (value.length < 8) { setFieldError('La contraseña debe tener al menos 8 caracteres'); return false; }
      if (!/[A-Z]/.test(value)) { setFieldError('La contraseña debe tener al menos una mayúscula'); return false; }
      if (!/[0-9]/.test(value)) { setFieldError('La contraseña debe tener al menos un número'); return false; }
    }
    return true;
  };

  const handleNext = async () => {
    Keyboard.dismiss();
    setFieldError('');
    const valid = await validateCurrent();
    if (!valid) return;

    if (isLastStep) {
      await handleFinish();
    } else {
      setStep(s => s + 1);
      Animated.timing(progress, { toValue: (step + 2) / STEPS.length, duration: 300, useNativeDriver: false }).start();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleBack = () => {
    setFieldError('');
    if (step > 0) {
      setStep(s => s - 1);
      Animated.timing(progress, { toValue: step / STEPS.length, duration: 300, useNativeDriver: false }).start();
    } else {
      toRegister?.();
    }
  };

  const handleFinish = async () => {
    const email = formData.email.trim().toLowerCase();
    const firstName = formData.firstName.trim();
    const lastName = formData.lastName.trim();
    try {
      await registerUser({ firstName, lastName, email, password: formData.password });
      router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`);
    } catch (err) {
      // VALIDATION_ERROR: volver al primer paso con error y mostrarlo en su input
      const { fields, general } = getFormErrors(err, REGISTER_FIELDS);
      const firstInvalid = STEPS.findIndex(s => fields[s.field]);
      if (firstInvalid >= 0) {
        clearError(); // el error ya se muestra en su campo; evita que reaparezca al cambiar de paso
        setStep(firstInvalid);
        setFieldError(fields[STEPS[firstInvalid].field]!);
        Animated.timing(progress, { toValue: (firstInvalid + 1) / STEPS.length, duration: 300, useNativeDriver: false }).start();
      }
      if (general) Alert.alert('Error', general);
    }
  };

  const handleGoogleSignIn = async () => {
    Keyboard.dismiss();
    setFieldError('');
    clearError();
    try {
      const success = await signInWithGoogle();
      if (success) router.replace('/(tabs)');
    } catch (err: any) {
      setFieldError(getUserErrorMessage(err) || 'No se pudo continuar con Google.');
    }
  };

  const displayError = fieldError || error || '';

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.background}>
        <LinearGradient colors={['#0A0910', '#1a000d', '#0A0910']} style={StyleSheet.absoluteFill} />
        <Animated.View
          pointerEvents="none"
          style={[
            styles.glow,
            {
              opacity: glow.interpolate({ inputRange: [0.7, 1], outputRange: [0.5, 1] }),
              transform: [{ scale: glow.interpolate({ inputRange: [0.7, 1], outputRange: [1, 1.18] }) }, { rotate: '10deg' }],
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(255,45,111,0.24)', 'rgba(255,45,111,0.10)', 'rgba(255,45,111,0)']}
            locations={[0, 0.55, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
          <View style={styles.container}>
            <BrandMark variant="mark" size={52} />

            <View style={[styles.cardGlow, { backgroundColor: '#0A0910' }]}>
            <View style={[styles.cardShadow, { backgroundColor: '#0A0910' }]}>
              <BlurView intensity={30} tint="dark" style={styles.card}>
                <View style={styles.cardHeader}>
                  <Pressable onPress={handleBack} hitSlop={8}>
                    <Ionicons name="arrow-back" size={22} color="#EDEAF5" />
                  </Pressable>
                  <Text style={styles.stepCounter}>{step + 1} / {STEPS.length}</Text>
                </View>

                <View style={styles.progressTrack}>
                  <Animated.View style={[styles.progressFill, progressStyle]}>
                    <LinearGradient colors={['#FF2D6F', '#850021']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
                  </Animated.View>
                </View>

                <Text style={styles.cardTitle}>Crear cuenta</Text>
                <Text style={styles.stepLabel}>{currentStep.label}</Text>

                <View style={styles.fieldGap}>
                  <Input
                    ref={inputRef}
                    leftIcon={currentStep.icon}
                    placeholder={currentStep.placeholder}
                    value={formData[currentStep.field]}
                    onChangeText={text => { setFormData(prev => ({ ...prev, [currentStep.field]: text })); setFieldError(''); clearError(); }}
                    keyboardType={currentStep.keyboardType || 'default'}
                    secureTextEntry={currentStep.secure}
                    autoCapitalize={['firstName', 'lastName'].includes(currentStep.field) ? 'words' : 'none'}
                    autoCorrect={false}
                    returnKeyType={isLastStep ? 'done' : 'next'}
                    onSubmitEditing={handleNext}
                    autoFocus
                  />
                </View>

                {!!displayError && <Text style={styles.errorText}>{displayError}</Text>}

                <Button
                  label={isLastStep ? 'Crear cuenta' : 'Siguiente'}
                  onPress={handleNext}
                  loading={isLoading}
                  fullWidth
                  style={styles.ctaButton}
                />

                {step === 0 && (
                  <>
                    <View style={styles.dividerRow}>
                      <View style={styles.dividerLine} />
                      <Text style={styles.dividerText}>o</Text>
                      <View style={styles.dividerLine} />
                    </View>

                    <Pressable
                      onPress={handleGoogleSignIn}
                      disabled={googleLoading}
                      style={({ pressed }) => [styles.googleButton, pressed && styles.googleButtonPressed]}
                    >
                      {googleLoading ? (
                        <ActivityIndicator size="small" color="#EDEAF5" />
                      ) : (
                        <>
                          <Ionicons name="logo-google" size={18} color="#EDEAF5" />
                          <Text style={styles.googleButtonText}>Registrarse con Google</Text>
                        </>
                      )}
                    </Pressable>

                    <View style={styles.loginRow}>
                      <Text style={styles.loginPrompt}>¿Ya tenés cuenta? </Text>
                      <Pressable onPress={toRegister}>
                        <Text style={styles.loginLink}>Ingresar</Text>
                      </Pressable>
                    </View>
                  </>
                )}
              </BlurView>
            </View>
            </View>
          </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: '#0A0910' },
  glow: {
    position: 'absolute',
    top: -180,
    left: -40,
    right: -40,
    height: 520,
    opacity: 0.9,
  },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },
  container: { alignItems: 'center' },
  cardShadow: {
    borderRadius: 26,
    shadowColor: '#FF2D6F',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.28,
    shadowRadius: 34,
    elevation: 12,
  },
  cardGlow: { borderRadius: 26, marginTop: 24, shadowColor: '#fff', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.06, shadowRadius: 20 },
  card: {
    width: width - 48,
    borderRadius: 26,
    overflow: 'hidden',
    padding: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  stepCounter: { fontSize: 13, color: 'rgba(237,234,245,0.55)', fontFamily: 'JetBrainsMono_500Medium', letterSpacing: 1 },
  progressTrack: { height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, marginBottom: 24, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2, overflow: 'hidden' },
  cardTitle: { fontSize: 22, fontWeight: '700', fontFamily: 'Archivo_700Bold', color: '#EDEAF5', marginBottom: 6 },
  stepLabel: { fontSize: 15, color: 'rgba(237,234,245,0.55)', marginBottom: 20 },
  fieldGap: { marginBottom: 14 },
  errorText: { fontSize: 13, color: '#FF4D4D', marginBottom: 14, marginLeft: 4 },
  ctaButton: { marginTop: 10, marginBottom: 26 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  dividerText: { fontSize: 12, color: 'rgba(237,234,245,0.4)', fontWeight: '600' },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginBottom: 20,
  },
  googleButtonPressed: { opacity: 0.8 },
  googleButtonText: { fontSize: 15, fontWeight: '600', color: '#EDEAF5' },
  loginRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  loginPrompt: { fontSize: 14, color: 'rgba(237,234,245,0.55)' },
  loginLink: { fontSize: 14, color: '#FF2D6F', fontWeight: '600' },
});
