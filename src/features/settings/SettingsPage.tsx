import React, { useState } from "react";
import { Text, TextInput, StyleSheet, Button, ScrollView, View } from "react-native";
import { useBoskoData } from "@/src/shared/state/DataContext";
import { t } from "@/src/shared/i18n";

export const SettingsPage = () => {
  const { currentUser } = useBoskoData();
  const [form, setForm] = useState({
    name: currentUser.user?.name ?? "",
    avatar: currentUser.user?.avatar ?? "",
    bio: currentUser.user?.bio ?? "",
  });

  const onChange = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const onSave = async () => {
    await currentUser.update(form);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{t("settingsTitle")}</Text>
      {[{ label: t("userName"), key: "name" }, { label: t("avatarUrl"), key: "avatar" }, { label: t("bio"), key: "bio" }].map(
        (item) => (
          <View key={item.key}>
            <Text style={styles.label}>{item.label}</Text>
            <TextInput
              style={styles.input}
              value={form[item.key]}
              onChangeText={(value) => onChange(item.key, value)}
              accessibilityLabel={item.label}
              multiline={item.key === "bio"}
            />
          </View>
        )
      )}
      <Button title={t("save")} onPress={onSave} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    gap: 12,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
  },
  label: {
    fontWeight: "600",
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 10,
  },
});
