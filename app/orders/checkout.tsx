import { Redirect } from 'expo-router';
import { FEATURES } from '@/core/config/features';
import { CheckoutScreen } from '@/features/orders/screens/CheckoutScreen';

export default function CheckoutRoute() {
  if (!FEATURES.payments) return <Redirect href="/(tabs)/orders" />;
  return <CheckoutScreen />;
}
