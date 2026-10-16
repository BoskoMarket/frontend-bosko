/**
 * Layout de las tabs autenticadas.
 *
 * Actúa como guarda secundaria: si alguien llega a esta ruta sin sesión
 * (deep link, recarga en dev, etc.) es redirigido al login.
 * La guarda primaria está en app/index.tsx.
 */

import { Redirect, Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomTabBar } from '@/components/CustomTabBar';
import { useAuth } from '@/features/auth/state/AuthContext';
import { useIsProvider } from '@/hooks/queries/useProfileQuery';
import { useThemeColors } from '@/stores/theme.store';
import { ErrorBoundary } from '@/core/components/ErrorBoundary';

export default function TabsLayout() {
  const { authLoaded, isAuthenticated } = useAuth();
  const isProvider = useIsProvider();
  const tc = useThemeColors();

  if (!authLoaded) return null;

  if (!isAuthenticated) return <Redirect href="/login" />;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: tc.bg }]}
      edges={['left', 'right']}
    >
      <ErrorBoundary>
        <Tabs
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
          <Tabs.Screen name="services" options={{ title: 'Servicios' }} />
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
