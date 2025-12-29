import React from "react";
import { Redirect, Tabs } from "expo-router";
import { AuthProvider } from "@/src/auth/hooks/AuthContext";
import { OrdersProvider } from "@/src/ticketing/hooks/OdersContext";
import { PaymentsProvider } from "@/src/pagos/hooks/PaymentContext";
import { PostsProvider } from "@/src/ticketing/hooks/PostsContext";
import { ReviewsProvider } from "@/src/ticketing/hooks/ReviewsContext";
import { ServicesProvider } from "@/src/ticketing/hooks/ServicesContext";
import { UserProvider } from "@/src/usuarios/hooks/UserContext";
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
