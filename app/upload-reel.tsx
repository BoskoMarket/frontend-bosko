import { Redirect } from 'expo-router';
import { FEATURES } from '@/core/config/features';
import ReelUploadScreen from '@/features/reels/screens/ReelUploadScreen';

export default function UploadReelRoute() {
  if (!FEATURES.reels) return <Redirect href="/(tabs)" />;
  return <ReelUploadScreen />;
}
