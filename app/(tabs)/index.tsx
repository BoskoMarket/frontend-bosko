import DashboardScreen from "@/features/servicesUser/screens/DashboardScreen";
import { ComponentShowcase } from "@/core/design-system/showcase/ComponentShowcase";

// Dev builds open on the component showcase; release builds (__DEV__ === false) show the dashboard.
export default __DEV__ ? ComponentShowcase : DashboardScreen;
