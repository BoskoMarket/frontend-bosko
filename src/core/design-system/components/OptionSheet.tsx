import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TOKENS } from '../tokens';
import { SPACING } from '../spacing';
import { Button } from './Button';
import { Text } from './Text';
import { useThemeColors } from '@/stores/theme.store';

export interface OptionSheetOption {
  /** Stable id handed back to `onSelect`. */
  id: string;
  label: string;
  description?: string;
}

export interface OptionSheetProps {
  visible: boolean;
  title: string;
  message?: string;
  options: ReadonlyArray<OptionSheetOption>;
  cancelLabel?: string;
  /** Called with the tapped option id. The caller closes the sheet. */
  onSelect: (id: string) => void;
  onCancel: () => void;
}

/**
 * OptionSheet — generic bottom sheet to pick one option from a list. Choosing an option fires
 * `onSelect` right away (no confirm step). Knows nothing about what is being chosen.
 */
export function OptionSheet({ visible, title, message, options, cancelLabel = 'Cancelar', onSelect, onCancel }: OptionSheetProps) {
  const tc = useThemeColors();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel} statusBarTranslucent>
      <View style={styles.root}>
        <Pressable
          style={[StyleSheet.absoluteFill, { backgroundColor: TOKENS.scrim.medium }]}
          onPress={onCancel}
          accessibilityLabel="Cerrar"
        />
        <View style={[styles.sheet, { backgroundColor: tc.surface, borderColor: tc.border }]}>
          <View style={[styles.handle, { backgroundColor: tc.border }]} />
          <Text variant="subtitle">{title}</Text>
          {message ? <Text variant="bodySmall" color={tc.textSub}>{message}</Text> : null}
          <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
            {options.map((o) => (
              <Pressable
                key={o.id}
                onPress={() => onSelect(o.id)}
                accessibilityRole="button"
                accessibilityLabel={o.label}
                style={[styles.option, { backgroundColor: tc.surface2, borderColor: tc.border }]}
              >
                <View style={styles.optionText}>
                  <Text variant="body" weight="600" numberOfLines={1}>{o.label}</Text>
                  {o.description ? (
                    <Text variant="caption" color={tc.textSub} numberOfLines={2}>{o.description}</Text>
                  ) : null}
                </View>
                <Ionicons name="chevron-forward" size={18} color={tc.textSub} />
              </Pressable>
            ))}
          </ScrollView>
          <Button label={cancelLabel} variant="ghost" onPress={onCancel} fullWidth />
        </View>
      </View>
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
  optionText: { flex: 1, gap: SPACING.xs },
});
