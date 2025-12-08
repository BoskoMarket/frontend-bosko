import React, { useEffect } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";

import { TOKENS } from "@/theme/tokens";
import { useCategories } from "@/src/contexts/CategoriesContext";
import { useProviders } from "@/src/contexts/ProvidersContext";
import { Provider } from "@/src/interfaces/provider";

export default function ProviderProfileScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();

  const { categories } = useCategories();
  const {
    providers,
    fetchProvider,
    loading: providersLoading,
    error: providersError,
  } = useProviders();

  const [provider, setProvider] = useState<Provider | undefined>();

  useEffect(() => {
    const providerId = typeof params.id === "string" ? params.id : undefined;
    if (!providerId) {
      return;
    }

    const fromState = providers.find((item) => item.id === providerId);
    if (fromState) {
      setProvider(fromState);
      return;
    }

    fetchProvider(providerId)
      .then((data) => setProvider(data ?? undefined))
      .catch((err) => console.error(err));
  }, [params.id, providers, fetchProvider]);

  function handleBack() {
    router.back();
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

  if (!providerId) {
    return (
      <SafeAreaView edges={["left", "right"]} style={styles.safeArea}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.emptyState}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </Pressable>
          <Text style={styles.emptyTitle}>
            {providersLoading
              ? "Cargando información del profesional..."
              : "No encontramos este profesional"}
          </Text>
          <Text style={styles.emptySubtitle}>
            {providersError
              ? providersError
              : "Volvé a la lista y elegí otro servicio disponible."}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const category = categories.find((item) => item.id === provider.categoryId);
  const accentColor = category?.accent ?? "#E8ECF2";

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </Pressable>
        </View>

        <View style={styles.heroCard}>
          <ImageBackground
            source={{ uri: provider.heroImage }}
            style={styles.heroBackground}
            imageStyle={styles.heroBackgroundImage}
          >
            <View style={styles.heroOverlay} />
            <View style={styles.heroContent}>
              <Image
                source={{ uri: provider.photo }}
                style={[styles.heroAvatar, { borderColor: accentColor }]}
              />
              <Text style={styles.heroName}>{provider.name}</Text>
              <Text style={styles.heroTitle}>{provider.title}</Text>
              <Text style={styles.heroSummary}>{provider.summary}</Text>
              <View style={styles.heroStats}>
                <Text style={styles.heroRating}>
                  ★ {provider.rating ? provider.rating.toFixed(1) : "N/D"}
                </Text>
                <View style={styles.dot} />
                <Text style={styles.heroReviews}>
                  {provider.reviewsCount ?? provider.reviews ?? 0} reseñas
                </Text>
              </View>
              <Text style={styles.heroLocation}>{provider.location}</Text>
              <View style={styles.heroActions}>
                <Text style={styles.heroRate}>
                  Desde {formatRate(provider.rate)}
                </Text>
                <Pressable style={styles.quoteButton}>
                  <Text style={styles.quoteButtonText}>Cotizar servicio</Text>
                </Pressable>
              </View>
            </View>
          </ImageBackground>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sobre el servicio</Text>
          <Text style={styles.sectionBody}>{provider.bio}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Especialidades</Text>
          <View style={styles.tagsRow}>
            {(provider.tags ?? []).map((tag) => (
              <View
                key={tag}
                style={[styles.tag, { backgroundColor: accentColor }]}
              >
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trabajos recientes</Text>
          <View style={styles.worksList}>
            {(provider.recentWorks ?? []).map((work, index) => (
              <MotiView
                key={work.id}
                from={{ opacity: 0, translateY: 16 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{
                  type: "timing",
                  duration: 420,
                  delay: index * 80,
                }}
                style={styles.workCard}
              >
                <Image source={{ uri: work.image }} style={styles.workImage} />
                <View style={styles.workInfo}>
                  <Text style={styles.workTitle}>{work.title}</Text>
                  <Text style={styles.workTime}>{work.timeAgo}</Text>
                </View>
              </MotiView>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 24,
    paddingBottom: 40,
  },
  fallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 12,
  },
  fallbackTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: TOKENS.color.text,
    textAlign: "center",
  },
  fallbackSubtitle: {
    fontSize: 14,
    color: TOKENS.color.sub,
    textAlign: "center",
  },
});
