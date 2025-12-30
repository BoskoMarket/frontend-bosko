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

import { useCategories } from "@/src/contexts/CategoriesContext";
import { useProviders } from "@/src/contexts/ProvidersContext";
import { Category } from "@/src/interfaces/category";
import { useServices } from "../state/ServicesContext";
import { TOKENS } from "@/core/design-system/tokens";

type CategoryWithCount = Category & { servicesCount: number };
type CategoryListItem = CategoryWithCount;

const FALLBACK_ACCENTS = ["#E6F0FF", "#F5ECFF", "#FFF4E5", "#FFEFF3"];

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
      icon: category.icon ?? "*",
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
            from={{ opacity: 0, translateY: 24 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 400, delay: index * 60 }}
            style={styles.cardWrapper}
          >
            <Pressable
              onPress={() => handleCategoryPress(item)}
              style={[styles.card, { backgroundColor: item.accent }]}
              android_ripple={{ color: "rgba(0,0,0,0.08)", borderless: false }}
            >
              <Text style={styles.icon}>{item.icon}</Text>
              <View>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardDescription}>{item.description}</Text>
              </View>
              <Text style={styles.cardCount}>
                {item.servicesCount ?? 0} servicios
              </Text>
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
    backgroundColor: "white",
  },
  listContent: {
    paddingHorizontal: 10,
    paddingBottom: 40,
    gap: 18,
  },
  columnWrapper: {
    gap: 18,
  },
  header: {
    gap: 4,
    marginBottom: 12,
  },
  heading: {
    fontSize: 24,
    fontWeight: "700",
    color: TOKENS.color.primary,
  },
  subheading: {
    fontSize: 14,
    color: TOKENS.color.sub,
  },
  cardWrapper: {
    flex: 1,
  },
  card: {
    flex: 1,
    minHeight: 150,
    borderRadius: TOKENS.radius.xl,
    padding: 18,
    gap: 12,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  icon: {
    fontSize: 32,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: TOKENS.color.text,
  },
  cardDescription: {
    fontSize: 13,
    color: TOKENS.color.sub,
  },
  cardCount: {
    fontSize: 12,
    color: TOKENS.color.sub,
  },
  servicesSection: {
    marginTop: 32,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 20,
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
  cardHeader: { flexDirection: "row", justifyContent: "space-between" },
  countBadge: { alignItems: "flex-end" },
  countText: {
    fontSize: 16,
    color: "white",
  },
  countLabel: { fontSize: 12, color: "white" },
  cardContent: { marginTop: 10, gap: 4 },
});
