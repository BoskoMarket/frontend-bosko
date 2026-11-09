/**
 * TermsAndConditionsScreen — Términos y condiciones, "Señal Nocturna".
 * Antes era un placeholder de texto suelto; ahora es un documento real y
 * navegable. Se abre desde el último paso del registro (anónimo) y desde Perfil
 * (autenticado): es informativa, no avanza ningún flujo ni cierra sesión.
 */

import React from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { BRAND_NAME, Button, Card, GRADIENTS, SPACING, Text, TOKENS, useThemeColors } from '@/core/design-system';
import { safeBack } from '@/core/navigation/safeBack';
import { AnimatedBackground } from '@/components/AnimatedBackground';

const SECTIONS = [
  {
    title: '1. Uso de la plataforma',
    body: `Al continuar, confirmás que aceptás el uso responsable de ${BRAND_NAME} como espacio de intermediación entre clientes y proveedores de servicios.`,
  },
  {
    title: '2. Tratamiento de datos',
    body: 'Tus datos personales se procesan según nuestra política de privacidad y nunca se comparten con terceros sin tu consentimiento.',
  },
  {
    title: '3. Veracidad de la información',
    body: 'Declarás que tu información de contacto y perfil es verídica y te comprometés a mantenerla actualizada.',
  },
];

export default function TermsAndConditionsScreen() {
  const tc = useThemeColors();
  // Sin historial (deep link) cae a /login; si hay sesión, el guard de /login lo manda a las tabs.
  const goBack = () => safeBack(router, '/login');

  return (
    <View style={[styles.background, { backgroundColor: tc.bg }]}>
      <AnimatedBackground variant="minimal" />
      <LinearGradient colors={GRADIENTS.brandDeep} style={styles.header}>
        <Pressable onPress={goBack} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={TOKENS.onMedia.icon} />
        </Pressable>
        <View style={styles.headerText}>
          <Text variant="title" color={TOKENS.onMedia.text}>Términos y condiciones</Text>
          <Text variant="caption" color={TOKENS.onMedia.textSub} style={styles.headerSubtitle}>
            Última actualización: 1 de agosto de 2026
          </Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {SECTIONS.map(s => (
          <Card key={s.title}>
            <Text variant="bodySmall" weight="700" style={styles.cardTitle}>{s.title}</Text>
            <Text variant="bodySmall" color={tc.textSub} style={styles.cardBody}>{s.body}</Text>
          </Card>
        ))}

        <View style={styles.btnGap}>
          <Button label="Entendido" onPress={goBack} fullWidth />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  header: {
    paddingTop: 56,
    paddingHorizontal: 22,
    paddingBottom: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  backBtn: { padding: 2 },
  headerText: { flex: 1 },
  headerSubtitle: { marginTop: 2 },
  body: { padding: SPACING.xl, gap: 14, paddingBottom: SPACING.huge },
  cardTitle: { marginBottom: SPACING.sm },
  cardBody: { lineHeight: 20 },
  btnGap: { marginTop: SPACING.xs },
});
