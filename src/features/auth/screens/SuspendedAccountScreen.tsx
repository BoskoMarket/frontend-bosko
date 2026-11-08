/**
 * SuspendedAccountScreen — total account suspension (403 ACCOUNT_SUSPENDED).
 *
 * The session is already gone when this shows. The reason is never returned by the backend,
 * so the copy only says the account cannot be used and that support can help.
 */

import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import {
  AuthBackdrop,
  AuthCard,
  Button,
  IconCircle,
  SPACING,
  Text,
  useThemeColors,
} from '@/core/design-system';
import { useAuth } from '@/features/auth/state/AuthContext';
import { SupportContactButton } from '@/features/appConfig/components/SupportContactButton';

export const SUSPENDED_SUPPORT_MESSAGE = 'Mi cuenta aparece suspendida.';

export default function SuspendedAccountScreen() {
  const tc = useThemeColors();
  const { clearSuspended } = useAuth();

  const backToLogin = () => {
    clearSuspended();
    router.replace('/login');
  };

  return (
    <AuthBackdrop>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <AuthCard>
          <View style={styles.content}>
            <IconCircle name="lock-closed-outline" variant="danger" />
            <Text variant="h2" center>Tu cuenta está suspendida</Text>
            <Text variant="body" color={tc.textSub} center>
              No puedes usar tu cuenta por ahora. Si crees que se trata de un error o quieres más información, el equipo de soporte puede ayudarte.
            </Text>
            <View style={styles.actions}>
              <SupportContactButton message={SUSPENDED_SUPPORT_MESSAGE} />
              <Button
                label="Volver al inicio de sesión"
                variant="secondary"
                size="lg"
                fullWidth
                onPress={backToLogin}
              />
            </View>
          </View>
        </AuthCard>
      </ScrollView>
    </AuthBackdrop>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xxl },
  content: { alignItems: 'center', gap: SPACING.lg },
  actions: { alignSelf: 'stretch', gap: SPACING.md, marginTop: SPACING.sm },
});
