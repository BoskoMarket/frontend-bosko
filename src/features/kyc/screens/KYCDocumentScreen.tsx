import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  Alert,
  Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { safeBack } from '@/core/navigation/safeBack';
import * as ImagePicker from 'expo-image-picker';
import { useKYC } from '../state/KYCContext';
import { DocumentType } from '../types/kyc.types';
import {
  TOKENS,
  Button,
  Card,
  Chip,
  NoticeBanner,
  ScreenHeader,
  Text,
  useThemeColors,
  withAlpha,
} from '@/core/design-system';
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
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  photo: DocumentPhoto | null;
  onPress: () => void;
  tc: ReturnType<typeof useThemeColors>;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        s.photoSlot,
        photo
          ? { borderColor: withAlpha(TOKENS.color.mint, 0.4), backgroundColor: withAlpha(TOKENS.color.mint, 0.05) }
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
          <Text variant="label" center>{label}</Text>
          <Text variant="caption" color={tc.textSub} center>{hint}</Text>
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
        <ScreenHeader title="Subir documentos" onBack={() => safeBack(router, '/(tabs)/profile/kyc')} />

        {/* Document type */}
        <FadeSlide delay={0}>
          <Card padding="xl" radius="lg" contentStyle={s.cardContent}>
            <Text variant="subtitle">Tipo de documento</Text>
            <View style={s.docTypeGrid}>
              {DOCUMENT_TYPES.map(dt => (
                <Chip
                  key={dt.value}
                  label={dt.label}
                  selected={docType === dt.value}
                  onPress={() => setDocType(dt.value)}
                />
              ))}
            </View>
          </Card>
        </FadeSlide>

        {/* Document photos */}
        <FadeSlide delay={100}>
          <Card padding="xl" radius="lg" contentStyle={s.cardContent}>
            <Text variant="subtitle">Fotos del documento</Text>
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
          </Card>
        </FadeSlide>

        {/* Selfie */}
        <FadeSlide delay={200}>
          <Card padding="xl" radius="lg" contentStyle={s.cardContent}>
            <Text variant="subtitle">Selfie de verificación</Text>
            <Text variant="bodySmall" color={tc.textSub} style={s.cardSubtitle}>
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
          </Card>
        </FadeSlide>

        {!!error && <NoticeBanner variant="error">{error}</NoticeBanner>}

        {/* Submit button */}
        <FadeSlide delay={300}>
          <Button
            label={canSubmit
              ? 'Enviar documentos'
              : `Faltan ${[!front, !back, !selfie].filter(Boolean).length} foto(s)`
            }
            size="lg"
            fullWidth
            iconPosition="right"
            icon={canSubmit ? <MaterialIcons name="upload" size={18} color={TOKENS.color.onPrimary} /> : undefined}
            loading={loading}
            disabled={!canSubmit}
            onPress={handleSubmit}
          />
        </FadeSlide>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  background: { flex: 1 },
  container: { paddingTop: 60, paddingBottom: 40, paddingHorizontal: 24, gap: 16 },
  cardContent: { gap: 12 },
  cardSubtitle: { marginTop: -8 },
  docTypeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photosRow: { flexDirection: 'row', gap: 12 },
  photoSlot: {
    flex: 1,
    height: 130,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  photoSlotPressed: { opacity: 0.8 },
  photoPreview: { width: '100%', height: '100%', resizeMode: 'cover' },
  photoCheck: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    borderRadius: 14,
  },
  photoEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, padding: 8 },
});
