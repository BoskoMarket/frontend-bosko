import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING } from '../spacing';
import { Text } from './Text';
import { Button } from './Button';
import { useThemeColors } from '@/stores/theme.store';

export interface EmptyStateAction {
  label: string;
  onPress: () => void;
}

export interface EmptyStateProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle: string;
  cta?: EmptyStateAction;
  secondaryCta?: EmptyStateAction;
  iconColor?: string;
  iconBg?: string;
}

/** Estado vacío centrado: ícono animado + título + subtítulo + CTA (brand) opcional + CTA secundario de texto. */
export function EmptyState({ icon, title, subtitle, cta, secondaryCta, iconColor, iconBg }: EmptyStateProps) {
  const tc = useThemeColors();
  const scale = useRef(new Animated.Value(0.7)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const slideY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }),
      Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideY, { toValue: 0, friction: 7, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.root, { opacity: fade, transform: [{ translateY: slideY }] }]}>
      <Animated.View style={[styles.iconWrap, { backgroundColor: iconBg ?? tc.accent, transform: [{ scale }] }]}>
        <Ionicons name={icon} size={36} color={iconColor ?? tc.signal} />
      </Animated.View>

      <Text variant="title" center style={styles.title}>{title}</Text>
      <Text variant="body" color={tc.textSub} center style={styles.subtitle}>{subtitle}</Text>

      {cta ? <Button label={cta.label} onPress={cta.onPress} style={styles.cta} /> : null}

      {secondaryCta ? (
        <Pressable onPress={secondaryCta.onPress} style={styles.secondaryBtn} accessibilityRole="button">
          <Text variant="label" color={tc.textSub}>{secondaryCta.label}</Text>
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    paddingVertical: 48,
    gap: SPACING.md,
  },
  iconWrap: {
    width: 84,
    height: 84,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  title: { letterSpacing: -0.3 },
  subtitle: { maxWidth: 280 },
  cta: { marginTop: SPACING.xs, paddingHorizontal: 28 },
  secondaryBtn: { paddingVertical: 10, paddingHorizontal: SPACING.lg },
});
