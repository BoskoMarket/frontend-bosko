import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Alert,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { safeBack } from '@/core/navigation/safeBack';
import { useAuth } from '@/features/auth/state/AuthContext';
import { deleteAccountService } from '@/features/profile/services/profile';
import { TOKENS } from '@/core/design-system/tokens';
import { useThemeColors, wash } from '@/core/design-system';
import { AnimatedBackground } from '@/components/AnimatedBackground';

const CONFIRM_WORD = 'ELIMINAR';

const WARNINGS = [
  'Tu perfil y datos personales serán eliminados permanentemente.',
  'Tus servicios publicados serán dados de baja.',
  'No podrás recuperar tu historial de órdenes ni conversaciones.',
  'Esta acción no tiene vuelta atrás.',
];

function FadeSlide({ delay, children }: { delay: number; children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
      Animated.timing(ty, { toValue: 0, duration: 400, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY: ty }] }}>
      {children}
    </Animated.View>
  );
}

export default function DeleteAccountScreen() {
  const tc = useThemeColors();
  const { logout } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [confirmText, setConfirmText] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const iconScale = useRef(new Animated.Value(0.85)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const step2Opacity = useRef(new Animated.Value(0)).current;
  const step2Ty = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(iconScale, { toValue: 1, damping: 14, useNativeDriver: true }),
      Animated.timing(iconOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
    ]).start();
  }, []);

  const canProceed = confirmText === CONFIRM_WORD;
  const canDelete = canProceed && password.length >= 6;

  const goToStep2 = () => {
    setError('');
    setStep(2);
    Animated.parallel([
      Animated.timing(step2Opacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(step2Ty, { toValue: 0, duration: 350, useNativeDriver: true }),
    ]).start();
  };

  const handleDelete = async () => {
    if (!canDelete) return;
    Alert.alert(
      'Última confirmación',
      '¿Estás absolutamente seguro? Esta acción eliminará tu cuenta para siempre.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, eliminar',
          style: 'destructive',
          onPress: async () => {
            setError('');
            setLoading(true);
            try {
              await deleteAccountService(password);
              await logout();
              router.replace('/login');
            } catch (err: any) {
              const code = err?.response?.data?.code;
              if (code === 'NOT_FOUND') setError('Usuario no encontrado.');
              else if (code === 'INVALID_PASSWORD' || err?.response?.status === 401)
                setError('Contraseña incorrecta. Verificá e intentá de nuevo.');
              else setError('Error al eliminar la cuenta. Intentá más tarde.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <LinearGradient
      colors={wash(tc)}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={s.bg}
    >
      <AnimatedBackground variant="minimal" />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={s.header}>
          <Pressable
            onPress={() => step === 2 ? (setStep(1), setPassword(''), setError('')) : safeBack(router, '/(tabs)/profile')}
            hitSlop={12}
            style={[s.backBtn, { backgroundColor: tc.surface }]}
          >
            <MaterialIcons name="arrow-back" size={24} color={tc.text} />
          </Pressable>
          <Text style={[s.headerTitle, { color: tc.text }]}>
            {step === 1 ? 'Eliminar cuenta' : 'Confirmar identidad'}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Step indicator */}
        <View style={s.stepRow}>
          <View style={[s.stepDot, { backgroundColor: tc.border }, s.stepDotActive]} />
          <View style={[s.stepLine, { backgroundColor: tc.divider }]} />
          <View style={[s.stepDot, { backgroundColor: tc.border }, step === 2 && s.stepDotActive]} />
        </View>

        {/* Warning icon */}
        <Animated.View style={[s.warningIconWrap, { opacity: iconOpacity, transform: [{ scale: iconScale }] }]}>
          <View style={[s.warningCircle, { backgroundColor: TOKENS.status.cancelled.bg, borderColor: 'rgba(255,77,77,0.35)' }]}>
            <MaterialIcons name={step === 1 ? 'warning' : 'lock'} size={48} color={TOKENS.color.error} />
          </View>
          <Text style={s.warningTitle}>{step === 1 ? 'Zona de peligro' : 'Verificá tu identidad'}</Text>
          <Text style={[s.warningSubtitle, { color: tc.textSub }]}>
            {step === 1
              ? 'Esta acción es permanente e irreversible.'
              : 'Ingresá tu contraseña para confirmar la eliminación.'}
          </Text>
        </Animated.View>

        {step === 1 && (
          <>
            {/* Consequences */}
            <FadeSlide delay={100}>
              <View style={[s.card, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
                <Text style={[s.cardTitle, { color: tc.text }]}>Si eliminás tu cuenta:</Text>
                {WARNINGS.map((w, i) => (
                  <View key={i} style={s.warningItem}>
                    <MaterialIcons name="close" size={16} color="#dc2626" style={{ marginTop: 2 }} />
                    <Text style={[s.warningText, { color: tc.textSub }]}>{w}</Text>
                  </View>
                ))}
              </View>
            </FadeSlide>

            {/* Confirm word input */}
            <FadeSlide delay={200}>
              <View style={[s.card, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
                <Text style={[s.confirmLabel, { color: tc.textSub }]}>
                  Escribí{' '}
                  <Text style={s.confirmWord}>{CONFIRM_WORD}</Text>
                  {' '}para continuar:
                </Text>
                <TextInput
                  style={[s.confirmInput, { borderColor: tc.border, color: tc.text, backgroundColor: tc.surface }, canProceed && { borderColor: TOKENS.color.error, backgroundColor: TOKENS.status.cancelled.bg }]}
                  value={confirmText}
                  onChangeText={setConfirmText}
                  placeholder={CONFIRM_WORD}
                  placeholderTextColor={tc.textMuted}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
              </View>
            </FadeSlide>

            <FadeSlide delay={300}>
              <View style={[s.deleteBtnShadow, !canProceed && s.deleteBtnShadowDisabled]}>
                <Pressable
                  onPress={goToStep2}
                  disabled={!canProceed}
                  style={({ pressed }) => [
                    s.deleteBtn,
                    pressed && canProceed && s.btnPressed,
                  ]}
                >
                  <LinearGradient
                    colors={canProceed ? ['#dc2626', '#b91c1c', '#991b1b'] : ['#ccc', '#bbb']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={s.btnGradient}
                  >
                    <Text style={s.btnText}>Continuar</Text>
                    <MaterialIcons name="arrow-forward" size={20} color="#fff" />
                  </LinearGradient>
                </Pressable>
              </View>
            </FadeSlide>
          </>
        )}

        {step === 2 && (
          <Animated.View style={{ opacity: step2Opacity, transform: [{ translateY: step2Ty }], gap: 16 }}>
            {/* Password input */}
            <View style={[s.card, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
              <Text style={[s.confirmLabel, { color: tc.textSub }]}>Ingresá tu contraseña actual:</Text>
              <View style={s.passwordRow}>
                <TextInput
                  style={[s.confirmInput, { borderColor: tc.border, color: tc.text, backgroundColor: tc.surface }, s.passwordInput, password.length >= 6 && { borderColor: TOKENS.color.error, backgroundColor: TOKENS.status.cancelled.bg }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={tc.textMuted}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                />
                <Pressable onPress={() => setShowPassword(v => !v)} style={[s.eyeBtn, { borderColor: tc.border, backgroundColor: tc.surface2 }]} hitSlop={8}>
                  <MaterialIcons
                    name={showPassword ? 'visibility-off' : 'visibility'}
                    size={20}
                    color={tc.textSub}
                  />
                </Pressable>
              </View>
            </View>

            {!!error && (
              <View style={s.errorBanner}>
                <MaterialIcons name="error-outline" size={16} color="#dc2626" />
                <Text style={s.errorText}>{error}</Text>
              </View>
            )}

            {/* Delete button */}
            <View style={[s.deleteBtnShadow, (!canDelete || loading) && s.deleteBtnShadowDisabled]}>
              <Pressable
                onPress={handleDelete}
                disabled={!canDelete || loading}
                style={({ pressed }) => [
                  s.deleteBtn,
                  pressed && canDelete && s.btnPressed,
                ]}
              >
                <LinearGradient
                  colors={canDelete ? ['#dc2626', '#b91c1c', '#991b1b'] : ['#ccc', '#bbb']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={s.btnGradient}
                >
                  {loading
                    ? <ActivityIndicator color="#fff" size="small" />
                    : (
                      <>
                        <MaterialIcons name="delete-forever" size={20} color="#fff" />
                        <Text style={s.btnText}>Eliminar mi cuenta</Text>
                      </>
                    )
                  }
                </LinearGradient>
              </Pressable>
            </View>
          </Animated.View>
        )}

        {!!error && step === 1 && (
          <View style={s.errorBanner}>
            <MaterialIcons name="error-outline" size={16} color="#dc2626" />
            <Text style={s.errorText}>{error}</Text>
          </View>
        )}

        <Pressable onPress={() => safeBack(router, '/(tabs)/profile')} style={s.cancelRow}>
          <Text style={[s.cancelText, { color: tc.textSub }]}>Cancelar, mantener mi cuenta</Text>
        </Pressable>
      </ScrollView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  bg: { flex: 1 },
  scroll: { paddingTop: 60, paddingBottom: 40, paddingHorizontal: 24, gap: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
    marginBottom: 4,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(200,200,220,0.6)',
  },
  stepDotActive: { backgroundColor: '#dc2626' },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: 'rgba(200,200,220,0.4)',
    marginHorizontal: 6,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  passwordInput: {
    flex: 1,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    borderRightWidth: 0,
  },
  eyeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: 'rgba(200,200,220,0.5)',
    borderLeftWidth: 0,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: TOKENS.color.text },
  warningIconWrap: { alignItems: 'center', gap: 10, paddingVertical: 8 },
  warningCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fecaca',
  },
  warningTitle: { fontSize: 22, fontWeight: '800', color: '#dc2626', textAlign: 'center' },
  warningSubtitle: { fontSize: 14, color: TOKENS.color.sub, textAlign: 'center' },
  card: {
    borderRadius: 20,
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.9)',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: TOKENS.color.text },
  warningItem: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  warningText: { flex: 1, fontSize: 13, color: TOKENS.color.sub, lineHeight: 18 },
  confirmLabel: { fontSize: 14, color: TOKENS.color.sub, lineHeight: 20 },
  confirmWord: { fontWeight: '800', color: '#dc2626', letterSpacing: 1 },
  confirmInput: {
    borderWidth: 2,
    borderColor: 'rgba(200,200,220,0.5)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '700',
    color: TOKENS.color.text,
    letterSpacing: 2,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  confirmInputValid: { borderColor: '#dc2626', backgroundColor: '#fff5f5' },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: TOKENS.status.cancelled.bg,
    borderRadius: 12,
    padding: 12,
  },
  errorText: { flex: 1, fontSize: 13, color: '#dc2626' },
  deleteBtnShadow: {
    borderRadius: 14,
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 4,
  },
  deleteBtnShadowDisabled: { shadowOpacity: 0, elevation: 0 },
  deleteBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  btnPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  btnGradient: {
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelRow: { alignItems: 'center', paddingVertical: 12 },
  cancelText: {
    fontSize: 14,
    color: TOKENS.color.sub,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
