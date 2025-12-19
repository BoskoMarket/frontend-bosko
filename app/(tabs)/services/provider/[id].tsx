import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { Image } from "expo-image";

import { TOKENS } from "@/theme/tokens";
import { useCategories } from "@/src/contexts/CategoriesContext";
import { useServices } from "@/context/ServicesContext";
import Colors from "@/constants/Colors";

export default function ProviderProfileScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const serviceId = typeof params.id === "string" ? params.id : undefined;

  const {
    selectServiceById,
    getService,
    fetchProviderProfile,
    getProviderById,
  } = useServices();
  const { categories } = useCategories();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serviceData, setServiceData] = useState<any>(null);
  const [providerData, setProviderData] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (!serviceId) {
        setError("ID de servicio no válido");
        setIsLoading(false);
        return;
      }

      // If we already have the data for this ID, don't reset loading to true immediately
      // This prevents flickering if the effect re-runs due to context updates
      if (serviceData?.id === serviceId && providerData) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        console.log("Fetching service:", serviceId);
        // 1. Try to get Service Summary (Read Model)
        let summary = selectServiceById(serviceId);
        let sData: any = summary;
        let pId: string | undefined = summary?.providerId;

        // 2. If not found, fetch Service (Write Model)
        if (!sData) {
          try {
            const fetchedService = await getService(serviceId);
            if (fetchedService) {
              sData = fetchedService;
              pId = fetchedService.userId;
            }
          } catch (err) {
            console.error("Error fetching service:", err);
          }
        }

        if (!sData) {
          throw new Error("Servicio no encontrado");
        }

        console.log("Service Data Loaded:", sData);
        if (isMounted) setServiceData(sData);

        // 3. Fetch Provider Profile
        if (pId) {
          let profile = getProviderById(pId);
          if (!profile) {
            profile = await fetchProviderProfile(pId);
          }
          console.log("Provider Data Loaded:", profile);
          if (isMounted) setProviderData(profile);
        }

      } catch (err: any) {
        console.error("Load Error:", err);
        if (isMounted) setError(err.message || "Error al cargar");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
    // Exclude functions from dependency array to prevent loops when context state updates
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId]);


  const category = categories.find((c) => c.id === (serviceData?.categoryId || serviceData?.category));
  const providerName = providerData ? `${providerData.firstName || ""} ${providerData.lastName || providerData.name || ""}`.trim() : serviceData?.name || "Proveedor";
  const providerUsername = providerData?.username || providerName.toLowerCase().replace(/\s+/g, '');

  function handleBack() {
    router.back();
  }

  function formatPrice(min?: number, max?: number, currency?: string) {
    if (serviceData?.rate) {
      // It's a ServiceSummary with Rate object
      const { amount, currency: curr, unit } = serviceData.rate;
      return `${curr || "$"} ${amount} / ${unit || "hr"}`;
    }
    if (!min && !max) return "Consultar";
    const symbol = currency === "ARS" ? "$" : currency === "USD" ? "US$" : "$";
    if (min && max) {
      return `${symbol}${min.toLocaleString()} - ${symbol}${max.toLocaleString()}`;
    }
    return `${symbol}${(min || max)?.toLocaleString()}`;
  }

  if (isLoading || !serviceData) {
    return (
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.emptyState}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </Pressable>
          <ActivityIndicator size="large" color={Colors.colorPrimary} />
          <Text style={styles.emptyTitle}>Cargando servicio...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Normalize data for view
  const title = serviceData.title;
  const description = serviceData.description || serviceData.summary;
  const location = serviceData.location || providerData?.location;
  const status = serviceData.status || "ACTIVE";
  const priceDisplay = formatPrice(serviceData.priceMin, serviceData.priceMax, serviceData.currency); // fallback if not Rate

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with back button */}
        <View style={styles.headerRow}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </Pressable>
        </View>

        {/* Hero Section with Glassmorphism */}
        <LinearGradient
          colors={[Colors.colorPrimary, Colors.colorPrimaryDark, "#1a0308"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            {/* Avatar */}
            <View style={styles.avatarContainer}>
              <Image
                source={providerData?.avatar ? { uri: providerData.avatar } : require("@/assets/images/bosko-logo.png")}
                style={styles.heroAvatar}
                contentFit="cover"
              />
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedIcon}>✓</Text>
              </View>
            </View>

            {/* Provider Info */}
            <Text style={styles.heroName}>{providerName}</Text>
            <Text style={styles.heroUsername}>@{providerUsername}</Text>
            {location && (
              <View style={styles.locationRow}>
                <Text style={styles.locationIcon}>📍</Text>
                <Text style={styles.locationText}>{location}</Text>
              </View>
            )}

            {/* Category Badge */}
            {category && (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{category.name}</Text>
              </View>
            )}
            {!category && serviceData.category && typeof serviceData.category === 'string' && (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>Servicio</Text>
              </View>
            )}
          </View>
        </LinearGradient>

        {/* Service Title Card */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "spring", damping: 15 }}
          style={styles.serviceCard}
        >
          <LinearGradient
            colors={["rgba(255,255,255,0.98)", "rgba(255,255,255,0.95)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            <Text style={styles.serviceTitle}>{title}</Text>
            {description && (
              <Text style={styles.serviceDescription}>{description}</Text>
            )}

            {/* Price Section */}
            <View style={styles.priceSection}>
              <View style={styles.priceContainer}>
                <Text style={styles.priceLabel}>Precio estimado</Text>
                <Text style={styles.priceText}>
                  {priceDisplay}
                </Text>
              </View>
              <Pressable style={styles.quoteButton}>
                <Text style={styles.quoteButtonText}>Solicitar cotización</Text>
              </Pressable>
            </View>
          </LinearGradient>
        </MotiView>

        {/* Service Details */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "spring", damping: 15, delay: 100 }}
          style={styles.detailsCard}
        >
          <Text style={styles.sectionTitle}>Detalles del servicio</Text>
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Estado</Text>
              <View
                style={[
                  styles.statusBadge,
                  status === "ACTIVE" && styles.statusActive,
                ]}
              >
                <Text style={styles.statusText}>
                  {status === "ACTIVE" ? "Disponible" : status}
                </Text>
              </View>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Categoría</Text>
              <Text style={styles.detailValue}>{category?.name || "General"}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Ubicación</Text>
              <Text style={styles.detailValue}>{location || "A convenir"}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Proveedor</Text>
              <Text style={styles.detailValue}>{providerName}</Text>
            </View>
          </View>
        </MotiView>

        {/* What's Included */}
        {description && (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "spring", damping: 15, delay: 200 }}
            style={styles.includesCard}
          >
            <Text style={styles.sectionTitle}>Descripción completa</Text>
            <Text style={styles.includesText}>{description}</Text>
          </MotiView>
        )}

        {/* Contact CTA */}
        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", damping: 15, delay: 300 }}
          style={styles.ctaCard}
        >
          <LinearGradient
            colors={[Colors.colorPrimary, Colors.colorPrimaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ctaGradient}
          >
            <Text style={styles.ctaTitle}>¿Interesado en este servicio?</Text>
            <Text style={styles.ctaSubtitle}>
              Contacta a {providerName} para más información
            </Text>
            <Pressable style={styles.ctaButton}>
              <Text style={styles.ctaButtonText}>Enviar mensaje</Text>
            </Pressable>
          </LinearGradient>
        </MotiView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerRow: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
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
  heroCard: {
    marginHorizontal: 20,
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 20,
    shadowColor: Colors.colorPrimary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  heroContent: {
    padding: 24,
    alignItems: "center",
    gap: 12,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 8,
  },
  heroAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: "#FFFFFF",
    backgroundColor: "#f0f0f0",
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: Colors.colorPrimary,
  },
  verifiedIcon: {
    fontSize: 16,
    color: Colors.colorPrimary,
    fontWeight: "700",
  },
  heroName: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: -0.5,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  heroUsername: {
    fontSize: 16,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  locationIcon: {
    fontSize: 14,
  },
  locationText: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  categoryBadge: {
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 4,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.colorPrimary,
  },
  serviceCard: {
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 16,
    shadowColor: Colors.colorPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  cardGradient: {
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: "rgba(133, 2, 33, 0.1)",
  },
  serviceTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.colorPrimaryDark,
    letterSpacing: -0.3,
  },
  serviceDescription: {
    fontSize: 15,
    color: TOKENS.color.text,
    lineHeight: 22,
  },
  priceSection: {
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  priceContainer: {
    gap: 4,
  },
  priceLabel: {
    fontSize: 13,
    color: TOKENS.color.sub,
    fontWeight: "500",
  },
  priceText: {
    fontSize: 28,
    fontWeight: "800",
    color: Colors.colorPrimary,
    letterSpacing: -0.5,
  },
  quoteButton: {
    backgroundColor: Colors.colorPrimary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: Colors.colorPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  quoteButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  detailsCard: {
    marginHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.colorPrimaryDark,
    marginBottom: 16,
  },
  detailsGrid: {
    gap: 16,
  },
  detailItem: {
    gap: 6,
  },
  detailLabel: {
    fontSize: 13,
    color: TOKENS.color.sub,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 15,
    color: TOKENS.color.text,
    fontWeight: "600",
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#e0e0e0",
  },
  statusActive: {
    backgroundColor: `${Colors.colorPrimary}15`,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.colorPrimary,
  },
  includesCard: {
    marginHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  includesText: {
    fontSize: 15,
    color: TOKENS.color.text,
    lineHeight: 24,
  },
  ctaCard: {
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: Colors.colorPrimary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  ctaGradient: {
    padding: 24,
    alignItems: "center",
    gap: 12,
  },
  ctaTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
  },
  ctaSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
  },
  ctaButton: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.colorPrimary,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: TOKENS.color.text,
    textAlign: "center",
  },
});
