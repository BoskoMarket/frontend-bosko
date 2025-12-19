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
import { Ionicons } from "@expo/vector-icons";

import ServiceCard from "@/components/ServiceCard";
import { TOKENS } from "@/theme/tokens";
import { useCategories } from "@/src/contexts/CategoriesContext";
import { useProviders } from "@/src/contexts/ProvidersContext";
import { Category } from "@/src/interfaces/category";
import { useServices } from "@/context/ServicesContext";
import Colors from "@/constants/Colors";

type CategoryWithCount = Category & { servicesCount: number; gradient?: string[] };
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
const GRADIENTS = [
  ['#850221', '#5c0117'], // Bosko Burgundy
  ['#333333', '#000000'], // Premium Dark
  ['#B8860B', '#8B6914'], // Antique Gold (Darker for contrast)
  ['#a00e31', '#6e0a22'], // Crimson
  ['#434343', '#000000'], // Charcoal
];

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
      gradient: GRADIENTS[index % GRADIENTS.length],
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
      services.filter((service) => {
        const catId = typeof service.category === 'string' ? service.category : service.category?.id;
        return catId === category.id;
      })
    );
    return collected.slice(0, 6);
  }, [categories, services]);

  const listEmpty = (
    <View style={styles.emptyState}>
      {categoriesLoading ? (
        <ActivityIndicator color={Colors.colorPrimary} />
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

      <FlatList
        data={categoriesWithCounts}
        keyExtractor={(item) => item.id}
        // Switched to 1 column for wide cards
        numColumns={1}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={listEmpty}
        renderItem={({ item, index }) => {
          // Mock Stats
          const popularity = (item.servicesCount * 142) + 500;
          const likes = (item.servicesCount * 89) + 200;
          const followed = item.servicesCount * 12;

          return (
            <MotiView
              from={{ opacity: 0, translateY: 50, scale: 0.95 }}
              animate={{ opacity: 1, translateY: 0, scale: 1 }}
              transition={{
                type: "spring",
                damping: 15,
                stiffness: 150,
                delay: index * 100,
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
                      scale: pressed ? 0.98 : 1,
                    }}
                    transition={{ type: "timing", duration: 100 }}
                    style={styles.card}
                  >
                    <LinearGradient
                      colors={(item as any).gradient || GRADIENTS[0]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.gradientBackground}
                    >
                      {/* Decorative Circles */}
                      <View style={styles.circleDecoration1} />
                      <View style={styles.circleDecoration2} />

                      <View style={styles.mainRow}>
                        {/* Avatar/Icon Section */}
                        <View style={styles.avatarSection}>
                          <View style={styles.avatarCircle}>
                            <Text style={styles.avatarIcon}>{item.icon}</Text>
                          </View>
                          <View style={styles.titleSection}>
                            <Text style={styles.cardTitle}>{item.name}</Text>
                            <Text style={styles.cardSubtitle}>{item.description || 'Explora esta categoría'}</Text>
                          </View>
                        </View>

                        {/* Ranking Section */}
                        <View style={styles.rankSection}>
                          <Ionicons name="ellipsis-horizontal" size={20} color="rgba(255,255,255,0.6)" style={{ alignSelf: 'flex-end', marginBottom: 8 }} />
                          <Text style={styles.rankNumber}>{index + 1}</Text>
                          <Text style={styles.rankLabel}>Ranking</Text>
                        </View>
                      </View>

                      {/* Stats Row */}
                      <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                          <Text style={styles.statValue}>{popularity}</Text>
                          <Text style={styles.statLabel}>Popularidad</Text>
                        </View>
                        <View style={styles.statItem}>
                          <Text style={styles.statValue}>{likes}</Text>
                          <Text style={styles.statLabel}>Likes</Text>
                        </View>
                        <View style={styles.statItem}>
                          <Text style={styles.statValue}>{followed}</Text>
                          <Text style={styles.statLabel}>Seguidores</Text>
                        </View>
                      </View>

                    </LinearGradient>
                  </MotiView>
                )}
              </Pressable>
            </MotiView>
          )
        }}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.heading}>Categorias</Text>
            <Text style={styles.subheading}>
              Encuentra los mejores profesionales.
            </Text>
          </View>
        }
        ListFooterComponent={
          featuredServices.length > 0 ? (
            <View style={styles.servicesSection}>
              <Text style={styles.sectionTitle}>Servicios destacados</Text>
              {featuredServices.map((service) => {
                // Map Service (Management) to ServiceSummary (Catalog) for display
                const fallbackSummary: any = {
                  ...service,
                  providerId: service.userId || '',
                  name: 'Proveedor', // Placeholder if name unavailable in Service type
                  rate: { amount: service.price, currency: 'ARS', unit: 'hr' },
                  thumbnail: service.image || '',
                  categoryId: typeof service.category === 'string' ? service.category : service.category?.id || '',
                };

                return (
                  <ServiceCard
                    key={service.id}
                    serviceId={service.id || ''}
                    fallback={fallbackSummary}
                    onPress={() => {
                      if (service.id) {
                        router.push({
                          pathname: "/(tabs)/services/provider/[id]",
                          params: { id: service.id },
                        })
                      }
                    }}
                    accessibilityHint={`Abrir perfil de ${service.title}`}
                    style={styles.serviceCard}
                  />
                )
              })}
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
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 20,
  },
  header: {
    marginBottom: 20,
    marginTop: 10,
  },
  heading: {
    fontSize: 32,
    fontWeight: "800",
    color: Colors.colorPrimary,
    letterSpacing: -0.5,
  },
  subheading: {
    fontSize: 16,
    color: TOKENS.color.sub,
    marginTop: 4,
  },
  cardWrapper: {
    width: '100%',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  cardContainer: {
    borderRadius: 24,
    overflow: "hidden",
  },
  card: {
    height: 160,
    borderRadius: 24,
  },
  gradientBackground: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
    position: 'relative',
  },
  circleDecoration1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  circleDecoration2: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  mainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 1,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    marginRight: 16,
  },
  avatarIcon: {
    fontSize: 28,
  },
  titleSection: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  rankSection: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 50,
  },
  rankNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  rankLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    maxWidth: '70%',
    marginLeft: 76, // Align with title start (60 avatar + 16 margin)
    zIndex: 1,
  },
  statItem: {
    alignItems: 'flex-start',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
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
