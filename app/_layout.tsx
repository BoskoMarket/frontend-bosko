import React from "react";
import { Redirect, Stack, Tabs } from "expo-router";
import { AuthProvider, useAuth } from "@/features/auth/state/AuthContext";
import { ProfileProvider } from "@/features/servicesUser/state/ProfileContext";
import { OrdersProvider } from "@/features/orders/state/OdersContext";
import { PaymentsProvider } from "@/features/payments/state/PaymentContext";
import { PostsProvider } from "@/features/servicesUser/state/PostsContext";
import { ReviewsProvider } from "@/features/servicesUser/state/ReviewsContext";
import { ServicesProvider } from "@/features/servicesUser/state/ServicesContext";
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from "react-native-reanimated";
import { UserProvider } from "@/features/users/state/UserContext";
import { UsersProvider } from "@/contexts/UsersContext";
import { CategoriesProvider } from "@/contexts/CategoriesContext";
import { ProvidersProvider } from "@/contexts/ProvidersContext";
import { SearchProvider } from "@/contexts/SearchContext";

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

function RootLayoutNav() {
  const { authLoaded } = useAuth();

  // Show nothing while checking auth
  if (!authLoaded) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="login" />
      <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function _layout() {
  return (
    <AuthProvider>
      <ProfileProvider>
        <UsersProvider>
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
        </UsersProvider>
      </ProfileProvider>
    </AuthProvider>
  );
}
