/**
 * Layout del grupo /login.
 *
 * Guarda inversa SOLO en arranque en frío: si el usuario ya tenía sesión al
 * llegar a /login (p.ej. deep link) lo redirige a las tabs.
 *
 * Si la sesión se inicia estando acá (login, Google), la navegación posterior
 * (video de bienvenida o tabs) es responsabilidad de la pantalla que inició el
 * flujo — el layout NO navega para no competir con ella. Mientras tanto muestra
 * un loader sobre el mismo fondo, sin desmontar la pantalla en curso.
 */

import React, { useRef } from 'react';
import { StyleSheet } from 'react-native';
import { Redirect, Slot } from 'expo-router';
import { ScreenLoader } from '@/core/design-system';
import { useAuth } from '@/features/auth/state/AuthContext';

export default function LoginLayout() {
  const { authLoaded, isAuthenticated } = useAuth();
  const authenticatedOnArrival = useRef<boolean | null>(null);

  // Mientras carga no redirigir (evita flash); el BootSplash tapa la pantalla.
  if (!authLoaded) return null;

  if (authenticatedOnArrival.current === null) authenticatedOnArrival.current = isAuthenticated;

  // Sesión previa al llegar → no debería estar en /login
  if (isAuthenticated && authenticatedOnArrival.current) return <Redirect href="/(tabs)" />;

  return (
    <>
      <Slot />
      {isAuthenticated && <ScreenLoader label="Entrando…" style={StyleSheet.absoluteFillObject} />}
    </>
  );
}
