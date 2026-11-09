import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheet, Button, Input, SPACING, Text, TOKENS, useThemeColors } from '@/core/design-system';
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
  const [description, setDescription] = useState(initialDescription ?? '');
  const busy = submitting || deleting;

  // Keep the last image while the sheet slides out (the parent clears it as soon as it closes).
  const lastImage = useRef<string | null>(imageUri);
  if (imageUri) lastImage.current = imageUri;
  const shownImage = imageUri ?? lastImage.current;

  useEffect(() => {
    if (visible) setDescription(initialDescription ?? '');
  }, [visible, initialDescription]);

  return (
    <BottomSheet visible={visible} onClose={onClose} dismissible={!busy}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>
        <Text variant="subtitle">{mode === 'create' ? 'Subir foto' : 'Editar foto'}</Text>
        {serviceTitle ? (
          <Text variant="bodySmall" color={tc.textSub}>
            {serviceTitle}
          </Text>
        ) : null}

        {shownImage ? (
          <Image
            source={{ uri: shownImage }}
            style={[styles.preview, { backgroundColor: tc.surface2 }]}
            contentFit="cover"
            accessibilityLabel={mode === 'create' ? 'Vista previa de la foto a publicar' : 'Foto que estás editando'}
          />
        ) : null}

        <Input
          label="Descripción (opcional)"
          placeholder="Cuenta qué trabajo hiciste"
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
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: SPACING.md },
  preview: { width: '100%', aspectRatio: 4 / 3, borderRadius: TOKENS.radius.md },
  counter: { alignSelf: 'flex-end' },
  actions: { flexDirection: 'row', gap: SPACING.md, alignItems: 'center' },
  primary: { flex: 1 },
});
