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
import { useEffect, useMemo } from "react";

import { ServiceCard } from "@/components/ServiceCard";
import { useServices } from "@/context/ServicesContext";
import { TOKENS } from "@/theme/tokens";

export default function CategoryServicesScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const categoryId = typeof params.id === "string" ? params.id : undefined;

  const {
    categories,
    fetchServicesByCategory,
    getServicesForCategory,
    getServicesStatus,
  } = useServices();

  const category = useMemo(
    () => categories.find((item) => item.id === categoryId),
    [categories, categoryId]
  );

  useEffect(() => {
    if (categoryId) {
      fetchServicesByCategory(categoryId).catch(() => undefined);
    }
  }, [categoryId, fetchServicesByCategory]);

  const services = categoryId ? getServicesForCategory(categoryId) : [];
  const status = categoryId ? getServicesStatus(categoryId) : "idle";
  const accentColor = category?.accent ?? "#E8ECF2";

  function handleBack() {
    router.back();
  }

  function handleServicePress(serviceId: string, providerId: string) {
    router.push({
      pathname: "../provider/[id]",
      params: { id: providerId, serviceId },
    });
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />

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
          <Text style={styles.heroTitle}>{category?.title ?? "Servicios"}</Text>
          <Text style={styles.heroSubtitle}>
            {category?.description ?? "Descubrí profesionales disponibles."}
          </Text>
        </View>
      </View>

      {status === "loading" && services.length === 0 ? (
        <View style={styles.loader}>
          <ActivityIndicator accessibilityLabel="Cargando servicios" />
        </View>
      ) : null}

      <FlatList
        data={services}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <ServiceCard
            service={item}
            onPress={() => handleServicePress(item.id, item.providerId)}
          />
        )}
        ListEmptyComponent={
          status === "loading" ? null : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Pronto habrá profesionales aquí</Text>
              <Text style={styles.emptySubtitle}>
                Estamos sumando especialistas en esta categoría.
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: TOKENS.color.bg,
  },
  hero: {
    margin: 20,
    borderRadius: TOKENS.radius.xl,
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
  loader: {
    paddingVertical: 32,
    alignItems: "center",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 16,
  },
  emptyState: {
    padding: 24,
    alignItems: "center",
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: TOKENS.color.text,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: TOKENS.color.sub,
    textAlign: "center",
    lineHeight: 20,
  },
});
