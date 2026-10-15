import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { safeBack } from '@/core/navigation/safeBack';
import { changePasswordService } from '@/features/auth/services/auth';
import {
  Button,
  Card,
  IconCircle,
  Input,
  ScreenHeader,
  SPACING,
  Text,
  TOKENS,
  useThemeColors,
  dialog,
} from '@/core/design-system';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { getUserErrorMessage } from '@/lib/errors';

function getStrength(pwd: string): 0 | 1 | 2 | 3 {
  if (!pwd) return 0;
  let s = 0;
  if (pwd.length >= 8) s++;
  if (/[0-9]/.test(pwd)) s++;
  if (/[^a-zA-Z0-9]/.test(pwd)) s++;
  return s as 0 | 1 | 2 | 3;
}

const STRENGTH_LABELS = ['', 'Débil', 'Regular', 'Fuerte'];
const STRENGTH_COLORS = ['', TOKENS.status.cancelled.fg, TOKENS.status.pending.fg, TOKENS.status.done.fg];

function StrengthBar({ password, tc }: { password: string; tc: ReturnType<typeof useThemeColors> }) {
  const strength = getStrength(password);
  if (!password) return null;
  return (
    <View style={sb.row}>
      {[1, 2, 3].map(i => (
        <View
          key={i}
          style={[sb.segment, { backgroundColor: i <= strength ? STRENGTH_COLORS[strength] : tc.border }]}
        />
      ))}
      <Text variant="caption" weight="700" color={STRENGTH_COLORS[strength]} style={sb.label}>
        {STRENGTH_LABELS[strength]}
      </Text>
    </View>
  );
}
const sb = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  segment: { flex: 1, height: 4, borderRadius: 2 },
  label: { width: 60 },
});

export default function ChangePasswordScreen() {
  const tc = useThemeColors();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const newRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleSave = async () => {
    Keyboard.dismiss();
    setError('');
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Completá todos los campos');
      return;
    }
    if (newPassword.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setIsLoading(true);
    try {
      await changePasswordService(currentPassword, newPassword);
      dialog.fromAlert('¡Listo!', 'Tu contraseña fue actualizada exitosamente.', [
        { text: 'OK', onPress: () => safeBack(router, '/(tabs)/profile') },
      ]);
    } catch (err) {
      setError(getUserErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={[s.background, { backgroundColor: tc.bg }]}>
        <AnimatedBackground variant="minimal" />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={s.flex}
        >
          <ScrollView
            contentContainerStyle={s.container}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View style={[s.inner, { opacity: fadeAnim, transform: [{ translateY }] }]}>
              <View style={s.header}>
                <ScreenHeader title="Cambiar contraseña" onBack={() => safeBack(router, '/(tabs)/profile')} />
              </View>

              <IconCircle name="shield-checkmark" size={80} iconSize={36} style={s.icon} />
              <Text variant="body" center color={tc.textSub} style={s.subtitle}>
                Tu contraseña debe tener al menos 8 caracteres.
              </Text>

              <Card padding="xxl" radius="lg" elevated style={s.card}>
                <View style={s.fields}>
                  <Input
                    label="Contraseña actual"
                    leftIcon="lock-closed-outline"
                    placeholder="••••••••"
                    value={currentPassword}
                    onChangeText={t => { setCurrentPassword(t); setError(''); }}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={() => newRef.current?.focus()}
                  />
                  <View>
                    <Input
                      ref={newRef}
                      label="Nueva contraseña"
                      leftIcon="lock-closed-outline"
                      placeholder="••••••••"
                      value={newPassword}
                      onChangeText={t => { setNewPassword(t); setError(''); }}
                      secureTextEntry
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="next"
                      onSubmitEditing={() => confirmRef.current?.focus()}
                    />
                    <StrengthBar password={newPassword} tc={tc} />
                  </View>
                  <Input
                    ref={confirmRef}
                    label="Confirmar nueva contraseña"
                    leftIcon="lock-closed-outline"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChangeText={t => { setConfirmPassword(t); setError(''); }}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                  />
                </View>

                {!!error && (
                  <Text variant="bodySmall" color={TOKENS.status.cancelled.fg} style={s.errorText}>{error}</Text>
                )}

                <Button label="Guardar cambios" onPress={handleSave} loading={isLoading} fullWidth />
              </Card>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const s = StyleSheet.create({
  background: { flex: 1 },
  flex: { flex: 1 },
  container: {
    paddingTop: 60,
    paddingBottom: SPACING.huge,
    paddingHorizontal: SPACING.xxl,
    flexGrow: 1,
  },
  inner: { flex: 1, alignItems: 'center' },
  header: { width: '100%', marginBottom: SPACING.xxxl },
  icon: { marginBottom: SPACING.md },
  subtitle: { marginBottom: 28 },
  card: { alignSelf: 'stretch' },
  fields: { gap: SPACING.lg, marginBottom: SPACING.lg },
  errorText: { marginBottom: SPACING.sm, marginLeft: SPACING.xs },
});
