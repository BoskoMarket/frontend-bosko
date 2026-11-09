import React from 'react';
import { Switch } from 'react-native';
import { ListRow, TOKENS, useThemeColors } from '@/core/design-system';
import { useReelsAutoplay, useSetReelsAutoplay } from '@/stores/preferences.store';

/** Settings row: reels autoplay "always" vs "Wi-Fi only". */
export function ReelsAutoplayRow() {
  const tc = useThemeColors();
  const value = useReelsAutoplay();
  const setValue = useSetReelsAutoplay();
  return (
    <ListRow
      icon="play-circle-outline"
      label="Reproducción automatica de reels"
      subtitle={value === 'wifi' ? 'Solo con Wi-Fi' : 'Siempre'}
      right={
        <Switch
          value={value === 'wifi'}
          onValueChange={(on) => setValue(on ? 'wifi' : 'always')}
          trackColor={{ true: TOKENS.color.signal, false: tc.switchTrack }}
          accessibilityLabel="Reproducir reels automaticamente solo con Wi-Fi"
        />
      }
    />
  );
}
