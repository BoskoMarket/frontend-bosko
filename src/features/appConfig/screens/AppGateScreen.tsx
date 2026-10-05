import React from 'react';
import { Linking, Platform, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Text, useThemeColors } from '@/core/design-system';
import { SPACING } from '@/core/design-system/spacing';
import type { AppGateState } from '../hooks/useAppGate';

const ANDROID_PACKAGE = 'com.boskoapp.mobile';

function openStore() {
  const url = Platform.select({
    android: `market://details?id=${ANDROID_PACKAGE}`,
    ios: 'https://apps.apple.com/search?term=Bosko',
    default: undefined,
  });
  if (url) Linking.openURL(url).catch(() => {});
}

export function AppGateScreen({ state }: { state: Extract<AppGateState, { blocked: true }> }) {
  const tc = useThemeColors();
  const isMaintenance = state.reason === 'maintenance';

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: tc.bg }]}>
      <View style={[styles.iconCircle, { backgroundColor: tc.surface2 }]}>
        <Ionicons
          name={isMaintenance ? 'construct-outline' : 'arrow-up-circle-outline'}
          size={40}
          color={tc.textSub}
        />
      </View>
      <Text variant="h3" style={styles.title}>
        {isMaintenance ? 'Estamos en mantenimiento' : 'Actualización requerida'}
      </Text>
      <Text variant="body" color={tc.textSub} style={styles.body}>
        {isMaintenance
          ? state.message || 'Bosko está en mantenimiento. Volvé a intentar en unos minutos.'
          : 'Esta versión de Bosko ya no es compatible. Actualizá para seguir usando la app.'}
      </Text>
      {!isMaintenance && (
        <Button label="Actualizar ahora" onPress={openStore} style={{ marginTop: SPACING.xxl }} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.huge,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: SPACING.xxl,
    textAlign: 'center',
  },
  body: {
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
});
