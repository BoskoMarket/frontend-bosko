import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TOKENS } from '../tokens';
import { SPACING } from '../spacing';
import { Button } from './Button';
import { Input } from './Input';
import { Text } from './Text';
import { useThemeColors } from '@/stores/theme.store';

export interface ReportSheetReason {
  /** Stable machine code sent to the backend. */
  code: string;
  /** User-facing label. */
  label: string;
}

export interface ReportSheetSubmit {
  reason: string;
  /** Trimmed optional free text; required for "other". */
  details?: string;
}

export interface ReportSheetProps {
  visible: boolean;
  title: string;
  message?: string;
  reasons: ReadonlyArray<ReportSheetReason>;
  /** Code of the reason that requires free text (default: "other"). */
  otherCode?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  detailsLabel?: string;
  detailsPlaceholder?: string;
  maxDetailsLength?: number;
  /** While true the sheet cannot be dismissed, the options are locked and the confirm button shows a spinner. */
  submitting?: boolean;
  onCancel: () => void;
  onSubmit: (value: ReportSheetSubmit) => void;
}

/**
 * ReportSheet — generic bottom sheet to report content or users: single-select reason list,
 * required free text when the "other" reason is chosen. Knows nothing about the target; the
 * caller owns the request, the loading state and the feedback.
 */
export function ReportSheet({
  visible,
  title,
  message,
  reasons,
  otherCode = 'other',
  confirmLabel = 'Enviar reporte',
  cancelLabel = 'Cancelar',
  detailsLabel = 'Contanos qué pasó',
  detailsPlaceholder = 'Describí el problema',
  maxDetailsLength = 500,
  submitting = false,
  onCancel,
  onSubmit,
}: ReportSheetProps) {
  const tc = useThemeColors();
  const [selected, setSelected] = useState<string | null>(null);
  const [details, setDetails] = useState('');

  useEffect(() => {
    if (visible) {
      setSelected(null);
      setDetails('');
    }
  }, [visible]);

  const trimmed = details.trim();
  const needsDetails = selected === otherCode;
  const canSubmit = !!selected && (!needsDetails || trimmed.length > 0) && !submitting;

  const dismiss = () => {
    if (!submitting) onCancel();
  };

  const submit = () => {
    if (!canSubmit || !selected) return;
    onSubmit({ reason: selected, ...(trimmed ? { details: trimmed } : {}) });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={dismiss} statusBarTranslucent>
      <KeyboardAvoidingView behavior="padding" style={styles.root}>
        <Pressable
          style={[StyleSheet.absoluteFill, { backgroundColor: TOKENS.scrim.medium }]}
          onPress={dismiss}
          accessibilityLabel="Cerrar"
        />
        <View style={[styles.sheet, { backgroundColor: tc.surface, borderColor: tc.border }]}>
          <View style={[styles.handle, { backgroundColor: tc.border }]} />
          <Text variant="subtitle">{title}</Text>
          {message ? <Text variant="bodySmall" color={tc.textSub}>{message}</Text> : null}
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {reasons.map((r) => {
              const active = r.code === selected;
              return (
                <Pressable
                  key={r.code}
                  onPress={() => { if (!submitting) setSelected(r.code); }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active, disabled: submitting }}
                  accessibilityLabel={r.label}
                  style={[
                    styles.option,
                    {
                      backgroundColor: active ? tc.accent : tc.surface2,
                      borderColor: active ? TOKENS.color.signal : tc.border,
                    },
                  ]}
                >
                  <Ionicons
                    name={active ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={active ? TOKENS.color.signal : tc.textSub}
                  />
                  <Text variant="body" style={styles.optionLabel}>{r.label}</Text>
                </Pressable>
              );
            })}
            {selected ? (
              <Input
                label={needsDetails ? detailsLabel : `${detailsLabel} (opcional)`}
                value={details}
                onChangeText={setDetails}
                placeholder={detailsPlaceholder}
                multiline
                maxLength={maxDetailsLength}
                textAlignVertical="top"
                editable={!submitting}
              />
            ) : null}
          </ScrollView>
          <View style={styles.actions}>
            <Button label={cancelLabel} variant="ghost" onPress={dismiss} disabled={submitting} style={styles.action} />
            <Button
              label={confirmLabel}
              variant="danger"
              onPress={submit}
              disabled={!canSubmit}
              loading={submitting}
              style={styles.action}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: TOKENS.radius.xl,
    borderTopRightRadius: TOKENS.radius.xl,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: SPACING.xl,
    gap: SPACING.md,
    maxHeight: '88%',
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: TOKENS.radius.pill },
  list: { flexGrow: 0 },
  listContent: { gap: SPACING.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: TOKENS.radius.sm,
    borderWidth: 1,
  },
  optionLabel: { flex: 1 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: SPACING.sm },
  action: { flex: 1 },
});
