import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { onlineManager } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/core/design-system';

/**
 * Banda persistente arriba de la app cuando no hay conexión — se suscribe al
 * mismo `onlineManager` que ya usa TanStack Query (ver networkFocus.ts), sin
 * duplicar estado en un store nuevo.
 */
export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!onlineManager.isOnline());
  const insets = useSafeAreaInsets();

  useEffect(() => {
    return onlineManager.subscribe(() => {
      setIsOffline(!onlineManager.isOnline());
    });
  }, []);

  if (!isOffline) return null;

  return (
    <View style={[styles.banner, { paddingTop: insets.top + 8 }]} pointerEvents="none">
      <Ionicons name="cloud-offline-outline" size={16} color="#fff" />
      <Text variant="caption" style={styles.text}>
        Sin conexión a internet
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    backgroundColor: '#B91C1C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingBottom: 8,
  },
  text: {
    color: '#fff',
    fontWeight: '600',
  },
});
