import React, { useEffect } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";

import ProviderProfile from "@/components/ProviderProfile";
import ServiceReviews from "@/components/ServiceReviews";
import { useServices } from "@/context/ServicesContext";
import { TOKENS } from "@/theme/tokens";

export default function ProviderProfileScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const providerId = typeof params.id === "string" ? params.id : undefined;
  const { selectServiceByProvider, fetchProviderProfile, getProviderById } = useServices();

  useEffect(() => {
    if (providerId) {
      fetchProviderProfile(providerId).catch((err) => console.error(err));
    }
  }, [fetchProviderProfile, providerId]);

  if (!providerId) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.fallback}> 
          <Text style={styles.fallbackTitle}>No encontramos este profesional</Text>
          <Text style={styles.fallbackSubtitle}>
            Volvé a la lista de servicios e intentá nuevamente.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const service = selectServiceByProvider(providerId);
  const serviceId = service?.id ?? providerId;
  const provider = getProviderById(providerId);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ProviderProfile providerId={providerId} onBack={router.back} />
        {provider || service ? (
          <ServiceReviews serviceId={serviceId} />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: TOKENS.color.bg,
  },
  scrollContent: {
    padding: 20,
    gap: 24,
    paddingBottom: 40,
  },
  fallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 12,
  },
  fallbackTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: TOKENS.color.text,
    textAlign: "center",
  },
  fallbackSubtitle: {
    fontSize: 14,
    color: TOKENS.color.sub,
    textAlign: "center",
  },
});
