import React from "react";
import { Redirect, Tabs } from "expo-router";
import { AuthProvider } from "@/auth/state/AuthContext";
import { OrdersProvider } from "@/orders/state/OdersContext";
import { PaymentsProvider } from "@/payments/state/PaymentContext";
import { PostsProvider } from "@/services/state/PostsContext";
import { ReviewsProvider } from "@/services/state/ReviewsContext";
import { ServicesProvider } from "@/services/state/ServicesContext";
import { UserProvider } from "@/users/state/UserContext";
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
      <UserProvider>
        <PaymentsProvider>
          <OrdersProvider>
            <PostsProvider serviceId="global">
              <ReviewsProvider serviceId="global">
                <ServicesProvider>
                  {/* <Redirect href="/login" /> */}
                  <Tabs
                    screenOptions={{
                      headerShown: false,
                      tabBarStyle: {
                        display: "none",
                      },
                    }}
                  />
                </ServicesProvider>
              </ReviewsProvider>
            </PostsProvider>
          </OrdersProvider>
        </PaymentsProvider>
      </UserProvider>
    </AuthProvider>
  );
}
