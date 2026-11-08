import { Redirect } from 'expo-router';
import { FEATURES } from '@/core/config/features';
import { PaymentSuccessScreen } from '@/features/orders/screens/PaymentSuccessScreen';

export default function PaymentSuccessRoute() {
  if (!FEATURES.payments) return <Redirect href="/(tabs)/orders" />;
  return <PaymentSuccessScreen />;
}
