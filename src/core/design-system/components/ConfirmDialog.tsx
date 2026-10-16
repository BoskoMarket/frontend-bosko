import React, { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { TOKENS } from '../tokens';
import { SPACING } from '../spacing';
import { Button, ButtonVariant } from './Button';
import { Card } from './Card';
import { Text } from './Text';
import { useThemeColors } from '@/stores/theme.store';

export type DialogActionStyle = 'default' | 'cancel' | 'destructive';

export interface ConfirmDialogAction {
  label: string;
  /** default = brand CTA, cancel = quiet, destructive = danger (default: 'default'). */
  style?: DialogActionStyle;
  onPress: () => void;
  /** Shows a spinner on this action. */
  loading?: boolean;
  disabled?: boolean;
}

export interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  actions: ConfirmDialogAction[];
  /** Backdrop tap / Android back button. Ignored while an action is loading. */
  onDismiss: () => void;
  /** Allow dismissing without choosing an action (default: true). */
  dismissable?: boolean;
}

const MAX_ROW_LABEL = 16;
const MAX_ROW_TOTAL = 30;

function variantFor(style: DialogActionStyle, isFirstDefault: boolean): ButtonVariant {
  if (style === 'cancel') return 'ghost';
  if (style === 'destructive') return 'danger';
  return isFirstDefault ? 'primary' : 'secondary';
}

/**
 * ConfirmDialog — themed replacement for `Alert.alert`. Presentational: it is
 * controlled by `visible` and reports presses through each action's `onPress`.
 * For the imperative API (`dialog.alert|confirm|choose|fromAlert`) mount
 * `<DialogRoot />` once at the app root.
 *
 * Layout: 1–2 short actions share a row (cancel first); anything else stacks
 * with the cancel action last.
 */
export function ConfirmDialog({
  visible,
  title,
  message,
  actions,
  onDismiss,
  dismissable = true,
}: ConfirmDialogProps) {
  const tc = useThemeColors();
  const busy = actions.some((a) => a.loading);
  const dismiss = () => {
    if (dismissable && !busy) onDismiss();
  };

  const row =
    actions.length <= 2 &&
    actions.every((a) => a.label.length <= MAX_ROW_LABEL) &&
    actions.reduce((n, a) => n + a.label.length, 0) <= MAX_ROW_TOTAL;

  // Row: cancel on the left. Stack: cancel at the bottom. Stable otherwise.
  const isCancel = (a: ConfirmDialogAction) => a.style === 'cancel';
  const ordered = [...actions].sort((a, b) =>
    row ? Number(isCancel(b)) - Number(isCancel(a)) : Number(isCancel(a)) - Number(isCancel(b)),
  );
  const firstDefault = ordered.find((a) => (a.style ?? 'default') === 'default');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={dismiss} statusBarTranslucent>
      <View style={styles.root} accessibilityViewIsModal>
        <Pressable
          style={[StyleSheet.absoluteFill, { backgroundColor: TOKENS.scrim.medium }]}
          onPress={dismiss}
          accessibilityLabel="Cerrar"
        />
        <Card padding="xl" radius="lg" elevated style={styles.card} contentStyle={{ ...styles.content, backgroundColor: tc.surface }}>
          <Text variant="subtitle" accessibilityRole="header">{title}</Text>
          {message ? <Text variant="bodySmall">{message}</Text> : null}
          <View style={row ? styles.actionsRow : styles.actionsStack}>
            {ordered.map((a, i) => (
              <Button
                key={`${i}-${a.label}`}
                label={a.label}
                variant={variantFor(a.style ?? 'default', a === firstDefault)}
                onPress={a.onPress}
                loading={a.loading}
                disabled={a.disabled || (busy && !a.loading)}
                fullWidth={!row}
                style={row ? styles.action : undefined}
              />
            ))}
          </View>
        </Card>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Imperative API
// ---------------------------------------------------------------------------

export interface DialogAction<K extends string = string> {
  key: K;
  label: string;
  style?: DialogActionStyle;
  /**
   * Optional side effect run when the action is pressed. If it returns a
   * Promise the button shows a spinner and the dialog stays open until it settles.
   */
  onPress?: () => void | Promise<unknown>;
}

interface DialogRequest {
  id: number;
  title: string;
  message?: string;
  actions: DialogAction[];
  dismissable: boolean;
  /** Runs on backdrop / back dismissal (before resolving with null). */
  onDismiss?: () => void;
  resolve: (key: string | null) => void;
}

let idCounter = 0;
let queue: DialogRequest[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => { listeners.delete(l); };
};
const getCurrent = () => queue[0] ?? null;

function show(req: Omit<DialogRequest, 'id'>): void {
  idCounter += 1;
  queue = [...queue, { ...req, id: idCounter }];
  emit();
}

function open<K extends string>(
  req: Omit<DialogRequest, 'id' | 'resolve' | 'actions'> & { actions: DialogAction<K>[] },
): Promise<K | null> {
  return new Promise<K | null>((resolve) => {
    show({ ...req, resolve: resolve as (key: string | null) => void });
  });
}

export interface AlertButton {
  text?: string;
  style?: DialogActionStyle;
  onPress?: (value?: string) => void | Promise<unknown>;
}

export interface AlertOptions {
  /** true = backdrop / back button dismiss the dialog (default: false, like native Android `Alert`). */
  cancelable?: boolean;
  /** Called when dismissed without pressing a button. */
  onDismiss?: () => void;
}

/**
 * import { dialog } from '@/core/design-system'
 *
 * - `alert({ title, message?, okLabel? })` → Promise<void>
 * - `confirm({ title, message?, confirmLabel?, cancelLabel?, destructive? })` → Promise<boolean>
 *   (false when cancelled or dismissed)
 * - `choose({ title, message?, actions: [{ key, label, style? }] })` → Promise<key | null>
 *   (null when dismissed with backdrop / back)
 * - `fromAlert(title, message?, buttons?, options?)` → void. Same signature as
 *   `Alert.alert`; each button's `onPress` runs when pressed (async onPress keeps
 *   the dialog open with a spinner). Use it for mechanical migrations.
 *
 * Requires `<DialogRoot />` mounted once in app/_layout.tsx. Dialogs requested
 * while another is open are queued.
 */
export const dialog = {
  alert: async ({ title, message, okLabel = 'Aceptar' }: { title: string; message?: string; okLabel?: string }): Promise<void> => {
    await open({ title, message, dismissable: true, actions: [{ key: 'ok', label: okLabel }] });
  },

  confirm: async ({
    title,
    message,
    confirmLabel = 'Aceptar',
    cancelLabel = 'Cancelar',
    destructive = false,
  }: {
    title: string;
    message?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    destructive?: boolean;
  }): Promise<boolean> => {
    const key = await open({
      title,
      message,
      dismissable: true,
      actions: [
        { key: 'cancel', label: cancelLabel, style: 'cancel' },
        { key: 'confirm', label: confirmLabel, style: destructive ? 'destructive' : 'default' },
      ],
    });
    return key === 'confirm';
  },

  choose: <T extends string>({
    title,
    message,
    actions,
  }: {
    title: string;
    message?: string;
    actions: { key: T; label: string; style?: DialogActionStyle }[];
  }): Promise<T | null> => open<T>({ title, message, dismissable: true, actions }),

  fromAlert: (title: string, message?: string | null, buttons?: AlertButton[], options?: AlertOptions): void => {
    const list = buttons && buttons.length > 0 ? buttons : [{ text: 'OK' }];
    const actions: DialogAction[] = list.map((b, i) => ({
      key: String(i),
      label: b.text ?? 'OK',
      style: b.style,
      onPress: b.onPress ? () => b.onPress?.() : undefined,
    }));
    const cancelIndex = list.findIndex((b) => b.style === 'cancel');
    show({
      title,
      message: message ?? undefined,
      actions,
      dismissable: options?.cancelable === true,
      onDismiss: () => {
        if (cancelIndex >= 0) list[cancelIndex].onPress?.();
        options?.onDismiss?.();
      },
      resolve: () => {},
    });
  },
};

/** Mount ONCE in app/_layout.tsx (next to ToastRoot). Renders the current dialog and queues the rest. */
export function DialogRoot() {
  const current = useSyncExternalStore(subscribe, getCurrent, getCurrent);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  // Keep the last request around so the fade-out doesn't flash empty content.
  const [shown, setShown] = useState<DialogRequest | null>(null);

  useEffect(() => {
    if (current) setShown(current);
    setPendingKey(null);
  }, [current]);

  const finish = useCallback((req: DialogRequest, key: string | null) => {
    queue = queue.filter((r) => r.id !== req.id);
    emit();
    req.resolve(key);
  }, []);

  const press = useCallback(
    (req: DialogRequest, action: DialogAction) => {
      if (pendingKey) return;
      let result: void | Promise<unknown>;
      try {
        result = action.onPress?.();
      } catch {
        result = undefined;
      }
      if (result && typeof (result as Promise<unknown>).then === 'function') {
        setPendingKey(action.key);
        (result as Promise<unknown>).then(
          () => finish(req, action.key),
          () => finish(req, action.key),
        );
      } else {
        finish(req, action.key);
      }
    },
    [finish, pendingKey],
  );

  const req = current ?? shown;
  if (!req) return null;

  return (
    <ConfirmDialog
      visible={!!current}
      title={req.title}
      message={req.message}
      dismissable={req.dismissable}
      onDismiss={() => {
        if (!current) return;
        current.onDismiss?.();
        finish(current, null);
      }}
      actions={req.actions.map((a) => ({
        label: a.label,
        style: a.style,
        loading: pendingKey === a.key,
        onPress: () => press(req, a),
      }))}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'center', paddingHorizontal: SPACING.xl },
  card: { width: '100%' },
  content: { gap: SPACING.md },
  actionsRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: SPACING.sm },
  actionsStack: { gap: SPACING.sm },
  action: { flex: 1 },
});
