import React, { useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import * as NavigationBar from "expo-navigation-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { Stack, router, useSegments, useRootNavigationState } from "expo-router";
import * as Notifications from "expo-notifications";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { FONT_ASSETS } from "@/core/design-system/brand/fonts";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/core/query/queryClient";
import { setupQueryNetworkFocus } from "@/core/query/networkFocus";
import { AuthProvider, useAuth } from "@/features/auth/state/AuthContext";
import { ToastRoot } from "@/core/components/Toast";
import { BootSplash, DialogRoot, useNavigationTheme, useThemeColors } from "@/core/design-system";
import { ThemeProvider } from "@react-navigation/native";
import { AppBackground } from "@/core/components/AppBackground";
import { usePushNotificationSetup } from "@/hooks/usePushNotificationSetup";
import { NotificationsModalRoot } from "@/features/notifications/screens/NotificationsScreen";
import { isChatNotificationType, resolveNotificationRoute } from "@/features/notifications/utils/notificationRoute";
import { lookupOrderIdByConversation } from "@/features/notifications/utils/conversationOrderLookup";
import type { Notification } from "@/features/notifications/services/notifications.service";
import { openNotifications } from "@/stores/notificationsUI.store";
import { ErrorBoundary } from "@/core/components/ErrorBoundary";
import { BiometricLockGate } from "@/core/components/BiometricLockGate";
import { OfflineBanner } from "@/core/components/OfflineBanner";
import { UpdateBanner } from "@/core/components/UpdateBanner";
import { useAppConfigSettled, useAppGate } from "@/features/appConfig/hooks/useAppGate";
import { useBootReady } from "@/hooks/useBootReady";
import { AppGateScreen } from "@/features/appConfig/screens/AppGateScreen";
import { initSentry } from "@/core/monitoring/sentry";
import { useChatSync } from "@/features/chat/useChatSync";

SplashScreen.preventAutoHideAsync().catch(() => {});
initSentry();
setupQueryNetworkFocus();

// Navigating before the root Stack mounts throws inside expo-router (and would be swallowed
// below), so a tap that arrives early — e.g. the notification that cold-started the app while
// the session is still restoring — is held until `ready` and then replayed.
function useNotificationNavigation(ready: boolean) {
  const responseListener = useRef<Notifications.EventSubscription | null>(null);
  const pending = useRef<Notifications.NotificationResponse | null>(null);
  const readyRef = useRef(ready);
  readyRef.current = ready;

  useEffect(() => {
    const handle = (response: Notifications.NotificationResponse) => {
      if (readyRef.current) handleNotificationResponse(response);
      else pending.current = response;
    };

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) handle(response);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(handle);

    return () => responseListener.current?.remove();
  }, []);

  useEffect(() => {
    if (!ready || !pending.current) return;
    const response = pending.current;
    pending.current = null;
    handleNotificationResponse(response);
  }, [ready]);
}

function handleNotificationResponse(response: Notifications.NotificationResponse) {
  const data = response.notification.request.content.data as Record<string, string> | undefined;
  if (!data) return;

  try {
    if (data.type === 'order' && data.orderId) {
      router.push({ pathname: '/orders/[id]', params: { id: data.orderId } });
    } else if (isChatNotificationType(data.type) && data.orderId) {
      router.push({ pathname: '/chat/[id]', params: { id: data.orderId } });
    } else if (isChatNotificationType(data.type) && data.conversationId) {
      // Only the conversation id is known: resolve it to the ORDER id (never use it as the route param).
      void resolveNotificationRoute(
        { id: '', userId: '', title: '', body: '', read: false, createdAt: '', type: 'chat', data: { conversationId: data.conversationId } } as Notification,
        lookupOrderIdByConversation,
      ).then((route) => { try { if (route) router.push(route as any); } catch {} });
    } else if (data.type === 'review' && data.orderId) {
      router.push({ pathname: '/orders/[id]', params: { id: data.orderId } });
    } else {
      openNotifications();
    }
  } catch {}
}

function RootLayoutNav() {
  const { authLoaded, isAuthenticated } = useAuth();
  const tc = useThemeColors();
  const segments = useSegments();
  const navigation = useRootNavigationState();
  useEffect(() => {
    if (!navigation?.key || !authLoaded || isAuthenticated) return;
    if (['(tabs)', 'orders', 'chat', 'admin', 'service-form', 'search', 'upload-reel'].includes(segments[0] ?? '')) router.replace('/login');
  }, [authLoaded, isAuthenticated, segments, navigation?.key]);
  useChatSync();
  useNotificationNavigation(authLoaded && !!navigation?.key);
  usePushNotificationSetup();

  // No route renders until the session is restored (the BootSplash covers this window).
  if (!authLoaded) return null;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: tc.bg } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="login" />
      <Stack.Screen name="welcome-video" />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="chat" options={{ headerShown: false }} />
      <Stack.Screen name="orders" options={{ headerShown: false }} />
      <Stack.Screen name="service-form" options={{ presentation: 'modal', headerShown: false }} />
      <Stack.Screen name="upload-reel" options={{ headerShown: false }} />
    </Stack>
  );
}

function ThemedRoot() {
  const gate = useAppGate();
  const navTheme = useNavigationTheme();
  const { authLoaded } = useAuth();
  const configSettled = useAppConfigSettled();
  const bootReady = useBootReady({ authLoaded, configSettled });
  const [splashDone, setSplashDone] = useState(false);

  const content = gate.blocked ? (
    <AppBackground>
      <AppGateScreen state={gate} />
    </AppBackground>
  ) : (
    <AppBackground>
      <OfflineBanner />
      <BiometricLockGate>
        <RootLayoutNav />
      </BiometricLockGate>
      <UpdateBanner />
      <ToastRoot />
      <DialogRoot />
      <NotificationsModalRoot />
    </AppBackground>
  );

  return (
    <ThemeProvider value={navTheme}>
      <View style={styles.flex}>
        {content}
        {!splashDone && (
          <BootSplash
            ready={bootReady}
            onFirstLayout={() => SplashScreen.hideAsync().catch(() => {})}
            onHidden={() => setSplashDone(true)}
          />
        )}
      </View>
    </ThemeProvider>
  );
}

export default function _layout() {
  const [fontsLoaded, fontError] = useFonts(FONT_ASSETS);

  // The native splash is released by BootSplash once it has laid out (seamless hand-off).
  // Safety net so a failure before that can never leave the native splash up forever.
  useEffect(() => {
    const timer = setTimeout(() => SplashScreen.hideAsync().catch(() => {}), 6000);
    return () => clearTimeout(timer);
  }, []);

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
