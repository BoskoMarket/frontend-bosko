import { View, StyleSheet } from "react-native";
import React from "react";
import { useLocalSearchParams } from "expo-router";
import EditPhoto from "@/src/usuarios/components/profile/edit/EditPhoto";
import EditDescription from "@/src/usuarios/components/profile/edit/EditDescription";
import EditPassword from "@/src/usuarios/components/profile/edit/EditPass";
import EditUsername from "@/src/usuarios/components/profile/edit/EditUserName";
import EditPayments from "@/src/pagos/components/EditPayments";
import EditNotifications from "@/src/usuarios/components/profile/edit/EditNotifications";
import EditEmail from "@/src/usuarios/components/profile/edit/EditMail";

export default function EditGeneric() {
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
