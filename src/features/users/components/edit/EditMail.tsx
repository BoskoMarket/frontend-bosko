import React from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/features/auth/state/AuthContext';
import { Card, ListRow, Text, useThemeColors } from '@/core/design-system';

export default function EditEmail() {
  const { authState } = useAuth();
  const tc = useThemeColors();

  return (
    <View style={styles.container}>
      <Card padding="lg" contentStyle={styles.field}>
        <Text variant="caption" color={tc.textSub} style={styles.label}>Email actual</Text>
        <Text variant="subtitle">{authState.user?.email ?? authState.userEmail ?? '—'}</Text>
        <Text variant="caption" color={tc.textSub}>El email no puede cambiarse directamente.</Text>
      </Card>

      <Card padding="xs">
        <ListRow
          icon="lock-closed-outline"
          label="Cambiar contraseña"
          onPress={() => router.push('/(tabs)/profile/ChangePassword')}
        />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 16 },
  field: { gap: 4 },
  label: { textTransform: 'uppercase', letterSpacing: 0.5 },
});
