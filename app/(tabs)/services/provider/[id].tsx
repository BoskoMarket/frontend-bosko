import { useEffect, useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";

import { ProviderProfile } from "@/components/ProviderProfile";
import { ServiceReviews } from "@/components/ServiceReviews";
import { useAuth } from "@/context/AuthContext";
import { useServices } from "@/context/ServicesContext";
import { TOKENS } from "@/theme/tokens";

export default function ProviderProfileScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const providerId = typeof params.id === "string" ? params.id : undefined;
  const serviceId = typeof params.serviceId === "string" ? params.serviceId : undefined;

  const { authState } = useAuth();
  const currentUserId = authState?.user?.id;
  const currentUserName = authState?.user?.name ?? undefined;

  const {
    fetchProviderProfile,
    getServiceById,
    servicesByCategory,
    categories,
  } = useServices();

  useEffect(() => {
    if (providerId) {
      fetchProviderProfile(providerId).catch(() => undefined);
    }
  }, [fetchProviderProfile, providerId]);

  const service = useMemo(() => {
    if (serviceId) {
      return getServiceById(serviceId);
    }

    if (!providerId) {
      return undefined;
    }

    const services = Object.values(servicesByCategory).flat();
    return services.find((item) => item.providerId === providerId);
  }, [getServiceById, providerId, serviceId, servicesByCategory]);

  const category = useMemo(() => {
    if (!service) {
      return undefined;
    }
    return categories.find((item) => item.id === service.categoryId);
  }, [categories, service]);

  const serviceDescription = service?.description ?? "Este profesional aún no cargó la descripción del servicio.";

  if (!providerId) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ProviderProfile providerId={providerId} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sobre el servicio</Text>
          <Text style={styles.sectionBody}>{serviceDescription}</Text>
        </View>

        {service ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Detalles</Text>
            <View style={styles.detailList}>
              <DetailItem label="Ubicación" value={service.location} />
              <DetailItem
                label="Tarifa"
                value={`${formatRate(service.rate)}${category ? ` • ${category.title}` : ""}`}
              />
            </View>
          </View>
        ) : null}

        {service ? (
          <ServiceReviews
            serviceId={service.id}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

interface DetailItemProps {
  label: string;
  value: string;
}

function DetailItem({ label, value }: DetailItemProps) {
  return (
    <View style={styles.detailItem}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function formatRate(rate: { currency: string; amount: number; unit: string }) {
  const symbol =
    rate.currency === "ARS"
      ? "$"
      : rate.currency === "USD"
      ? "US$"
      : `${rate.currency} `;
  return `${symbol}${rate.amount} / ${rate.unit}`;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: TOKENS.color.bg,
  },
  scrollContent: {
    padding: 20,
    gap: 20,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: TOKENS.radius.xl,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: TOKENS.color.text,
  },
  sectionBody: {
    fontSize: 14,
    color: TOKENS.color.sub,
    lineHeight: 20,
  },
  detailList: {
    gap: 12,
  },
  detailItem: {
    gap: 4,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: TOKENS.color.sub,
  },
  detailValue: {
    fontSize: 15,
    color: TOKENS.color.text,
  },
});
