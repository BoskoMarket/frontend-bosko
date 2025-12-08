import React, { useCallback, useEffect, useMemo } from "react";
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

import { TOKENS } from "@/theme/tokens";
import { useCallback, useEffect, useMemo } from "react";
import { useCategories } from "@/src/contexts/CategoriesContext";
import { useProviders } from "@/src/contexts/ProvidersContext";
import { Category } from "@/src/interfaces/category";
import { Provider } from "@/src/interfaces/provider";

type CategoryWithCount = Category & { servicesCount: number };
type CategoryListItem = CategoryWithCount;

const FALLBACK_ACCENTS = ["#E6F0FF", "#F5ECFF", "#FFF4E5", "#FFEFF3"];

function formatRate(rate?: Provider["rate"]) {
  if (!rate || rate.amount === undefined) {
    return "Tarifa no disponible";
  }

  const currency = rate.currency?.toUpperCase();
  const symbol =
    currency === "ARS"
      ? "$"
      : currency === "USD"
      ? "US$"
      : `${currency ?? ""} `;
  const unit = rate.unit ? ` / ${rate.unit}` : "";
  return `${symbol}${rate.amount}${unit}`;
}

export default function ServicesScreen() {
  const router = useRouter();
  const {
    categories,
    categoriesStatus,
    servicesStatus,
    fetchCategories,
    fetchServicesByCategory,
    getServicesForCategory,
  } = useServices();

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
      if (provider.categoryId) {
        acc[provider.categoryId] = (acc[provider.categoryId] ?? 0) + 1;
      }
      return acc;
    }, {});

    console.log(categories, "Estas son las categorias");

    return categories.map((category, index) => ({
      ...category,
      accent:
        category.accent ?? FALLBACK_ACCENTS[index % FALLBACK_ACCENTS.length],
      icon: category.icon ?? "🛠️",
      servicesCount: counts[category.id] ?? 0,
    }));
  }, [categories, providers]);

  const featuredServices = useMemo<Provider[]>(
    () => providers.slice(0, 6),
    [providers]
  );

  const loading = categoriesLoading || providersLoading;

  const handleCategoryPress = useCallback(
    (category: Category) => {
      router.push({
        pathname: "/services/category/[id]",
        params: { id: category.id },
      });
    },
    [router]
  );

  const featuredServices = useMemo(() => {
    const collected = categories.flatMap((category) =>
      getServicesForCategory(category.id)
    );
    return collected.slice(0, 6);
  }, [categories, getServicesForCategory]);

  const renderCategory = useCallback(
    ({ item, index }: { item: CategoryListItem; index: number }) => {
      const count =
        item.servicesCount ?? getServicesForCategory(item.id).length;
      return (
        <MotiView
          from={{ opacity: 0, translateY: 24 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 420, delay: index * 70 }}
          style={styles.cardWrapper}
        >
          <Pressable
            onPress={() => handleCategoryPress(item)}
            accessibilityRole="button"
            accessibilityLabel={item.title}
            accessibilityHint={`Abrir categoría ${item.title}`}
            style={[styles.card, { backgroundColor: item.accent }]}
            android_ripple={{ color: "rgba(0,0,0,0.08)", borderless: false }}
          >
            <Text style={styles.icon}>{item.icon}</Text>
            <View>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDescription}>{item.description}</Text>
            </View>
            <Text style={styles.cardCount}>{count} servicios</Text>
          </Pressable>
        </MotiView>
      );
    },
    [getServicesForCategory, handleCategoryPress]
  );

  const listEmpty = (
    <View style={styles.emptyState}>
      {categoriesStatus.loading ? (
        <ActivityIndicator />
      ) : (
        <Text style={styles.emptyText}>
          Pronto habrá categorías disponibles.
        </Text>
      )}
      {categoriesStatus.error ? (
        <Text style={styles.errorText}>{categoriesStatus.error}</Text>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {loading ? (
        <View style={styles.header}>
          <Text style={styles.heading}>Cargando categorías...</Text>
        </View>
      ) : null}
      {categoriesError || providersError ? (
        <View style={styles.header}>
          <Text style={styles.subheading}>
            {categoriesError ||
              providersError ||
              "Ocurrió un error al cargar los datos"}
          </Text>
        </View>
      ) : null}
      {!loading && categoriesWithCounts.length === 0 ? (
        <View style={styles.header}>
          <Text style={styles.heading}>No hay categorías para mostrar</Text>
          <Text style={styles.subheading}>Intenta nuevamente más tarde.</Text>
        </View>
      ) : null}
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <MotiView
            from={{ opacity: 0, translateY: 24 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 400, delay: index * 60 }}
            style={styles.cardWrapper}
          >
            <Pressable
              onPress={() => {
                router.push({
                  pathname: "/(tabs)/services/category/[id]",
                  params: { id: item.id },
                });
              }}
              style={[styles.card, { backgroundColor: item.accent }]}
              android_ripple={{ color: "rgba(0,0,0,0.08)", borderless: false }}
            >
              <Text style={styles.icon}>{item.icon}</Text>
              <View>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDescription}>{item.description}</Text>
              </View>
              <Text style={styles.cardCount}>
                {item.servicesCount} servicios
              </Text>
            </Pressable>
          </MotiView>
        )}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.heading}>Categorías sugeridas</Text>
            <Text style={styles.subheading}>
              Elegí una categoría para ver profesionales disponibles.
            </Text>
          </View>
        }
        ListFooterComponent={
          featuredServices.length > 0 ? (
            <View style={styles.servicesSection}>
              <Text style={styles.sectionTitle}>Servicios destacados</Text>
              <Text style={styles.sectionSubtitle}>
                Tocá cualquier profesional para conocer su perfil.
              </Text>
              {featuredServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  serviceId={service.id}
                  onPress={() =>
                    router.push({
                      pathname: "./provider/[id]",
                      params: { id: service.providerId },
                    })
                  }
                  accessibilityHint={`Abrir perfil de ${service.name}`}
                  style={styles.serviceCard}
                />
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  <Text style={styles.serviceHeadline}>{service.title}</Text>
                  <View style={styles.serviceMetaRow}>
                    <Text style={styles.serviceMetaHighlight}>
                      {service.rating ? service.rating.toFixed(1) : "N/D"} ★
                    </Text>
                    <View style={styles.metaDot} />
                    <Text style={styles.serviceMeta}>{service.location}</Text>
                  </View>
                  <Text style={styles.serviceRate}>
                    {/* Desde {formatRate(service.rate)} */}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}
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
