import { Redirect } from "expo-router";
import { FEATURES } from "@/core/config/features";
import PlansScreen from "@/features/plans/screens/PlansScreen";

export default function PlansRoute() {
  if (!FEATURES.payments) return <Redirect href="/(tabs)/profile" />;
  return <PlansScreen />;
}
