import { View, Text } from "react-native";
import React from "react";
import { Redirect, Slot, Tabs } from "expo-router";
import { useAuth } from "@/context/AuthContext";

export default function _layout() {
  const { authLoaded, authState } = useAuth();
  return <Redirect href="/(tabs)" />;
  if (!authLoaded) return null;
  if (authState.token) return <Redirect href="/(tabs)" />;

  return <Slot />;
}
