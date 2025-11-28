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

import ServiceCard from "@/components/ServiceCard";
import { useServices } from "@/context/ServicesContext";
import type { ServiceSummary } from "@/types/services";
import { TOKENS } from "@/theme/tokens";

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

  const handleBack = () => {
    router.back();
  };

  const renderService = ({
    item,
    index,
  }: {
    item: ServiceSummary;
    index: number;
  }) => (
    <MotiView
      from={{ opacity: 0, translateY: 28 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 420, delay: index * 70 }}
      style={styles.serviceWrapper}
    >
      <ServiceCard
        serviceId={item.id}
        onPress={() =>
          router.push({
            pathname: "../provider/[id]",
            params: { id: item.providerId },
          })
        }
        style={styles.serviceCard}
        accessibilityHint={`Abrir perfil del profesional asociado a ${headerCopy.title}`}
      />
    </MotiView>
  );

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
        renderItem={renderService}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            {isLoading ? (
              <ActivityIndicator />
            ) : (
              <>
                <Text style={styles.emptyTitle}>
                  Pronto habrá profesionales aquí
                </Text>
                <Text style={styles.emptySubtitle}>
                  Estamos sumando especialistas en esta categoría.
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
