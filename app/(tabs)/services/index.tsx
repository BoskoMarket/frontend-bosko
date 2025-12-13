import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import { useCallback, useEffect, useMemo } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

import ServiceCard from "@/components/ServiceCard";

import { TOKENS } from "@/theme/tokens";
import { useCategories } from "@/src/contexts/CategoriesContext";
import { useProviders } from "@/src/contexts/ProvidersContext";
import { Category } from "@/src/interfaces/category";
import { useServices } from "@/context/ServicesContext";
import Colors from "@/constants/Colors";

type CategoryWithCount = Category & { servicesCount: number };
type CategoryListItem = CategoryWithCount;

const FALLBACK_ACCENTS = ["#E6F0FF", "#F5ECFF", "#FFF4E5", "#FFEFF3"];

// Icon mapping based on category name keywords
const getCategoryIcon = (name: string): string => {
  const lowerName = name.toLowerCase();

  if (lowerName.includes("plom") || lowerName.includes("agua") || lowerName.includes("cañ")) return "🔧";
  if (lowerName.includes("electric") || lowerName.includes("luz")) return "⚡";
  if (lowerName.includes("pintu") || lowerName.includes("pared")) return "🎨";
  if (lowerName.includes("carpint") || lowerName.includes("madera")) return "🪚";
  if (lowerName.includes("jardin") || lowerName.includes("plant")) return "🌿";
  if (lowerName.includes("limpieza") || lowerName.includes("aseo")) return "🧹";
  if (lowerName.includes("belleza") || lowerName.includes("estét") || lowerName.includes("peluq")) return "💇";
  if (lowerName.includes("diseño") || lowerName.includes("gráf")) return "🎨";
  if (lowerName.includes("fotograf")) return "📸";
  if (lowerName.includes("música") || lowerName.includes("audio")) return "🎵";
  if (lowerName.includes("cocina") || lowerName.includes("chef") || lowerName.includes("gastr")) return "👨‍🍳";
  if (lowerName.includes("mecán") || lowerName.includes("auto") || lowerName.includes("coche")) return "🔩";
  if (lowerName.includes("tecnolog") || lowerName.includes("comput") || lowerName.includes("inform")) return "💻";
  if (lowerName.includes("clases") || lowerName.includes("educac") || lowerName.includes("enseñ")) return "📚";
  if (lowerName.includes("salud") || lowerName.includes("médic") || lowerName.includes("enfermer")) return "🏥";
  if (lowerName.includes("fitness") || lowerName.includes("deport") || lowerName.includes("gym")) return "💪";
  if (lowerName.includes("mascot") || lowerName.includes("veterin")) return "🐾";
  if (lowerName.includes("construc") || lowerName.includes("albañ")) return "🏗️";
  if (lowerName.includes("transport") || lowerName.includes("mudanza")) return "🚚";
  if (lowerName.includes("event") || lowerName.includes("fiesta")) return "🎉";

  return "⭐"; // Default icon
};

export default function ServicesScreen() {
  const router = useRouter();
  const { services } = useServices();

  const {
    categories,
    loading: categoriesLoading,
    error: categoriesError,
  } = useCategories();
  const {
    providers,
    loading: providersLoading,
    error: providersError,
    loadProviders,
  } = useProviders();

  useEffect(() => {
    if (providers.length === 0) {
      loadProviders().catch((err) => console.error(err));
    }
  }, [providers.length, loadProviders]);

  const categoriesWithCounts = useMemo<CategoryListItem[]>(() => {
    const counts = providers.reduce<Record<string, number>>((acc, provider) => {
      const categoryId =
        provider.categoryId ??
        (provider as any)?.category?.id ??
        (provider as any)?.category_id;
      if (categoryId) {
        acc[categoryId] = (acc[categoryId] ?? 0) + 1;
      }
      return acc;
    }, {});

    return categories.map((category, index) => ({
      ...category,
      accent:
        category.accent ?? FALLBACK_ACCENTS[index % FALLBACK_ACCENTS.length],
      icon: getCategoryIcon(category.name),
      servicesCount: counts[category.id] ?? 0,
    }));
  }, [categories, providers]);

  const loading = categoriesLoading || providersLoading;

  const handleCategoryPress = useCallback(
    (category: Category) => {
      router.push({
        pathname: "/(tabs)/services/category/[id]",
        params: { id: category.id },
      });
    },
    [router]
  );

  const featuredServices = useMemo(() => {
    const collected = categories.flatMap((category) =>
      services.filter((service) => service.categoryId === category.id)
    );
    return collected.slice(0, 6);
  }, [categories, services]);

  const listEmpty = (
    <View style={styles.emptyState}>
      {categoriesLoading ? (
        <ActivityIndicator />
      ) : (
        <Text style={styles.emptyText}>
          Pronto habra categorias disponibles.
        </Text>
      )}
      {categoriesError ? (
        <Text style={styles.errorText}>{categoriesError}</Text>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {loading ? (
        <View style={styles.header}>
          <Text style={styles.heading}>Cargando categorias...</Text>
        </View>
      ) : null}
      {categoriesError || providersError ? (
        <View style={styles.header}>
          <Text style={styles.subheading}>
            {categoriesError ||
              providersError ||
              "Ocurrio un error al cargar los datos"}
          </Text>
        </View>
      ) : null}
      {!loading && categoriesWithCounts.length === 0 ? (
        <View style={styles.header}>
          <Text style={styles.heading}>No hay categorias para mostrar</Text>
          <Text style={styles.subheading}>Intenta nuevamente mas tarde.</Text>
        </View>
      ) : null}
      <FlatList
        data={categoriesWithCounts}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={listEmpty}
        renderItem={({ item, index }) => (
          <MotiView
            from={{ opacity: 0, translateY: 50, scale: 0.9 }}
            animate={{ opacity: 1, translateY: 0, scale: 1 }}
            transition={{
              type: "spring",
              damping: 15,
              stiffness: 150,
              delay: index * 80,
            }}
            style={styles.cardWrapper}
          >
            <Pressable
              onPress={() => handleCategoryPress(item)}
              style={styles.cardContainer}
            >
              {({ pressed }) => (
                <MotiView
                  animate={{
                    scale: pressed ? 0.95 : 1,
                    translateY: pressed ? 2 : 0,
                  }}
                  transition={{ type: "timing", duration: 150 }}
                  style={styles.card}
                >
                  <LinearGradient
                    colors={[
                      `${Colors.colorPrimary}15`,
                      `${Colors.colorPrimary}08`,
                      "rgba(255,255,255,0.95)",
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientBackground}
                  >
                    {/* Icon with glow effect */}
                    <View style={styles.iconContainer}>
                      <LinearGradient
                        colors={[Colors.colorPrimary, Colors.colorPrimaryDark]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.iconGradient}
                      >
                        <Text style={styles.icon}>{item.icon}</Text>
                      </LinearGradient>
                    </View>

                    {/* Content */}
                    <View style={styles.cardContent}>
                      <Text style={styles.cardTitle} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.cardDescription} numberOfLines={2}>
                        {item.description ?? ""}
                      </Text>
                    </View>

                    {/* Count badge */}
                    <View style={styles.countBadge}>
                      <LinearGradient
                        colors={[Colors.colorPrimary, Colors.colorPrimaryDark]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.countGradient}
                      >
                        <Text style={styles.countText}>
                          {item.servicesCount ?? 0}
                        </Text>
                      </LinearGradient>
                    </View>

                    {/* Glassmorphic overlay */}
                    <View style={styles.glassOverlay} />
                  </LinearGradient>
                </MotiView>
              )}
            </Pressable>
          </MotiView>
        )}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.heading}>Categorias sugeridas</Text>
            <Text style={styles.subheading}>
              Elige una categoria para ver profesionales disponibles.
            </Text>
          </View>
        }
        ListFooterComponent={
          featuredServices.length > 0 ? (
            <View style={styles.servicesSection}>
              <Text style={styles.sectionTitle}>Servicios destacados</Text>
              <Text style={styles.sectionSubtitle}>
                Toca cualquier profesional para conocer su perfil.
              </Text>
              {featuredServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  serviceId={service.id}
                  onPress={() =>
                    router.push({
                      pathname: "./provider/[id]",
                      params: { id: service.id },
                    })
                  }
                  accessibilityHint={`Abrir perfil de ${service.title}`}
                  style={styles.serviceCard}
                />
              ))}
            </View>
          ) : null
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
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 16,
  },
  columnWrapper: {
    gap: 16,
  },
  header: {
    gap: 4,
    marginBottom: 20,
  },
  heading: {
    fontSize: 28,
    fontWeight: "800",
    color: Colors.colorPrimary,
    letterSpacing: -0.5,
  },
  subheading: {
    fontSize: 15,
    color: TOKENS.color.sub,
    lineHeight: 20,
  },
  cardWrapper: {
    flex: 1,
  },
  cardContainer: {
    flex: 1,
  },
  card: {
    flex: 1,
    minHeight: 180,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: Colors.colorPrimary,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  gradientBackground: {
    flex: 1,
    padding: 20,
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.8)",
  },
  iconContainer: {
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  iconGradient: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.colorPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  icon: {
    fontSize: 28,
  },
  cardContent: {
    gap: 6,
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.colorPrimaryDark,
    letterSpacing: -0.3,
  },
  cardDescription: {
    fontSize: 13,
    color: TOKENS.color.sub,
    lineHeight: 18,
  },
  countBadge: {
    position: "absolute",
    top: 16,
    right: 16,
  },
  countGradient: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    shadowColor: Colors.colorPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  countText: {
    fontSize: 14,
    fontWeight: "700",
    color: "white",
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 24,
  },
  servicesSection: {
    marginTop: 32,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: TOKENS.color.text,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: TOKENS.color.sub,
  },
  serviceCard: {
    marginBottom: 12,
  },
  emptyState: {
    width: "100%",
    alignItems: "center",
    gap: 8,
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: TOKENS.color.sub,
  },
  errorText: {
    fontSize: 12,
    color: "#DC2626",
  },
});
