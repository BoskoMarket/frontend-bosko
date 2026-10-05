import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { safeBack } from '@/core/navigation/safeBack';
import * as ImagePicker from 'expo-image-picker';
import { useKYC } from '../state/KYCContext';
import { DocumentType } from '../types/kyc.types';
import { TOKENS, GRADIENTS, useThemeColors } from '@/core/design-system';
import { AnimatedBackground } from '@/components/AnimatedBackground';

const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'DNI', label: 'DNI (Argentina)' },
  { value: 'CEDULA', label: 'Cédula' },
  { value: 'PASAPORTE', label: 'Pasaporte' },
  { value: 'RUT', label: 'RUT (Chile/Uruguay)' },
];

interface DocumentPhoto {
  uri: string;
}

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

function PhotoSlot({
  label, hint, icon, photo, onPress, tc,
}: {
  label: string;
  hint: string;
  icon: any;
  photo: DocumentPhoto | null;
  onPress: () => void;
  tc: ReturnType<typeof useThemeColors>;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        s.photoSlot,
        photo
          ? { borderColor: 'rgba(0,229,160,0.4)', backgroundColor: 'rgba(0,229,160,0.05)' }
          : { borderColor: tc.border, backgroundColor: tc.surface2 },
        pressed && s.photoSlotPressed,
      ]}
      onPress={onPress}
    >
      {photo ? (
        <>
          <Image source={{ uri: photo.uri }} style={s.photoPreview} />
          <View style={[s.photoCheck, { backgroundColor: tc.surface }]}>
            <MaterialIcons name="check-circle" size={28} color={TOKENS.status.done.fg} />
          </View>
        </>
      ) : (
        <View style={s.photoEmpty}>
          <MaterialIcons name={icon} size={32} color={tc.textMuted} />
          <Text style={[s.photoLabel, { color: tc.text }]}>{label}</Text>
          <Text style={[s.photoHint, { color: tc.textSub }]}>{hint}</Text>
        </View>
      )}
    </Pressable>
  );
}

export default function KYCDocumentScreen() {
  const tc = useThemeColors();
  const { submit, loading, error, clearError } = useKYC();
  const [docType, setDocType] = useState<DocumentType>('DNI');
  const [front, setFront] = useState<DocumentPhoto | null>(null);
  const [back, setBack] = useState<DocumentPhoto | null>(null);
  const [selfie, setSelfie] = useState<DocumentPhoto | null>(null);

  const pickImage = async (type: 'front' | 'back' | 'selfie') => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para continuar.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: type === 'selfie' ? [1, 1] : [4, 3],
    });
    if (!result.canceled && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      if (type === 'front') setFront({ uri });
      if (type === 'back') setBack({ uri });
      if (type === 'selfie') setSelfie({ uri });
    }
  };

  const canSubmit = front && back && selfie;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    clearError();
    try {
      await submit({
        documentType: docType,
        documentFront: front.uri,
        documentBack: back.uri,
        selfie: selfie.uri,
      });
      router.replace('/(tabs)/profile/kyc');
    } catch {
      // Error ya está en el contexto
    }
  };

  return (
    <View style={[s.background, { backgroundColor: tc.bg }]}>
      <AnimatedBackground variant="minimal" />
      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.header}>
          <Pressable onPress={() => safeBack(router, '/(tabs)/profile/kyc')} hitSlop={12} style={[s.backButton, { backgroundColor: tc.surface }]}>
            <MaterialIcons name="arrow-back" size={24} color={tc.text} />
          </Pressable>
          <Text style={[s.headerTitle, { color: tc.text }]}>Subir documentos</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Document type */}
        <FadeSlide delay={0}>
          <View style={[s.card, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
            <Text style={[s.cardTitle, { color: tc.text }]}>Tipo de documento</Text>
            <View style={s.docTypeGrid}>
              {DOCUMENT_TYPES.map(dt => (
                <Pressable
                  key={dt.value}
                  style={[
                    s.docTypeButton,
                    { borderColor: tc.border, backgroundColor: tc.surface2 },
                    docType === dt.value && [s.docTypeButtonActive, { backgroundColor: tc.accent }],
                  ]}
                  onPress={() => setDocType(dt.value)}
                >
                  <Text style={[s.docTypeText, { color: tc.textSub }, docType === dt.value && s.docTypeTextActive]}>
                    {dt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </FadeSlide>

        {/* Document photos */}
        <FadeSlide delay={100}>
          <View style={[s.card, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
            <Text style={[s.cardTitle, { color: tc.text }]}>Fotos del documento</Text>
            <View style={s.photosRow}>
              <PhotoSlot
                label="Frente"
                hint="Lado con tu foto"
                icon="credit-card"
                photo={front}
                onPress={() => pickImage('front')}
                tc={tc}
              />
              <PhotoSlot
                label="Dorso"
                hint="Lado trasero"
                icon="flip"
                photo={back}
                onPress={() => pickImage('back')}
                tc={tc}
              />
            </View>
          </View>
        </FadeSlide>

        {/* Selfie */}
        <FadeSlide delay={200}>
          <View style={[s.card, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}>
            <Text style={[s.cardTitle, { color: tc.text }]}>Selfie de verificación</Text>
            <Text style={[s.cardSubtitle, { color: tc.textSub }]}>
              Sacate una foto sosteniendo el documento junto a tu rostro.
            </Text>
            <PhotoSlot
              label="Selfie con documento"
              hint="Tocá para elegir"
              icon="face"
              photo={selfie}
              onPress={() => pickImage('selfie')}
              tc={tc}
            />
          </View>
        </FadeSlide>

        {!!error && (
          <View style={[s.errorBanner, { backgroundColor: TOKENS.status.cancelled.bg }]}>
            <MaterialIcons name="error-outline" size={16} color={TOKENS.status.cancelled.fg} />
            <Text style={[s.errorText, { color: TOKENS.status.cancelled.fg }]}>{error}</Text>
          </View>
        )}

        {/* Submit button */}
        <FadeSlide delay={300}>
          <View style={[s.submitButtonShadow, !canSubmit && s.submitButtonShadowDisabled]}>
            <Pressable
              onPress={handleSubmit}
              disabled={!canSubmit || loading}
              style={({ pressed }) => [
                s.submitButton,
                pressed && canSubmit && s.buttonPressed,
              ]}
            >
            <LinearGradient
              colors={canSubmit
                ? GRADIENTS.brand
                : [tc.surface2, tc.border] as const
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.buttonGradient}
            >
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : (
                  <>
                    <Text style={s.submitButtonText}>
                      {canSubmit
                        ? 'Enviar documentos'
                        : `Faltan ${[!front, !back, !selfie].filter(Boolean).length} foto(s)`
                      }
                    </Text>
                    {canSubmit && <MaterialIcons name="upload" size={18} color="#fff" />}
                  </>
                )
              }
            </LinearGradient>
          </Pressable>
          </View>
        </FadeSlide>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  background: { flex: 1 },
  container: { paddingTop: 60, paddingBottom: 40, paddingHorizontal: 24, gap: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: TOKENS.color.text },
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
  cardTitle: { fontSize: 16, fontWeight: '700', color: TOKENS.color.text },
  cardSubtitle: { fontSize: 13, color: TOKENS.color.sub, marginTop: -8 },
  docTypeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  docTypeButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(200,200,220,0.5)',
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  docTypeButtonActive: {
    borderColor: TOKENS.color.signal,
  },
  docTypeText: { fontSize: 13, fontWeight: '500', color: TOKENS.color.sub },
  docTypeTextActive: { color: TOKENS.color.signal, fontWeight: '700' },
  photosRow: { flexDirection: 'row', gap: 12 },
  photoSlot: {
    flex: 1,
    height: 130,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(133,0,33,0.25)',
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  photoSlotPressed: { opacity: 0.8 },
  photoPreview: { width: '100%', height: '100%', resizeMode: 'cover' },
  photoCheck: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: '#fff',
    borderRadius: 14,
  },
  photoEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, padding: 8 },
  photoLabel: { fontSize: 13, fontWeight: '700', color: TOKENS.color.text, textAlign: 'center' },
  photoHint: { fontSize: 11, color: TOKENS.color.sub, textAlign: 'center' },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    padding: 12,
  },
  errorText: { flex: 1, fontSize: 13, color: '#dc2626' },
  submitButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  submitButtonShadow: {
    borderRadius: 14,
    ...TOKENS.shadow.glow,
  },
  submitButtonShadowDisabled: { shadowOpacity: 0, elevation: 0 },
  buttonPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  buttonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
