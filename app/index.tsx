/**
 * Pantalla raíz — Gate de enrutamiento inicial.
 *
 * Decide a dónde enviar al usuario según el estado de la sesión:
 *  1. Mientras se restaura la sesión → no renderiza nada (el BootSplash de la raíz tapa la pantalla)
 *  2. Con sesión activa → va directo a las tabs (sin pasar por onboarding/login)
 *  3. Sin sesión → muestra OnBoarding (que internamente detecta si ya fue visto
 *     y redirige a /login si corresponde)
 */

import React from 'react';
import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/features/auth/state/AuthContext';
import OnBoarding from '@/features/auth/screens/OnBoarding';

export default function IndexScreen() {
  const { authLoaded, isAuthenticated } = useAuth();

  if (!authLoaded) return null;

  // Sesión activa → ir al dashboard sin pasar por onboarding
  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  // Sin sesión → OnBoarding (maneja internamente si ya fue visto)
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <OnBoarding />
    </>
  );
}
