import { View, StyleSheet } from "react-native";
import React from "react";
import { useLocalSearchParams } from "expo-router";
import EditPhoto from "../components/edit/EditPhoto";
import EditDescription from "../components/edit/EditDescription";
import EditPayments from "../components/edit/EditPayments";
import EditNotifications from "../components/edit/EditNotifications";
import EditEmail from "../components/edit/EditMail";
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { useThemeColors } from '@/stores/theme.store';

export default function ProfileEditScreen() {
  const { type } = useLocalSearchParams<{ type: string }>();
  const tc = useThemeColors();

  const renderComponent = () => {
    switch (type) {
      case "photo":
        return <EditPhoto />;
      case "description":
        return <EditDescription />;
      case "payments":
        return <EditPayments />;
      case "notifications":
        return <EditNotifications />;
      case "email":
        return <EditEmail />;
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: tc.bg }]}>
      <AnimatedBackground variant="minimal" />
      {renderComponent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
});
