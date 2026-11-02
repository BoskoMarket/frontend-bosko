import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus, StyleSheet, View } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { Ionicons } from '@expo/vector-icons';
import { BRAND_NAME, Button, Text, useThemeColors } from '@/core/design-system';
import { SPACING } from '@/core/design-system/spacing';
import { useAuth } from '@/features/auth/state/AuthContext';
import { useBiometricEnabled } from '@/stores/appLock.store';

// Tiempo en background antes de re-pedir biometría al volver a primer plano —
// mismo criterio que apps bancarias (no bloquea en cada cambio de app fugaz,
// ej. abrir la cámara del sistema o el selector de fotos).
const LOCK_THRESHOLD_MS = 30_000;

const BACKGROUND_STATES = /inactive|background/;

/**
 * Overlay de bloqueo biométrico. Envuelve el árbol autenticado — si el
 * dispositivo no tiene hardware biométrico o no hay biometría enrolada,
 * queda transparente (no hay fallback de PIN propio en esta primera versión).
 */
export function BiometricLockGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const biometricEnabled = useBiometricEnabled();
  const tc = useThemeColors();

  const [supported, setSupported] = useState(false);
  const [locked, setLocked] = useState(false);
  const backgroundedAt = useRef<number | null>(null);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [hasHardware, enrolled] = await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
      ]);
      if (mounted) setSupported(hasHardware && enrolled);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const shouldLock = isAuthenticated && biometricEnabled && supported;

  const promptUnlock = useCallback(async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: `Desbloqueá ${BRAND_NAME}`,
      cancelLabel: 'Cancelar',
    });
    if (result.success) setLocked(false);
  }, []);

  useEffect(() => {
    if (!shouldLock) return;

    const sub = AppState.addEventListener('change', (next) => {
      const prev = appState.current;

      if (prev === 'active' && BACKGROUND_STATES.test(next)) {
        backgroundedAt.current = Date.now();
      }

      if (BACKGROUND_STATES.test(prev) && next === 'active') {
        const elapsed = backgroundedAt.current ? Date.now() - backgroundedAt.current : Infinity;
        if (elapsed > LOCK_THRESHOLD_MS) setLocked(true);
      }

      appState.current = next;
    });

    return () => sub.remove();
  }, [shouldLock]);

  // Auto-prompt al bloquearse — el botón de la pantalla de bloqueo queda
  // como reintento manual si el usuario cancela o falla la autenticación.
  useEffect(() => {
    if (locked) promptUnlock();
  }, [locked, promptUnlock]);

  if (!shouldLock || !locked) return <>{children}</>;

  return (
    <View style={StyleSheet.absoluteFill}>
      {children}
      <View style={[StyleSheet.absoluteFill, styles.overlay, { backgroundColor: tc.bg }]}>
        <View style={[styles.iconCircle, { backgroundColor: tc.surface2 }]}>
          <Ionicons name="lock-closed" size={36} color={tc.textSub} />
        </View>
        <Text variant="h3" style={{ marginTop: SPACING.lg, textAlign: 'center' }}>
          App bloqueada
        </Text>
        <Text variant="body" color={tc.textSub} style={{ marginTop: SPACING.sm, textAlign: 'center' }}>
          Desbloqueá con tu biometría para continuar
        </Text>
        <Button label="Desbloquear" onPress={promptUnlock} style={{ marginTop: SPACING.xxl }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.huge,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
