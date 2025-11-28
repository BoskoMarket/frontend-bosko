import React from "react";
import { Redirect, Tabs } from "expo-router";
import { AuthProvider } from "@/context/AuthContext";
import { OrdersProvider } from "@/context/OdersContext";
import { PaymentsProvider } from "@/context/PaymentContext";
import { PostsProvider } from "@/context/PostsContext";
import { ReviewsProvider } from "@/context/ReviewsContext";
import { ServicesProvider } from "@/context/ServicesContext";
import { UserProvider } from "@/context/UserContext";
import { BoskoDataProvider } from "@/src/shared/state/DataContext";
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
