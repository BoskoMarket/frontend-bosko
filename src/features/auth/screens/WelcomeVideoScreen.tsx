/**
 * WelcomeVideoScreen — Video de bienvenida "bosko logo loading", pantalla completa.
 * Se muestra UNA sola vez: justo después de que un usuario recién registrado
 * (email verificado) hace su primer login. Ver flag WELCOME_VIDEO_PENDING_KEY
 * — se setea en VerifyEmailScreen al verificar, LogInView navega acá si está seteado
 * y esta pantalla lo consume al terminar o saltar el video.
 */

import React, { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, StyleSheet, Pressable } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Redirect, router } from 'expo-router';
import { WELCOME_VIDEO_PENDING_KEY } from '@/features/auth/constants';
import { useAuth } from '@/features/auth/state/AuthContext';
import { Text, TOKENS, useThemeColors, withAlpha } from '@/core/design-system';

const VIDEO_SRC = require('../../../../assets/videos/bosko-logo-loading.mp4');

// Red de seguridad por si el evento playToEnd no llega (fallo de carga, etc.)
const FALLBACK_TIMEOUT_MS = 8000;

/**
 * Guards: without a session the screen redirects to /login; without the pending flag
 * (deep link, already watched) it redirects to /(tabs). While auth or the flag read is
 * pending it renders nothing, so neither the video nor a redirect flashes.
 */
export default function WelcomeVideoScreen() {
  const { authLoaded, isAuthenticated } = useAuth();
  if (!authLoaded) return null;
  if (!isAuthenticated) return <Redirect href="/login" />;
  return <PendingFlagGate />;
}

function PendingFlagGate() {
  const [pending, setPending] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(WELCOME_VIDEO_PENDING_KEY)
      .then((v) => { if (active) setPending(!!v); })
      .catch(() => { if (active) setPending(false); });
    return () => { active = false; };
  }, []);

  if (pending === null) return null;
  if (!pending) return <Redirect href="/(tabs)" />;
  return <WelcomeVideoPlayer />;
}

function WelcomeVideoPlayer() {
  const tc = useThemeColors();
  const doneRef = useRef(false);

  const player = useVideoPlayer(VIDEO_SRC, (p) => {
    p.loop = false;
    p.play();
  });

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    // Consume the flag on finish AND skip so the video never replays.
    AsyncStorage.removeItem(WELCOME_VIDEO_PENDING_KEY).catch(() => {}).finally(() => router.replace('/(tabs)'));
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
    <View style={[styles.root, { backgroundColor: tc.bg }]}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
      />
      <Pressable onPress={finish} hitSlop={16} style={[styles.skipButton, { backgroundColor: TOKENS.scrim.medium, borderColor: withAlpha(TOKENS.onMedia.text, 0.2) }]}>
        <Text variant="label" color={TOKENS.onMedia.text}>Saltar</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 24,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
});
