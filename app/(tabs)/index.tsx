import DashboardScreen from "@/features/servicesUser/screens/DashboardScreen";
import { ComponentShowcase } from "@/core/design-system/showcase/ComponentShowcase";

// TEMP: component showcase for design review — revert before merging
export default __DEV__ ? ComponentShowcase : DashboardScreen;
