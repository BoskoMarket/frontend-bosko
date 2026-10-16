import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, FONT_FAMILY } from '@/core/design-system';
import { TOKENS } from '@/core/design-system/tokens';
import { useAppUpdates } from '@/core/updates/useAppUpdates';

/** Banda inferior — "Nueva versión disponible" con reinicio de un toque. */
export function UpdateBanner() {
  const { updateReady, applyUpdate } = useAppUpdates();
  const insets = useSafeAreaInsets();

  if (!updateReady) return null;

  return (
    <View style={[styles.banner, { paddingBottom: insets.bottom + 12 }]}>
      <Ionicons name="sparkles" size={16} color={TOKENS.color.onPrimary} />
      <Text variant="caption" style={styles.text}>
        Hay una versión nueva de Bosko
      </Text>
      <Pressable onPress={applyUpdate} hitSlop={8}>
        <Text variant="caption" style={styles.action}>
          Actualizar
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    backgroundColor: TOKENS.color.signal,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 12,
  },
  text: {
    color: TOKENS.color.onPrimary,
  },
  action: {
    color: TOKENS.color.onPrimary,
    fontFamily: FONT_FAMILY.heading,
    textDecorationLine: 'underline',
  },
});
