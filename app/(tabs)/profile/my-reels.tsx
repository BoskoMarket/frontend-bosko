import { Redirect } from 'expo-router';
import { FEATURES } from '@/core/config/features';
import MyReelsScreen from '@/features/reels/screens/MyReelsScreen';

export default function MyReelsRoute() {
  if (!FEATURES.reels) return <Redirect href="/(tabs)" />;
  return <MyReelsScreen />;
}
