import React, { useEffect, useMemo } from "react";
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useServices } from "@/context/ServicesContext";
import type { Rate } from "@/types/services";
import { TOKENS } from "@/theme/tokens";

const formatRate = (rate: Rate) => {
  const symbol = rate.currency === "ARS" ? "$" : rate.currency === "USD" ? "US$" : `${rate.currency} `;
  return `${symbol}${rate.amount} / ${rate.unit}`;
};

interface ProviderProfileProps {
  providerId: string;
  onBack?: () => void;
  onRequestQuote?: () => void;
}

const ProviderProfile: React.FC<ProviderProfileProps> = ({
  providerId,
  onBack,
  onRequestQuote,
}) => {
  const {
    categories,
    providersStatus,
    fetchProviderProfile,
    getProviderById,
    getProviderRating,
  } = useServices();

  const provider = getProviderById(providerId);
  const rating = useMemo(() => getProviderRating(providerId), [getProviderRating, providerId]);
  const status = providersStatus[providerId];

  useEffect(() => {
    if (!provider && !status?.loading) {
      fetchProviderProfile(providerId).catch((err) => console.error(err));
    }
  }, [fetchProviderProfile, provider, providerId, status?.loading]);

  const categoryAccent = useMemo(() => {
    const category = categories.find((item) => item.id === provider?.categoryId);
    return category?.accent ?? "#E8ECF2";
  }, [categories, provider?.categoryId]);

  if (!provider && status?.loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!provider) {
    return (
      <View style={styles.emptyState}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Volver"
            style={styles.backButton}
          >
            <Text style={styles.backIcon}>←</Text>
          </Pressable>
        ) : null}
        <Text style={styles.emptyTitle}>No encontramos este profesional</Text>
        <Text style={styles.emptySubtitle}>
          Volvé a la lista y elegí otro servicio disponible.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.headerRow}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Volver"
            style={styles.backButton}
          >
            <Text style={styles.backIcon}>←</Text>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.heroCard}>
        <ImageBackground
          source={{ uri: provider.heroImage }}
          style={styles.heroBackground}
          imageStyle={styles.heroBackgroundImage}
        >
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <Image
              source={{ uri: provider.avatar }}
              style={[styles.heroAvatar, { borderColor: categoryAccent }]}
            />
            <Text style={styles.heroName}>{provider.name}</Text>
            <Text style={styles.heroTitle}>{provider.title}</Text>
            <Text style={styles.heroSummary}>{provider.summary}</Text>
            <View style={styles.heroStats}>
              <Text style={styles.heroRating}>★ {rating.averageRating.toFixed(1)}</Text>
              <View style={styles.dot} />
              <Text style={styles.heroReviews}>{rating.reviewsCount} reseñas</Text>
            </View>
            <Text style={styles.heroLocation}>{provider.location}</Text>
            <View style={styles.heroActions}>
              <Text style={styles.heroRate}>Desde {formatRate(provider.rate)}</Text>
              <Pressable
                onPress={onRequestQuote}
                accessibilityRole="button"
                accessibilityLabel="Solicitar cotización"
                style={[styles.quoteButton, { backgroundColor: categoryAccent }]}
              >
                <Text style={styles.quoteButtonText}>Cotizar servicio</Text>
              </Pressable>
            </View>
          </View>
        </ImageBackground>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sobre el servicio</Text>
        <Text style={styles.sectionBody}>{provider.bio}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Especialidades</Text>
        <View style={styles.tagsRow}>
          {provider.tags.map((tag) => (
            <View key={tag} style={[styles.tag, { backgroundColor: categoryAccent }]}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Trabajos recientes</Text>
        <View style={styles.worksList}>
          {provider.recentWorks.map((work) => (
            <View key={work.id} style={styles.workCard}>
              <Image source={{ uri: work.image }} style={styles.workImage} />
              <View style={styles.workInfo}>
                <Text style={styles.workTitle}>{work.title}</Text>
                <Text style={styles.workTime}>{work.timeAgo}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

export default ProviderProfile;

const styles = StyleSheet.create({
  wrapper: {
    gap: 20,
  },
  loader: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyState: {
    gap: 16,
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: TOKENS.color.text,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: TOKENS.color.sub,
    textAlign: "center",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: TOKENS.radius.lg,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    ...TOKENS.shadow.soft,
  },
  backIcon: {
    fontSize: 20,
    color: TOKENS.color.text,
  },
  heroCard: {
    borderRadius: TOKENS.radius.xl,
    overflow: "hidden",
    ...TOKENS.shadow.soft,
  },
  heroBackground: {
    width: "100%",
  },
  heroBackgroundImage: {
    width: "100%",
    minHeight: 320,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(17, 24, 39, 0.45)",
  },
  heroContent: {
    padding: 24,
    alignItems: "center",
    gap: 12,
  },
  heroAvatar: {
    width: 96,
    height: 96,
    borderRadius: 32,
    borderWidth: 4,
  },
  heroName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  heroTitle: {
    fontSize: 16,
    color: "#F9FAFB",
  },
  heroSummary: {
    fontSize: 14,
    color: "#E5E7EB",
    textAlign: "center",
  },
  heroStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  heroRating: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FCD34D",
  },
  heroReviews: {
    fontSize: 14,
    color: "#F3F4F6",
  },
  heroLocation: {
    fontSize: 14,
    color: "#E5E7EB",
  },
  heroActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  heroRate: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  quoteButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: TOKENS.radius.lg,
  },
  quoteButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: TOKENS.color.text,
  },
  section: {
    gap: 12,
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: TOKENS.radius.lg,
    ...TOKENS.shadow.soft,
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
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: TOKENS.radius.lg,
  },
  tagText: {
    fontSize: 12,
    color: TOKENS.color.text,
  },
  worksList: {
    gap: 12,
  },
  workCard: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  workImage: {
    width: 64,
    height: 64,
    borderRadius: TOKENS.radius.md,
  },
  workInfo: {
    flex: 1,
    gap: 4,
  },
  workTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: TOKENS.color.text,
  },
  workTime: {
    fontSize: 12,
    color: TOKENS.color.sub,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.6)",
  },
});
