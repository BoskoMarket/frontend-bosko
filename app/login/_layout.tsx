import React from "react";
import { Redirect, Slot } from "expo-router";
import { useAuth } from "@/features/auth/state/AuthContext";

export default function LoginLayout() {
  const { authLoaded, authState } = useAuth();

  if (!authLoaded) return null;
  if (authState.token) return <Redirect href="/(tabs)" />;

  return <Slot />;
}
