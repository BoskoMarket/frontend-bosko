import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Text } from './Text';
import { safeBack } from '../../navigation/safeBack';
import { useThemeColors } from '@/stores/theme.store';

export interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  /** Reemplaza el spacer derecho — badge/contador (Favoritos, Admin). Si se omite, queda un spacer de 22px para balancear el chevron. */
  right?: React.ReactNode;
}

/**
 * Header de pantalla — patrón repetido en las 24 pantallas de Perfil/Cuenta,
 * Órdenes, KYC/Admin. `chevron-back` desnudo (sin chrome de botón) + título
 * centrado + spacer de 22px que iguala el ancho del ícono para que el título
 * quede realmente centrado, no solo "flex:1 + textAlign:center".
 */
export function ScreenHeader({ title, onBack, right }: ScreenHeaderProps) {
  const tc = useThemeColors();
  return (
    <View style={styles.row}>
      <Pressable onPress={onBack ?? (() => safeBack(router, '/(tabs)'))} hitSlop={12} style={styles.side} accessibilityRole="button" accessibilityLabel="Volver">
        <Ionicons name="chevron-back" size={22} color={tc.text} />
      </Pressable>
      <Text variant="title" color={tc.text} style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={[styles.side, styles.right]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  side: { width: 22, alignItems: 'flex-start', justifyContent: 'center' },
  right: { alignItems: 'flex-end', width: undefined, minWidth: 22 },
  title: { flex: 1, textAlign: 'center' },
});
