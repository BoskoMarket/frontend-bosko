/**
 * QuoteRequestScreen — Formulario para solicitar un servicio.
 * El cliente completa los datos y crea una orden (POST /orders).
 * Se accede desde ProviderProfileScreen al tocar "Cotizar servicio".
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from '@/core/components/BlurView';
import { MaterialIcons } from '@expo/vector-icons';
import { MotiView } from '@/core/components/MotiView';
import { router, useLocalSearchParams } from 'expo-router';
import { safeBack } from '@/core/navigation/safeBack';
import { useOrders } from '../state/OrdersContext';
import { TOKENS } from '@/core/design-system/tokens';
import { useThemeColors, useIsDark } from '@/stores/theme.store';
import { getUserErrorMessage } from '@/lib/errors';
import { AnimatedBackground } from '@/components/AnimatedBackground';

const { width } = Dimensions.get('window');

export default function QuoteRequestScreen() {
  const tc = useThemeColors();
  const isDark = useIsDark();
  const params = useLocalSearchParams<{ serviceId: string; providerName?: string; serviceTitle?: string }>();
  const { addOrder } = useOrders();

  const [message, setMessage] = useState('');
  const [address, setAddress] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      Alert.alert('Campo requerido', 'Describí qué necesitás para que el proveedor pueda cotizar.');
      return;
    }

    if (!params.serviceId) {
      Alert.alert('Error', 'No se encontró el servicio. Volvé e intentá nuevamente.');
      return;
    }

    setIsLoading(true);
    try {
      await addOrder({
        serviceId: params.serviceId,
        message: message.trim(),
        address: address.trim() || undefined,
        scheduledDate: scheduledDate.trim() || undefined,
      });

      Alert.alert(
        '¡Solicitud enviada!',
        'El proveedor recibirá tu solicitud y te responderá pronto.',
        [{ text: 'Ver mis órdenes', onPress: () => router.replace('/(tabs)/orders') }],
      );
    } catch (err: any) {
      Alert.alert('Error', getUserErrorMessage(err));
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
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={() => safeBack(router, '/(tabs)/services')} hitSlop={12} style={[styles.backButton, { backgroundColor: tc.surface }]}>
              <MaterialIcons name="arrow-back" size={24} color={tc.text} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: tc.text }]}>Solicitar servicio</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Info del servicio */}
          {params.serviceTitle && (
            <MotiView
              from={{ opacity: 0, translateY: 16 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 400 }}
            >
              <BlurView intensity={25} tint={isDark ? 'dark' : 'light'} style={[styles.serviceInfo, { borderColor: tc.cardBorder }]}>
                <MaterialIcons name="work" size={20} color={TOKENS.color.primary} />
                <View style={styles.serviceInfoText}>
                  <Text style={[styles.serviceTitle, { color: tc.text }]}>{params.serviceTitle}</Text>
                  {params.providerName && (
                    <Text style={[styles.providerName, { color: tc.textSub }]}>por {params.providerName}</Text>
                  )}
                </View>
              </BlurView>
            </MotiView>
          )}

          {/* Formulario */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 450, delay: 100 }}
          >
            <BlurView intensity={30} tint={isDark ? 'dark' : 'light'} style={[styles.card, { borderColor: tc.cardBorder }]}>
              {/* Mensaje al proveedor (requerido) */}
              <View style={styles.fieldContainer}>
                <Text style={[styles.fieldLabel, { color: tc.text }]}>
                  Mensaje al proveedor <Text style={styles.required}>*</Text>
                </Text>
                <Text style={[styles.fieldHint, { color: tc.textSub }]}>
                  Describí qué necesitás, cuándo y cualquier detalle relevante.
                </Text>
                <TextInput
                  style={[styles.textArea, { backgroundColor: tc.surface2, borderColor: tc.border, color: tc.text }]}
                  placeholder="Ej: Necesito una instalación eléctrica en 3 habitaciones. Tengo los materiales..."
                  placeholderTextColor={tc.textSub}
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
                <View style={[styles.inputWrapper, { backgroundColor: tc.surface2, borderColor: tc.border }]}>
                  <MaterialIcons name="location-on" size={20} color={tc.textSub} />
                  <TextInput
                    style={[styles.input, { color: tc.text }]}
                    placeholder="Ej: Av. Corrientes 1234, CABA"
                    placeholderTextColor={tc.textSub}
                    value={address}
                    onChangeText={setAddress}
                    returnKeyType="next"
                  />
                </View>
              </View>

              {/* Fecha deseada (opcional) */}
              <View style={styles.fieldContainer}>
                <Text style={[styles.fieldLabel, { color: tc.text }]}>Fecha deseada</Text>
                <Text style={[styles.fieldHint, { color: tc.textSub }]}>Opcional — cuándo preferís que se realice.</Text>
                <View style={[styles.inputWrapper, { backgroundColor: tc.surface2, borderColor: tc.border }]}>
                  <MaterialIcons name="event" size={20} color={tc.textSub} />
                  <TextInput
                    style={[styles.input, { color: tc.text }]}
                    placeholder="Ej: Sábado por la mañana"
                    placeholderTextColor={tc.textSub}
                    value={scheduledDate}
                    onChangeText={setScheduledDate}
                    returnKeyType="done"
                  />
                </View>
              </View>

              {/* Aviso */}
              <View style={[styles.notice, { backgroundColor: tc.accent }]}>
                <MaterialIcons name="info-outline" size={16} color={TOKENS.color.primary} />
                <Text style={[styles.noticeText, { color: tc.textSub }]}>
                  El proveedor verá tu solicitud y podrá aceptarla o rechazarla.
                  El precio final se acuerda entre ambas partes.
                </Text>
              </View>

              {/* Botón enviar */}
              <View style={styles.buttonShadow}>
                <Pressable
                  onPress={handleSubmit}
                  disabled={isLoading}
                  style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
                >
                  <LinearGradient
                    colors={[TOKENS.color.primary, '#a0032a', TOKENS.color.primaryDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buttonGradient}
                  >
                    {isLoading
                      ? <ActivityIndicator color="#fff" size="small" />
                      : (
                        <View style={styles.buttonContent}>
                          <MaterialIcons name="send" size={18} color="#fff" />
                          <Text style={styles.buttonText}>Enviar solicitud</Text>
                        </View>
                      )
                    }
                  </LinearGradient>
                </Pressable>
              </View>
            </BlurView>
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
    paddingHorizontal: 20,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TOKENS.color.text,
  },
  serviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.85)',
    overflow: 'hidden',
  },
  serviceInfoText: { flex: 1 },
  serviceTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: TOKENS.color.text,
  },
  providerName: {
    fontSize: 13,
    color: TOKENS.color.sub,
    marginTop: 2,
  },
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    padding: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
    gap: 4,
  },
  fieldContainer: { marginBottom: 16 },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: TOKENS.color.text,
    marginBottom: 4,
  },
  fieldHint: {
    fontSize: 12,
    color: TOKENS.color.sub,
    marginBottom: 8,
  },
  required: { color: '#ef4444' },
  textArea: {
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(200,200,220,0.5)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: TOKENS.color.text,
    minHeight: 120,
  },
  charCount: {
    fontSize: 11,
    color: TOKENS.color.sub,
    textAlign: 'right',
    marginTop: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(200,200,220,0.5)',
    paddingHorizontal: 14,
    paddingVertical: 4,
    gap: 10,
    minHeight: 52,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: TOKENS.color.text,
    paddingVertical: 8,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(133,0,33,0.06)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    color: TOKENS.color.sub,
    lineHeight: 18,
  },
  buttonShadow: {
    borderRadius: 14,
    marginTop: 4,
    shadowColor: TOKENS.color.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 4,
  },
  button: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  buttonPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
