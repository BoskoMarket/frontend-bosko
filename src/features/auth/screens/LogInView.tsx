/**
 * LogInView — Pantalla de inicio de sesión.
 * Rebrand "Señal Nocturna": insignia bo, glass sobre negro profundo, usa los
 * componentes reales del design system (`AuthBackdrop`, `AuthCard`, `Input`,
 * `Button`) en vez de duplicar estilos a mano.
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
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  AuthBackdrop,
  AuthCard,
  Button,
  Divider,
  Input,
  SPACING,
  Text,
  TOKENS,
  useThemeColors,
} from '@/core/design-system';
import { useAuth } from '@/features/auth/state/AuthContext';
import { useGoogleSignIn } from '@/features/auth/hooks/useGoogleSignIn';
import { getUserErrorMessage } from '@/lib/errors';
import { BrandMark } from '@/components/BrandMark';
import { WELCOME_VIDEO_PENDING_KEY } from '@/features/auth/constants';

const REMEMBERED_EMAIL_KEY = 'BOSKO_REMEMBERED_EMAIL';

export default function LogInView({ toRegister }: { toRegister?: () => void }) {
  const tc = useThemeColors();
  const { login, isLoading, error, clearError } = useAuth();
  const { loading: googleLoading, signInWithGoogle } = useGoogleSignIn();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const passwordRef = useRef<TextInput>(null);

  React.useEffect(() => {
    // Evita mostrar un error que haya quedado pegado de otra pantalla
    // (login, registro, verificación de email comparten el mismo `error` de AuthContext)
    clearError();

    // Si había un email recordado, lo precargamos y dejamos el checkbox tildado
    AsyncStorage.getItem(REMEMBERED_EMAIL_KEY).then(saved => {
      if (saved) {
        setEmail(saved);
        setRememberMe(true);
      }
    });

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, damping: 20, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    Keyboard.dismiss();
    if (!email.trim() || !password.trim()) {
      setLocalError('Por favor completa todos los campos');
      return;
    }
    setLocalError('');
    clearError();
    try {
      const trimmedEmail = email.trim().toLowerCase();
      await login({ email: trimmedEmail, password });
      if (rememberMe) await AsyncStorage.setItem(REMEMBERED_EMAIL_KEY, trimmedEmail);
      else await AsyncStorage.removeItem(REMEMBERED_EMAIL_KEY);

      // Primer login después de verificar el email recién registrado → video de bienvenida, una sola vez
      const showWelcomeVideo = await AsyncStorage.getItem(WELCOME_VIDEO_PENDING_KEY);
      if (showWelcomeVideo) {
        await AsyncStorage.removeItem(WELCOME_VIDEO_PENDING_KEY);
        router.replace('/welcome-video');
      } else {
        router.replace('/(tabs)');
      }
    } catch (err) {
      setLocalError(getUserErrorMessage(err));
    }
  };

  const handleGoogleSignIn = async () => {
    Keyboard.dismiss();
    setLocalError('');
    clearError();
    try {
      const success = await signInWithGoogle();
      if (success) router.replace('/(tabs)');
    } catch (err: any) {
      setLocalError(getUserErrorMessage(err) || 'No se pudo iniciar sesión con Google.');
    }
  };

  const displayError = localError || error || '';

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.flex}>
      <AuthBackdrop tilt={-8}>
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
            <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
              <BrandMark variant="mark" size={68} />
              <View style={styles.markGap} />
              <BrandMark variant="wordmark" size={30} color={tc.text} tagline />
              <View style={styles.wordmarkGap} />

              <AuthCard>
                <Text variant="h3" style={styles.cardTitle}>Iniciar sesión</Text>

                <View style={styles.fieldGap}>
                  <Input
                    testID="login-email"
                    leftIcon="mail-outline"
                    placeholder="Correo electrónico"
                    value={email}
                    onChangeText={text => { setEmail(text); setLocalError(''); clearError(); }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                  />
                </View>

                <View style={styles.fieldGap}>
                  <Input
                    ref={passwordRef}
                    testID="login-password"
                    leftIcon="lock-closed-outline"
                    placeholder="Contraseña"
                    value={password}
                    onChangeText={text => { setPassword(text); setLocalError(''); clearError(); }}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                  />
                </View>

                {!!displayError && (
                  <Text variant="bodySmall" color={TOKENS.color.error} style={styles.errorText}>{displayError}</Text>
                )}

                <View style={styles.optionsRow}>
                  <Pressable onPress={() => setRememberMe(v => !v)} style={styles.rememberRow} hitSlop={8}>
                    <Ionicons
                      name={rememberMe ? 'checkbox' : 'square-outline'}
                      size={19}
                      color={rememberMe ? TOKENS.color.signal : tc.textSub}
                    />
                    <Text variant="bodySmall" weight="500" color={tc.textSub}>Recuérdame</Text>
                  </Pressable>

                  <Pressable onPress={() => router.push('/login/forgot-password')} hitSlop={8}>
                    <Text variant="bodySmall" weight="500" color={TOKENS.color.signal}>¿Olvidaste tu contraseña?</Text>
                  </Pressable>
                </View>

                <Button label="Ingresar" onPress={handleLogin} loading={isLoading} fullWidth style={styles.ctaButton} />

                <View style={styles.dividerRow}>
                  <Divider style={styles.dividerLine} />
                  <Text variant="caption" weight="600" color={tc.textMuted}>o</Text>
                  <Divider style={styles.dividerLine} />
                </View>

                <Button
                  label="Continuar con Google"
                  variant="secondary"
                  size="lg"
                  icon={<Ionicons name="logo-google" size={18} color={tc.text} />}
                  onPress={handleGoogleSignIn}
                  loading={googleLoading}
                  fullWidth
                  style={styles.googleButton}
                />

                <View style={styles.registerRow}>
                  <Text variant="body" color={tc.textSub}>¿No tenés cuenta? </Text>
                  <Pressable onPress={toRegister}>
                    <Text variant="body" weight="600" color={TOKENS.color.signal}>Registrarse</Text>
                  </Pressable>
                </View>
              </AuthCard>
            </Animated.View>
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
  markGap: { height: 14 },
  wordmarkGap: { height: 28 },
  cardTitle: { fontSize: 22, marginBottom: 30 },
  fieldGap: { marginBottom: SPACING.xl },
  errorText: { marginBottom: 14, marginLeft: SPACING.xs },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 28,
  },
  rememberRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  ctaButton: { marginBottom: 26 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.xl },
  dividerLine: { flex: 1 },
  googleButton: { marginBottom: SPACING.xxl },
  registerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
});
