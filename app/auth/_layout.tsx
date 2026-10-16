import { Stack } from "expo-router";
import { useThemeColors } from '@/core/design-system';

export default function AuthModalLayout() {
  const tc = useThemeColors();
  return (
    <Stack screenOptions={{ headerShown: false, presentation: "modal", contentStyle: { backgroundColor: tc.bg } }}>
      <Stack.Screen name="verify-email" />
      <Stack.Screen name="verify-reset-code" />
      <Stack.Screen name="reset-password" />
    </Stack>
  );
}
