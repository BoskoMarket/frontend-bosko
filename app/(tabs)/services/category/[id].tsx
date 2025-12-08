import React, { useEffect, useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { MotiView } from "moti";

import ServiceCard from "@/components/ServiceCard";
import { useServices } from "@/context/ServicesContext";
import type { ServiceSummary } from "@/types/services";
import { TOKENS } from "@/theme/tokens";
import { useCategories } from "@/src/contexts/CategoriesContext";
import { useProviders } from "@/src/contexts/ProvidersContext";
import { Category } from "@/src/interfaces/category";
import { Provider } from "@/src/interfaces/provider";

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

  const accentColor = category?.accent ?? "#E8ECF2";
  const isLoading = Boolean(
    status?.loading && !status?.loaded && services.length === 0
  );

  const headerCopy = useMemo(
    () => ({
      title: category?.title ?? "Servicios",
      description:
        category?.description ??
        "Descubrí profesionales disponibles en esta categoría.",
    }),
    [category?.description, category?.title]
  );

  function handleProviderPress(provider: Provider) {
    router.push({
      pathname: "../provider/[id]",
      params: { id: provider.id },
    });
  }

  function formatRate(rate?: Provider["rate"]) {
    if (!rate || rate.amount === undefined) {
      return "Tarifa no disponible";
    }
    const currency = rate.currency?.toUpperCase();
    const symbol = currency === "ARS" ? "$" : currency === "USD" ? "US$" : `${currency ?? ""} `;
    const unit = rate.unit ? ` / ${rate.unit}` : "";
    return `${symbol}${rate.amount}${unit}`;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* <Stack.Screen options={{ headerShown: false }} /> */}
      <View style={[styles.hero, { backgroundColor: accentColor }]}>
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
        </View>
      </View>

      <FlatList
        data={services}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={() => loadProviders().catch((err) => console.error(err))}
        renderItem={({ item, index }) => (
          <MotiView
            from={{ opacity: 0, translateY: 28 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 420, delay: index * 70 }}
            style={styles.serviceWrapper}
          >
            <Pressable
              onPress={() => handleProviderPress(item)}
              style={styles.serviceCard}
              android_ripple={{ color: "rgba(0,0,0,0.04)" }}
            >
              <Image
                source={{ uri: item.photo }}
                style={styles.avatar}
                resizeMode="cover"
              />
              <View style={styles.serviceInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.serviceName}>{item.name}</Text>
                  <Text style={styles.serviceRating}>
                    ★ {item.rating ? item.rating.toFixed(1) : "N/D"}
                  </Text>
                </View>
                <Text style={styles.serviceHeadline}>{item.title}</Text>
                <View style={styles.metaRow}>
                  <Text style={styles.servicePrice}>
                    Desde {formatRate(item.rate)}
                  </Text>
                  <View style={styles.dot} />
                  <Text style={styles.serviceReviews}>
                    {item.reviewsCount ?? item.reviews ?? 0} reseñas
                  </Text>
                </View>
                <Text style={styles.serviceLocation}>{item.location}</Text>
              </View>
            </Pressable>
          </MotiView>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>
              {loading ? "Cargando profesionales..." : "Pronto habrá profesionales aquí"}
            </Text>
            <Text style={styles.emptySubtitle}>
              {providersError
                ? providersError
                : "Estamos sumando especialistas en esta categoría."}
            </Text>
          </View>
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
  hero: {
    borderRadius: TOKENS.radius.xl,
    marginBottom: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: TOKENS.radius.lg,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    ...TOKENS.shadow.soft,
  },
  backIcon: {
    fontSize: 20,
    color: TOKENS.color.text,
  },
  heroCopy: {
    flex: 1,
    gap: 6,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: TOKENS.color.text,
  },
  heroSubtitle: {
    fontSize: 14,
    color: TOKENS.color.sub,
    lineHeight: 20,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 16,
  },
  serviceWrapper: {
    width: "100%",
  },
  serviceCard: {
    width: "100%",
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: TOKENS.color.text,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: TOKENS.color.sub,
    textAlign: "center",
  },
});
