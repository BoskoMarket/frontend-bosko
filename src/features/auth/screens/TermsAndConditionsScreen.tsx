/**
 * TermsAndConditionsScreen — Términos y condiciones, "Señal Nocturna".
 * Antes era un placeholder de texto suelto; ahora es un documento real y
 * navegable con banner de verificación de email + checkbox de aceptación.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Button, GRADIENTS, TOKENS } from '@/core/design-system';
import { safeBack } from '@/core/navigation/safeBack';
import { AnimatedBackground } from '@/components/AnimatedBackground';

const SECTIONS = [
  {
    title: '1. Uso de la plataforma',
    body: 'Al continuar, confirmás que aceptás el uso responsable de Bosko como espacio de intermediación entre clientes y proveedores de servicios.',
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
  const [accepted, setAccepted] = useState(false);

  return (
    <View style={styles.background}>
      <AnimatedBackground variant="minimal" />
      <LinearGradient colors={GRADIENTS.brandDeep} style={styles.header}>
        <Pressable onPress={() => safeBack(router, '/login')} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Términos y condiciones</Text>
          <Text style={styles.headerSubtitle}>Última actualización: 1 de agosto de 2026</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.banner}>
          <Ionicons name="mail-unread-outline" size={17} color={TOKENS.color.signal} />
          <Text style={styles.bannerText}>
            Te enviamos un correo de verificación. Revisá tu bandeja mientras leés los términos.
          </Text>
        </View>

        {SECTIONS.map(s => (
          <View key={s.title} style={styles.card}>
            <Text style={styles.cardTitle}>{s.title}</Text>
            <Text style={styles.cardBody}>{s.body}</Text>
          </View>
        ))}

        <Pressable onPress={() => setAccepted(a => !a)} style={styles.acceptRow} hitSlop={8}>
          <View style={[styles.checkbox, accepted && styles.checkboxChecked]}>
            {accepted && <Ionicons name="checkmark" size={14} color={TOKENS.color.signal} />}
          </View>
          <Text style={styles.acceptText}>Leí y acepto los términos y condiciones</Text>
        </Pressable>

        <View style={styles.btnGap}>
          <Button label="Volver al inicio" onPress={() => router.replace('/login')} fullWidth />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: '#0A0910' },
  header: {
    paddingTop: 56,
    paddingHorizontal: 22,
    paddingBottom: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: { padding: 2 },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 17, fontWeight: '700', fontFamily: 'Archivo_700Bold', color: '#fff' },
  headerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  body: { padding: 20, gap: 14, paddingBottom: 40 },
  banner: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: 'rgba(255,45,111,0.14)',
    borderRadius: 14,
    padding: 14,
  },
  bannerText: { flex: 1, fontSize: 13, color: 'rgba(237,234,245,0.55)', lineHeight: 19 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', fontFamily: 'Archivo_700Bold', color: '#EDEAF5' },
  cardBody: { fontSize: 13, color: 'rgba(237,234,245,0.55)', lineHeight: 20 },
  acceptRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    borderColor: '#FF2D6F',
    backgroundColor: 'rgba(255,45,111,0.14)',
  },
  acceptText: { fontSize: 13, color: '#EDEAF5' },
  btnGap: { marginTop: 4 },
});
