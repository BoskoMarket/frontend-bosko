import { Alert, Linking } from 'react-native';

/** Permission denied: explain why and offer a shortcut to the system settings. */
export function alertPermissionDenied(message: string) {
  Alert.alert('Permiso requerido', message, [
    { text: 'Ahora no', style: 'cancel' },
    { text: 'Abrir ajustes', onPress: () => { Linking.openSettings().catch(() => {}); } },
  ]);
}
