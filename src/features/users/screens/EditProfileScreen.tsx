/**
 * EditProfileScreen — Editar perfil con avatar y portada.
 * PATCH /users/me + POST /users/me/avatar + POST/DELETE /users/me/banner (propuesto, BR01)
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { MotiView } from '@/core/components/MotiView';
import { router } from 'expo-router';
import { safeBack } from '@/core/navigation/safeBack';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useUploadAvatar, useUploadBanner, useRemoveBanner } from '@/hooks/queries/useProfileQuery';
import { getBannerErrorMessage } from '@/features/profile/utils/bannerErrors';
import { useProfile } from '@/features/profile/state/ProfileContext';
import {
  TOKENS,
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  GRADIENTS,
  Input,
  ScreenHeader,
  Text,
  toast,
  useThemeColors,
  dialog,
} from '@/core/design-system';
import { getUserErrorMessage } from '@/lib/errors';
import { AnimatedBackground } from '@/components/AnimatedBackground';

const AVATAR_SIZE = 104;
const BIO_MAX = 500;

export default function EditProfileScreen() {
  const tc = useThemeColors();
  const { profile, updateProfile, refreshProfile, isLoading, error: profileError } = useProfile();

  const [firstName, setFirstName] = useState(profile?.firstName || '');
  const [lastName, setLastName] = useState(profile?.lastName || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const { mutateAsync: uploadAvatar } = useUploadAvatar();
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const { mutateAsync: uploadBanner } = useUploadBanner();
  const { mutateAsync: removeBanner } = useRemoveBanner();
  const [bannerUri, setBannerUri] = useState<string | null>(null);
  const [updatingBanner, setUpdatingBanner] = useState(false);
  const [saving, setSaving] = useState(false);
  const seeded = useRef(!!profile);

  // The profile can arrive after the screen mounts (cold start / refetch): seed the form once.
  useEffect(() => {
    if (profile && !seeded.current) {
      seeded.current = true;
      setFirstName(profile.firstName || '');
      setLastName(profile.lastName || '');
      setPhone(profile.phone || '');
      setBio(profile.bio || '');
    }
  }, [profile]);

  const ensureGalleryPermission = useCallback(async (purpose: string) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status === 'granted') return true;
    dialog.fromAlert('Permiso requerido', `Necesitamos acceso a tu galería para cambiar ${purpose}.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Abrir ajustes', onPress: () => { Linking.openSettings(); } },
    ]);
    return false;
  }, []);

  const bannerBusy = useRef(false);

  const pickBanner = useCallback(async () => {
    if (bannerBusy.current) return;
    bannerBusy.current = true;
    try {
      if (!(await ensureGalleryPermission('la portada'))) return;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [3, 1],
        quality: 0.8,
      });
      if (result.canceled || !result.assets[0]) return;
      const uri = result.assets[0].uri;
      setBannerUri(uri);
      setUpdatingBanner(true);
      try {
        await uploadBanner(uri);
        toast.success('Portada actualizada');
      } catch (err) {
        toast.error('No se pudo actualizar la portada', getBannerErrorMessage(err));
      } finally {
        setBannerUri(null);
        setUpdatingBanner(false);
      }
    } finally {
      bannerBusy.current = false;
    }
  }, [ensureGalleryPermission, uploadBanner]);

  const confirmRemoveBanner = useCallback(() => {
    if (bannerBusy.current) return;
    dialog.fromAlert('Quitar portada', '¿Querés quitar tu portada? Se va a mostrar la imagen por defecto.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Quitar',
        style: 'destructive',
        onPress: async () => {
          if (bannerBusy.current) return;
          bannerBusy.current = true;
          setUpdatingBanner(true);
          try {
            await removeBanner();
            toast.success('Portada quitada');
          } catch (err) {
            toast.error('No se pudo quitar la portada', getBannerErrorMessage(err));
          } finally {
            setUpdatingBanner(false);
            bannerBusy.current = false;
          }
        },
      },
    ]);
  }, [removeBanner]);

  const pickImage = useCallback(async () => {
    if (!(await ensureGalleryPermission('el avatar'))) return;

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
        toast.success('Foto actualizada');
      } catch (err: any) {
        toast.error('No se pudo subir la foto', getUserErrorMessage(err));
        setAvatarUri(null);
      } finally {
        setUploadingAvatar(false);
      }
    }
  }, [uploadAvatar, ensureGalleryPermission]);

  const trimmedFirstName = firstName.trim();
  const firstNameError = firstName.length > 0 && !trimmedFirstName ? 'El nombre es obligatorio' : undefined;

  const hasChanges =
    firstName !== (profile?.firstName ?? '') ||
    lastName !== (profile?.lastName ?? '') ||
    bio !== (profile?.bio ?? '') ||
    phone !== (profile?.phone ?? '') ||
    coordinates !== null;

  const canSave = hasChanges && !!trimmedFirstName && !saving && !uploadingAvatar && !updatingBanner;

  const handleSave = useCallback(async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await updateProfile({ firstName: trimmedFirstName, lastName, bio, phone, ...(coordinates ?? {}) });
      toast.success('Perfil actualizado', 'Tus datos se guardaron correctamente.');
      safeBack(router, '/(tabs)/profile');
    } catch (err: any) {
      toast.error('No se pudo guardar', getUserErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }, [canSave, trimmedFirstName, lastName, bio, phone, coordinates, updateProfile]);

  const handleBack = useCallback(() => {
    if (!hasChanges || saving) {
      safeBack(router, '/(tabs)/profile');
      return;
    }
    dialog.fromAlert('Descartar cambios', 'Tenés cambios sin guardar. ¿Querés salir igual?', [
      { text: 'Seguir editando', style: 'cancel' },
      { text: 'Descartar', style: 'destructive', onPress: () => safeBack(router, '/(tabs)/profile') },
    ]);
  }, [hasChanges, saving]);

  const handleLocate = useCallback(async () => {
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') throw new Error('Permití el acceso a tu ubicación en los ajustes del dispositivo.');
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCoordinates({ lat: position.coords.latitude, lng: position.coords.longitude });
    } catch (err) {
      dialog.fromAlert('Ubicación', getUserErrorMessage(err));
    } finally {
      setLocating(false);
    }
  }, []);

  const displayUri = avatarUri || profile?.avatarUrl;
  const bannerDisplayUri = bannerUri || profile?.bannerUrl;

  // First load in flight with no cached profile / load failed: nothing to edit yet.
  if (!profile) {
    return (
      <View style={[styles.bg, { backgroundColor: tc.bg }]}>
        <AnimatedBackground variant="minimal" />
        <View style={styles.header}>
          <ScreenHeader title="Editar Perfil" onBack={() => safeBack(router, '/(tabs)/profile')} />
        </View>
        <View style={styles.centered}>
          {isLoading ? (
            <ActivityIndicator color={TOKENS.color.signal} />
          ) : (
            <EmptyState
              icon="cloud-offline-outline"
              title="No pudimos cargar tu perfil"
              subtitle={profileError ?? 'Revisá tu conexión e intentá de nuevo.'}
              cta={{ label: 'Reintentar', onPress: () => { refreshProfile(); } }}
            />
          )}
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={[styles.bg, { backgroundColor: tc.bg }]}
    >
      <AnimatedBackground variant="minimal" />

      <View style={styles.header}>
        <ScreenHeader title="Editar Perfil" onBack={handleBack} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Portada */}
        <View style={styles.bannerSection}>
          <Text variant="label">Portada</Text>
          <View style={[styles.bannerPreview, { backgroundColor: tc.surface2 }]}>
            {bannerDisplayUri ? (
              <Image
                source={{ uri: bannerDisplayUri }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                accessibilityLabel="Vista previa de la portada"
              />
            ) : (
              <LinearGradient
                colors={GRADIENTS.brandDeep}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
            )}
            {updatingBanner ? (
              <View style={[styles.bannerOverlay, { backgroundColor: TOKENS.scrim.medium }]}>
                <ActivityIndicator color={TOKENS.onMedia.icon} />
              </View>
            ) : null}
          </View>
          <View style={styles.bannerActions}>
            <Button
              label="Cambiar portada"
              variant="secondary"
              size="sm"
              loading={updatingBanner}
              disabled={updatingBanner}
              onPress={pickBanner}
              accessibilityLabel="Cambiar portada"
            />
            {profile?.bannerUrl ? (
              <Button
                label="Quitar"
                variant="ghost"
                size="sm"
                disabled={updatingBanner}
                onPress={confirmRemoveBanner}
                accessibilityLabel="Quitar portada"
              />
            ) : null}
          </View>
        </View>

        {/* Avatar */}
        <MotiView
          from={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 14 }}
          style={styles.avatarSection}
        >
          <Pressable
            onPress={pickImage}
            disabled={uploadingAvatar}
            accessibilityRole="button"
            accessibilityLabel="Cambiar foto de perfil"
          >
            <Avatar uri={displayUri} name={profile?.firstName} size={AVATAR_SIZE} />
            {uploadingAvatar ? (
              <View style={[styles.avatarOverlay, { backgroundColor: TOKENS.scrim.medium }]}>
                <ActivityIndicator color={TOKENS.onMedia.icon} />
              </View>
            ) : null}
            <View style={[styles.cameraBadge, { borderColor: tc.bg }]}>
              <MaterialIcons name="camera-alt" size={16} color={TOKENS.color.onPrimary} />
            </View>
          </Pressable>
          <Text variant="caption" color={tc.textSub}>Tocá para cambiar foto</Text>
        </MotiView>

        {/* Form */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 350, delay: 100 }}
        >
          <Card padding="xl" radius="lg" contentStyle={styles.formContent}>
            <Input
              label="Nombre"
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Tu nombre"
              error={firstNameError}
              autoCapitalize="words"
            />

            <Input
              label="Apellido"
              value={lastName}
              onChangeText={setLastName}
              placeholder="Tu apellido"
              autoCapitalize="words"
            />

            {/* Teléfono */}
            <View style={styles.fieldGroup}>
              <View style={styles.phoneHeader}>
                <Text variant="label">Teléfono</Text>
                {profile?.isPhoneVerified ? (
                  <Badge label="Verificado" tone="done" icon="checkmark-circle" size="sm" />
                ) : (
                  <Button
                    label="Verificar"
                    variant="ghost"
                    size="sm"
                    iconPosition="right"
                    icon={<MaterialIcons name="arrow-forward" size={14} color={TOKENS.color.signal} />}
                    onPress={() => router.push('/(tabs)/profile/verify-phone')}
                  />
                )}
              </View>
              <Input
                value={phone}
                onChangeText={setPhone}
                placeholder="+54 11 1234 5678"
                keyboardType="phone-pad"
                accessibilityLabel="Teléfono"
              />
            </View>

            {/* Ubicación */}
            <View style={styles.fieldGroup}>
              <Text variant="label">Ubicación</Text>
              <Text variant="bodySmall" color={tc.textSub}>
                {coordinates ? 'Ubicación seleccionada. Guardá el perfil para confirmarla.' : profile?.location || 'Usá tu ubicación actual para ubicar tu perfil.'}
              </Text>
              <Button
                label={locating ? 'Buscando ubicación…' : 'Usar mi ubicación actual'}
                variant="secondary"
                loading={locating}
                onPress={handleLocate}
              />
            </View>

            {/* Bio */}
            <View style={styles.fieldGroup}>
              <Input
                label="Bio"
                value={bio}
                onChangeText={setBio}
                placeholder="Contanos sobre vos..."
                multiline
                maxLength={BIO_MAX}
                textAlignVertical="top"
              />
              <Text variant="caption" color={tc.textMuted} style={styles.charCount}>{bio.length}/{BIO_MAX}</Text>
            </View>
          </Card>
        </MotiView>

        {/* Save */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 350, delay: 200 }}
        >
          <Button
            label="Guardar Cambios"
            icon={<MaterialIcons name="check" size={20} color={TOKENS.color.onPrimary} />}
            onPress={handleSave}
            disabled={!canSave}
            loading={saving}
            fullWidth
          />
        </MotiView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 16 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 24,
  },
  bannerSection: { gap: 8 },
  bannerPreview: {
    width: '100%',
    aspectRatio: 3,
    borderRadius: TOKENS.radius.md,
    overflow: 'hidden',
  },
  bannerOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  bannerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatarSection: { alignItems: 'center', gap: 8 },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: TOKENS.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
  formContent: { gap: 18 },
  fieldGroup: { gap: 6 },
  phoneHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  charCount: { alignSelf: 'flex-end' },
});
