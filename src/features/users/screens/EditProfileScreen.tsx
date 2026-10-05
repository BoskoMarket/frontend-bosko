/**
 * EditProfileScreen — Editar perfil con avatar upload.
 * PATCH /users/me + POST /users/me/avatar
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from '@/core/components/BlurView';
import { MaterialIcons } from '@expo/vector-icons';
import { MotiView } from '@/core/components/MotiView';
import { router } from 'expo-router';
import { safeBack } from '@/core/navigation/safeBack';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useUploadAvatar } from '@/hooks/queries/useProfileQuery';
import { useProfile } from '@/features/profile/state/ProfileContext';

import { TOKENS } from '@/core/design-system/tokens';
import { Button, useThemeColors, useIsDark, wash } from '@/core/design-system';
import { getUserErrorMessage } from '@/lib/errors';
import { AnimatedBackground } from '@/components/AnimatedBackground';

export default function EditProfileScreen() {
  const tc = useThemeColors();
  const isDark = useIsDark();
  const { profile, updateProfile, isLoading } = useProfile();

  const [firstName, setFirstName] = useState(profile?.firstName || '');
  const [lastName, setLastName] = useState(profile?.lastName || '');
  const [username] = useState('');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const { mutateAsync: uploadAvatar } = useUploadAvatar();
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);

  const pickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para cambiar el avatar.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setAvatarUri(uri);

      setUploadingAvatar(true);
      try {
        await uploadAvatar(uri);
      } catch (err: any) {
        Alert.alert('Error', getUserErrorMessage(err));
        setAvatarUri(null);
      } finally {
        setUploadingAvatar(false);
      }
    }
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await updateProfile({ firstName, lastName, bio, phone, ...(coordinates ?? {}) });
      Alert.alert('Perfil actualizado', 'Tus datos se guardaron correctamente.', [
        { text: 'OK', onPress: () => safeBack(router, '/(tabs)/profile') },
      ]);
    } catch (err: any) {
      Alert.alert('Error', getUserErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }, [firstName, lastName, bio, phone, coordinates, updateProfile]);

  const hasChanges =
    firstName !== profile?.firstName ||
    lastName !== profile?.lastName ||
    bio !== profile?.bio ||
    phone !== (profile?.phone ?? '') || coordinates !== null;

  const displayUri = avatarUri || profile?.avatarUrl;

  return (
    <LinearGradient
      colors={wash(tc)}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.bg}
    >
      <AnimatedBackground variant="minimal" />

      {/* Header */}
      <BlurView intensity={25} tint={isDark ? 'dark' : 'light'} style={[styles.header, { borderBottomColor: tc.border }]}>
        <Pressable onPress={() => safeBack(router, '/(tabs)/profile')} hitSlop={12} style={[styles.backBtn, { backgroundColor: tc.surface }]}>
          <MaterialIcons name="arrow-back" size={24} color={tc.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: tc.text }]}>Editar Perfil</Text>
        <View style={{ width: 40 }} />
      </BlurView>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar */}
        <MotiView
          from={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 14 }}
          style={styles.avatarSection}
        >
          <Pressable onPress={pickImage} disabled={uploadingAvatar}>
            <LinearGradient
              colors={[TOKENS.color.primary, TOKENS.color.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarBorder}
            >
              <View style={[styles.avatarContainer, { backgroundColor: tc.surface2 }]}>
                {uploadingAvatar ? (
                  <ActivityIndicator color={TOKENS.color.primary} size="large" />
                ) : displayUri ? (
                  <Image source={{ uri: displayUri }} style={styles.avatarImage} />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: tc.surface2 }]}>
                    <Text style={styles.avatarInitial}>
                      {(profile?.firstName || 'U').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={[styles.cameraBadge, { borderColor: tc.bg }]}>
                  <MaterialIcons name="camera-alt" size={16} color="#fff" />
                </View>
              </View>
            </LinearGradient>
          </Pressable>
          <Text style={[styles.avatarHint, { color: tc.textSub }]}>Tocá para cambiar foto</Text>
        </MotiView>

        {/* Form */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 350, delay: 100 }}
          style={[styles.formCard, { borderColor: tc.cardBorder }]}
        >
          <BlurView intensity={25} tint={isDark ? 'dark' : 'light'} style={styles.formBlur}>
            {/* Nombre */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: tc.text }]}>Nombre</Text>
              <TextInput
                style={[styles.input, { backgroundColor: tc.surface, borderColor: tc.border, color: tc.text }]}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Tu nombre"
                placeholderTextColor={tc.textMuted}
              />
            </View>

            {/* Apellido */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: tc.text }]}>Apellido</Text>
              <TextInput
                style={[styles.input, { backgroundColor: tc.surface, borderColor: tc.border, color: tc.text }]}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Tu apellido"
                placeholderTextColor={tc.textMuted}
              />
            </View>

            {/* Username (solo lectura, se muestra) */}
            {username ? (
              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: tc.text }]}>Usuario</Text>
                <View style={[styles.readonlyField, { backgroundColor: tc.surface2, borderColor: tc.border }]}>
                  <Text style={[styles.readonlyText, { color: tc.textSub }]}>@{username}</Text>
                  <MaterialIcons name="lock" size={14} color={tc.textMuted} />
                </View>
              </View>
            ) : null}

            {/* Teléfono */}
            <View style={styles.fieldGroup}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={[styles.label, { color: tc.text }]}>Teléfono</Text>
                {profile?.isPhoneVerified ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <MaterialIcons name="verified" size={14} color="#16a34a" />
                    <Text style={{ fontSize: 12, color: '#16a34a', fontWeight: '600' }}>Verificado</Text>
                  </View>
                ) : (
                  <Pressable onPress={() => router.push('/(tabs)/profile/verify-phone')}>
                    <Text style={{ fontSize: 12, color: TOKENS.color.primary, fontWeight: '600' }}>Verificar →</Text>
                  </Pressable>
                )}
              </View>
              <TextInput
                style={[styles.input, { backgroundColor: tc.surface, borderColor: tc.border, color: tc.text }]}
                value={phone}
                onChangeText={setPhone}
                placeholder="+54 11 1234 5678"
                placeholderTextColor={tc.textMuted}
                keyboardType="phone-pad"
              />
            </View>

            {/* Ubicación */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: tc.text }]}>Ubicación</Text>
              <Text style={{ color: tc.textSub, marginBottom: 8 }}>
                {coordinates ? 'Ubicación seleccionada. Guardá el perfil para confirmarla.' : profile?.location || 'Usá tu ubicación actual para ubicar tu perfil.'}
              </Text>
              <Button label={locating ? 'Buscando ubicación…' : 'Usar mi ubicación actual'} disabled={locating} onPress={async () => {
                setLocating(true);
                try {
                  const permission = await Location.requestForegroundPermissionsAsync();
                  if (permission.status !== 'granted') throw new Error('Permití el acceso a tu ubicación en los ajustes del dispositivo.');
                  const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                  setCoordinates({ lat: position.coords.latitude, lng: position.coords.longitude });
                } catch (err) { Alert.alert('Ubicación', getUserErrorMessage(err)); }
                finally { setLocating(false); }
              }} />
            </View>

            {/* Bio */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: tc.text }]}>Bio</Text>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: tc.surface, borderColor: tc.border, color: tc.text }]}
                value={bio}
                onChangeText={setBio}
                placeholder="Contanos sobre vos..."
                placeholderTextColor={tc.textMuted}
                multiline
                maxLength={500}
                textAlignVertical="top"
              />
              <Text style={[styles.charCount, { color: tc.textMuted }]}>{bio.length}/500</Text>
            </View>
          </BlurView>
        </MotiView>

        {/* Save */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 350, delay: 200 }}
        >
          <Button
            label="Guardar Cambios"
            icon={<MaterialIcons name="check" size={20} color="#fff" />}
            onPress={handleSave}
            disabled={!hasChanges}
            loading={saving || isLoading}
            fullWidth
          />
        </MotiView>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 16,
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.6)',
  },
  backBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: TOKENS.color.text },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    gap: 24,
  },
  // Avatar
  avatarSection: { alignItems: 'center', gap: 8 },
  avatarBorder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarContainer: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  avatarImage: {
    width: 104,
    height: 104,
    borderRadius: 52,
  },
  avatarPlaceholder: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 36,
    fontWeight: '700',
    color: TOKENS.color.primary,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: TOKENS.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarHint: {
    fontSize: 12,
    color: 'rgba(107,107,107,0.6)',
    fontWeight: '500',
  },
  // Form
  formCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  formBlur: {
    padding: 20,
    gap: 18,
  },
  fieldGroup: { gap: 6 },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: TOKENS.color.text,
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: TOKENS.color.text,
    borderWidth: 1.5,
    borderColor: 'rgba(200,200,220,0.5)',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  charCount: {
    fontSize: 11,
    color: 'rgba(107,107,107,0.5)',
    alignSelf: 'flex-end',
  },
  readonlyField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(200,200,220,0.2)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(200,200,220,0.3)',
  },
  readonlyText: {
    fontSize: 15,
    color: 'rgba(107,107,107,0.6)',
  },
  // Save
});
