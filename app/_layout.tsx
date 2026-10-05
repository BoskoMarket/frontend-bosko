import React, { useEffect, useRef } from "react";
import { Platform, StyleSheet } from "react-native";
import * as NavigationBar from "expo-navigation-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { Stack, router, useSegments, useRootNavigationState } from "expo-router";
import * as Notifications from "expo-notifications";
import * as SplashScreen from "expo-splash-screen";
import {
  useFonts,
  Archivo_600SemiBold,
  Archivo_700Bold,
  Archivo_800ExtraBold,
} from "@expo-google-fonts/archivo";
import { JetBrainsMono_500Medium } from "@expo-google-fonts/jetbrains-mono";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/core/query/queryClient";
import { setupQueryNetworkFocus } from "@/core/query/networkFocus";
import { AuthProvider, useAuth } from "@/features/auth/state/AuthContext";
import { ToastRoot } from "@/core/components/Toast";
import { AppBackground } from "@/core/components/AppBackground";
import { usePushNotificationSetup } from "@/hooks/usePushNotificationSetup";
import { NotificationsModalRoot } from "@/features/notifications/screens/NotificationsScreen";
import { openNotifications } from "@/stores/notificationsUI.store";
import { ErrorBoundary } from "@/core/components/ErrorBoundary";
import { BiometricLockGate } from "@/core/components/BiometricLockGate";
import { OfflineBanner } from "@/core/components/OfflineBanner";
import { UpdateBanner } from "@/core/components/UpdateBanner";
import { useAppGate } from "@/features/appConfig/hooks/useAppGate";
import { AppGateScreen } from "@/features/appConfig/screens/AppGateScreen";
import { initSentry } from "@/core/monitoring/sentry";
import { useChatSync } from "@/features/chat/useChatSync";

SplashScreen.preventAutoHideAsync().catch(() => {});
initSentry();
setupQueryNetworkFocus();

function useNotificationNavigation() {
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) handleNotificationResponse(response);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);

    return () => responseListener.current?.remove();
  }, []);
}

function handleNotificationResponse(response: Notifications.NotificationResponse) {
  const data = response.notification.request.content.data as Record<string, string> | undefined;
  if (!data) return;

  try {
    if (data.type === 'order' && data.orderId) {
      router.push({ pathname: '/orders/[id]', params: { id: data.orderId } });
    } else if (data.type === 'chat' && data.orderId) {
      router.push({ pathname: '/chat/[id]', params: { id: data.orderId } });
    } else if (data.type === 'review' && data.orderId) {
      router.push({ pathname: '/orders/[id]', params: { id: data.orderId } });
    } else {
      openNotifications();
    }
  } catch {}
}

function RootLayoutNav() {
  const { isAuthenticated } = useAuth();
  const segments = useSegments();
  const navigation = useRootNavigationState();
  useEffect(() => {
    if (!navigation?.key || isAuthenticated) return;
    if (['(tabs)', 'orders', 'chat', 'admin', 'service-form', 'search'].includes(segments[0] ?? '')) router.replace('/login');
  }, [isAuthenticated, segments, navigation?.key]);
  useChatSync();
  useNotificationNavigation();
  usePushNotificationSetup();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="login" />
      <Stack.Screen name="welcome-video" />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="chat" options={{ headerShown: false }} />
      <Stack.Screen name="orders" options={{ headerShown: false }} />
      <Stack.Screen name="service-form" options={{ presentation: 'modal', headerShown: false }} />
    </Stack>
  );
}

function ThemedRoot() {
  const gate = useAppGate();

  if (gate.blocked) {
    return (
      <AppBackground>
        <AppGateScreen state={gate} />
      </AppBackground>
    );
  }

  return (
    <AppBackground>
      <OfflineBanner />
      <BiometricLockGate>
        <RootLayoutNav />
      </BiometricLockGate>
      <UpdateBanner />
      <ToastRoot />
      <NotificationsModalRoot />
    </AppBackground>
  );
}

export default function _layout() {
  const [fontsLoaded, fontError] = useFonts({
    Archivo_600SemiBold,
    Archivo_700Bold,
    Archivo_800ExtraBold,
    JetBrainsMono_500Medium,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    NavigationBar.setVisibilityAsync("hidden").catch(() => {});
    NavigationBar.setBehaviorAsync("inset-swipe").catch(() => {});
  }, []);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={styles.flex}>
      <ErrorBoundary>
        <BottomSheetModalProvider>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <ThemedRoot />
            </AuthProvider>
          </QueryClientProvider>
        </BottomSheetModalProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
