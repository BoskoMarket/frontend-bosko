import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { TOKENS } from '../tokens';
import { GRADIENTS } from '../gradients';
import { Text } from './Text';
import { useThemeColors } from '@/stores/theme.store';

export type StepStatus = 'done' | 'active' | 'pending';

export interface TimelineStep {
  label: string;
  status: StepStatus;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}

/**
 * Timeline de pasos — OrderDetail, OrderStatus, KYCIntro, BecomeProvider.
 * Dot 28px + conector 2px. done → var(--brand) sólido, active → brand-gradient
 * con glow (TOKENS.color.signal), pending → surface-2 + borde.
 */
export function StepTimeline({ steps }: { steps: TimelineStep[] }) {
  const tc = useThemeColors();
  return (
    <View>
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        return (
          <View key={i} style={styles.row}>
            <View style={styles.rail}>
              <Dot status={step.status} icon={step.icon} />
              {!isLast && (
                <View style={[styles.connector, { backgroundColor: step.status === 'done' ? TOKENS.color.primary : tc.border }]} />
              )}
            </View>
            <Text
              variant={step.status === 'pending' ? 'body' : 'label'}
              color={step.status === 'pending' ? tc.textSub : tc.text}
              style={styles.label}
            >
              {step.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function Dot({ status, icon }: { status: StepStatus; icon: TimelineStep['icon'] }) {
  const tc = useThemeColors();
  if (status === 'pending') {
    return (
      <View style={[styles.dot, styles.dotPending, { backgroundColor: tc.surface2, borderColor: tc.border }]}>
        <Ionicons name={icon} size={12} color={tc.textMuted} />
      </View>
    );
  }
  return (
    <View style={[styles.dot, status === 'active' && styles.dotActiveGlow]}>
      <LinearGradient colors={GRADIENTS.brand} style={StyleSheet.absoluteFillObject} />
      <Ionicons name={icon} size={12} color={TOKENS.color.onPrimary} style={{ zIndex: 1 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12 },
  rail: { alignItems: 'center', width: 28 },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  dotPending: { borderWidth: 1 },
  dotActiveGlow: {
    shadowColor: TOKENS.color.signal,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 6,
  },
  connector: { width: 2, height: 22 },
  label: { paddingTop: 5, paddingBottom: 16 },
});
