/**
 * QuoteRequestScreen — Formulario para solicitar un servicio.
 * El cliente completa los datos y crea una orden (POST /orders).
 * Se accede desde ProviderProfileScreen al tocar "Cotizar servicio".
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { MotiView } from '@/core/components/MotiView';
import { router, useLocalSearchParams } from 'expo-router';
import { safeBack } from '@/core/navigation/safeBack';
import { useOrders } from '../state/OrdersContext';
import {
  Button,
  Card,
  Chip,
  Input,
  NoticeBanner,
  ScreenHeader,
  SPACING,
  TOKENS,
  useThemeColors,
  dialog, FONT_FAMILY } from '@/core/design-system';
import { getUserErrorMessage } from '@/lib/errors';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { availableSlots, buildDayOptions, toScheduledIso, DEFAULT_SLOT_HOUR } from '../utils/scheduledDate';

export default function QuoteRequestScreen() {
  const tc = useThemeColors();
  const params = useLocalSearchParams<{ serviceId: string; providerName?: string; serviceTitle?: string }>();
  const { addOrder } = useOrders();

  const [message, setMessage] = useState('');
  const [address, setAddress] = useState('');
  // Optional desired date: no day selected => scheduledDate undefined. Slot defaults to 9 h.
  // Past slots are hidden for today; today is dropped once no slot is left.
  const now = useMemo(() => new Date(), []);
  const dayOptions = useMemo(
    () => buildDayOptions(now, 14).filter((d) => availableSlots(d.date, now).length > 0),
    [now],
  );
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const [slotHour, setSlotHour] = useState(DEFAULT_SLOT_HOUR);
  const selectedDay = dayOptions.find((d) => d.key === selectedDayKey);
  const slots = selectedDay ? availableSlots(selectedDay.date, now) : [];

  const selectDay = (key: string) => {
    if (selectedDayKey === key) {
      setSelectedDayKey(null);
      return;
    }
    const day = dayOptions.find((d) => d.key === key);
    const daySlots = day ? availableSlots(day.date, now) : [];
    setSelectedDayKey(key);
    if (!daySlots.some((s) => s.hour === slotHour)) setSlotHour(daySlots[0]?.hour ?? DEFAULT_SLOT_HOUR);
  };
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      dialog.fromAlert('Campo requerido', 'Describí qué necesitás para que el proveedor pueda cotizar.');
      return;
    }

    if (!params.serviceId) {
      dialog.fromAlert('Error', 'No se encontró el servicio. Volvé e intentá nuevamente.');
      return;
    }

    setIsLoading(true);
    try {
      await addOrder({
        serviceId: params.serviceId,
        message: message.trim(),
        address: address.trim() || undefined,
        scheduledDate: selectedDay ? toScheduledIso(selectedDay.date, slotHour) : undefined,
      });

      dialog.fromAlert(
        '¡Solicitud enviada!',
        'El proveedor recibirá tu solicitud y te responderá pronto.',
        [{ text: 'Ver mis órdenes', onPress: () => router.replace('/(tabs)/orders') }],
      );
    } catch (err: any) {
      dialog.fromAlert('Error', getUserErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.background, { backgroundColor: tc.bg }]}>
      <AnimatedBackground variant="minimal" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <ScreenHeader title="Solicitar servicio" onBack={() => safeBack(router, '/(tabs)/services')} />

          {/* Info del servicio */}
          {params.serviceTitle && (
            <MotiView
              from={{ opacity: 0, translateY: 16 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 400 }}
            >
              <Card padding="lg" radius="md" contentStyle={styles.serviceInfo}>
                <MaterialIcons name="work" size={20} color={TOKENS.color.signal} />
                <View style={styles.serviceInfoText}>
                  <Text style={[styles.serviceTitle, { color: tc.text }]}>{params.serviceTitle}</Text>
                  {params.providerName && (
                    <Text style={[styles.providerName, { color: tc.textSub }]}>por {params.providerName}</Text>
                  )}
                </View>
              </Card>
            </MotiView>
          )}

          {/* Formulario */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 450, delay: 100 }}
          >
            <Card padding="xxl" radius="xl" elevated contentStyle={styles.card}>
              {/* Mensaje al proveedor (requerido) */}
              <View style={styles.fieldContainer}>
                <Text style={[styles.fieldLabel, { color: tc.text }]}>
                  Mensaje al proveedor <Text style={{ color: TOKENS.color.error }}>*</Text>
                </Text>
                <Text style={[styles.fieldHint, { color: tc.textSub }]}>
                  Describí qué necesitás, cuándo y cualquier detalle relevante.
                </Text>
                <Input
                  placeholder="Ej: Necesito una instalación eléctrica en 3 habitaciones. Tengo los materiales..."
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                  maxLength={500}
                />
                <Text style={[styles.charCount, { color: tc.textSub }]}>{message.length}/500</Text>
              </View>

              {/* Dirección (opcional) */}
              <View style={styles.fieldContainer}>
                <Text style={[styles.fieldLabel, { color: tc.text }]}>Dirección del trabajo</Text>
                <Text style={[styles.fieldHint, { color: tc.textSub }]}>Opcional — dónde se realizará el servicio.</Text>
                <Input
                  leftIcon="location-outline"
                  placeholder="Ej: Av. Corrientes 1234, CABA"
                  value={address}
                  onChangeText={setAddress}
                  returnKeyType="next"
                />
              </View>

              {/* Fecha deseada (opcional) */}
              <View style={styles.fieldContainer}>
                <Text style={[styles.fieldLabel, { color: tc.text }]}>Fecha deseada</Text>
                <Text style={[styles.fieldHint, { color: tc.textSub }]}>Opcional — cuándo preferís que se realice.</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                  {dayOptions.map((d) => (
                    <Chip
                      key={d.key}
                      label={d.label}
                      selected={selectedDayKey === d.key}
                      onPress={() => selectDay(d.key)}
                    />
                  ))}
                </ScrollView>
                {selectedDay && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.chipRow, styles.slotRow]}>
                    {slots.map((s) => (
                      <Chip
                        key={s.key}
                        label={s.label}
                        icon="time-outline"
                        selected={slotHour === s.hour}
                        onPress={() => setSlotHour(s.hour)}
                      />
                    ))}
                  </ScrollView>
                )}
              </View>

              {/* Aviso */}
              <NoticeBanner style={styles.notice}>
                El proveedor verá tu solicitud y podrá aceptarla o rechazarla.
                El precio final se acuerda entre ambas partes.
              </NoticeBanner>

              {/* Botón enviar */}
              <Button
                label="Enviar solicitud"
                icon={<MaterialIcons name="send" size={18} color={TOKENS.color.onPrimary} />}
                size="lg"
                fullWidth
                loading={isLoading}
                onPress={handleSubmit}
              />
            </Card>
          </MotiView>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  flex: { flex: 1 },
  container: {
    paddingTop: 60,
    paddingBottom: 120,
    paddingHorizontal: SPACING.xl,
    gap: SPACING.lg,
  },
  serviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  serviceInfoText: { flex: 1 },
  serviceTitle: {
    fontSize: 15,
    fontFamily: FONT_FAMILY.headingMedium,
  },
  providerName: {
    fontSize: 13,
    fontFamily: FONT_FAMILY.body,
    marginTop: 2,
  },
  card: { gap: SPACING.xs },
  fieldContainer: { marginBottom: SPACING.lg },
  fieldLabel: {
    fontSize: 14,
    fontFamily: FONT_FAMILY.heading,
    marginBottom: SPACING.xs,
  },
  fieldHint: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.body,
    marginBottom: SPACING.sm,
  },
  charCount: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.body,
    textAlign: 'right',
    marginTop: SPACING.xs,
  },
  chipRow: { gap: SPACING.sm },
  slotRow: { marginTop: SPACING.sm },
  notice: { marginBottom: SPACING.sm },
});
