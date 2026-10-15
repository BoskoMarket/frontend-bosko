import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Button, Input, NoticeBanner, ProgressBar, SPACING, Text, toast, useThemeColors, dialog } from '@/core/design-system';
import { useRequireProviderStatus } from '@/hooks/useRequireProviderStatus';
import {
  classifyReelUploadError,
  createReel,
  REEL_UPLOAD_ERROR_MESSAGES,
  uploadReelVideo,
} from '../services/reels.service';
import { REEL_MAX_SECONDS, resolveFileSize, validateReelVideo, type ReelVideoAsset } from '../constants/reelUploadRules';
import { ReelVideoPreview } from '../components/ReelVideoPreview';
import { getUserErrorMessage } from '@/lib/errors';
import { alertPermissionDenied } from '@/lib/permissionAlert';
import { safeBack } from '@/core/navigation/safeBack';

export default function ReelUploadScreen() {
  useRequireProviderStatus('provider');
  const tc = useThemeColors();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [video, setVideo] = useState<ReelVideoAsset | null>(null);
  const [useLink, setUseLink] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [description, setDescription] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const busyRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

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
    setVideo(candidate);
  }, []);

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
    if (busyRef.current) return;
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
    try {
      let finalUrl = link;
      if (!useLink && video) {
        const uploaded = await uploadReelVideo(video, { onProgress: setProgress, signal: controller.signal });
        finalUrl = uploaded.videoUrl;
      }
      await createReel({ videoUrl: finalUrl, description: description.trim(), tags });
      await qc.invalidateQueries({ queryKey: ['reels'] });
      toast.success('Reel publicado');
      safeBack(router, '/(tabs)/reels');
    } catch (err) {
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
      busyRef.current = false;
      setSaving(false);
    }
  };

  const percent = Math.round(progress * 100);
  const canPublish = !saving && (useLink ? !!videoUrl.trim() : !!video);

  return (
    <KeyboardAvoidingView style={[styles.root, { backgroundColor: tc.bg, paddingTop: insets.top }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + SPACING.xxl }]} keyboardShouldPersistTaps="handled">
        <Text variant="h2">Publicar un reel</Text>

        {!useLink && (
          <>
            <Text color={tc.textSub}>Elegí un video de tu galería o grabá uno nuevo. Máximo {REEL_MAX_SECONDS} segundos y 100 MB.</Text>
            {video && <ReelVideoPreview uri={video.uri} />}
            <View style={styles.row}>
              <Button style={styles.flex} variant={video ? 'outline' : 'primary'} label="Elegir de la galería" icon={<Ionicons name="images-outline" size={18} color={tc.text} />} disabled={saving} onPress={pickFromGallery} />
              <Button style={styles.flex} variant="outline" label="Grabar video" icon={<Ionicons name="videocam-outline" size={18} color={tc.text} />} disabled={saving} onPress={recordVideo} />
            </View>
          </>
        )}

        {useLink && (
          <Input label="Enlace directo al video" accessibilityLabel="Enlace del video" placeholder="https://…/video.mp4" autoCapitalize="none" autoCorrect={false} keyboardType="url" value={videoUrl} onChangeText={setVideoUrl} editable={!saving} />
        )}

        <Input label="Descripción" accessibilityLabel="Descripción" value={description} onChangeText={setDescription} multiline maxLength={2000} editable={!saving} />
        <Input label="Etiquetas separadas por comas" accessibilityLabel="Etiquetas" value={tagsText} onChangeText={setTagsText} editable={!saving} />

        {error && <NoticeBanner variant="error">{error}</NoticeBanner>}

        {saving && !useLink && (
          <View style={styles.progress}>
            <ProgressBar value={progress} accessibilityLabel="Progreso de la subida" />
            <Text variant="caption" color={tc.textSub}>{percent >= 100 ? 'Procesando…' : `Subiendo video… ${percent}%`}</Text>
            <Button label="Cancelar subida" variant="outline" size="sm" onPress={cancelUpload} />
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
});
