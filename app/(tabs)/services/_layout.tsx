import { Stack } from "expo-router";
import { useThemeColors } from "@/core/design-system";

export default function ServicesLayout() {
  const tc = useThemeColors();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: tc.bg } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="category/[id]" options={{ animation: "slide_from_right", presentation: "card" }} />
      <Stack.Screen name="provider/[id]" options={{ animation: "slide_from_right", presentation: "card" }} />
    </Stack>
  );
}
