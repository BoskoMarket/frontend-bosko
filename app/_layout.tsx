import React, { useEffect } from "react";
import { Redirect, Tabs, Stack, useRouter, useSegments } from "expo-router";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { OrdersProvider } from "@/context/OdersContext";
import { PaymentsProvider } from "@/context/PaymentContext";
import { PostsProvider } from "@/context/PostsContext";
import { ReviewsProvider } from "@/context/ReviewsContext";
import { CategoriesProvider } from "@/src/contexts/CategoriesContext";
import { ProvidersProvider } from "@/src/contexts/ProvidersContext";
import { SearchProvider } from "@/src/contexts/SearchContext";
import { BoskoDataProvider } from "@/src/shared/state/DataContext";

import { UsersProvider } from "@/src/contexts/UsersContext";
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from "react-native-reanimated";
import { ServicesProvider } from "@/context/ServicesContext";
import { ProfileProvider } from "@/context/ProfileContext";

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

function RootLayoutNav() {
  const { authState, authLoaded } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!authLoaded) return;

    const inAuthGroup = segments[0] === '(auth)' || segments[0] === 'login';

    if (
      // If the user is not signed in and the initial segment is not anything in the auth group.
      !authState.token &&
      !inAuthGroup
    ) {
      // Redirect to the sign-in page.
      router.replace('/login/LogInView');
    } else if (authState.token && inAuthGroup) {
      // Redirect away from the sign-in page.
      router.replace('/(tabs)');
    }
  }, [authState.token, segments, authLoaded]);

  // Show generic loading screen while checking auth
  if (!authLoaded) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="login" />
    </Stack>
  );
}

export default function _layout() {
  return (
    <AuthProvider>
      <ProfileProvider>
        <UsersProvider>
          <BoskoDataProvider>
            <CategoriesProvider>
              <ProvidersProvider>
                <ServicesProvider>
                  <SearchProvider>
                    <PaymentsProvider>
                      <OrdersProvider>
                        <PostsProvider serviceId="global">
                          <ReviewsProvider serviceId="global">
                            <RootLayoutNav />
                          </ReviewsProvider>
                        </PostsProvider>
                      </OrdersProvider>
                    </PaymentsProvider>
                  </SearchProvider>
                </ServicesProvider>
              </ProvidersProvider>
            </CategoriesProvider>
          </BoskoDataProvider>
        </UsersProvider>
      </ProfileProvider>
    </AuthProvider>
  );
}
