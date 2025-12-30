import React, { useEffect, useState } from "react";
import {
  Text,
  TextInput,
  StyleSheet,
  Button,
  ScrollView,
  View,
} from "react-native";
import { t } from "@/src/shared/i18n";
import { useProfile } from "@/features/profile/state/ProfileContext";

export const SettingsPage = () => {
  const { profile, isLoading, refreshProfile, updateProfile } = useProfile();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    avatarUrl: "",
    bio: "",
  });

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  useEffect(() => {
    if (!profile) return;
    setForm({
      firstName: profile.firstName || "",
      lastName: profile.lastName || "",
      avatarUrl: profile.avatarUrl || "",
      bio: profile.bio || "",
    });
  }, [profile]);

  const onChange = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const onSave = async () => {
    await updateProfile({
      firstName: form.firstName,
      lastName: form.lastName,
      avatarUrl: form.avatarUrl,
      bio: form.bio,
    });
  };

  if (isLoading && !profile) return null;
  if (!profile) return null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{t("settingsTitle")}</Text>
      {[
        { label: t("userName"), key: "name" },
        { label: t("avatarUrl"), key: "avatar" },
        { label: t("bio"), key: "bio" },
      ].map((item) => (
        <View key={item.key}>
          <Text style={styles.label}>{item.label}</Text>
          <TextInput
            style={styles.input}
            value={(form as any)[item.key]}
            onChangeText={(value) =>
              onChange(item.key as keyof typeof form, value)
            }
            accessibilityLabel={item.label}
            multiline={item.key === "bio"}
          />
        </View>
      ))}
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
