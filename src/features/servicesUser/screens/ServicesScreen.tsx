import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MotiView } from "moti";

import {
  SERVICE_CATEGORIES,
  ServiceCategory,
} from "@/features/servicesUser/constants/serviceCategories";
import {
  SERVICE_PROVIDERS,
  ServiceProvider,
} from "@/features/servicesUser/constants/serviceProviders";
import { TOKENS } from "@/core/design-system/tokens";
import { useCallback, useMemo } from "react";

type CategoryWithCount = ServiceCategory & { servicesCount: number };

const categoriesWithCounts: CategoryWithCount[] = SERVICE_CATEGORIES.map(
  (category) => {
    const servicesInCategory = SERVICE_PROVIDERS.filter(
      (provider) => provider.categoryId === category.id
    );

    return {
      ...category,
      servicesCount: servicesInCategory.length,
    };
  }
);

const featuredServices: ServiceProvider[] = SERVICE_PROVIDERS.slice(0, 6);

export default function ServicesScreen() {
  const router = useRouter();

  const categories = useMemo<CategoryListItem[]>(() => {
    const counts = SERVICE_PROVIDERS.reduce<Record<string, number>>(
      (acc, provider) => {
        acc[provider.categoryId] = (acc[provider.categoryId] ?? 0) + 1;
        return acc;
      },
      {}
    );

    return SERVICE_CATEGORIES.map((category) => ({
      ...category,
      servicesCount: counts[category.id] ?? 0,
    }));
  }, []);

  const handleCategoryPress = useCallback(
    (category: ServiceCategory) => {
      router.push({
        pathname: "/services/category/[id]",
        params: { id: category.id },
      });
    },
    [router]
  );

  const renderCategory = useCallback(
    ({ item, index }: { item: CategoryListItem; index: number }) => (
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
          <View style={styles.cardHeader}>
            <Text style={styles.icon}>{item.icon}</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{item.servicesCount}</Text>
              <Text style={styles.countLabel}>servicios</Text>
            </View>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardDescription}>{item.description}</Text>
          </View>
        </Pressable>
      </MotiView>
    ),
    [handleCategoryPress]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={categoriesWithCounts}
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
              onPress={() =>
                router.push({
                  pathname: "./category/[id]",
                  params: { id: item.id },
                })
              }
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
        ListFooterComponent={() => (
          <View style={styles.servicesSection}>
            <Text style={styles.sectionTitle}>Servicios destacados</Text>
            <Text style={styles.sectionSubtitle}>
              Tocá cualquier profesional para conocer su perfil.
            </Text>
            {featuredServices.map((service) => (
              <Pressable
                key={service.id}
                onPress={() =>
                  router.push({
                    pathname: "./provider/[id]",
                    params: { id: service.id },
                  })
                }
                style={styles.serviceCard}
              >
                <Image
                  source={{ uri: service.photo }}
                  style={styles.serviceAvatar}
                />
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  <Text style={styles.serviceHeadline}>{service.title}</Text>
                  <View style={styles.serviceMetaRow}>
                    <Text style={styles.serviceMetaHighlight}>
                      {service.rating.toFixed(1)} ★
                    </Text>
                    <View style={styles.metaDot} />
                    <Text style={styles.serviceMeta}>{service.location}</Text>
                  </View>
                  <Text style={styles.serviceRate}>
                    Desde {formatRate(service.rate)}
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
    backgroundColor: TOKENS.color.bg,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 18,
  },
  columnWrapper: {
    justifyContent: "space-between",
  },
  header: {
    paddingVertical: 10,
  },
  heading: {
    fontSize: 24,
    fontWeight: "700",
    color: TOKENS.color.text,
  },
  subheading: {
    fontSize: 14,
    color: TOKENS.color.sub,
    marginTop: 6,
  },
  cardWrapper: {
    flex: 1,
  },
  card: {
    borderRadius: TOKENS.radius.lg,
    padding: 16,
    minHeight: 160,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  icon: {
    fontSize: 32,
  },
  countBadge: {
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  countText: {
    fontSize: 14,
    fontWeight: "700",
    color: TOKENS.color.text,
  },
  countLabel: {
    fontSize: 10,
    color: TOKENS.color.sub,
  },
  cardContent: {
    gap: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: TOKENS.color.text,
  },
  cardDescription: {
    fontSize: 12,
    color: TOKENS.color.sub,
  },
  cardCount: {
    fontSize: 12,
    fontWeight: "600",
    color: TOKENS.color.text,
    marginTop: 10,
  },
  servicesSection: {
    marginTop: 24,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: TOKENS.color.text,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: TOKENS.color.sub,
    marginTop: 6,
    marginBottom: 16,
  },
  serviceCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: TOKENS.radius.md,
    backgroundColor: "#fff",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  serviceAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 12,
  },
  serviceInfo: {
    flex: 1,
    gap: 4,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: "700",
    color: TOKENS.color.text,
  },
  serviceHeadline: {
    fontSize: 13,
    color: TOKENS.color.sub,
  },
  serviceMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  serviceMetaHighlight: {
    fontSize: 13,
    fontWeight: "700",
    color: TOKENS.color.primary,
  },
  metaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: TOKENS.color.sub,
  },
  serviceMeta: {
    fontSize: 12,
    color: TOKENS.color.sub,
  },
  serviceRate: {
    fontSize: 13,
    fontWeight: "600",
    color: TOKENS.color.text,
  },
});

const formatRate = (rate: number) => {
  if (!rate) return "Consultar";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(rate);
};

interface CategoryListItem extends ServiceCategory {
  servicesCount: number;
}
