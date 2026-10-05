/**
 * WelcomeVideoScreen — Video de bienvenida "bosko logo loading", pantalla completa.
 * Se muestra UNA sola vez: justo después de que un usuario recién registrado
 * (email verificado) hace su primer login. Ver flag WELCOME_VIDEO_PENDING_KEY
 * — se setea en VerifyEmailScreen al verificar, se consume en LogInView al loguear.
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { router } from 'expo-router';

const VIDEO_SRC = require('../../../../assets/videos/bosko-logo-loading.mp4');

// Red de seguridad por si el evento playToEnd no llega (fallo de carga, etc.)
const FALLBACK_TIMEOUT_MS = 8000;

export default function WelcomeVideoScreen() {
  const doneRef = useRef(false);

  const player = useVideoPlayer(VIDEO_SRC, (p) => {
    p.loop = false;
    p.play();
  });

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    router.replace('/(tabs)');
  };

  useEffect(() => {
    const sub = player.addListener('playToEnd', finish);
    const fallback = setTimeout(finish, FALLBACK_TIMEOUT_MS);
    return () => {
      sub.remove();
      clearTimeout(fallback);
    };
  }, [player]);

  return (
    <View style={styles.root}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
      />
      <Pressable onPress={finish} hitSlop={16} style={styles.skipButton}>
        <Text style={styles.skipText}>Saltar</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0910' },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 24,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  skipText: { fontSize: 13, fontWeight: '600', color: '#EDEAF5' },
});
