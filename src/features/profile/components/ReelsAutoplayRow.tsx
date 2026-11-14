import React from 'react';
import { Switch } from 'react-native';
import { ListRow, TOKENS, useThemeColors } from '@/core/design-system';
import { useReelsAutoplay, useSetReelsAutoplay } from '@/stores/preferences.store';

/** Settings row: reels autoplay "always" vs "Wi-Fi only". The whole row toggles the switch. */
export function ReelsAutoplayRow() {
  const tc = useThemeColors();
  const value = useReelsAutoplay();
  const setValue = useSetReelsAutoplay();
  const toggle = (onlyWifi: boolean) => setValue(onlyWifi ? 'wifi' : 'always');
  return (
    <ListRow
      icon="play-circle-outline"
      label="Reproducción automática de reels"
      subtitle={value === 'wifi' ? 'Solo con Wi-Fi' : 'Siempre'}
      onPress={() => toggle(value !== 'wifi')}
      right={
        <Switch
          value={value === 'wifi'}
          onValueChange={toggle}
          trackColor={{ true: TOKENS.color.signal, false: tc.switchTrack }}
          accessibilityLabel="Reproducir reels automáticamente solo con Wi-Fi"
        />
      }
    />
  );
}
