import React, { useState } from "react";
import { View, Text, StyleSheet, Button, Alert, ScrollView } from "react-native";
import { useBoskoData } from "@/src/shared/state/DataContext";
import { ServiceCard } from "@/src/shared/ui/ServiceCard";
import { ServiceForm } from "@/src/features/services/components/ServiceForm";
import { t } from "@/src/shared/i18n";
import { SettingsButton } from "@/src/shared/ui/SettingsButton";
import { useRouter } from "expo-router";

export const ProfilePage = () => {
  const { serviceManager, currentUser } = useBoskoData();
  const [editing, setEditing] = useState(false);
  const router = useRouter();

  const onDelete = () => {
    Alert.alert(t("deleteService"), t("confirmDeleteService"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("deleteService"),
        style: "destructive",
        onPress: () => serviceManager.remove(),
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{t("profileHeaderTitle")}</Text>
          <Text style={styles.subtitle}>{currentUser.user?.name}</Text>
        </View>
        <SettingsButton onPress={() => router.push("/(tabs)/settings")} />
      </View>

      {serviceManager.service ? (
        <View>
          <ServiceCard service={serviceManager.service} />
          <Button title={t("editService")} onPress={() => setEditing((prev) => !prev)} />
          <View style={{ height: 8 }} />
          <Button title={t("deleteService")} color="#b91c1c" onPress={onDelete} />
        </View>
      ) : (
        <Button title={t("createService")} onPress={() => setEditing(true)} />
      )}

      {editing && (
        <View style={styles.formContainer}>
          <ServiceForm
            initialService={serviceManager.service}
            onSubmit={async (payload) => {
              await serviceManager.createOrUpdate(payload);
              setEditing(false);
            }}
          />
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
  },
  subtitle: {
    color: "#6b7280",
  },
  formContainer: {
    marginTop: 16,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
  },
});
