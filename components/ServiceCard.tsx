import { useEffect, useMemo } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useServices } from "@/context/ServicesContext";
import type { Service } from "@/types/services";

interface ServiceCardProps {
  service: Service;
  onPress?: () => void;
  testID?: string;
}

function formatRate(rate: Service["rate"]) {
  const symbol =
    rate.currency === "ARS"
      ? "$"
      : rate.currency === "USD"
      ? "US$"
      : `${rate.currency} `;
  return `${symbol}${rate.amount} / ${rate.unit}`;
}

export function ServiceCard({ service, onPress, testID }: ServiceCardProps) {
  const { providers, fetchProviderProfile, getProviderAggregate } = useServices();

  const provider = providers[service.providerId];

  useEffect(() => {
    if (!provider) {
      fetchProviderProfile(service.providerId).catch(() => {
        // handled in context errors
      });
    }
  }, [fetchProviderProfile, provider, service.providerId]);

  const aggregate = useMemo(
    () => getProviderAggregate(service.providerId),
    [getProviderAggregate, service.providerId]
  );

  const displayRating = service.rating ?? aggregate.averageRating;
  const displayReviews = service.reviewsCount ?? aggregate.totalReviews;

  return (
    <Pressable
      onPress={onPress}
      style={styles.card}
      android_ripple={{ color: "rgba(0,0,0,0.05)", borderless: false }}
      accessibilityRole="button"
      accessibilityLabel={`Abrir servicio ${service.title}`}
      testID={testID}
    >
      {service.thumbnail ? (
        <Image source={{ uri: service.thumbnail }} style={styles.thumbnail} />
      ) : (
        <View style={styles.thumbnailPlaceholder}>
          <Text style={styles.thumbnailInitial}>{service.title[0]?.toUpperCase()}</Text>
        </View>
      )}
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{service.title}</Text>
          <Text style={styles.rating}>★ {displayRating.toFixed(1)}</Text>
        </View>
        <Text style={styles.description} numberOfLines={2}>
          {service.description}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{service.location}</Text>
          <View style={styles.dot} />
          <Text style={styles.metaText}>{displayReviews} reseñas</Text>
        </View>
        <View style={styles.footerRow}>
          <Text style={styles.provider}>{provider?.name ?? service.providerName}</Text>
          <Text style={styles.rate}>Desde {formatRate(service.rate)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    gap: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  thumbnail: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
  },
  thumbnailPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  thumbnailInitial: {
    fontSize: 28,
    fontWeight: "600",
    color: "#4B5563",
  },
  content: {
    flex: 1,
    gap: 6,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
    marginRight: 12,
  },
  rating: {
    fontSize: 14,
    fontWeight: "600",
    color: "#F59E0B",
  },
  description: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: "#6B7280",
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1D5DB",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  provider: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  rate: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2563EB",
  },
});
