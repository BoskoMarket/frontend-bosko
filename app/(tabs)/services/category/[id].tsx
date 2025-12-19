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
import { Ionicons } from "@expo/vector-icons";

const GRADIENTS = [
  ['#850221', '#5c0117'], // Bosko Burgundy
  ['#333333', '#000000'], // Premium Dark
  ['#a00e31', '#6e0a22'], // Crimson
  ['#434343', '#000000'], // Charcoal
];

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
      title: category?.name ?? "Servicios",
      description:
        category?.description ??
        "Descubrí profesionales disponibles en esta categoría.",
    }),
    [category?.description, category?.name]
  );

  const handleServicePress = (service: ServiceSummary) => {
    router.push(`/(tabs)/services/provider/${service.id}`);
  };

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
                    scale: pressed ? 0.98 : 1,
                  }}
                  transition={{ type: "timing", duration: 150 }}
                  style={styles.providerCard}
                >
                  <LinearGradient
                    colors={GRADIENTS[index % GRADIENTS.length] as any}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.cardGradient}
                  >
                    {/* Decorative Elements */}
                    <View style={styles.circleDecoration1} />
                    <View style={styles.circleDecoration2} />

                    {/* Content Row */}
                    <View style={styles.mainContent}>
                      {/* Avatar Column */}
                      <View style={styles.avatarColumn}>
                        <Image
                          source={{ uri: item.thumbnail }}
                          style={styles.avatar}
                          contentFit="cover"
                          placeholder={require("@/assets/images/bosko-logo.png")}
                        />
                        {item.averageRating && item.averageRating >= 4.5 && (
                          <View style={styles.verifiedBadge}>
                            <Ionicons name="checkmark" size={10} color="#fff" />
                          </View>
                        )}
                      </View>

                      {/* Info Column */}
                      <View style={styles.infoColumn}>
                        <View style={styles.headerRow}>
                          <Text style={styles.providerName} numberOfLines={1}>{item.name}</Text>
                          {/* Rating Badge (Highlighted) */}
                          <View style={styles.ratingBadge}>
                            <Ionicons name="star" size={14} color="#FFD700" />
                            <Text style={styles.ratingText}>{item.averageRating ? item.averageRating.toFixed(1) : 'New'}</Text>
                          </View>
                        </View>

                        <Text style={styles.providerTitle} numberOfLines={1}>{item.title}</Text>

                        {item.location && (
                          <View style={styles.locationRow}>
                            <Ionicons name="location-outline" size={12} color="rgba(255,255,255,0.7)" />
                            <Text style={styles.locationText} numberOfLines={1}>{item.location}</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Description excerpt */}
                    {item.summary && (
                      <Text style={styles.summary} numberOfLines={2}>{item.summary}</Text>
                    )}

                    {/* Footer: Price */}
                    <View style={styles.footerRow}>
                      <View style={styles.priceContainer}>
                        <Text style={styles.priceLabel}>Desde</Text>
                        <Text style={styles.priceText}>{formatRate(item.rate)}</Text>
                      </View>
                      {item.reviewsCount > 0 && (
                        <Text style={styles.reviewsText}>
                          ({item.reviewsCount} reseñas)
                        </Text>
                      )}
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
  // ... existing styles ...
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    gap: 20,
  },
  cardWrapper: {
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  cardContainer: {
    borderRadius: 24,
    overflow: "hidden",
  },
  providerCard: {
    borderRadius: 24,
    overflow: "hidden",
  },
  cardGradient: {
    padding: 20,
    minHeight: 180,
    position: 'relative',
    justifyContent: 'space-between',
  },
  circleDecoration1: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  circleDecoration2: {
    position: 'absolute',
    bottom: -20,
    left: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  mainContent: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
  },
  avatarColumn: {
    position: 'relative',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: Colors.colorPrimary,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  infoColumn: {
    flex: 1,
    gap: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  providerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    marginRight: 8,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    borderColor: 'rgba(255,215,0,0.3)',
    borderWidth: 1,
  },
  ratingText: {
    color: '#FFD700',
    fontWeight: 'bold',
    fontSize: 14,
  },
  providerTitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  locationText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  summary: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 18,
    marginTop: 12,
    marginBottom: 12,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 12,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 11,
    color: '#fff',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 2,
  },
  priceText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  reviewsText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    marginLeft: 6,
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
