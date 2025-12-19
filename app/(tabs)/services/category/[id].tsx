import React, { useEffect, useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { MotiView } from "moti";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";

import ServiceCard from "@/components/ServiceCard";
import { useServices } from "@/context/ServicesContext";
import type { ServiceSummary } from "@/types/services";
import { TOKENS } from "@/theme/tokens";
import { useCategories } from "@/src/contexts/CategoriesContext";
import { useProviders } from "@/src/contexts/ProvidersContext";
import { Category } from "@/src/interfaces/category";
import { Provider } from "@/src/interfaces/provider";
import Colors from "@/constants/Colors";

export default function CategoryServicesScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const categoryId = typeof params.id === "string" ? params.id : undefined;

  const {
    categories,
    categoriesStatus,
    servicesStatus,
    fetchCategories,
    fetchServicesByCategory,
    getServicesForCategory,
  } = useServices();

  const {
    loading: providersLoading,
    error: providersError,
    loadProviders,
    providers,
  } = useProviders();

  useEffect(() => {
    if (!categoriesStatus.loaded && !categoriesStatus.loading) {
      fetchCategories().catch((err) => console.error(err));
    }
  }, [categoriesStatus.loaded, categoriesStatus.loading, fetchCategories]);

  useEffect(() => {
    if (!categoryId) {
      return;
    }
    fetchServicesByCategory(categoryId).catch((err) => console.error(err));
  }, [categoryId, fetchServicesByCategory]);

  const category = categories.find((item) => item.id === categoryId);
  const services = categoryId ? getServicesForCategory(categoryId) : [];
  const status = categoryId ? servicesStatus[categoryId] : undefined;

  const isLoading = Boolean(
    status?.loading && !status?.loaded && services.length === 0
  );

  const handleBack = () => {
    router.back();
  };

  const headerCopy = useMemo(
    () => ({
      title: category?.title ?? "Servicios",
      description:
        category?.description ??
        "Descubrí profesionales disponibles en esta categoría.",
    }),
    [category?.description, category?.title]
  );

  function handleServicePress(service: Provider) {
    router.push({
      pathname: "../provider/[id]",
      params: { id: service.id },
    });
  }

  function formatRate(rate?: Provider["rate"]) {
    if (!rate || rate.amount === undefined) {
      return "Consultar";
    }
    const currency = rate.currency?.toUpperCase();
    const symbol =
      currency === "ARS"
        ? "$"
        : currency === "USD"
          ? "US$"
          : `${currency ?? ""} `;
    const unit = rate.unit ? `/${rate.unit}` : "";
    return `${symbol}${rate.amount}${unit}`;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* Hero Section with Glassmorphism */}
      <LinearGradient
        colors={[Colors.colorPrimary, Colors.colorPrimaryDark, "#1a0308"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroContent}>
          <Pressable
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel="Volver"
            style={styles.backButton}
          >
            <Text style={styles.backIcon}>←</Text>
          </Pressable>
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>{headerCopy.title}</Text>
            <Text style={styles.heroSubtitle}>{headerCopy.description}</Text>
            <View style={styles.statsRow}>
              <View style={styles.statBadge}>
                <Text style={styles.statNumber}>{services.length}</Text>
                <Text style={styles.statLabel}>Profesionales</Text>
              </View>
            </View>
          </View>
        </View>
        {/* Decorative overlay */}
        <View style={styles.heroOverlay} />
      </LinearGradient>

      <FlatList
        data={services}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={isLoading}
        onRefresh={() => loadProviders().catch((err) => console.error(err))}
        renderItem={({ item, index }) => (
          <MotiView
            from={{ opacity: 0, translateY: 40, scale: 0.95 }}
            animate={{ opacity: 1, translateY: 0, scale: 1 }}
            transition={{
              type: "spring",
              damping: 18,
              stiffness: 120,
              delay: index * 100,
            }}
            style={styles.cardWrapper}
          >
            <Pressable
              onPress={() => handleServicePress(item)}
              style={styles.cardContainer}
            >
              {({ pressed }) => (
                <MotiView
                  animate={{
                    scale: pressed ? 0.97 : 1,
                  }}
                  transition={{ type: "timing", duration: 150 }}
                  style={styles.providerCard}
                >
                  <LinearGradient
                    colors={["rgba(255,255,255,0.98)", "rgba(255,255,255,0.95)"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.cardGradient}
                  >
                    {/* Avatar and Basic Info */}
                    <View style={styles.cardHeader}>
                      <View style={styles.avatarContainer}>
                        <Image
                          source={{ uri: item.photo || item.avatar }}
                          style={styles.avatar}
                          contentFit="cover"
                          placeholder={require("@/assets/images/bosko-logo.png")}
                        />
                        {item.rating && item.rating >= 4.5 && (
                          <View style={styles.verifiedBadge}>
                            <Text style={styles.verifiedIcon}>✓</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.headerInfo}>
                        <Text style={styles.providerName} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text style={styles.providerTitle} numberOfLines={1}>
                          {item.title}
                        </Text>
                        {item.location && (
                          <View style={styles.locationRow}>
                            <Text style={styles.locationIcon}>📍</Text>
                            <Text style={styles.locationText} numberOfLines={1}>
                              {item.location}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Bio/Summary */}
                    {item.summary && (
                      <Text style={styles.summary} numberOfLines={2}>
                        {item.summary}
                      </Text>
                    )}

                    {/* Tags */}
                    {item.tags && item.tags.length > 0 && (
                      <View style={styles.tagsContainer}>
                        {item.tags.slice(0, 3).map((tag: string, idx: number) => (
                          <View key={idx} style={styles.tag}>
                            <Text style={styles.tagText}>{tag}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Bottom Row: Rating, Reviews, Price */}
                    <View style={styles.cardFooter}>
                      <View style={styles.ratingContainer}>
                        {item.rating && (
                          <View style={styles.ratingBadge}>
                            <Text style={styles.starIcon}>★</Text>
                            <Text style={styles.ratingText}>
                              {item.rating.toFixed(1)}
                            </Text>
                          </View>
                        )}
                        {(item.reviewsCount || item.reviews) && (
                          <Text style={styles.reviewsText}>
                            ({item.reviewsCount ?? item.reviews} reseñas)
                          </Text>
                        )}
                      </View>
                      <View style={styles.priceContainer}>
                        <Text style={styles.priceLabel}>Desde</Text>
                        <Text style={styles.priceText}>{formatRate(item.rate)}</Text>
                      </View>
                    </View>
                  </LinearGradient>
                </MotiView>
              )}
            </Pressable>
          </MotiView>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            {isLoading ? (
              <>
                <ActivityIndicator size="large" color={Colors.colorPrimary} />
                <Text style={styles.emptyTitle}>Cargando profesionales...</Text>
              </>
            ) : (
              <>
                <Text style={styles.emptyIcon}>🔍</Text>
                <Text style={styles.emptyTitle}>
                  Pronto habrá profesionales aquí
                </Text>
                <Text style={styles.emptySubtitle}>
                  {providersError
                    ? providersError
                    : "Estamos sumando especialistas en esta categoría."}
                </Text>
              </>
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  hero: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: "hidden",
  },
  heroContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
    zIndex: 2,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  backIcon: {
    fontSize: 22,
    color: Colors.colorPrimary,
    fontWeight: "600",
  },
  heroCopy: {
    flex: 1,
    gap: 8,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  heroSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  statBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  statLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
    gap: 16,
  },
  cardWrapper: {
    width: "100%",
  },
  cardContainer: {
    width: "100%",
  },
  providerCard: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: Colors.colorPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  cardGradient: {
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: "rgba(133, 2, 33, 0.1)",
  },
  cardHeader: {
    flexDirection: "row",
    gap: 14,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: "#f0f0f0",
    borderWidth: 2,
    borderColor: Colors.colorPrimary,
  },
  verifiedBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.colorPrimary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  verifiedIcon: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  headerInfo: {
    flex: 1,
    gap: 4,
    justifyContent: "center",
  },
  providerName: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.colorPrimaryDark,
    letterSpacing: -0.3,
  },
  providerTitle: {
    fontSize: 14,
    color: TOKENS.color.sub,
    fontWeight: "500",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  locationIcon: {
    fontSize: 12,
  },
  locationText: {
    fontSize: 13,
    color: TOKENS.color.sub,
  },
  summary: {
    fontSize: 14,
    color: TOKENS.color.text,
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    backgroundColor: `${Colors.colorPrimary}10`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: `${Colors.colorPrimary}20`,
  },
  tagText: {
    fontSize: 12,
    color: Colors.colorPrimary,
    fontWeight: "600",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: `${Colors.colorPrimary}15`,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  starIcon: {
    fontSize: 14,
    color: Colors.colorPrimary,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.colorPrimary,
  },
  reviewsText: {
    fontSize: 13,
    color: TOKENS.color.sub,
  },
  priceContainer: {
    alignItems: "flex-end",
  },
  priceLabel: {
    fontSize: 11,
    color: TOKENS.color.sub,
    marginBottom: 2,
  },
  priceText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.colorPrimary,
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: "center",
    gap: 12,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 8,
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
    paddingHorizontal: 40,
    lineHeight: 20,
  },
});
