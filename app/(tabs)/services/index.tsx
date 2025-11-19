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

import ServiceCard from "@/components/ServiceCard";
import { useServices } from "@/context/ServicesContext";
import type { Category } from "@/types/services";
import { TOKENS } from "@/theme/tokens";

type CategoryListItem = Category & { servicesCount?: number };

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

  useEffect(() => {
    if (!categoriesStatus.loaded && !categoriesStatus.loading) {
      fetchCategories().catch((err) => console.error(err));
    }
  }, [categoriesStatus.loaded, categoriesStatus.loading, fetchCategories]);

  useEffect(() => {
    categories.slice(0, 3).forEach((category) => {
      const status = servicesStatus[category.id];
      if (!status?.loaded && !status?.loading) {
        fetchServicesByCategory(category.id).catch((err) => console.error(err));
      }
    });
  }, [categories, fetchServicesByCategory, servicesStatus]);

  const handleCategoryPress = useCallback(
    (category: CategoryListItem) => {
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
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={renderCategory}
        ListEmptyComponent={listEmpty}
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
    paddingHorizontal: 20,
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
});
