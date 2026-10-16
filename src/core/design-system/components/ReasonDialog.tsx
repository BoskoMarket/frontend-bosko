import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, StyleSheet, View } from 'react-native';
import { TOKENS } from '../tokens';
import { SPACING } from '../spacing';
import { Button } from './Button';
import { Card } from './Card';
import { Input } from './Input';
import { Text } from './Text';

export interface ReasonDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  /** Label of the input (default: "Motivo"). */
  label?: string;
  placeholder?: string;
  confirmLabel: string;
  cancelLabel?: string;
  /** Destructive confirm button (default: true). */
  destructive?: boolean;
  /** While true the dialog cannot be dismissed and the confirm button shows a spinner. */
  submitting?: boolean;
  maxLength?: number;
  onCancel: () => void;
  /** Called with the trimmed, non-empty reason. */
  onConfirm: (reason: string) => void;
}

/**
 * ReasonDialog — cross-platform replacement for the iOS-only `Alert.prompt`.
 * Asks for a required free-text reason before a destructive action.
 */
export function ReasonDialog({
  visible,
  title,
  message,
  label = 'Motivo',
  placeholder,
  confirmLabel,
  cancelLabel = 'Cancelar',
  destructive = true,
  submitting = false,
  maxLength = 300,
  onCancel,
  onConfirm,
}: ReasonDialogProps) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (visible) setReason('');
  }, [visible]);

  const trimmed = reason.trim();
  const dismiss = () => {
    if (!submitting) onCancel();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={dismiss} statusBarTranslucent>
      <KeyboardAvoidingView behavior="padding" style={styles.root}>
        <Pressable
          style={[StyleSheet.absoluteFill, { backgroundColor: TOKENS.scrim.medium }]}
          onPress={dismiss}
          accessibilityLabel="Cerrar"
        />
        <Card padding="xl" radius="lg" elevated style={styles.card} contentStyle={styles.content}>
          <Text variant="subtitle">{title}</Text>
          {message ? <Text variant="bodySmall">{message}</Text> : null}
          <Input
            label={label}
            value={reason}
            onChangeText={setReason}
            placeholder={placeholder}
            multiline
            maxLength={maxLength}
            textAlignVertical="top"
            editable={!submitting}
            autoFocus
          />
          <View style={styles.actions}>
            <Button label={cancelLabel} variant="ghost" onPress={dismiss} disabled={submitting} style={styles.action} />
            <Button
              label={confirmLabel}
              variant={destructive ? 'danger' : 'primary'}
              onPress={() => onConfirm(trimmed)}
              disabled={!trimmed}
              loading={submitting}
              style={styles.action}
            />
          </View>
        </Card>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'center', paddingHorizontal: SPACING.xl },
  card: { width: '100%' },
  content: { gap: SPACING.md },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: SPACING.sm },
  action: { flex: 1 },
});
