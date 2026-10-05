import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/stores/theme.store';

/**
 * Alertas propias de Bosko — success / error / warning, con barra de progreso
 * abajo que cuenta el tiempo hasta que se cierran solas. No depende de ninguna
 * librería externa de toasts.
 */

type AlertType = 'success' | 'error' | 'warning';

interface QueuedAlert {
  id: number;
  type: AlertType;
  title: string;
  message?: string;
  duration: number;
}

const TYPE_CONFIG: Record<AlertType, { icon: React.ComponentProps<typeof Ionicons>['name']; color: string; tint: string }> = {
  success: { icon: 'checkmark-circle', color: '#22C55E', tint: 'rgba(34,197,94,0.14)' },
  error:   { icon: 'close-circle',     color: '#EF4444', tint: 'rgba(239,68,68,0.14)' },
  warning: { icon: 'warning',          color: '#F59E0B', tint: 'rgba(245,158,11,0.14)' },
};

let idCounter = 0;
let enqueueFn: ((item: Omit<QueuedAlert, 'id'>) => void) | null = null;

/** import { toast } from '@/core/components/Toast' */
export const toast = {
  success: (title: string, message?: string) =>
    enqueueFn?.({ type: 'success', title, message, duration: 3000 }),
  error: (title: string, message?: string) =>
    enqueueFn?.({ type: 'error', title, message, duration: 4000 }),
  warning: (title: string, message?: string) =>
    enqueueFn?.({ type: 'warning', title, message, duration: 4500 }),
};

/** Colocar UNA VEZ en app/_layout.tsx, fuera del Stack */
export function ToastRoot() {
  const tc = useThemeColors();
  const insets = useSafeAreaInsets();
  const [queue, setQueue] = useState<QueuedAlert[]>([]);
  const current = queue[0] ?? null;

  const translateY = useRef(new Animated.Value(-40)).current;
  const opacity     = useRef(new Animated.Value(0)).current;
  const progress     = useRef(new Animated.Value(1)).current; // 1 → 0
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    if (dismissTimer.current) {
      clearTimeout(dismissTimer.current);
      dismissTimer.current = null;
    }
    Animated.parallel([
      Animated.timing(translateY, { toValue: -40, duration: 180, useNativeDriver: true }),
      Animated.timing(opacity,    { toValue: 0,   duration: 180, useNativeDriver: true }),
    ]).start(() => {
      setQueue((q) => q.slice(1));
    });
  }, [translateY, opacity]);

  useEffect(() => {
    enqueueFn = (item) => {
      idCounter += 1;
      setQueue((q) => [...q, { ...item, id: idCounter }]);
    };
    return () => { enqueueFn = null; };
  }, []);

  useEffect(() => {
    if (!current) return;
    translateY.setValue(-40);
    opacity.setValue(0);
    progress.setValue(1);

    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, friction: 8, tension: 60 }),
      Animated.timing(opacity,    { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();

    Animated.timing(progress, {
      toValue: 0,
      duration: current.duration,
      useNativeDriver: false,
    }).start();

    dismissTimer.current = setTimeout(dismiss, current.duration);
    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, [current?.id]);

  if (!current) return null;
  const cfg = TYPE_CONFIG[current.type];

  return (
    <View pointerEvents="box-none" style={[StyleSheet.absoluteFill, { paddingTop: insets.top + 8 }]}>
      <Animated.View style={{ opacity, transform: [{ translateY }] }}>
        <Pressable
          onPress={dismiss}
          style={[s.card, { backgroundColor: tc.card, borderColor: tc.cardBorder }]}
        >
          <View style={s.row}>
            <View style={[s.iconWrap, { backgroundColor: cfg.tint }]}>
              <Ionicons name={cfg.icon} size={20} color={cfg.color} />
            </View>
            <View style={s.textWrap}>
              <Text style={[s.title, { color: tc.text }]} numberOfLines={2}>{current.title}</Text>
              {current.message ? (
                <Text style={[s.message, { color: tc.textSub }]} numberOfLines={2}>{current.message}</Text>
              ) : null}
            </View>
          </View>
          <View style={[s.track, { backgroundColor: tc.border }]}>
            <Animated.View
              style={[
                s.fill,
                {
                  backgroundColor: cfg.color,
                  width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                },
              ]}
            />
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    marginHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { flex: 1, gap: 2, paddingTop: 2 },
  title: { fontSize: 14, fontWeight: '700' },
  message: { fontSize: 13 },
  track: { height: 3, width: '100%' },
  fill: { height: 3 },
});
