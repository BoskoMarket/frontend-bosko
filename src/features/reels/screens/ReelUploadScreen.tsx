import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Button, useThemeColors, ScreenHeader } from '@/core/design-system';
import { useRequireProviderStatus } from '@/hooks/useRequireProviderStatus';
import { createReel } from '../services/reels.service';
import { getUserErrorMessage } from '@/lib/errors';
import { safeBack } from '@/core/navigation/safeBack';

export default function ReelUploadScreen() {
  useRequireProviderStatus('provider');
  const tc = useThemeColors();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [videoUrl, setVideoUrl] = useState('');
  const [description, setDescription] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [saving, setSaving] = useState(false);
  const publish = async () => {
    const url = videoUrl.trim();
    if (!/^https:\/\/[^\s]+$/.test(url)) { Alert.alert('Video', 'Ingresá un enlace HTTPS público al archivo de video.'); return; }
    const tags = [...new Set(tagsText.split(',').map(tag => tag.trim().replace(/^#/, '')).filter(Boolean))];
    if (tags.length > 8) { Alert.alert('Etiquetas', 'Agregá hasta 8 etiquetas.'); return; }
    setSaving(true);
    try {
      await createReel({ videoUrl: url, description: description.trim(), tags });
      await qc.invalidateQueries({ queryKey: ['reels'] });
      safeBack(router, '/(tabs)/reels');
    } catch (error) { Alert.alert('No se pudo publicar', getUserErrorMessage(error)); }
    finally { setSaving(false); }
  };
  return (
    <KeyboardAvoidingView style={[styles.root, { backgroundColor: tc.bg, paddingTop: insets.top }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]} keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, { color: tc.text }]}>Publicar un reel</Text>
        <Text style={{ color: tc.textSub }}>Publicá un video que ya tengas alojado. La carga desde la galería todavía no está disponible.</Text>
        <Text style={{ color: tc.text }}>Enlace directo al video</Text>
        <TextInput accessibilityLabel="Enlace del video" placeholder="https://…/video.mp4" placeholderTextColor={tc.textSub} autoCapitalize="none" autoCorrect={false} keyboardType="url" value={videoUrl} onChangeText={setVideoUrl} style={[styles.input, { color: tc.text, borderColor: tc.border }]} />
        <Text style={{ color: tc.text }}>Descripción</Text>
        <TextInput accessibilityLabel="Descripción" value={description} onChangeText={setDescription} multiline maxLength={2000} style={[styles.input, { color: tc.text, borderColor: tc.border, minHeight: 100 }]} />
        <Text style={{ color: tc.text }}>Etiquetas separadas por comas</Text>
        <TextInput accessibilityLabel="Etiquetas" value={tagsText} onChangeText={setTagsText} style={[styles.input, { color: tc.text, borderColor: tc.border }]} />
        <Button label={saving ? 'Publicando…' : 'Publicar reel'} disabled={saving || !videoUrl.trim()} onPress={publish} />
        <Button label="Volver" variant="ghost" onPress={() => safeBack(router, '/(tabs)/reels')} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({ root: { flex: 1 }, content: { padding: 24, gap: 16 }, title: { fontSize: 24, fontWeight: '700' }, input: { borderWidth: 1, borderRadius: 12, padding: 14 } });
