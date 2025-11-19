import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useBoskoData } from "@/src/shared/state/DataContext";
import { ServiceCard } from "@/src/shared/ui/ServiceCard";
import { Service, User } from "@/src/types";

export const ProfileDetailPage = () => {
  const params = useLocalSearchParams<{ id: string }>();
  const { getProfile } = useBoskoData();
  const [state, setState] = useState<{ user?: User; service?: Service }>();

  useEffect(() => {
    if (!params.id) return;
    getProfile(params.id as string).then((profile) => setState(profile));
  }, [params.id, getProfile]);

  if (!params.id) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.title}>{state?.user?.name ?? ""}</Text>
      <Text style={styles.subtitle}>{state?.user?.bio}</Text>
      {state?.service ? (
        <ServiceCard service={state.service} />
      ) : (
        <Text style={styles.subtitle}>Sin servicios publicados.</Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  title: { fontSize: 28, fontWeight: "700" },
  subtitle: { color: "#6b7280", marginTop: 4 },
});
