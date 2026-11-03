import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Input, SPACING, Text, TOKENS, useThemeColors } from '@/core/design-system';
import { WORK_DESCRIPTION_MAX } from '../constants';

export interface WorkFormSheetProps {
  visible: boolean;
  /** `create` publishes a new photo; `edit` changes the description of an existing one. */
  mode: 'create' | 'edit';
  imageUri: string | null;
  serviceTitle?: string;
  initialDescription?: string | null;
  submitting: boolean;
  deleting?: boolean;
  onSubmit: (description: string) => void;
  onDelete?: () => void;
  onClose: () => void;
}

/** Bottom sheet to publish a photo or edit its description (and delete it). */
export function WorkFormSheet({
  visible,
  mode,
  imageUri,
  serviceTitle,
  initialDescription,
  submitting,
  deleting = false,
  onSubmit,
  onDelete,
  onClose,
}: WorkFormSheetProps) {
  const tc = useThemeColors();
  const insets = useSafeAreaInsets();
  const [description, setDescription] = useState(initialDescription ?? '');
  const busy = submitting || deleting;

  useEffect(() => {
    if (visible) setDescription(initialDescription ?? '');
  }, [visible, initialDescription]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior="padding" style={styles.flex}>
        <Pressable
          style={[StyleSheet.absoluteFill, { backgroundColor: TOKENS.scrim.medium }]}
          onPress={busy ? undefined : onClose}
          accessibilityLabel="Cerrar"
        />
        <View
          style={[
            styles.sheet,
            { backgroundColor: tc.surface, borderColor: tc.border, paddingBottom: insets.bottom + SPACING.xl },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: tc.border }]} />
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>
            <Text variant="subtitle">{mode === 'create' ? 'Subir foto' : 'Editar foto'}</Text>
            {serviceTitle ? (
              <Text variant="bodySmall" color={tc.textSub}>
                {serviceTitle}
              </Text>
            ) : null}

            {imageUri ? (
              <Image source={{ uri: imageUri }} style={[styles.preview, { backgroundColor: tc.surface2 }]} contentFit="cover" />
            ) : null}

            <Input
              label="Descripción (opcional)"
              placeholder="Contá qué trabajo hiciste"
              value={description}
              onChangeText={setDescription}
              multiline
              maxLength={WORK_DESCRIPTION_MAX}
              textAlignVertical="top"
              editable={!busy}
            />
            <Text variant="caption" color={tc.textMuted} style={styles.counter}>
              {description.length}/{WORK_DESCRIPTION_MAX}
            </Text>

            <View style={styles.actions}>
              {mode === 'edit' && onDelete ? (
                <Button
                  variant="dangerOutline"
                  label="Eliminar"
                  icon={<Ionicons name="trash-outline" size={16} color={TOKENS.color.error} />}
                  loading={deleting}
                  disabled={busy}
                  onPress={onDelete}
                />
              ) : null}
              <Button
                label={mode === 'create' ? 'Publicar' : 'Guardar cambios'}
                loading={submitting}
                disabled={busy}
                onPress={() => onSubmit(description)}
                style={styles.primary}
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    maxHeight: '90%',
    borderTopLeftRadius: TOKENS.radius.xl,
    borderTopRightRadius: TOKENS.radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    paddingTop: SPACING.sm,
    paddingHorizontal: SPACING.xl,
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, marginBottom: SPACING.md },
  body: { gap: SPACING.md },
  preview: { width: '100%', aspectRatio: 4 / 3, borderRadius: TOKENS.radius.md },
  counter: { alignSelf: 'flex-end' },
  actions: { flexDirection: 'row', gap: SPACING.md, alignItems: 'center' },
  primary: { flex: 1 },
});
