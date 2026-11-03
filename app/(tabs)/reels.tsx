import { Redirect } from 'expo-router';
import { FEATURES } from '@/core/config/features';
import ReelsScreen from '@/features/reels/screens/ReelsScreen';

export default function ReelsRoute() {
  if (!FEATURES.reels) return <Redirect href="/(tabs)" />;
  return <ReelsScreen />;
}
