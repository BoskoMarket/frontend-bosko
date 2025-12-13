import React from "react";
import { Stack } from "expo-router";
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
