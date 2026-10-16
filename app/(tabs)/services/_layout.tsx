import { Stack } from "expo-router";
import { useThemeColors } from "@/core/design-system";

export default function ServicesLayout() {
  const tc = useThemeColors();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerTintColor: tc.text,
        headerTitleAlign: "center",
        headerShadowVisible: false,
        contentStyle: { backgroundColor: tc.bg },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="category/[id]"
        options={{
          animation: "slide_from_right",
          title: "Servicios",
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="provider/[id]"
        options={{
          animation: "slide_from_right",
          title: "Perfil",
          presentation: "card",
        }}
      />
    </Stack>
  );
}
