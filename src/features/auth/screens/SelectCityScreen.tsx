/**
 * SelectCityScreen — pick the city (and accept the terms) for an account that has none.
 *
 * Two entry points, one screen:
 *  - NEW Google user: the backend answered 422 CITY_REQUIRED. The Firebase ID token waits in
 *    memory (`pendingGoogleSignup`, never persisted); the Google call is retried with
 *    `{ cityId, acceptedTerms, termsVersion }`.
 *  - Signed-in account whose profile has `city === null` (gate in `app/index.tsx`):
 *    `PATCH /users/me/city`. Terms were already accepted at registration.
 */

import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import {
  AuthBackdrop,
  AuthCard,
  Button,
  CheckboxRow,
  SPACING,
  Text,
  TOKENS,
  useThemeColors,
} from '@/core/design-system';
import { BrandMark } from '@/components/BrandMark';
import { TERMS_VERSION } from '@/core/config/terms';
import { useAuth } from '@/features/auth/state/AuthContext';
import { pendingGoogleSignup } from '@/features/auth/state/pendingGoogleSignup';
import { CityPicker } from '@/features/auth/components/CityPicker';
import { useSetCity } from '@/hooks/mutations/useCityMutation';
import { getUserErrorMessage } from '@/lib/errors';

export default function SelectCityScreen() {
  const tc = useThemeColors();
  const { isAuthenticated, authLoaded, loginWithGoogle, logout, isLoading } = useAuth();
  const setCity = useSetCity();

  // Read once: the token must not trigger re-renders and is cleared on success or exit.
  const [googleToken] = useState(() => pendingGoogleSignup.get());
  const googleMode = googleToken !== null;

  const [cityId, setCityId] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [cityError, setCityError] = useState('');
  const [termsError, setTermsError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Leaving the flow without finishing drops the token.
  useEffect(() => () => { pendingGoogleSignup.clear(); }, []);

  if (!authLoaded) return null;
  if (!googleMode && !isAuthenticated) return <Redirect href="/login" />;

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitError('');
    let valid = true;
    if (!cityId) { setCityError('Elige tu ciudad'); valid = false; }
    if (googleMode && !acceptedTerms) { setTermsError('Debes aceptar los términos y la política de privacidad'); valid = false; }
    if (!valid || !cityId) return;

    setSubmitting(true);
    try {
      if (googleMode) {
        await loginWithGoogle(googleToken, { cityId, acceptedTerms: true, termsVersion: TERMS_VERSION });
        pendingGoogleSignup.clear();
      } else {
        await setCity.mutateAsync(cityId);
      }
      router.replace('/(tabs)');
    } catch (err) {
      setSubmitError(getUserErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    pendingGoogleSignup.clear();
    if (isAuthenticated) await logout();
    router.replace('/login');
  };

  return (
    <View style={styles.flex}>
      <AuthBackdrop tilt={10}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <BrandMark variant="mark" size={52} />
          <AuthCard padding={28} style={styles.card}>
            <Text variant="h3">Tu ciudad</Text>
            <Text variant="body" color={tc.textSub} style={styles.subtitle}>
              Elige la ciudad donde usarás la app. Define los proveedores y los precios que verás, y no se puede cambiar después.
            </Text>

            <CityPicker
              value={cityId}
              onChange={city => { setCityId(city.id); setCityError(''); setSubmitError(''); }}
              error={cityError}
            />

            {googleMode ? (
              <CheckboxRow
                checked={acceptedTerms}
                onToggle={next => { setAcceptedTerms(next); setTermsError(''); setSubmitError(''); }}
                error={termsError}
                accessibilityLabel="Acepto los términos y la política de privacidad"
                style={styles.terms}
              >
                <Text variant="bodySmall">
                  {'Acepto los '}
                  <Text
                    variant="bodySmall"
                    weight="600"
                    color={TOKENS.color.signal}
                    accessibilityRole="link"
                    onPress={() => router.push('/terms')}
                  >
                    términos y la política de privacidad
                  </Text>
                </Text>
              </CheckboxRow>
            ) : null}

            {!!submitError && (
              <Text variant="bodySmall" color={TOKENS.color.error} style={styles.error}>{submitError}</Text>
            )}

            <Button label="Continuar" onPress={handleSubmit} loading={submitting || isLoading} fullWidth style={styles.cta} />
            <Button label={googleMode ? 'Cancelar' : 'Cerrar sesión'} variant="ghost" onPress={handleCancel} fullWidth />
          </AuthCard>
        </ScrollView>
      </AuthBackdrop>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.xxl, paddingVertical: SPACING.huge },
  card: { marginTop: SPACING.xxl, gap: SPACING.lg },
  subtitle: { marginBottom: SPACING.xs },
  terms: { marginTop: SPACING.xs },
  error: { marginLeft: SPACING.xs },
  cta: { marginTop: SPACING.sm },
});
