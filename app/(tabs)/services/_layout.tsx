import { Stack } from "expo-router";
import { TOKENS } from "@/core/design-system/tokens";

export default function ServicesLayout() {
  return (
    <Stack
    // screenOptions={{
    //   headerTintColor: TOKENS.color.text,
    //   headerTitleAlign: "center",
    //   headerShadowVisible: false,
    //   contentStyle: { backgroundColor: TOKENS.color.bg },
    // }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
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
