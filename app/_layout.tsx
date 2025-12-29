import React from "react";
import { Redirect, Tabs } from "expo-router";
import { AuthProvider } from "@/features/auth/state/AuthContext";
import { OrdersProvider } from "@/features/orders/state/OdersContext";
import { PaymentsProvider } from "@/features/payments/state/PaymentContext";
import { PostsProvider } from "@/features/servicesUser/state/PostsContext";
import { ReviewsProvider } from "@/features/servicesUser/state/ReviewsContext";
import { ServicesProvider } from "@/features/servicesUser/state/ServicesContext";
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from "react-native-reanimated";
import { BoskoDataProvider } from "@/shared/state/DataContext";
import { UserProvider } from "@/features/users/state/UserContext";
import { UsersProvider } from "@/contexts/UsersContext";
import { CategoriesProvider } from "@/contexts/CategoriesContext";
import { ProvidersProvider } from "@/contexts/ProvidersContext";
import { SearchProvider } from "@/contexts/SearchContext";

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

export default function _layout() {
  return (
    <AuthProvider>
      <UsersProvider>
        <CategoriesProvider>
          <ProvidersProvider>
            <ServicesProvider>
              <SearchProvider>
                <PaymentsProvider>
                  <OrdersProvider>
                    <PostsProvider serviceId="global">
                      <ReviewsProvider serviceId="global">
                        {/* <Redirect href="/login" /> */}
                        <Tabs
                          screenOptions={{
                            headerShown: false,
                            tabBarStyle: {
                              display: "none",
                            },
                          }}
                        />
                      </ReviewsProvider>
                    </PostsProvider>
                  </OrdersProvider>
                </PaymentsProvider>
              </SearchProvider>
            </ServicesProvider>
          </ProvidersProvider>
        </CategoriesProvider>
      </UsersProvider>
    </AuthProvider>
  );
}
