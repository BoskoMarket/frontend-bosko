import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { safeBack } from '@/core/navigation/safeBack';
import { useAuth } from '@/features/auth/state/AuthContext';
import { useGoogleReauth } from '@/features/auth/hooks/useGoogleSignIn';
import { useProfile } from '@/features/profile/state/ProfileContext';
import { deleteAccountService, type DeleteAccountCredentials } from '@/features/profile/services/profile';
import { useClientOrders, useProviderOrders } from '@/hooks/queries/useOrdersQuery';
import { useMyPlan } from '@/hooks/queries/usePlansQuery';
import { ORDER_STATUS } from '@/features/orders/constants/orderStatus';
import {
  DELETION_GRACE_DAYS,
  blockingOrders,
  deactivationMessage,
  mergeOrders,
} from '@/features/profile/utils/deleteAccountRules';
import {
  TOKENS,
  Badge,
  Button,
  Card,
  IconCircle,
  Input,
  ListRow,
  NoticeBanner,
  ScreenHeader,
  Text,
  toast,
  useThemeColors,
} from '@/core/design-system';
import { AnimatedBackground } from '@/components/AnimatedBackground';

const CONFIRM_WORD = 'ELIMINAR';

const WARNINGS = [
  'Tu cuenta se desactiva y tu perfil, servicios y reels dejan de verse.',
  `Tenés ${DELETION_GRACE_DAYS} días para cambiar de idea: si volvés a iniciar sesión en ese plazo, tu cuenta se reactiva.`,
  `Pasados los ${DELETION_GRACE_DAYS} días, tu cuenta y tus datos se eliminan definitivamente.`,
];
const PREMIUM_WARNING = 'Vas a perder tu plan Premium sin reembolso del período restante.';
const BLOCKED_MESSAGE = 'No podés eliminar tu cuenta mientras tengas órdenes activas.';

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
  const { profile } = useProfile();
  const isGoogle = profile?.authProvider === 'google';
  const { loading: googleLoading, getGoogleIdToken } = useGoogleReauth();
  const clientOrders = useClientOrders();
  const providerOrders = useProviderOrders();
  const myPlan = useMyPlan();
  const blocking = blockingOrders(mergeOrders(clientOrders.data, providerOrders.data));
  const providerIds = new Set((providerOrders.data ?? []).map((o) => o.id));
  const [serverBlocked, setServerBlocked] = useState(false);
  const isBlocked = blocking.length > 0 || serverBlocked;
  const isPremium = myPlan.data?.status === 'active';
  const [step, setStep] = useState<1 | 2>(1);
  const [confirmText, setConfirmText] = useState('');
  const [password, setPassword] = useState('');
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
  const canDelete = canProceed && (isGoogle || password.length >= 6);

  const goToStep2 = () => {
    setError('');
    setStep(2);
    Animated.parallel([
      Animated.timing(step2Opacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(step2Ty, { toValue: 0, duration: 350, useNativeDriver: true }),
    ]).start();
  };

  const handleBack = () => {
    if (loading) return;
    if (step === 2) {
      setStep(1);
      setPassword('');
      setError('');
    } else {
      safeBack(router, '/(tabs)/profile');
    }
  };

  const handleDelete = () => {
    if (!canDelete || loading || googleLoading) return;
    Alert.alert(
      'Última confirmación',
      `Tu cuenta se desactivará y se eliminará definitivamente en ${DELETION_GRACE_DAYS} días. Si volvés a iniciar sesión antes, se reactiva.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, desactivar',
          style: 'destructive',
          onPress: async () => {
            setError('');
            setLoading(true);
            try {
              let credentials: DeleteAccountCredentials;
              if (isGoogle) {
                let googleIdToken: string | null;
                try {
                  googleIdToken = await getGoogleIdToken();
                } catch {
                  toast.error('No pudimos confirmar con Google', 'Intentá de nuevo.');
                  return;
                }
                if (!googleIdToken) return; // user cancelled the Google prompt
                credentials = { googleIdToken };
              } else {
                credentials = { password };
              }
              const result = await deleteAccountService(credentials);
              await logout();
              router.replace('/login');
              toast.success('Cuenta desactivada', deactivationMessage(result?.deletionScheduledAt));
            } catch (err: any) {
              const code = err?.response?.data?.code;
              if (code === 'ACTIVE_ORDERS' || err?.response?.status === 409) {
                setServerBlocked(true);
                setStep(1);
                void clientOrders.refetch();
                void providerOrders.refetch();
              } else if (!err?.response) setError('Sin conexión. Revisá tu internet e intentá de nuevo.');
              else if (code === 'NOT_FOUND') setError('Usuario no encontrado.');
              else if (code === 'REAUTH_FAILED')
                setError('No pudimos verificar tu cuenta de Google. Intentá de nuevo.');
              else if (code === 'INVALID_PASSWORD' || err?.response?.status === 401)
                setError(isGoogle ? 'No pudimos verificar tu cuenta de Google. Intentá de nuevo.' : 'Contraseña incorrecta. Verificá e intentá de nuevo.');
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
    <View style={[s.bg, { backgroundColor: tc.bg }]}>
      <AnimatedBackground variant="minimal" />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <ScreenHeader title={step === 1 ? 'Eliminar cuenta' : 'Confirmar identidad'} onBack={handleBack} />

        {/* Step indicator */}
        <View style={s.stepRow}>
          <View style={[s.stepDot, { backgroundColor: TOKENS.color.error }]} />
          <View style={[s.stepLine, { backgroundColor: tc.divider }]} />
          <View style={[s.stepDot, { backgroundColor: step === 2 ? TOKENS.color.error : tc.border }]} />
        </View>

        {/* Warning icon */}
        <Animated.View style={[s.warningIconWrap, { opacity: iconOpacity, transform: [{ scale: iconScale }] }]}>
          <IconCircle name={step === 1 ? 'warning' : 'lock-closed'} variant="danger" size={84} />
          <Text variant="h3" color={TOKENS.color.error} center>
            {isBlocked ? 'No se puede eliminar todavía' : step === 1 ? 'Zona de peligro' : 'Verificá tu identidad'}
          </Text>
          <Text variant="bodySmall" color={tc.textSub} center>
            {step === 1
              ? `Tu cuenta se desactiva y se elimina definitivamente en ${DELETION_GRACE_DAYS} días.`
              : isGoogle
                ? 'Confirmá con tu cuenta de Google para continuar.'
                : 'Ingresá tu contraseña para confirmar la eliminación.'}
          </Text>
        </Animated.View>

        {isBlocked && (
          <FadeSlide delay={100}>
            <NoticeBanner variant="error">{BLOCKED_MESSAGE}</NoticeBanner>
            {blocking.length > 0 && (
              <Card padding="md" radius="lg" contentStyle={s.blockList}>
                {blocking.map((o) => (
                  <ListRow
                    key={o.id}
                    label={o.title}
                    subtitle={providerIds.has(o.id) ? 'Como proveedor' : 'Como cliente'}
                    right={<Badge label={ORDER_STATUS[o.status].label} tone={ORDER_STATUS[o.status].tone} />}
                    onPress={() => router.push({ pathname: '/orders/[id]', params: { id: o.id } })}
                  />
                ))}
              </Card>
            )}
          </FadeSlide>
        )}

        {step === 1 && !isBlocked && (
          <>
            {/* Consequences */}
            <FadeSlide delay={100}>
              <Card padding="xl" radius="lg" contentStyle={s.cardContent}>
                <Text variant="subtitle">Si eliminás tu cuenta:</Text>
                {WARNINGS.map((w, i) => (
                  <View key={i} style={s.warningItem}>
                    <MaterialIcons name="close" size={16} color={TOKENS.color.error} style={s.warningIcon} />
                    <Text variant="bodySmall" color={tc.textSub} style={s.warningText}>{w}</Text>
                  </View>
                ))}
                {isPremium && (
                  <View style={s.warningItem}>
                    <MaterialIcons name="close" size={16} color={TOKENS.color.error} style={s.warningIcon} />
                    <Text variant="bodySmall" color={tc.textSub} style={s.warningText}>{PREMIUM_WARNING}</Text>
                  </View>
                )}
              </Card>
            </FadeSlide>

            {/* Confirm word input */}
            <FadeSlide delay={200}>
              <Card padding="xl" radius="lg" contentStyle={s.cardContent}>
                <Text variant="body" color={tc.textSub}>
                  Escribí{' '}
                  <Text variant="body" weight="800" color={TOKENS.color.error}>{CONFIRM_WORD}</Text>
                  {' '}para continuar:
                </Text>
                <Input
                  value={confirmText}
                  onChangeText={setConfirmText}
                  placeholder={CONFIRM_WORD}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  accessibilityLabel={`Escribí ${CONFIRM_WORD} para continuar`}
                />
              </Card>
            </FadeSlide>

            <FadeSlide delay={300}>
              <Button
                label="Continuar"
                variant="danger"
                size="lg"
                fullWidth
                disabled={!canProceed}
                iconPosition="right"
                icon={<MaterialIcons name="arrow-forward" size={20} color={TOKENS.color.onPrimary} />}
                onPress={goToStep2}
              />
            </FadeSlide>
          </>
        )}

        {step === 2 && !isBlocked && (
          <Animated.View style={[s.step2, { opacity: step2Opacity, transform: [{ translateY: step2Ty }] }]}>
            {isGoogle ? (
              <Card padding="xl" radius="lg" contentStyle={s.cardContent}>
                <Text variant="bodySmall" color={tc.textSub}>
                  Tu cuenta usa Google para iniciar sesión. Vas a elegir tu cuenta de Google para confirmar.
                </Text>
              </Card>
            ) : (
            <Card padding="xl" radius="lg" contentStyle={s.cardContent}>
              <Input
                label="Ingresá tu contraseña actual"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
                editable={!loading}
                returnKeyType="done"
                onSubmitEditing={handleDelete}
              />
            </Card>
            )}

            {!!error && <NoticeBanner variant="error">{error}</NoticeBanner>}

            <Button
              label={isGoogle ? 'Confirmar con Google' : 'Eliminar mi cuenta'}
              variant="danger"
              size="lg"
              fullWidth
              loading={loading || googleLoading}
              disabled={!canDelete}
              icon={<MaterialIcons name="delete-forever" size={20} color={TOKENS.color.onPrimary} />}
              onPress={handleDelete}
            />
          </Animated.View>
        )}

        {!!error && step === 1 && <NoticeBanner variant="error">{error}</NoticeBanner>}

        <Button
          label="Cancelar, mantener mi cuenta"
          variant="ghost"
          disabled={loading}
          onPress={() => safeBack(router, '/(tabs)/profile')}
        />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  bg: { flex: 1 },
  scroll: { paddingTop: 60, paddingBottom: 40, paddingHorizontal: 24, gap: 16 },
  stepRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  stepDot: { width: 10, height: 10, borderRadius: 5 },
  stepLine: { width: 40, height: 2, marginHorizontal: 6 },
  warningIconWrap: { alignItems: 'center', gap: 10, paddingVertical: 8 },
  cardContent: { gap: 12 },
  warningItem: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  warningIcon: { marginTop: 2 },
  warningText: { flex: 1, lineHeight: 18 },
  step2: { gap: 16 },
  blockList: { gap: 4 },
});
