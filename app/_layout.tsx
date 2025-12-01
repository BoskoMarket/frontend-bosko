import React from "react";
import { Redirect, Tabs } from "expo-router";
import { AuthProvider } from "@/context/AuthContext";
import { OrdersProvider } from "@/context/OdersContext";
import { PaymentsProvider } from "@/context/PaymentContext";
import { PostsProvider } from "@/context/PostsContext";
import { ReviewsProvider } from "@/context/ReviewsContext";
import { CategoriesProvider } from "@/src/contexts/CategoriesContext";
import { ProvidersProvider } from "@/src/contexts/ProvidersContext";
import { SearchProvider } from "@/src/contexts/SearchContext";
import { ServicesProvider } from "@/src/contexts/ServicesContext";
import { UsersProvider } from "@/src/contexts/UsersContext";
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from "react-native-reanimated";

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
