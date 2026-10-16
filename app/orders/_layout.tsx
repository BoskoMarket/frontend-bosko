import { Stack } from 'expo-router';
import { useThemeColors } from '@/core/design-system';

export default function OrdersLayout() {
  const tc = useThemeColors();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: tc.bg } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="checkout" />
      <Stack.Screen name="payment-success" />
      <Stack.Screen name="status" />
      <Stack.Screen name="quote" />
      <Stack.Screen name="review" />
    </Stack>
  );
}
