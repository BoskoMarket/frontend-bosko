import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { MotiView } from "moti";

import { SERVICE_CATEGORIES } from "@/features/servicesUser/constants/serviceCategories";
import {
  SERVICE_PROVIDERS,
  ServiceProvider,
} from "@/features/servicesUser/constants/serviceProviders";
import { TOKENS } from "@/core/design-system/tokens";

export default function CategoryServicesScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();

  const categoryId = typeof params.id === "string" ? params.id : undefined;
  const category = SERVICE_CATEGORIES.find((item) => item.id === categoryId);

  const services = SERVICE_PROVIDERS.filter(
    (provider) => provider.categoryId === categoryId
  );
  const accentColor = category?.accent ?? "#E8ECF2";

  function handleBack() {
    router.back();
  }

  function handleProviderPress(provider: ServiceProvider) {
    router.push({
      pathname: "../provider/[id]",
      params: { id: provider.id },
    });
  }

  function formatRate(rate: ServiceProvider["rate"]) {
    const symbol =
      rate.currency === "ARS"
        ? "$"
        : rate.currency === "USD"
        ? "US$"
        : `${rate.currency} `;
    return `${symbol}${rate.amount} / ${rate.unit}`;
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

      <FlatList
        data={services}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
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
                    ★ {item.rating.toFixed(1)}
                  </Text>
                </View>
                <Text style={styles.serviceHeadline}>{item.title}</Text>
                <View style={styles.metaRow}>
                  <Text style={styles.servicePrice}>
                    Desde {formatRate(item.rate)}
                  </Text>
                  <View style={styles.dot} />
                  <Text style={styles.serviceReviews}>
                    {item.reviews} reseñas
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
              Pronto habrá profesionales aquí
            </Text>
            <Text style={styles.emptySubtitle}>
              Estamos sumando especialistas en esta categoría.
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
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 16,
  },
  serviceWrapper: {
    width: "100%",
  },
  serviceCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: "#FFFFFF",
    padding: 18,
    borderRadius: TOKENS.radius.lg,
    ...TOKENS.shadow.soft,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 18,
  },
  serviceInfo: {
    flex: 1,
    gap: 6,
  },
  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  serviceName: {
    fontSize: 16,
    fontWeight: "600",
    color: TOKENS.color.text,
  },
  serviceRating: {
    fontSize: 13,
    fontWeight: "600",
    color: TOKENS.color.primary,
  },
  serviceHeadline: {
    fontSize: 14,
    color: TOKENS.color.sub,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  servicePrice: {
    fontSize: 13,
    fontWeight: "600",
    color: TOKENS.color.text,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#CBD3DA",
  },
  serviceReviews: {
    fontSize: 12,
    color: TOKENS.color.sub,
  },
  serviceLocation: {
    fontSize: 12,
    color: TOKENS.color.sub,
  },
  emptyState: {
    paddingVertical: 80,
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: TOKENS.color.text,
  },
  emptySubtitle: {
    fontSize: 14,
    color: TOKENS.color.sub,
    textAlign: "center",
    paddingHorizontal: 20,
  },
});
