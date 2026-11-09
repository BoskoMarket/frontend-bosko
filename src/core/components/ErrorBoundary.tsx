import React from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Text, useThemeColors } from '@/core/design-system';
import { SPACING } from '@/core/design-system/spacing';
import { captureError } from '@/core/monitoring/sentry';

interface Props {
  children: React.ReactNode;
  /** Texto del botón de reintento. Default: "Reintentar". */
  retryLabel?: string;
}

interface State {
  error: Error | null;
}

/**
 * Boundary de errores de render. Class component porque `componentDidCatch`
 * no tiene equivalente en hooks. El fallback es un componente funcional aparte
 * para poder usar `useThemeColors()` — la clase en sí no debe depender de
 * nada que pueda fallar (Zustand, Context) para no enmascarar el error real.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    captureError(error, { componentStack: info.componentStack ?? undefined });
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return <ErrorFallback retryLabel={this.props.retryLabel} onRetry={this.reset} />;
    }
    return this.props.children;
  }
}

function ErrorFallback({ onRetry, retryLabel }: { onRetry: () => void; retryLabel?: string }) {
  const tc = useThemeColors();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tc.bg }]}>
      <View style={styles.content}>
        <View style={[styles.iconCircle, { backgroundColor: tc.surface2 }]}>
          <Ionicons name="alert-circle-outline" size={40} color={tc.textSub} />
        </View>
        <Text variant="h3" style={{ textAlign: 'center', marginTop: SPACING.lg }}>
          Algo salió mal
        </Text>
        <Text variant="body" color={tc.textSub} style={{ textAlign: 'center', marginTop: SPACING.sm }}>
          Ocurrió un error inesperado en esta pantalla. Puedes intentar de nuevo.
        </Text>
        <Button
          label={retryLabel ?? 'Reintentar'}
          onPress={onRetry}
          style={{ marginTop: SPACING.xxl }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.huge,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
