import { View, StyleSheet } from "react-native";
import React from "react";
import { useLocalSearchParams } from "expo-router";
import EditPhoto from "@/users/components/edit/EditPhoto";
import EditDescription from "@/users/components/edit/EditDescription";
import EditPassword from "@/users/components/edit/EditPass";
import EditUsername from "@/users/components/edit/EditUserName";
import EditPayments from "@/users/components/edit/EditPayments";
import EditNotifications from "@/users/components/edit/EditNotifications";
import EditEmail from "@/users/components/edit/EditMail";

export default function ProfileEditScreen() {
  const { type } = useLocalSearchParams<{ type: string }>();

  const renderComponent = () => {
    switch (type) {
      case "photo":
        return <EditPhoto />;
      case "description":
        return <EditDescription />;
      case "password":
        return <EditPassword />;
      case "username":
        return <EditUsername />;
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

  return <View style={styles.container}>{renderComponent()}</View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
});
