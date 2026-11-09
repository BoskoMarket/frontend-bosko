import React from 'react';
import { Linking } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Button, TOKENS } from '@/core/design-system';
import { toast } from '@/core/components/Toast';
import { useSupportContact } from '../hooks/useSupportContact';

interface SupportContactButtonProps {
  /** Context appended to the suggested message (e.g. the order id). */
  message?: string;
  label?: string;
  variant?: React.ComponentProps<typeof Button>['variant'];
}

/** Opens the support WhatsApp chat. Renders nothing until the backend provides a number. */
export function SupportContactButton({
  message,
  label = 'Contactar a soporte',
  variant = 'primary',
}: SupportContactButtonProps) {
  const { url } = useSupportContact(message);
  if (!url) return null;

  const open = async () => {
    try {
      await Linking.openURL(url);
    } catch {
      toast.error('No se pudo abrir WhatsApp', 'Verifica que la aplicación esté instalada e inténtalo de nuevo.');
    }
  };

  return (
    <Button
      label={label}
      variant={variant}
      size="lg"
      fullWidth
      icon={<MaterialIcons name="support-agent" size={20} color={variant === 'primary' ? TOKENS.color.onPrimary : TOKENS.color.signal} />}
      onPress={open}
    />
  );
}
