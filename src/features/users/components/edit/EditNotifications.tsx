import React from 'react';
import { View, Switch, StyleSheet, ActivityIndicator } from 'react-native';
import { usePushPreference } from '@/hooks/queries/usePushPreference';
import { Text, toast, TOKENS, useThemeColors } from '@/core/design-system';
import { getUserErrorMessage } from '@/lib/errors';

export default function EditNotifications() {
  const { query, mutation } = usePushPreference();
  const tc = useThemeColors();
  const pushEnabled = query.data ?? false;
  const saving = query.isLoading || mutation.isPending;
  const handlePushToggle = async (value: boolean) => {
    try {
      await mutation.mutateAsync(value);
      toast.success(value ? 'Notificaciones activadas' : 'Notificaciones desactivadas');
    } catch (error) {
      toast.error('No se pudo guardar', getUserErrorMessage(error));
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="title" style={styles.title}>Notificaciones push</Text>

      <View style={[styles.row, { borderBottomColor: tc.divider }]}>
        <View style={styles.rowText}>
          <Text variant="subtitle">Notificaciones push</Text>
          <Text variant="bodySmall" color={tc.textSub}>Recibí alertas de órdenes, pagos y mensajes</Text>
        </View>
        {saving
          ? <ActivityIndicator size="small" color={TOKENS.color.signal} />
          : <Switch
              value={pushEnabled}
              onValueChange={handlePushToggle}
              trackColor={{ true: TOKENS.color.signal, false: tc.switchTrack }}
              accessibilityLabel="Notificaciones push"
            />
        }
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 8 },
  title: { marginBottom: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  rowText: { flex: 1, marginRight: 12, gap: 2 },
});
