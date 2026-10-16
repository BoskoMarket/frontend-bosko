/**
 * Layout de las tabs autenticadas.
 *
 * Guarda secundaria: sin sesión no se renderizan las tabs. Esta capa NO navega:
 * el único dueño del redirect a /login es RootLayoutNav (app/_layout.tsx), que
 * cubre logout manual, logout forzado y deep links. Acá solo se muestra una
 * superficie con el mismo fondo que el login, para que la transición no parpadee.
 * La guarda primaria está en app/index.tsx.
 */

import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomTabBar } from '@/components/CustomTabBar';
import { useAuth } from '@/features/auth/state/AuthContext';
import { useIsProvider } from '@/hooks/queries/useProfileQuery';
import { useThemeColors } from '@/stores/theme.store';
import { AuthBackdrop } from '@/core/design-system';
import { ErrorBoundary } from '@/core/components/ErrorBoundary';

export default function TabsLayout() {
  const { authLoaded, isAuthenticated } = useAuth();
  const isProvider = useIsProvider();
  const tc = useThemeColors();

  if (!authLoaded) return null;

  if (!isAuthenticated) return <AuthBackdrop />;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: tc.bg }]}
      edges={['left', 'right']}
    >
      <ErrorBoundary>
        <Tabs
          // Hidden routes (services catalog) are reached by push: `history` makes
          // back return to the tab the user came from instead of the first tab.
          backBehavior="history"
          screenOptions={{
            headerShown: false,
            sceneStyle: { backgroundColor: tc.bg },
            tabBarHideOnKeyboard: true,
            // CustomTabBar ya flota con position:'absolute' propio — sin esto,
            // Navigation reserva su altura medida en cada escena y les resta
            // ~91px de alto real. Reels usa `height: H` fijo para el paging
            // y quedaba cortado por ese espacio reservado de más.
            tabBarStyle: { position: 'absolute' },
          }}
          tabBar={(props) => (
            <CustomTabBar
              {...props}
            />
          )}
        >
          <Tabs.Screen name="index"    options={{ title: 'Inicio'    }} />
          {/* Catalog + category/provider stack: hidden from the bar, still routable. */}
          <Tabs.Screen name="services" options={{ title: 'Servicios', href: null }} />
          <Tabs.Screen name="orders"   options={{ title: isProvider ? 'Órdenes' : 'Pedidos' }} />
          <Tabs.Screen name="reels"    options={{ title: 'Reels'     }} />
          <Tabs.Screen name="chat"     options={{ title: 'Mensajes'  }} />
          <Tabs.Screen name="profile"  options={{ title: 'Perfil'    }} />
        </Tabs>
      </ErrorBoundary>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
