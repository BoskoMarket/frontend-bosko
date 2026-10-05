import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { safeBack } from '@/core/navigation/safeBack';
import { useKYC } from '../state/KYCContext';
import { TOKENS, wash, useThemeColors } from '@/core/design-system';
import { AnimatedBackground } from '@/components/AnimatedBackground';

const MAX_ATTEMPTS = 3;

const REJECTION_TIPS = [
  'Asegurate de que el documento no esté cortado ni borroso.',
  'Tomá la foto con buena iluminación, sin reflejos.',
  'La selfie debe mostrar claramente tu rostro y el documento.',
  'Usá el documento vigente, no vencido.',
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

export default function KYCRejectedScreen() {
  const tc = useThemeColors();
  const { verification, retry, loading, error, clearError } = useKYC();

  const attemptCount = verification?.attemptCount ?? 0;
  const canRetry = attemptCount < MAX_ATTEMPTS;
  const rejectionReason = verification?.rejectionReason;

  const handleRetry = async () => {
    clearError();
    try {
      await retry();
      router.replace('/(tabs)/profile/kyc');
    } catch {
      // Error en contexto
    }
  };

  return (
    <LinearGradient
      colors={wash(tc)}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={s.bg}
    >
      <AnimatedBackground variant="minimal" />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.header}>
          <Pressable onPress={() => safeBack(router, '/(tabs)/profile/kyc')} hitSlop={12} style={[s.backBtn, { backgroundColor: tc.surface }]}>
            <MaterialIcons name="arrow-back" size={24} color={tc.text} />
          </Pressable>
          <Text style={[s.headerTitle, { color: tc.text }]}>Verificación rechazada</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Icon */}
        <Animated.View style={[s.iconWrap, { opacity: 1 }]}>
          <View style={s.iconCircle}>
            <MaterialIcons name="cancel" size={52} color="#dc2626" />
          </View>
          <Text style={s.title}>Verificación rechazada</Text>
          <Text style={[s.subtitle, { color: tc.textSub }]}>
            Tu verificación de identidad no fue aprobada. Revisá el motivo y volvé a intentarlo.
          </Text>
        </Animated.View>

        {/* Rejection reason */}
        {!!rejectionReason && (
          <FadeSlide delay={100}>
            <View style={[s.card, s.reasonCard]}>
              <View style={s.reasonHeader}>
                <MaterialIcons name="info" size={18} color="#dc2626" />
                <Text style={s.reasonTitle}>Motivo del rechazo</Text>
              </View>
              <Text style={s.reasonText}>{rejectionReason}</Text>
            </View>
          </FadeSlide>
        )}

        {/* Tips */}
        <FadeSlide delay={150}>
          <View style={[s.card, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
            <Text style={[s.cardTitle, { color: tc.text }]}>Consejos para el reintento</Text>
            {REJECTION_TIPS.map((tip, i) => (
              <View key={i} style={s.tipRow}>
                <View style={s.tipBullet}>
                  <Text style={s.tipNumber}>{i + 1}</Text>
                </View>
                <Text style={[s.tipText, { color: tc.textSub }]}>{tip}</Text>
              </View>
            ))}
          </View>
        </FadeSlide>

        {/* Attempts counter */}
        <FadeSlide delay={200}>
          <View style={[s.attemptsCard, { backgroundColor: tc.surface, borderColor: tc.border }]}>
            <MaterialIcons
              name="refresh"
              size={18}
              color={canRetry ? TOKENS.color.primary : '#dc2626'}
            />
            <Text style={[s.attemptsText, !canRetry && s.attemptsExhausted]}>
              {canRetry
                ? `Intentos disponibles: ${MAX_ATTEMPTS - attemptCount} de ${MAX_ATTEMPTS}`
                : 'Agotaste los 3 intentos. Contactá a soporte.'
              }
            </Text>
          </View>
        </FadeSlide>

        {!!error && (
          <View style={s.errorBanner}>
            <MaterialIcons name="error-outline" size={16} color="#dc2626" />
            <Text style={s.errorText}>{error}</Text>
          </View>
        )}

        {canRetry ? (
          <FadeSlide delay={250}>
            <View style={s.primaryBtnShadow}>
              <Pressable
                onPress={handleRetry}
                disabled={loading}
                style={({ pressed }) => [s.primaryBtn, pressed && s.btnPressed]}
              >
              <LinearGradient
                colors={[TOKENS.color.primary, '#a0032a', TOKENS.color.primaryDark ?? '#3D000F']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.btnGradient}
              >
                {loading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : (
                    <>
                      <MaterialIcons name="refresh" size={20} color="#fff" />
                      <Text style={s.btnText}>Reintentar verificación</Text>
                    </>
                  )
                }
              </LinearGradient>
            </Pressable>
            </View>
          </FadeSlide>
        ) : (
          <View style={[s.supportCard, { backgroundColor: tc.surface, borderColor: tc.border }]}>
            <MaterialIcons name="support-agent" size={24} color={TOKENS.color.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[s.supportTitle, { color: tc.text }]}>¿Necesitás ayuda?</Text>
              <Text style={[s.supportText, { color: tc.textSub }]}>
                Contactá a nuestro equipo de soporte con tu problema de verificación.
              </Text>
            </View>
          </View>
        )}

        <Pressable onPress={() => router.replace('/(tabs)/profile/kyc')} style={s.secondaryRow}>
          <Text style={s.secondaryText}>Ver estado de verificación</Text>
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
  backBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: TOKENS.color.text },
  iconWrap: { alignItems: 'center', gap: 10, paddingVertical: 8 },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fecaca',
  },
  title: { fontSize: 22, fontWeight: '800', color: '#dc2626', textAlign: 'center' },
  subtitle: { fontSize: 14, color: TOKENS.color.sub, textAlign: 'center', lineHeight: 20 },
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
  reasonCard: {
    borderColor: '#fecaca',
    backgroundColor: 'rgba(254,226,226,0.5)',
  },
  reasonHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reasonTitle: { fontSize: 14, fontWeight: '700', color: '#dc2626' },
  reasonText: { fontSize: 14, color: '#7f1d1d', lineHeight: 20 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: TOKENS.color.text },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  tipBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(133,0,33,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  tipNumber: { fontSize: 12, fontWeight: '700', color: TOKENS.color.primary },
  tipText: { flex: 1, fontSize: 13, color: TOKENS.color.sub, lineHeight: 18 },
  attemptsCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.9)',
    backgroundColor: 'rgba(255,255,255,0.85)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  attemptsText: { fontSize: 13, fontWeight: '600', color: TOKENS.color.primary },
  attemptsExhausted: { color: '#dc2626' },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    padding: 12,
  },
  errorText: { flex: 1, fontSize: 13, color: '#dc2626' },
  primaryBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  primaryBtnShadow: {
    borderRadius: 14,
    shadowColor: TOKENS.color.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 4,
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
  supportCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.9)',
    backgroundColor: 'rgba(255,255,255,0.85)',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  supportTitle: { fontSize: 14, fontWeight: '700', color: TOKENS.color.text },
  supportText: { fontSize: 13, color: TOKENS.color.sub, lineHeight: 18, marginTop: 2 },
  secondaryRow: { alignItems: 'center', paddingVertical: 8 },
  secondaryText: { fontSize: 14, color: TOKENS.color.primary, fontWeight: '600' },
});
