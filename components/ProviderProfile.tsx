import { useEffect } from "react";
import {
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useServices } from "@/context/ServicesContext";
import type { Provider } from "@/types/services";

interface ProviderProfileProps {
  providerId: string;
  onContactPress?: () => void;
}

export function ProviderProfile({ providerId, onContactPress }: ProviderProfileProps) {
  const { providers, fetchProviderProfile, getProviderAggregate } = useServices();

  const provider = providers[providerId];
  const aggregate = getProviderAggregate(providerId);

  useEffect(() => {
    if (!provider) {
      fetchProviderProfile(providerId).catch(() => {
        // handled upstream
      });
    }
  }, [fetchProviderProfile, provider, providerId]);

  if (!provider) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando perfil…</Text>
      </View>
    );
  }

  const backgroundSource = provider.heroImage
    ? { uri: provider.heroImage }
    : undefined;

  const tags = provider.tags ?? [];

  const content = (
    <View style={styles.content}>
      <Image source={{ uri: provider.avatar }} style={styles.avatar} />
      <Text style={styles.name}>{provider.name}</Text>
      <Text style={styles.title}>{provider.title}</Text>
      {provider.summary ? <Text style={styles.summary}>{provider.summary}</Text> : null}
      <View style={styles.statsRow}>
        <Text style={styles.rating}>★ {aggregate.averageRating.toFixed(1)}</Text>
        <View style={styles.dot} />
        <Text style={styles.reviews}>{aggregate.totalReviews} reseñas</Text>
        <View style={styles.dot} />
        <Text style={styles.location}>{provider.location}</Text>
      </View>
      <View style={styles.rateRow}>
        <Text style={styles.rateLabel}>Desde</Text>
        <Text style={styles.rateValue}>{formatRate(provider.rate)}</Text>
      </View>
      <View style={styles.tagsRow}>
        {tags.slice(0, 4).map((tag) => (
          <View key={tag} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>
      {onContactPress ? (
        <Pressable
          onPress={onContactPress}
          style={styles.contactButton}
          accessibilityRole="button"
          accessibilityLabel="Contactar profesional"
        >
          <Text style={styles.contactButtonText}>Cotizar servicio</Text>
        </Pressable>
      ) : null}
    </View>
  );

  if (!backgroundSource) {
    return <View style={styles.card}>{content}</View>;
  }

  return (
    <ImageBackground
      source={backgroundSource}
      style={styles.card}
      imageStyle={styles.backgroundImage}
    >
      <View style={styles.overlay} />
      {content}
    </ImageBackground>
  );
}

function formatRate(rate: Provider["rate"]) {
  const symbol =
    rate.currency === "ARS"
      ? "$"
      : rate.currency === "USD"
      ? "US$"
      : `${rate.currency} `;
  return `${symbol}${rate.amount} / ${rate.unit}`;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#111827",
    padding: 24,
  },
  backgroundImage: {
    resizeMode: "cover",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(17, 24, 39, 0.55)",
  },
  content: {
    gap: 12,
    alignItems: "center",
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  name: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  title: {
    fontSize: 16,
    fontWeight: "500",
    color: "#F9FAFB",
  },
  summary: {
    fontSize: 14,
    color: "#E5E7EB",
    textAlign: "center",
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rating: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FCD34D",
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.7)",
  },
  reviews: {
    fontSize: 14,
    color: "#F9FAFB",
  },
  location: {
    fontSize: 14,
    color: "#E5E7EB",
  },
  rateRow: {
    flexDirection: "row",
    gap: 6,
    alignItems: "baseline",
  },
  rateLabel: {
    fontSize: 14,
    color: "#E5E7EB",
  },
  rateValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  tag: {
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  contactButton: {
    marginTop: 12,
    backgroundColor: "#22C55E",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  contactButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 14,
    color: "#4B5563",
  },
});
