import React from 'react';
import { View, StyleSheet } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { TOKENS } from '@/core/design-system';

/** Muted, looping preview of the video the user picked, before publishing. */
export function ReelVideoPreview({ uri }: { uri: string }) {
  const player = useVideoPlayer({ uri }, (p) => {
    p.loop = true;
    p.muted = true;
  });
  return (
    <View style={styles.box} accessibilityLabel="Vista previa del video">
      <VideoView player={player} style={styles.video} nativeControls contentFit="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { height: 280, borderRadius: TOKENS.radius.md, overflow: 'hidden', backgroundColor: TOKENS.onMedia.canvas },
  video: { flex: 1 },
});
