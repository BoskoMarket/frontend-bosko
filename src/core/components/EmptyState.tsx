import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { TOKENS } from '@/core/design-system/tokens';
import { GRADIENTS } from '@/core/design-system/gradients';
import { useThemeColors } from '@/stores/theme.store';

interface EmptyStateProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle: string;
  cta?: {
    label: string;
    onPress: () => void;
  };
  secondaryCta?: {
    label: string;
    onPress: () => void;
  };
  iconColor?: string;
  iconBg?: string;
}

export function EmptyState({
  icon,
  title,
  subtitle,
  cta,
  secondaryCta,
  iconColor,
  iconBg,
}: EmptyStateProps) {
  const tc = useThemeColors();
  const resolvedIconColor = iconColor ?? tc.signal;
  const resolvedIconBg = iconBg ?? tc.accent;
  const scale  = useRef(new Animated.Value(0.7)).current;
  const fade   = useRef(new Animated.Value(0)).current;
  const slideY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }),
      Animated.timing(fade,   { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideY, { toValue: 0, friction: 7, useNativeDriver: true }),
    ]).start();
  }, []);

  const btnScale = useRef(new Animated.Value(1)).current;

  return (
    <Animated.View style={[s.root, { opacity: fade, transform: [{ translateY: slideY }] }]}>
      {/* Icon */}
      <Animated.View style={[s.iconWrap, { backgroundColor: resolvedIconBg, transform: [{ scale }] }]}>
        <Ionicons name={icon} size={36} color={resolvedIconColor} />
      </Animated.View>

      {/* Text */}
      <Text style={[s.title, { color: tc.text }]}>{title}</Text>
      <Text style={[s.subtitle, { color: tc.textSub }]}>{subtitle}</Text>

      {/* CTAs */}
      {cta && (
        <Pressable
          onPressIn={() => Animated.spring(btnScale, { toValue: 0.96, useNativeDriver: true }).start()}
          onPressOut={() => Animated.spring(btnScale, { toValue: 1, useNativeDriver: true }).start()}
          onPress={cta.onPress}
        >
          <View style={[s.ctaShadow, TOKENS.shadow.glow]}>
            <Animated.View style={[s.ctaWrap, { transform: [{ scale: btnScale }] }]}>
              <LinearGradient
                colors={GRADIENTS.brand}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.ctaBtn}
              >
                <Text style={s.ctaText}>{cta.label}</Text>
              </LinearGradient>
            </Animated.View>
          </View>
        </Pressable>
      )}

      {secondaryCta && (
        <Pressable onPress={secondaryCta.onPress} style={s.secondaryBtn}>
          <Text style={[s.secondaryText, { color: tc.textSub }]}>{secondaryCta.label}</Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    paddingVertical: 48,
    gap: 12,
  },
  iconWrap: {
    width: 84,
    height: 84,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  ctaShadow: {
    borderRadius: 13,
    marginTop: 4,
  },
  ctaWrap: {
    borderRadius: 13,
    overflow: 'hidden',
  },
  ctaBtn: {
    paddingHorizontal: 28,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  secondaryBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  secondaryText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
