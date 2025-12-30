import React, { useEffect } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { ServiceCard } from "@/src/shared/ui/ServiceCard";
import { useProfile } from "@/features/profile/state/ProfileContext";

export const ProfileDetailPage = () => {
  const { profile, isLoading, refreshProfile } = useProfile();

  useEffect(() => {
    // Refresh to ensure latest data from backend
    refreshProfile();
  }, [refreshProfile]);

  if (isLoading && !profile) return null;
  if (!profile) return null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16 }}
    >
      <Text style={styles.title}>
        {[profile.firstName, profile.lastName].filter(Boolean).join(" ") ||
          profile.username ||
          "Perfil"}
      </Text>
      <Text style={styles.subtitle}>{profile.bio || ""}</Text>
      <Text style={styles.subtitle}>{profile.email}</Text>
      <Text style={styles.subtitle}>{profile.location || ""}</Text>
      {/* Si hay servicios asociados, mostrarlos; mientras tanto, placeholder */}
      <Text style={styles.subtitle}>Sin servicios publicados.</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  title: { fontSize: 28, fontWeight: "700" },
  subtitle: { color: "#6b7280", marginTop: 4 },
});
