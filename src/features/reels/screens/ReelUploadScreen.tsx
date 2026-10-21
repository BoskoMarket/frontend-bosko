import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Button, Input, NoticeBanner, ProgressBar, SPACING, Text, TOKENS, toast, useThemeColors, dialog } from '@/core/design-system';
import { useRequireProviderStatus } from '@/hooks/useRequireProviderStatus';
import {
  classifyReelUploadError,
  createReel,
  REEL_UPLOAD_ERROR_MESSAGES,
  uploadReelVideo,
  type ReelThumbnailFile,
} from '../services/reels.service';
import { REEL_MAX_SECONDS, resolveFileSize, validateReelVideo, type ReelVideoAsset } from '../constants/reelUploadRules';
import { IMAGE_UPLOAD_MAX_BYTES, resolveImageMime } from '@/core/media/imageMime';
import { ReelVideoPreview } from '../components/ReelVideoPreview';
import { getUserErrorMessage } from '@/lib/errors';
import { alertPermissionDenied } from '@/lib/permissionAlert';
import { safeBack } from '@/core/navigation/safeBack';
import { MY_REELS_ROUTE } from '@/features/reels/routes';

export default function ReelUploadScreen() {
  useRequireProviderStatus('provider');
  const tc = useThemeColors();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [video, setVideo] = useState<ReelVideoAsset | null>(null);
  const [thumbnail, setThumbnail] = useState<ReelThumbnailFile | null>(null);
  const [useLink, setUseLink] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [description, setDescription] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [publicationUncertain, setPublicationUncertain] = useState(false);
  const busyRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const uploadedRef = useRef<{ videoUri: string; thumbnailUri?: string; videoUrl: string } | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const handlePicked = useCallback((result: ImagePicker.ImagePickerResult) => {
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const candidate: ReelVideoAsset = {
      uri: asset.uri,
      duration: asset.duration,
      fileSize: resolveFileSize({ uri: asset.uri, fileSize: asset.fileSize }),
      mimeType: asset.mimeType,
    };
    const problem = validateReelVideo(candidate);
    if (problem) { toast.warning('Video no válido', problem); return; }
    setError(null);
    setPublicationUncertain(false);
    setVideo(candidate);
    setThumbnail(null);
    uploadedRef.current = null;
  }, []);

  // Editing the form is a deliberate user change: it lifts the uncertain-publication lock.
  const clearUncertain = () => {
    if (publicationUncertain) { setPublicationUncertain(false); setError(null); }
  };

  const retryAfterUncertain = () => {
    dialog.fromAlert('Reintentar publicación', 'Si el reel ya se publicó, se va a duplicar. Revisá "Mis reels" antes de continuar.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Reintentar', onPress: () => { setPublicationUncertain(false); setError(null); } },
    ]);
  };

  const pickThumbnail = async () => {
    if (saving || !video) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { alertPermissionDenied('Necesitamos acceso a tu galería para elegir una miniatura.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      // iOS: ask for a JPEG-compatible representation instead of HEIC.
      preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode?.Compatible,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const mimeType = resolveImageMime(asset);
    if (mimeType !== 'image/jpeg' && mimeType !== 'image/png') {
      toast.warning('Miniatura no válida', 'Elegí una foto JPG o PNG.');
      return;
    }
    const fileSize = resolveFileSize({ uri: asset.uri, fileSize: asset.fileSize });
    if (fileSize != null && fileSize > IMAGE_UPLOAD_MAX_BYTES) {
      toast.warning('Miniatura demasiado grande', 'El máximo es 5 MB.');
      return;
    }
    setThumbnail({ uri: asset.uri, mimeType });
    uploadedRef.current = null;
  };

  const pickFromGallery = async () => {
    if (saving) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { alertPermissionDenied('Necesitamos acceso a tu galería para elegir un video.'); return; }
    handlePicked(await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['videos'], videoMaxDuration: REEL_MAX_SECONDS }));
  };

  const recordVideo = async () => {
    if (saving) return;
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { alertPermissionDenied('Necesitamos acceso a tu cámara para grabar un video.'); return; }
    handlePicked(await ImagePicker.launchCameraAsync({ mediaTypes: ['videos'], videoMaxDuration: REEL_MAX_SECONDS }));
  };

  const cancelUpload = () => abortRef.current?.abort();

  const publish = async () => {
    if (busyRef.current || publicationUncertain) return;
    const link = videoUrl.trim();
    if (useLink && !/^https:\/\/[^\s]+$/.test(link)) { dialog.fromAlert('Video', 'Ingresá un enlace HTTPS público al archivo de video.'); return; }
    if (!useLink && !video) { dialog.fromAlert('Video', 'Elegí o grabá un video para publicar.'); return; }
    const tags = [...new Set(tagsText.split(',').map(tag => tag.trim().replace(/^#/, '')).filter(Boolean))];
    if (tags.length > 8) { dialog.fromAlert('Etiquetas', 'Agregá hasta 8 etiquetas.'); return; }
    busyRef.current = true;
    setSaving(true);
    setProgress(0);
    setError(null);
    const controller = new AbortController();
    abortRef.current = controller;
    let publishing = false;
    try {
      let finalUrl = link;
      if (!useLink && video) {
        const cached = uploadedRef.current;
        if (cached?.videoUri === video.uri && cached.thumbnailUri === thumbnail?.uri) {
          finalUrl = cached.videoUrl;
          setProgress(1);
        } else {
          setUploading(true);
          const uploaded = await uploadReelVideo(video, { thumbnail: thumbnail ?? undefined, onProgress: setProgress, signal: controller.signal });
          setUploading(false);
          finalUrl = uploaded.videoUrl;
          // Keep a finished upload even if the user cancelled meanwhile (orphans are never purged server-side).
          uploadedRef.current = { videoUri: video.uri, thumbnailUri: thumbnail?.uri, videoUrl: finalUrl };
          if (controller.signal.aborted) { toast.warning('Subida cancelada'); return; }
        }
      }
      publishing = true;
      await createReel({ videoUrl: finalUrl, description: description.trim(), tags });
      uploadedRef.current = null;
      publishing = false;
      void qc.invalidateQueries({ queryKey: ['reels'] });
      toast.success('Reel publicado');
      safeBack(router, '/(tabs)/reels');
    } catch (err) {
      if (publishing) {
        const kind = classifyReelUploadError(err);
        if (kind === 'invalidUpload') uploadedRef.current = null;
        const status = (err as { response?: { status?: number } } | null)?.response?.status;
        if (kind === 'network' || !status || status === 408 || status >= 500) {
          setPublicationUncertain(true);
          setError('No pudimos confirmar si el reel se publicó. Revisá Mis reels antes de intentar de nuevo.');
          return;
        }
        setError(kind === 'invalidUpload' || kind === 'providerRequired' || kind === 'busy'
          ? REEL_UPLOAD_ERROR_MESSAGES[kind]
          : getUserErrorMessage(err));
        return;
      }
      const kind = classifyReelUploadError(err);
      if (kind === 'cancelled') { toast.warning('Subida cancelada'); return; }
      if (kind === 'network') {
        setError(REEL_UPLOAD_ERROR_MESSAGES.network);
        dialog.fromAlert('Sin conexión', REEL_UPLOAD_ERROR_MESSAGES.network, [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Reintentar', onPress: () => { publish(); } },
        ]);
        return;
      }
      setError(kind === 'other' ? getUserErrorMessage(err) : REEL_UPLOAD_ERROR_MESSAGES[kind]);
    } finally {
      abortRef.current = null;
      setUploading(false);
      busyRef.current = false;
      setSaving(false);
    }
  };

  const percent = Math.round(progress * 100);
  const canPublish = !saving && !publicationUncertain && (useLink ? !!videoUrl.trim() : !!video);

  return (
    <KeyboardAvoidingView style={[styles.root, { backgroundColor: tc.bg, paddingTop: insets.top }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + SPACING.xxl }]} keyboardShouldPersistTaps="handled">
        <Text variant="h2">Publicar un reel</Text>

        {!useLink && (
          <>
            <Text color={tc.textSub}>Elegí un video de tu galería o grabá uno nuevo. Máximo {REEL_MAX_SECONDS} segundos y 100 MB.</Text>
            {video && <ReelVideoPreview uri={video.uri} />}
            {video && (
              <View style={styles.thumbnailRow}>
                {thumbnail ? <Image source={{ uri: thumbnail.uri }} style={styles.thumbnailPreview} contentFit="cover" accessibilityLabel="Vista previa de la miniatura" /> : null}
                <Button variant="outline" size="sm" label={thumbnail ? 'Cambiar miniatura' : 'Elegir miniatura (opcional)'} disabled={saving} onPress={pickThumbnail} />
                {thumbnail ? <Button variant="ghost" size="sm" label="Quitar miniatura" disabled={saving} onPress={() => setThumbnail(null)} /> : null}
              </View>
            )}
            <View style={styles.row}>
              <Button style={styles.flex} variant={video ? 'outline' : 'primary'} label="Elegir de la galería" icon={<Ionicons name="images-outline" size={18} color={tc.text} />} disabled={saving} onPress={pickFromGallery} />
              <Button style={styles.flex} variant="outline" label="Grabar video" icon={<Ionicons name="videocam-outline" size={18} color={tc.text} />} disabled={saving} onPress={recordVideo} />
            </View>
          </>
        )}

        {useLink && (
          <Input label="Enlace directo al video" accessibilityLabel="Enlace del video" placeholder="https://…/video.mp4" autoCapitalize="none" autoCorrect={false} keyboardType="url" value={videoUrl} onChangeText={(t) => { clearUncertain(); setVideoUrl(t); }} editable={!saving} />
        )}

        <Input label="Descripción" accessibilityLabel="Descripción" value={description} onChangeText={(t) => { clearUncertain(); setDescription(t); }} multiline maxLength={2000} editable={!saving} />
        <Input label="Etiquetas separadas por comas" accessibilityLabel="Etiquetas" value={tagsText} onChangeText={(t) => { clearUncertain(); setTagsText(t); }} editable={!saving} />

        {error && <NoticeBanner variant="error">{error}</NoticeBanner>}
        {publicationUncertain && (
          <View style={styles.row}>
            <Button style={styles.flex} label="Ver mis reels" variant="secondary" onPress={() => router.replace(MY_REELS_ROUTE)} />
            <Button style={styles.flex} label="Reintentar" variant="outline" onPress={retryAfterUncertain} />
          </View>
        )}

        {saving && !useLink && (
          <View style={styles.progress}>
            <ProgressBar value={progress} accessibilityLabel="Progreso de la subida" />
            <Text variant="caption" color={tc.textSub}>{!uploading ? 'Publicando…' : percent >= 100 ? 'Procesando…' : `Subiendo video… ${percent}%`}</Text>
            {uploading && <Button label="Cancelar subida" variant="outline" size="sm" onPress={cancelUpload} />}
          </View>
        )}

        <Button label={saving ? 'Publicando…' : 'Publicar reel'} loading={saving} disabled={!canPublish} onPress={publish} />
        <Button label={useLink ? 'Subir un video desde mi teléfono' : 'Usar un enlace a un video ya alojado'} variant="ghost" disabled={saving} onPress={() => { setUseLink(v => !v); setError(null); }} />
        <Button label="Volver" variant="ghost" disabled={saving} onPress={() => safeBack(router, '/(tabs)/reels')} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: SPACING.xxl, gap: SPACING.lg },
  row: { flexDirection: 'row', gap: SPACING.md },
  flex: { flex: 1 },
  progress: { gap: SPACING.sm },
  thumbnailRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flexWrap: 'wrap' },
  thumbnailPreview: { width: SPACING.giant, height: SPACING.giant, borderRadius: TOKENS.radius.sm },
});
