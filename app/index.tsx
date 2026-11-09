/**
 * Pantalla raíz — Gate de enrutamiento inicial.
 *
 * Decide a dónde enviar al usuario según el estado de la sesión:
 *  1. Mientras se restaura la sesión → no renderiza nada (el BootSplash de la raíz tapa la pantalla)
 *  2. Con sesión activa → va directo a las tabs (sin pasar por onboarding/login);
 *     si la API informa que la cuenta no tiene ciudad (`city === null`) → /auth/select-city
 *  3. Sin sesión → muestra OnBoarding (que internamente detecta si ya fue visto
 *     y redirige a /login si corresponde)
 */

import React from 'react';
import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/features/auth/state/AuthContext';
import OnBoarding from '@/features/auth/screens/OnBoarding';
import { useProfile } from '@/hooks/queries/useProfileQuery';
import { needsCity, SELECT_CITY_HREF } from '@/features/auth/utils/cityGate';

export default function IndexScreen() {
  const { authLoaded, isAuthenticated, authState, suspended } = useAuth();
  const { data: profile } = useProfile();

  if (!authLoaded) return null;

  // Sesión activa → ir al dashboard sin pasar por onboarding
  if (isAuthenticated) {
    // `null` = the API says there is no city; `undefined` = old backend / unknown => no gate.
    const city = profile?.city !== undefined ? profile.city : authState.user?.city;
    if (needsCity(city)) return <Redirect href={SELECT_CITY_HREF} />;
    return <Redirect href="/(tabs)" />;
  }

  // Suspended account: no session, and the only screen it can see is the suspension one.
  if (suspended) return <Redirect href="/suspended" />;

  // Sin sesión → OnBoarding (maneja internamente si ya fue visto)
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <OnBoarding />
    </>
  );
}
