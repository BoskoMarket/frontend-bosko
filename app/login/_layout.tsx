import { View, Text } from "react-native";
import React from "react";
import { Redirect, Slot, Tabs } from "expo-router";
import { useAuth } from "@/auth/state/AuthContext";

export default function _layout() {
  const { authLoaded, authState } = useAuth();

  if (authLoaded && authState.token) {
    return <Redirect href="/(tabs)" />;
  }
  return <Redirect href="/login/LogInView" />;
}
