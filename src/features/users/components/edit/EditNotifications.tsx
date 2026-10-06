import React, { useState } from 'react';
import { View, Text, Switch, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { usePushPreference } from '@/hooks/queries/usePushPreference';
import { TOKENS } from '@/core/design-system/tokens';
import { getUserErrorMessage } from '@/lib/errors';

export default function EditNotifications() {
  const { query, mutation } = usePushPreference();
  const pushEnabled = query.data ?? false;
  const saving = query.isLoading || mutation.isPending;
  const handlePushToggle = async (value: boolean) => {
    try { await mutation.mutateAsync(value); }
    catch (error) { Alert.alert('Error', getUserErrorMessage(error)); }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notificaciones push</Text>

      <View style={styles.row}>
        <View style={styles.rowText}>
          <Text style={styles.label}>Notificaciones push</Text>
          <Text style={styles.sublabel}>Recibí alertas de órdenes y mensajes</Text>
        </View>
        {saving
          ? <ActivityIndicator size="small" color={TOKENS.color.primary} />
          : <Switch
              value={pushEnabled}
              onValueChange={handlePushToggle}
              trackColor={{ true: TOKENS.color.primary }}
            />
        }
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 8 },
  title: { fontSize: 18, fontWeight: '700', color: TOKENS.color.text, marginBottom: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  rowText: { flex: 1, marginRight: 12 },
  label: { fontSize: 15, fontWeight: '500', color: TOKENS.color.text },
  sublabel: { fontSize: 13, color: TOKENS.color.sub, marginTop: 2 },
});

