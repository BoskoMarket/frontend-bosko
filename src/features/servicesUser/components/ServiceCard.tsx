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
import { MotiView } from "moti";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Rate, ServiceSummary } from "@/types/services";
import { useServices } from "../state/ServicesContext";
import Colors from "@/core/design-system/Colors";

type ServiceCardProps = {
  serviceId: string;
  fallback?: ServiceSummary;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
};

const formatRate = (rate: Rate) => {
  const symbol =
    rate.currency === "ARS"
      ? "$"
      : rate.currency === "USD"
      ? "US$"
      : `${rate.currency} `;
  return `${symbol}${rate.amount} ${
    rate.unit !== "fixed" ? "/ " + rate.unit : ""
  }`;
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
    <MotiView
      from={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "timing", duration: 500 }}
      style={[styles.container, style]}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`Servicio de ${service.name}`}
        accessibilityHint={
          accessibilityHint ?? "Abrir el perfil del profesional seleccionado"
        }
      >
        {/* Cover Image Section */}
        <View style={styles.coverContainer}>
          {service.thumbnail ? (
            <Image
              source={{ uri: service.thumbnail }}
              style={styles.coverImage}
              resizeMode="cover"
            />
          ) : (
            <LinearGradient
              colors={[Colors.colorPrimary, Colors.colorPrimaryDark]}
              style={styles.placeholderCover}
            >
              <Ionicons
                name="briefcase-outline"
                size={40}
                color="rgba(255,255,255,0.3)"
              />
            </LinearGradient>
          )}

          {/* Rating Badge */}
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={12} color="#FFD700" />
            <Text style={styles.ratingText}>
              {rating.averageRating.toFixed(1)}
            </Text>
          </View>

          {/* Price Badge */}
          <View style={styles.priceBadge}>
            <Text style={styles.priceText}>{formatRate(service.rate)}</Text>
          </View>
        </View>

        {/* Content Section */}
        <View style={styles.content}>
          <View style={styles.providerRow}>
            {/* Provider Avatar (Overlapping) */}
            {/* TODO: If provider avatar url is available in service summary, use it. Otherwise placeholder */}
            <View style={styles.avatarContainer}>
              <Image
                source={{
                  uri: `https://i.pravatar.cc/150?u=${service.providerId}`,
                }}
                style={styles.avatar}
              />
            </View>
            <View style={styles.providerInfo}>
              <Text style={styles.providerName}>{service.name}</Text>
              <View style={styles.locationRow}>
                <Ionicons
                  name="location-outline"
                  size={12}
                  color={Colors.title.color}
                />
                <Text style={styles.locationText}>{service.location}</Text>
              </View>
            </View>
          </View>

          <View style={styles.serviceDetails}>
            <Text style={styles.serviceTitle} numberOfLines={2}>
              {service.title}
            </Text>
            <Text style={styles.reviewsText}>
              {rating.reviewsCount} reseñas
            </Text>
          </View>

          <View style={styles.footer}>
            <Text style={styles.ctaText}>Ver detalles</Text>
            <Ionicons
              name="arrow-forward"
              size={16}
              color={Colors.colorPrimary}
            />
          </View>
        </View>
      </Pressable>
    </MotiView>
  );
};

export default ServiceCard;

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    overflow: "hidden",
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  coverContainer: {
    height: 160,
    width: "100%",
    position: "relative",
  },
  coverImage: {
    width: "100%",
    height: "100%",
  },
  placeholderCover: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  ratingBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  ratingText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },
  priceBadge: {
    position: "absolute",
    bottom: 16,
    right: 16,
    backgroundColor: Colors.colorPrimary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    shadowColor: Colors.colorPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  priceText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  content: {
    padding: 16,
    paddingTop: 8, // Space for avatar overlap
  },
  providerRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginTop: -40, // Overlap effect
    marginBottom: 12,
  },
  avatarContainer: {
    padding: 3,
    backgroundColor: "#fff",
    borderRadius: 28,
    marginRight: 10,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  providerInfo: {
    flex: 1,
    paddingBottom: 4, // Align with avatar bottom
  },
  providerName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    marginBottom: 4, // Push up slightly to be on image or just below
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: Colors.title.color,
  },
  serviceDetails: {
    gap: 4,
    marginBottom: 12,
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.title.color,
    lineHeight: 24,
  },
  reviewsText: {
    fontSize: 12,
    color: Colors.title.color,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 12,
  },
  ctaText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.colorPrimary,
  },
});
