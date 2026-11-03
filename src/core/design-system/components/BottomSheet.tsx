import React from 'react';
import { KeyboardAvoidingView, Modal, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TOKENS } from '../tokens';
import { SPACING } from '../spacing';
import { useThemeColors } from '@/stores/theme.store';

export interface BottomSheetProps {
  visible: boolean;
  /** Called by the backdrop tap and the hardware back button (only when `dismissible`). */
  onClose: () => void;
  /** When false the backdrop and back button do nothing (e.g. while a request is in flight). */
  dismissible?: boolean;
  /** Accessibility label of the backdrop button. */
  backdropLabel?: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * BottomSheet — generic themed modal sheet: scrim backdrop, handle and a keyboard-aware surface
 * that respects the bottom safe area. Knows nothing about its content.
 */
export function BottomSheet({
  visible,
  onClose,
  dismissible = true,
  backdropLabel = 'Cerrar',
  children,
  style,
}: BottomSheetProps) {
  const tc = useThemeColors();
  const insets = useSafeAreaInsets();
  const close = dismissible ? onClose : undefined;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close} statusBarTranslucent>
      <KeyboardAvoidingView behavior="padding" style={styles.root}>
        <Pressable
          style={[StyleSheet.absoluteFill, { backgroundColor: TOKENS.scrim.medium }]}
          onPress={close}
          accessibilityRole="button"
          accessibilityLabel={backdropLabel}
          accessibilityState={{ disabled: !dismissible }}
        />
        <View
          style={[
            styles.sheet,
            { backgroundColor: tc.surface, borderColor: tc.border, paddingBottom: insets.bottom + SPACING.xl },
            style,
          ]}
        >
          <View style={[styles.handle, { backgroundColor: tc.border }]} />
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    maxHeight: '90%',
    borderTopLeftRadius: TOKENS.radius.xl,
    borderTopRightRadius: TOKENS.radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    paddingTop: SPACING.sm,
    paddingHorizontal: SPACING.xl,
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: TOKENS.radius.pill, marginBottom: SPACING.md },
});
