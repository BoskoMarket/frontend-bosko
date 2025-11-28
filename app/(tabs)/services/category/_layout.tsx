import React from "react";
import { Stack } from "expo-router";

export default function LayoutCategory() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        title: "Categoría",
      }}
    />
  );
}
