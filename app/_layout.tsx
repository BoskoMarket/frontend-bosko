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

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

export default function _layout() {
  return (
    <AuthProvider>
      <UserProvider>
        <PaymentsProvider>
          <OrdersProvider>
            <PostsProvider serviceId="global">
              <ReviewsProvider serviceId="global">
                <ServicesProvider>
                  <BoskoDataProvider>
                    {/* <Redirect href="/login" /> */}
                    <Tabs
                      screenOptions={{
                        headerShown: false,
                        tabBarStyle: {
                          display: "none",
                        },
                      }}
                    />
                  </BoskoDataProvider>
                </ServicesProvider>
              </ReviewsProvider>
            </PostsProvider>
          </OrdersProvider>
        </PaymentsProvider>
      </UserProvider>
    </AuthProvider>
  );
}
