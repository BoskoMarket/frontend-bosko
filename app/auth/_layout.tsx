/**
 * Layout del grupo /auth (verify-email, verify-reset-code, reset-password).
 *
 * Guarda inversa SOLO en arranque en frío: si el usuario ya tenía sesión al
 * llegar acá (p.ej. deep link) lo redirige a las tabs. Una cuenta con sesión ya
 * tiene el email verificado (la sesión nace en `verifyEmail`) y no está
 * recuperando contraseña.
 *
 * La sesión que se inicia estando acá (el OTP de `verify-email` devuelve los
 * tokens y la pantalla cierra sesión al terminar) NO dispara el redirect: el
 * layout no navega para no competir con la pantalla que maneja el flujo.
 */

import React, { useRef } from 'react';
import { Redirect, Stack } from 'expo-router';
import { useThemeColors } from '@/core/design-system';
import { useAuth } from '@/features/auth/state/AuthContext';

export default function AuthModalLayout() {
  const tc = useThemeColors();
  const { authLoaded, isAuthenticated } = useAuth();
  const authenticatedOnArrival = useRef<boolean | null>(null);

  // Mientras carga no redirigir (evita flash); el BootSplash tapa la pantalla.
  if (!authLoaded) return null;

  if (authenticatedOnArrival.current === null) authenticatedOnArrival.current = isAuthenticated;

  if (isAuthenticated && authenticatedOnArrival.current) return <Redirect href="/(tabs)" />;

  return (
    <Stack screenOptions={{ headerShown: false, presentation: 'modal', contentStyle: { backgroundColor: tc.bg } }}>
      <Stack.Screen name="verify-email" />
      <Stack.Screen name="verify-reset-code" />
      <Stack.Screen name="reset-password" />
    </Stack>
  );
}
