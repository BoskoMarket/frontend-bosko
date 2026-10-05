import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { safeBack } from '@/core/navigation/safeBack';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

import { TOKENS } from '@/core/design-system/tokens';
import { GRADIENTS } from '@/core/design-system/gradients';
import { useThemeColors, useIsDark } from '@/stores/theme.store';
import { getUserErrorMessage } from '@/lib/errors';
import {
  BackgroundCheckState,
  BackgroundCheckStatus,
  getBackgroundCheckStatus,
  uploadBackgroundCheck,
} from '../services/background-check.service';
import { useRequireProviderStatus } from '@/hooks/useRequireProviderStatus';
import { AnimatedBackground } from '@/components/AnimatedBackground';

function makeC(tc: ReturnType<typeof useThemeColors>) {
  return {
    primary: TOKENS.color.primary,
    dark:    TOKENS.color.primaryDark,
    bg:      tc.bg,
    card:    tc.card,
    accent:  tc.accent,
    text:    tc.text,
    sub:     tc.textSub,
    border:  tc.border,
    green:   '#22C55E',
    amber:   '#F59E0B',
    red:     '#EF4444',
    blue:    '#3B82F6',
  };
}

function makeStatusConfig(C: ReturnType<typeof makeC>, tc: ReturnType<typeof useThemeColors>): Record<BackgroundCheckStatus, { label: string; color: string; bg: string; icon: React.ComponentProps<typeof Ionicons>['name'] }> {
  return {
    NOT_SUBMITTED: { label: 'Sin enviar',       color: C.sub,                     bg: tc.surface2,               icon: 'document-outline' },
    UNDER_REVIEW:  { label: 'En revisión',      color: TOKENS.status.pending.fg,   bg: TOKENS.status.pending.bg,   icon: 'time-outline' },
    APPROVED:      { label: 'Aprobado',         color: TOKENS.status.done.fg,      bg: TOKENS.status.done.bg,      icon: 'checkmark-circle' },
    REJECTED:      { label: 'Rechazado',        color: TOKENS.status.cancelled.fg, bg: TOKENS.status.cancelled.bg, icon: 'close-circle' },
  };
}

export default function BackgroundCheckScreen() {
  useRequireProviderStatus('pending');
  const insets = useSafeAreaInsets();
  const tc = useThemeColors();
  const isDark = useIsDark();
  const C = useMemo(() => makeC(tc), [tc]);
  const STATUS_CONFIG = useMemo(() => makeStatusConfig(C, tc), [C, tc]);
  const s = useMemo(() => makeStyles(C), [C]);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [state, setState]       = useState<BackgroundCheckState | null>(null);
  const [loading, setLoading]   = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    load();
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getBackgroundCheckStatus();
      setState(data ?? { status: 'NOT_SUBMITTED' });
    } catch {
      setState({ status: 'NOT_SUBMITTED' });
    } finally {
      setLoading(false);
    }
  };

  const handlePickAndUpload = async (source: 'document' | 'camera' | 'gallery') => {
    let uri: string, mimeType: string, fileName: string;

    try {
      if (source === 'document') {
        const result = await DocumentPicker.getDocumentAsync({
          type: ['application/pdf', 'image/jpeg', 'image/png'],
          copyToCacheDirectory: true,
        });
        if (result.canceled) return;
        const asset = result.assets[0];
        uri      = asset.uri;
        mimeType = asset.mimeType ?? 'application/pdf';
        fileName = asset.name ?? 'antecedentes.pdf';
      } else if (source === 'camera') {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (perm.status !== 'granted') {
          Alert.alert('Permiso requerido', 'Necesitamos acceso a la cámara.');
          return;
        }
        const result = await ImagePicker.launchCameraAsync({ quality: 0.9 });
        if (result.canceled) return;
        uri      = result.assets[0].uri;
        mimeType = 'image/jpeg';
        fileName = 'antecedentes.jpg';
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (perm.status !== 'granted') {
          Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería.');
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.9 });
        if (result.canceled) return;
        uri      = result.assets[0].uri;
        mimeType = 'image/jpeg';
        fileName = 'antecedentes.jpg';
      }
    } catch {
      Alert.alert('Error', 'No se pudo seleccionar el archivo.');
      return;
    }

    setUploading(true);
    try {
      await uploadBackgroundCheck(uri, mimeType, fileName);
      await load();
      Alert.alert('¡Enviado!', 'Tu documento fue enviado y está bajo revisión del equipo de Bosko.');
    } catch (e: any) {
      Alert.alert('Error', getUserErrorMessage(e));
    } finally {
      setUploading(false);
    }
  };

  const showPickerOptions = () => {
    Alert.alert('Subir documento', 'Elegí cómo querés adjuntar tu certificado', [
      { text: 'PDF o imagen desde archivos', onPress: () => handlePickAndUpload('document') },
      { text: 'Tomar foto', onPress: () => handlePickAndUpload('camera') },
      { text: 'Elegir de galería', onPress: () => handlePickAndUpload('gallery') },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const status   = state?.status ?? 'NOT_SUBMITTED';
  const cfg      = STATUS_CONFIG[status];
  const canUpload = status === 'NOT_SUBMITTED' || status === 'REJECTED';

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <AnimatedBackground variant="minimal" />
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={C.bg} />

      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => safeBack(router, '/(tabs)/profile')} style={s.backBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={20} color={C.text} />
        </Pressable>
        <Text style={s.headerTitle}>Antecedentes penales</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>

          {/* Hero */}
          <LinearGradient colors={GRADIENTS.brandDeep} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}>
            <View style={s.heroIconWrap}>
              <Ionicons name="shield-checkmark" size={32} color="#fff" />
            </View>
            <Text style={s.heroTitle}>Certificado de antecedentes</Text>
            <Text style={s.heroSub}>
              Subí tu certificado del Registro Nacional de Reincidencia para generar confianza con tus clientes.
            </Text>
          </LinearGradient>

          {/* Estado actual */}
          {loading ? (
            <ActivityIndicator color={C.primary} style={{ marginTop: 40 }} />
          ) : (
            <>
              <View style={[s.statusCard, { backgroundColor: cfg.bg }]}>
                <Ionicons name={cfg.icon} size={22} color={cfg.color} />
                <View style={{ flex: 1 }}>
                  <Text style={[s.statusLabel, { color: cfg.color }]}>{cfg.label}</Text>
                  {state?.notes ? (
                    <Text style={s.statusNotes}>{state.notes}</Text>
                  ) : null}
                  {state?.reviewedAt ? (
                    <Text style={s.statusDate}>
                      Revisado: {new Date(state.reviewedAt).toLocaleDateString('es-AR')}
                    </Text>
                  ) : null}
                </View>
              </View>

              {/* Info */}
              <View style={s.infoCard}>
                <Text style={s.infoTitle}>¿Cómo obtener el certificado?</Text>
                {[
                  'Ingresá a www.argentina.gob.ar/reincidencia',
                  'Iniciá sesión con tu CUIL y clave fiscal',
                  'Solicitá el certificado de antecedentes penales',
                  'Descargá el PDF y subilo acá',
                ].map((step, i) => (
                  <View key={i} style={s.step}>
                    <View style={s.stepNum}>
                      <Text style={s.stepNumText}>{i + 1}</Text>
                    </View>
                    <Text style={s.stepText}>{step}</Text>
                  </View>
                ))}
              </View>

              {/* Formatos */}
              <View style={s.formatsRow}>
                {['PDF', 'JPG', 'PNG'].map(fmt => (
                  <View key={fmt} style={s.formatChip}>
                    <Ionicons name="document-outline" size={13} color={C.sub} />
                    <Text style={s.formatText}>{fmt}</Text>
                  </View>
                ))}
                <Text style={s.formatNote}>Tamaño máximo: 10 MB</Text>
              </View>

              {/* Botón */}
              {canUpload && (
                <View style={s.uploadBtnShadow}>
                  <Pressable
                    onPress={showPickerOptions}
                    disabled={uploading}
                    style={({ pressed }) => [s.uploadBtn, pressed && { opacity: 0.85 }]}
                  >
                  <LinearGradient colors={GRADIENTS.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.uploadBtnGrad}>
                    {uploading
                      ? <ActivityIndicator color="#fff" />
                      : <>
                          <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
                          <Text style={s.uploadBtnText}>
                            {status === 'REJECTED' ? 'Subir nuevo documento' : 'Subir certificado'}
                          </Text>
                        </>
                    }
                  </LinearGradient>
                </Pressable>
                </View>
              )}

              {status === 'UNDER_REVIEW' && (
                <View style={s.reviewNote}>
                  <Ionicons name="information-circle-outline" size={16} color={TOKENS.status.pending.fg} />
                  <Text style={s.reviewNoteText}>El equipo de Bosko revisará tu documento en un plazo de 1-3 días hábiles.</Text>
                </View>
              )}
            </>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const makeStyles = (C: ReturnType<typeof makeC>) => StyleSheet.create({
  root:         { flex: 1, backgroundColor: C.bg },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn:      { width: 36, height: 36, borderRadius: 12, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
  headerTitle:  { fontSize: 17, fontWeight: '700', color: C.text },
  scroll:       { paddingHorizontal: 16, paddingTop: 4 },

  hero:         { borderRadius: 20, padding: 24, marginBottom: 16, gap: 10 },
  heroIconWrap: { width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  heroTitle:    { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  heroSub:      { fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 19 },

  statusCard:   { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderRadius: 16, padding: 16, marginBottom: 16 },
  statusLabel:  { fontSize: 15, fontWeight: '700' },
  statusNotes:  { fontSize: 13, color: C.sub, marginTop: 3 },
  statusDate:   { fontSize: 12, color: C.sub, marginTop: 2 },

  infoCard:     { backgroundColor: C.card, borderRadius: 16, padding: 18, marginBottom: 14, gap: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
  infoTitle:    { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 4 },
  step:         { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  stepNum:      { width: 22, height: 22, borderRadius: 11, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  stepNumText:  { fontSize: 11, fontWeight: '700', color: TOKENS.color.signal },
  stepText:     { flex: 1, fontSize: 13, color: C.sub, lineHeight: 19 },

  formatsRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  formatChip:   { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.card, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: C.border },
  formatText:   { fontSize: 12, fontWeight: '600', color: C.sub },
  formatNote:   { fontSize: 12, color: C.sub, marginLeft: 4 },

  uploadBtn:    { borderRadius: 14, overflow: 'hidden' },
  uploadBtnShadow: { borderRadius: 14, ...TOKENS.shadow.glow },
  uploadBtnGrad:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16 },
  uploadBtnText:{ fontSize: 15, fontWeight: '700', color: '#fff' },

  reviewNote:   { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: TOKENS.status.pending.bg, borderRadius: 12, padding: 14, marginTop: 16 },
  reviewNoteText: { flex: 1, fontSize: 13, color: TOKENS.status.pending.fg, lineHeight: 18 },
});
