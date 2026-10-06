/**
 * RegisterView — Pantalla de registro multi-paso.
 * Rebrand "Señal Nocturna" — misma lógica de 4 pasos, validación y flujo
 * que el archivo original; usa los componentes reales del design system
 * (`AuthBackdrop`, `AuthCard`, `Input`, `Button`) para el fondo, la card, el campo del paso y el CTA.
 */

import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Animated,
  Alert,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  AuthBackdrop,
  AuthCard,
  Button,
  Divider,
  GRADIENTS,
  Input,
  SPACING,
  Text,
  TOKENS,
  FONT_FAMILY,
  useThemeColors,
} from '@/core/design-system';
import { useAuth } from '@/features/auth/state/AuthContext';
import { useGoogleSignIn } from '@/features/auth/hooks/useGoogleSignIn';
import { getFormErrors, getUserErrorMessage } from '@/lib/errors';
import { BrandMark } from '@/components/BrandMark';

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
  const tc = useThemeColors();
  const { registerUser, isLoading, error, clearError } = useAuth();
  const { loading: googleLoading, signInWithGoogle } = useGoogleSignIn();

  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({ firstName: '', lastName: '', email: '', password: '' });
  const [fieldError, setFieldError] = useState('');

  const inputRef = useRef<TextInput>(null);
  const progress = useRef(new Animated.Value(1 / STEPS.length)).current;

  React.useEffect(() => {
    // Evita mostrar un error que haya quedado pegado de otra pantalla
    // (login, registro, verificación de email comparten el mismo `error` de AuthContext)
    clearError();
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
      <View style={styles.flex}>
        <AuthBackdrop tilt={10}>
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

                <AuthCard padding={28} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Pressable onPress={handleBack} hitSlop={8}>
                      <Ionicons name="arrow-back" size={22} color={tc.text} />
                    </Pressable>
                    <Text variant="bodySmall" color={tc.textSub} style={styles.stepCounter}>
                      {step + 1} / {STEPS.length}
                    </Text>
                  </View>

                  <View style={[styles.progressTrack, { backgroundColor: tc.border }]}>
                    <Animated.View style={[styles.progressFill, progressStyle]}>
                      <LinearGradient colors={GRADIENTS.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
                    </Animated.View>
                  </View>

                  <Text variant="h3" style={styles.cardTitle}>Crear cuenta</Text>
                  <Text variant="subtitle" weight="400" color={tc.textSub} style={styles.stepLabel}>{currentStep.label}</Text>

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

                  {!!displayError && (
                    <Text variant="bodySmall" color={TOKENS.color.error} style={styles.errorText}>{displayError}</Text>
                  )}

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
                        <Divider style={styles.dividerLine} />
                        <Text variant="caption" weight="600" color={tc.textMuted}>o</Text>
                        <Divider style={styles.dividerLine} />
                      </View>

                      <Button
                        label="Registrarse con Google"
                        variant="secondary"
                        size="lg"
                        icon={<Ionicons name="logo-google" size={18} color={tc.text} />}
                        onPress={handleGoogleSignIn}
                        loading={googleLoading}
                        fullWidth
                        style={styles.googleButton}
                      />

                      <View style={styles.loginRow}>
                        <Text variant="body" color={tc.textSub}>¿Ya tenés cuenta? </Text>
                        <Pressable onPress={toRegister}>
                          <Text variant="body" weight="600" color={TOKENS.color.signal}>Ingresar</Text>
                        </Pressable>
                      </View>
                    </>
                  )}
                </AuthCard>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </AuthBackdrop>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.xxl, paddingVertical: SPACING.huge },
  container: { alignItems: 'center' },
  card: { marginTop: SPACING.xxl },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  stepCounter: { fontFamily: FONT_FAMILY.mono, letterSpacing: 1 },
  progressTrack: { height: 4, borderRadius: 2, marginBottom: SPACING.xxl, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2, overflow: 'hidden' },
  cardTitle: { fontSize: 22, marginBottom: 6 },
  stepLabel: { fontSize: 15, marginBottom: SPACING.xl },
  fieldGap: { marginBottom: 14 },
  errorText: { marginBottom: 14, marginLeft: SPACING.xs },
  ctaButton: { marginTop: 10, marginBottom: 26 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.xl },
  dividerLine: { flex: 1 },
  googleButton: { marginBottom: SPACING.xl },
  loginRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
});
