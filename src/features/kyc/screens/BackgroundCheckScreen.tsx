import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { safeBack } from '@/core/navigation/safeBack';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

import {
  TOKENS,
  GRADIENTS,
  Badge,
  Button,
  Card,
  NoticeBanner,
  ScreenHeader,
  Text,
  useThemeColors,
  useIsDark,
  dialog,
} from '@/core/design-system';
import { getUserErrorMessage } from '@/lib/errors';
import {
  BackgroundCheckState,
  getBackgroundCheckStatus,
  uploadBackgroundCheck,
} from '../services/background-check.service';
import { BACKGROUND_CHECK_STATUS, toneColors } from '../constants/kycStatus';
import { useRequireProviderStatus } from '@/hooks/useRequireProviderStatus';
import { AnimatedBackground } from '@/components/AnimatedBackground';

const CERTIFICATE_STEPS = [
  'Ingresá a www.argentina.gob.ar/reincidencia',
  'Iniciá sesión con tu CUIL y clave fiscal',
  'Solicitá el certificado de antecedentes penales',
  'Descargá el PDF y subilo acá',
];

export default function BackgroundCheckScreen() {
  useRequireProviderStatus('pending');
  const insets = useSafeAreaInsets();
  const tc = useThemeColors();
  const isDark = useIsDark();
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
          dialog.fromAlert('Permiso requerido', 'Necesitamos acceso a la cámara.');
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
          dialog.fromAlert('Permiso requerido', 'Necesitamos acceso a tu galería.');
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.9 });
        if (result.canceled) return;
        uri      = result.assets[0].uri;
        mimeType = 'image/jpeg';
        fileName = 'antecedentes.jpg';
      }
    } catch {
      dialog.fromAlert('Error', 'No se pudo seleccionar el archivo.');
      return;
    }

    setUploading(true);
    try {
      await uploadBackgroundCheck(uri, mimeType, fileName);
      await load();
      dialog.fromAlert('¡Enviado!', 'Tu documento fue enviado y está bajo revisión del equipo de Bosko.');
    } catch (e: any) {
      dialog.fromAlert('Error', getUserErrorMessage(e));
    } finally {
      setUploading(false);
    }
  };

  const showPickerOptions = () => {
    dialog.fromAlert('Subir documento', 'Elegí cómo querés adjuntar tu certificado', [
      { text: 'PDF o imagen desde archivos', onPress: () => handlePickAndUpload('document') },
      { text: 'Tomar foto', onPress: () => handlePickAndUpload('camera') },
      { text: 'Elegir de galería', onPress: () => handlePickAndUpload('gallery') },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const status   = state?.status ?? 'NOT_SUBMITTED';
  const cfg      = BACKGROUND_CHECK_STATUS[status];
  const tone     = toneColors(cfg.tone, tc);
  const canUpload = status === 'NOT_SUBMITTED' || status === 'REJECTED';

  return (
    <View style={[s.root, { backgroundColor: tc.bg, paddingTop: insets.top }]}>
      <AnimatedBackground variant="minimal" />
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={tc.bg} />

      <View style={s.header}>
        <ScreenHeader title="Antecedentes penales" onBack={() => safeBack(router, '/(tabs)/profile')} />
      </View>

      <ScrollView contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>

          {/* Hero */}
          <LinearGradient colors={GRADIENTS.brandDeep} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}>
            <View style={s.heroIconWrap}>
              <Ionicons name="shield-checkmark" size={32} color={TOKENS.color.onPrimary} />
            </View>
            <Text variant="h3" color={TOKENS.color.onPrimary}>Certificado de antecedentes</Text>
            <Text variant="bodySmall" color={TOKENS.onMedia.textSub}>
              Subí tu certificado del Registro Nacional de Reincidencia para generar confianza con tus clientes.
            </Text>
          </LinearGradient>

          {/* Estado actual */}
          {loading ? (
            <ActivityIndicator color={TOKENS.color.primary} style={s.loader} />
          ) : (
            <>
              <View style={[s.statusCard, { backgroundColor: tone.bg }]}>
                <Ionicons name={cfg.icon} size={22} color={tone.fg} />
                <View style={s.statusBody}>
                  <Text variant="subtitle" color={tone.fg}>{cfg.label}</Text>
                  {state?.notes ? (
                    <Text variant="bodySmall" color={tc.textSub}>{state.notes}</Text>
                  ) : null}
                  {state?.reviewedAt ? (
                    <Text variant="caption" color={tc.textSub}>
                      Revisado: {new Date(state.reviewedAt).toLocaleDateString('es-AR')}
                    </Text>
                  ) : null}
                </View>
              </View>

              {/* Info */}
              <Card padding="xl" radius="lg" style={s.block} contentStyle={s.infoContent}>
                <Text variant="subtitle">¿Cómo obtener el certificado?</Text>
                {CERTIFICATE_STEPS.map((step, i) => (
                  <View key={i} style={s.step}>
                    <View style={[s.stepNum, { backgroundColor: tc.accent }]}>
                      <Text variant="caption" weight="700" color={TOKENS.color.signal}>{i + 1}</Text>
                    </View>
                    <Text variant="bodySmall" color={tc.textSub} style={s.stepText}>{step}</Text>
                  </View>
                ))}
              </Card>

              {/* Formatos */}
              <View style={s.formatsRow}>
                {['PDF', 'JPG', 'PNG'].map(fmt => (
                  <Badge key={fmt} label={fmt} icon="document-outline" size="sm" />
                ))}
                <Text variant="caption" color={tc.textSub}>Tamaño máximo: 10 MB</Text>
              </View>

              {/* Botón */}
              {canUpload && (
                <Button
                  label={status === 'REJECTED' ? 'Subir nuevo documento' : 'Subir certificado'}
                  size="lg"
                  fullWidth
                  loading={uploading}
                  icon={<Ionicons name="cloud-upload-outline" size={20} color={TOKENS.color.onPrimary} />}
                  onPress={showPickerOptions}
                />
              )}

              {status === 'UNDER_REVIEW' && (
                <NoticeBanner variant="pending" style={s.reviewNote}>
                  El equipo de Bosko revisará tu documento en un plazo de 1-3 días hábiles.
                </NoticeBanner>
              )}
            </>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1 },
  header:       { paddingHorizontal: 16, paddingVertical: 12 },
  scroll:       { paddingHorizontal: 16, paddingTop: 4 },
  loader:       { marginTop: 40 },

  hero:         { borderRadius: 20, padding: 24, marginBottom: 16, gap: 10 },
  heroIconWrap: { width: 56, height: 56, borderRadius: 16, backgroundColor: TOKENS.onMedia.fill, alignItems: 'center', justifyContent: 'center' },

  statusCard:   { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderRadius: 16, padding: 16, marginBottom: 16 },
  statusBody:   { flex: 1, gap: 2 },

  block:        { marginBottom: 14 },
  infoContent:  { gap: 12 },
  step:         { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  stepNum:      { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  stepText:     { flex: 1 },

  formatsRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' },

  reviewNote:   { marginTop: 16 },
});
