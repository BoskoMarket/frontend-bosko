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
import { useEffect, useMemo } from "react";

import { ServiceCard } from "@/components/ServiceCard";
import { useServices } from "@/context/ServicesContext";
import type { Category } from "@/types/services";
import { TOKENS } from "@/theme/tokens";

export default function ServicesScreen() {
  const router = useRouter();
  const {
    categories,
    categoriesStatus,
    fetchCategories,
    fetchServicesByCategory,
    servicesByCategory,
  } = useServices();

  useEffect(() => {
    if (categoriesStatus === "idle") {
      fetchCategories().catch(() => undefined);
    }
  }, [categoriesStatus, fetchCategories]);

  useEffect(() => {
    if (categories.length > 0) {
      const preload = categories.slice(0, 2);
      preload.forEach((category) => {
        fetchServicesByCategory(category.id).catch(() => undefined);
      });
    }
  }, [categories, fetchServicesByCategory]);

  const featuredServices = useMemo(() => {
    return Object.values(servicesByCategory)
      .flat()
      .slice(0, 6);
  }, [servicesByCategory]);

  const handleCategoryPress = (category: Category) => {
    router.push({
      pathname: "/services/category/[id]",
      params: { id: category.id },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {categoriesStatus === "loading" && categories.length === 0 ? (
        <View style={styles.loader}>
          <ActivityIndicator accessibilityLabel="Cargando categorías" />
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
              onPress={() => handleCategoryPress(item)}
              style={[styles.card, { backgroundColor: item.accent }]}
              android_ripple={{ color: "rgba(0,0,0,0.08)", borderless: false }}
              accessibilityRole="button"
              accessibilityLabel={item.title}
              accessibilityHint={`Abrir categoría ${item.title}`}
            >
              <Text style={styles.icon}>{item.icon}</Text>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDescription}>{item.description}</Text>
              </View>
              <Text style={styles.cardCount}>
                {(item.servicesCount ?? 0).toString()} servicios
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
              <ServiceCard
                key={service.id}
                service={service}
                onPress={() =>
                  router.push({
                    pathname: "./provider/[id]",
                    params: { id: service.providerId, serviceId: service.id },
                  })
                }
              />
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
  loader: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 18,
  },
  columnWrapper: {
    gap: 18,
  },
  cardWrapper: {
    flex: 1,
  },
  card: {
    flex: 1,
    borderRadius: TOKENS.radius.xl,
    padding: 20,
    gap: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    fontSize: 24,
  },
  cardContent: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: TOKENS.color.text,
  },
  cardDescription: {
    fontSize: 13,
    color: TOKENS.color.sub,
  },
  cardCount: {
    fontSize: 12,
    fontWeight: "600",
    color: TOKENS.color.text,
  },
  header: {
    marginBottom: 12,
    gap: 8,
  },
  heading: {
    fontSize: 24,
    fontWeight: "800",
    color: TOKENS.color.text,
  },
  subheading: {
    fontSize: 14,
    color: TOKENS.color.sub,
    lineHeight: 20,
  },
  servicesSection: {
    marginTop: 24,
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
});
