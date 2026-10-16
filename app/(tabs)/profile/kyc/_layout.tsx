import { Stack } from 'expo-router';
import { useThemeColors } from '@/core/design-system';

export default function KYCLayout() {
  const tc = useThemeColors();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: tc.bg } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="intro" />
      <Stack.Screen name="document" />
    </Stack>
  );
}
