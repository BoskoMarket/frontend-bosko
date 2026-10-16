/**
 * RoleSelectionModal — se muestra una única vez, la primera vez que el usuario
 * llega al Home, preguntando si busca servicios o quiere ofrecerlos. Si elige
 * "ofrecer servicios" lo manda a BecomeProviderScreen (que ya guía el KYC).
 * El flag de "ya lo vi" vive en AsyncStorage — ver ROLE_MODAL_SEEN_KEY.
 */

import React, { useRef, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FullScreenModal, BRAND_RADIAL_FILL, TOKENS, useThemeColors } from '@/core/design-system';

export const ROLE_MODAL_SEEN_KEY = 'BOSKO_ROLE_MODAL_SEEN';

interface Props {
  visible: boolean;
  onSelectClient: () => void;
  onSelectProvider: () => void;
}

export function RoleSelectionModal({ visible, onSelectClient, onSelectProvider }: Props) {
  const tc = useThemeColors();
  const insets = useSafeAreaInsets();
  const cardAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      cardAnim.setValue(0);
      Animated.spring(cardAnim, { toValue: 1, friction: 7, tension: 60, useNativeDriver: true }).start();
    }
  }, [visible]);

  return (
    <FullScreenModal visible={visible} onRequestClose={onSelectClient}>
      <Pressable
        style={[styles.backdrop, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}
        onPress={onSelectClient}
      >
        <Animated.View
          style={[
            styles.cardWrap,
            {
              opacity: cardAnim,
              transform: [{ scale: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }],
            },
          ]}
        >
          {/* onPress no-op: absorbe el toque para que no burbujee al backdrop y cierre el modal */}
          <Pressable onPress={() => {}} style={[styles.card, { backgroundColor: tc.surface, borderColor: tc.border }]}>
            <Pressable onPress={onSelectClient} hitSlop={8} style={[styles.closeButton, { backgroundColor: tc.surface2 }]}>
              <Ionicons name="close" size={18} color={tc.textSub} />
            </Pressable>

            <View style={[styles.iconWrap, { backgroundColor: tc.accent }]}>
              <Ionicons name="hand-left" size={30} color={TOKENS.color.signal} />
            </View>

            <Text style={[styles.title, { color: tc.text }]}>¡Bienvenido a Bosko!</Text>
            <Text style={[styles.subtitle, { color: tc.textSub }]}>
              Contanos qué te trae por acá para armarte la mejor experiencia.
            </Text>

            <Pressable onPress={onSelectProvider} style={styles.optionShadow}>
              <View style={[styles.optionCard, BRAND_RADIAL_FILL]}>
                <View style={styles.optionIconWrap}>
                  <Ionicons name="briefcase" size={22} color={TOKENS.color.onPrimary} />
                </View>
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>Quiero ofrecer servicios</Text>
                  <Text style={styles.optionSub}>Publicá lo que sabés hacer y recibí clientes</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={TOKENS.onMedia.textSub} />
              </View>
            </Pressable>

            <Pressable
              onPress={onSelectClient}
              style={[styles.optionCardOutline, { borderColor: tc.border, backgroundColor: tc.surface2 }]}
            >
              <View style={[styles.optionIconWrap, { backgroundColor: tc.accent }]}>
                <Ionicons name="search" size={22} color={TOKENS.color.signal} />
              </View>
              <View style={styles.optionText}>
                <Text style={[styles.optionTitle, { color: tc.text }]}>Busco un servicio</Text>
                <Text style={[styles.optionSub, { color: tc.textSub }]}>Quiero contratar a un profesional</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={tc.textSub} />
            </Pressable>
          </Pressable>
        </Animated.View>
      </Pressable>
    </FullScreenModal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: TOKENS.scrim.medium,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  cardWrap: { width: '100%', borderRadius: 26, ...TOKENS.shadow.button },
  card: {
    borderRadius: 26,
    overflow: 'hidden',
    padding: 26,
    borderWidth: 1,
    gap: 14,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 1,
    padding: 6,
    borderRadius: 16,
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: { fontSize: 20, fontWeight: '800', textAlign: 'center' },
  subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 8 },
  optionShadow: {
    width: '100%',
    borderRadius: 18,
    ...TOKENS.shadow.glow,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 18,
    padding: 16,
  },
  optionCardOutline: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
  },
  optionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: TOKENS.onMedia.fill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: { flex: 1, gap: 2 },
  optionTitle: { fontSize: 15, fontWeight: '700', color: TOKENS.color.onPrimary },
  optionSub: { fontSize: 12, color: TOKENS.onMedia.textSub },
});
