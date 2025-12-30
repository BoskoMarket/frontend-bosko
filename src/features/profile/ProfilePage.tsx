import React, { useEffect } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { t } from "@/src/shared/i18n";
import { SettingsButton } from "@/src/shared/ui/SettingsButton";
import { useRouter } from "expo-router";
import { useProfile } from "@/features/profile/state/ProfileContext";

export const ProfilePage = () => {
  const { profile, isLoading, refreshProfile } = useProfile();
  const router = useRouter();

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  if (isLoading && !profile) return null;
  if (!profile) return null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16 }}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{t("profileHeaderTitle")}</Text>
          <Text style={styles.subtitle}>
            {[profile.firstName, profile.lastName].filter(Boolean).join(" ") ||
              profile.username ||
              ""}
          </Text>
        </View>
        <SettingsButton
          onPress={() => router.push("/(tabs)/profile/EditProfile")}
        />
      </View>

      <Text style={styles.subtitle}>{profile.bio || ""}</Text>
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
});
