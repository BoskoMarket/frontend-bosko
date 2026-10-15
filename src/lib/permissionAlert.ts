import { Linking } from 'react-native';
import { dialog } from '@/core/design-system';

/** Permission denied: explain why and offer a shortcut to the system settings. */
export function alertPermissionDenied(message: string) {
  dialog.fromAlert('Permiso requerido', message, [
    { text: 'Ahora no', style: 'cancel' },
    { text: 'Abrir ajustes', onPress: () => { Linking.openSettings().catch(() => {}); } },
  ]);
}
