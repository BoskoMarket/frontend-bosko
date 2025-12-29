import React, { useMemo } from "react";
import {
  Image,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

import { useServices } from "@/context/ServicesContext";
import type { Rate, ServiceSummary } from "@/types/services";
import { TOKENS } from "@/theme/tokens";

type ServiceCardProps = {
  serviceId: string;
  fallback?: ServiceSummary;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
};

const formatRate = (rate: Rate) => {
  const symbol = rate.currency === "ARS" ? "$" : rate.currency === "USD" ? "US$" : `${rate.currency} `;
  return `${symbol}${rate.amount} / ${rate.unit}`;
};

const ServiceCard: React.FC<ServiceCardProps> = ({
  serviceId,
  fallback,
  onPress,
  style,
  accessibilityHint,
}) => {
  const { selectServiceById, getProviderRating } = useServices();
  const service = selectServiceById(serviceId) ?? fallback;

  const rating = useMemo(() => {
    if (!service) {
      return { averageRating: 0, reviewsCount: 0 };
    }
    return getProviderRating(service.providerId);
  }, [getProviderRating, service]);

  if (!service) {
    return null;
  }

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, style]}
      accessibilityRole="button"
      accessibilityLabel={`Servicio de ${service.name}`}
      accessibilityHint={
        accessibilityHint ?? "Abrir el perfil del profesional seleccionado"
      }
    >
      {service.thumbnail ? (
        <Image
          source={{ uri: service.thumbnail }}
          style={styles.avatar}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Sin foto</Text>
        </View>
      )}
      <View style={styles.info}>
        <View style={styles.headerRow}>
          <Text style={styles.name}>{service.name}</Text>
          <Text style={styles.rating}>{rating.averageRating.toFixed(1)} ★</Text>
        </View>
        <Text style={styles.title}>{service.title}</Text>
        <Text numberOfLines={2} style={styles.summary}>
          {service.summary}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaHighlight}>{formatRate(service.rate)}</Text>
          <View style={styles.dot} />
          <Text style={styles.metaText}>{service.location}</Text>
        </View>
        <Text style={styles.reviews}>{rating.reviewsCount} reseñas</Text>
      </View>
    </Pressable>
  );
};

export default ServiceCard;

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: "#FFFFFF",
    padding: 18,
    borderRadius: TOKENS.radius.lg,
    ...TOKENS.shadow.soft,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 18,
  },
  placeholder: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    fontSize: 10,
    color: "#6B7280",
  },
  info: {
    flex: 1,
    gap: 6,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: TOKENS.color.text,
  },
  rating: {
    fontSize: 14,
    fontWeight: "600",
    color: TOKENS.color.primary,
  },
  title: {
    fontSize: 14,
    color: TOKENS.color.sub,
  },
  summary: {
    fontSize: 12,
    color: TOKENS.color.sub,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metaHighlight: {
    fontSize: 13,
    fontWeight: "600",
    color: TOKENS.color.text,
  },
  metaText: {
    fontSize: 12,
    color: TOKENS.color.sub,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1D5DB",
  },
  reviews: {
    fontSize: 12,
    color: TOKENS.color.sub,
  },
});
